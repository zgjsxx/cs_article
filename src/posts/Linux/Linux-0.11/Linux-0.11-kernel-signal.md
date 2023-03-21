---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理signal.c详解

signal.c主要涉及的是进程的信号处理。该章节中最难理解的是**do_signal**函数。

## sys_sgetmask
```c
int sys_sgetmask()
```
该函数的作用是设置**信号的屏蔽图**，即进程对哪些信号可以不做处理。

代码很简单，就是返回进程PCB中的**blocked**字段。
```c
return current->blocked;
```
## sys_ssetmask
```c
int sys_ssetmask(int newmask)
```
用于设置**新的信号屏蔽位图**。其中SIGKILL是不可以被屏蔽的。

``` ~(1<<(SIGKILL-1))``` 保证了SIGKILL的屏蔽位为0。

```c
int old=current->blocked;//保存旧的信号屏蔽位

current->blocked = newmask & ~(1<<(SIGKILL-1));//设置新的信号屏蔽位
```
## save_old
```c
static inline void save_old(char * from,char * to)
```
该函数在sys_sigaction中被调用， 其作用是将旧的sigaction对象拷贝到用户地址空间。

其中调用了put_fs_byte函数，其定义在segment.h文件中，其作用是把内核态一个字节的数据拷贝到由 fs:addr 指向的用户态内存地址空间。

下面分析该函数的代码。

首先对to所在的内存进行校验，接着进行遍历，将from的内容拷贝到to的位置，实际就是拷贝了from位置的sigaction对象到to位置。
```c
verify_area(to, sizeof(struct sigaction));
for (i=0 ; i< sizeof(struct sigaction) ; i++) {
	put_fs_byte(*from,to);
	from++;
	to++;
}
```
## get_new
```c
static inline void get_new(char * from,char * to)
```
该函数在sys_sigaction中被调用，其作用是将用户设置的sigaction传递到内核中。

其中调用了get_fs_byte函数， 其定义在segment.h文件中， 其作用是把fs:from 指向的用户态内存的一个字节拷贝到内核态to的地址中。该函数借助了fs寄存器，在system_call函数中，将fs寄存器设置为了0x17，指向了用户的数据段。


```c
int i;

for (i=0 ; i< sizeof(struct sigaction) ; i++)
	*(to++) = get_fs_byte(from++);//拷贝用户空间的一个字节
```

## sys_signal
```c
int sys_signal(int signum, long handler, long restorer)
```
该函数用于设置信号的处理函数。

sys_signal有三个入参， 而signal函数只有两个入参(如下所示)，这第三个参数restorer是在编译的过程中由编译器加入的，其作用将在do_signal中阐述。

```c
typedef void sigfunc(int);
sigfunc *signal(int signr, sigfunc *handler);
```

程序首先对入参signum做校验，其大小必须在区间[1，32]中，并且其值不得为SIGKILL（9）。
```c
struct sigaction tmp;

if (signum<1 || signum>32 || signum==SIGKILL)//对signum做检查
	return -1;
```

接下来设置信号处理函数以及对应的一些标志。例如SA_ONESHOT代表将只执行一次就会将信号处理函数恢复为之前的处理函数。

sa_restorer保存的是恢复处理函数，会在do_signal函数中再次被提到， 其作用就是在信号处理函数结束之后，恢复现场。
```c
tmp.sa_handler = (void (*)(int)) handler;
tmp.sa_mask = 0;
tmp.sa_flags = SA_ONESHOT | SA_NOMASK;
tmp.sa_restorer = (void (*)(void)) restorer;
```

接着取出该信号的旧的处理函数作为返回值返回。然后将上面构建好的sigaction类型的tmp对象放置于进程的sigaction数组的对应位置。
```c
handler = (long) current->sigaction[signum-1].sa_handler;
current->sigaction[signum-1] = tmp;
```
## sys_sigaction
```c
int sys_sigaction(int signum, const struct sigaction * action,
	struct sigaction * oldaction)
```
该函数是sigaction的系统调用。

程序首先对入参signum做校验，其大小必须在区间[1，32]中，并且其值不得为SIGKILL（9）。
```c
if (signum < 1 || signum > 32 || signum == SIGKILL)
	return -1;
```

```c
tmp = current->sigaction[signum - 1];
get_new ((char *) action, (char *) (signum - 1 + current->sigaction));
if (oldaction)
	save_old ((char *) &tmp, (char *) oldaction);
```

如果允许信号在自己的信号句柄中收到，则令屏蔽码位0， 否则设置屏蔽本信号。
```c
if (current->sigaction[signum-1].sa_flags & SA_NOMASK)
	current->sigaction[signum-1].sa_mask = 0;
else
	current->sigaction[signum-1].sa_mask |= (1<<(signum-1));
```

## do_signal
```c
void do_signal(long signr,long eax, long ebx, long ecx, long edx,
	long fs, long es, long ds,
	long eip, long cs, long eflags,
	unsigned long * esp, long ss)
```
该函数是进程接收到信号执行信号处理方法的主体。其在**ret_from_sys_call**中被调用，即从系统调用返回的过程中被调用。

在系统调用过程中，内核栈的情况如下图所示：

![do_signal1](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/signal_raw.png)

在该函数中，首先根据信号的id，取出对应的sigaction结构。
```c
unsigned long sa_handler;
long old_eip=eip;
struct sigaction * sa = current->sigaction + signr - 1;
int longs;
unsigned long * tmp_esp;
```

从sigaction结构体中取出sa_handler， 如果该handler的值为1， 代表是SIG_IGN，即忽略该信号， 则直接返回。

如果sa_handler的值是0，即SIG_DFL，即使用默认的信号处理方式，如果信号是SIGCHILD,则直接返回， 如果不是，则程序直接退出。

```c
sa_handler = (unsigned long) sa->sa_handler;
if (sa_handler==1)
	return;
if (!sa_handler) {
	if (signr==SIGCHLD)
		return;
	else
		do_exit(1<<(signr-1));
}
```

接下来， 如果sa_flags含有SA_ONESHOT标记， 代表本次信号处理函数执行之后，就恢复默认处理方式。
```c
if (sa->sa_flags & SA_ONESHOT)
	sa->sa_handler = NULL;
```

下面的代码就是设置让系统调用返回时去执行信号处理函数。

首先将eip设置为信号处理函数的地址，当中断处理函数调用结束之后通过iret返回之后， 就会去执行中断处理函数。 同时也会将原来通过INT压栈的一些寄存器的值保存在用户栈中。

```*(&eip) = sa_handler```就设置了新的eip值，这种做法，如果是c语言中的函数调用是不起作用的，因为在函数调用结束后，会因为esp指针的上移而丢弃掉， 而do_signal是在汇编程序中被调用，因此调用完毕之后，不会丢弃掉这些参数。

```c
*(&eip) = sa_handler;
longs = (sa->sa_flags & SA_NOMASK)?7:8;//判断是7个参数还是8个参数
*(&esp) -= longs;//向下移动esp指针
verify_area(esp,longs*4);
tmp_esp=esp;
put_fs_long((long) sa->sa_restorer,tmp_esp++);//设置回复处理函数
put_fs_long(signr,tmp_esp++);//设置信号的number
if (!(sa->sa_flags & SA_NOMASK))
	put_fs_long(current->blocked,tmp_esp++);//设置block
put_fs_long(eax,tmp_esp++);//设置原eax
put_fs_long(ecx,tmp_esp++);//设置ecx
put_fs_long(edx,tmp_esp++);//设置edx
put_fs_long(eflags,tmp_esp++);//设置eflags
put_fs_long(old_eip,tmp_esp++);//设置eip
current->blocked |= sa->sa_mask;
```

其最终的效果如下图所示:

![do_after](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/signal_after.png)


当信号处理函数执行完毕，通过return返回时，就会去执行sa_restorer处的代码。

![sa_restore](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/sa_restore.png)

下面就将解答之前在sys_signal中抛出的问题，sa_restorer是干什么的？ 

sa_restorer实际就是用于**恢复用户栈**，并且让程序**恢复到系统调用之前的上下文**。 

编译器会在编译程序中调用libc库中信号系统调用函数把sa_restorer作为参数传递给sys_signal或者sigaction。

signal入参没有sa_flag，因此传入__sig_restore

```c
void (*signal(int sig, __sighandler_t func))(int)
{
	void (*res)();.
	register int __fooebx __asm__ ("bx") = sig;
	__asm__("int $0x80":"=a"(res):
	"0" (_NR_signal), "r" (__fooebx), "c"(func), "d"((long)__sig_restore)
}
```


sigaction有sa_flag参数，因此可以sa_flag参数决定传入__sig_restore或者是__masksig_restore。

```c
int sigaction(int sig, struct sigaction *sa, struct sigaction *old)
{
	register int __fooebx __asm__ ("bx") = sig;
	if(sa->sa_flags & SA_NOMASK)
		sa->sa_restorer = __sig_restore;
	else
		sa->sa_restorer = __masksig_restore;
	__asm__("int 0x80": "=a"(sig)
		:"0"(_NR_sigaction), "r"(__foxxebx), "c"(sa), "d"(old))
	if(sig >= 0)
		return 0;
	errno = -sig;
	return -1;
}
```

__sig_restore和__masksig_restore的定义如下所示:

其二者区别就在于栈中的参数是7个还是8个。

```asm
.globl __sig_restore
.globl __masksig_restore
# 若没有blocked，则使用这个restorer函数
__sig_restore:
    addl $4, %esp
	popl %eax
	popl %ecx
	popl %edx
	popf
	ret
__masksig_restore:
    addl $4, %esp
	call __ssetmask
	addl $4, %esp
	popl %eax
	popl %ecx
	popl %edx
	popf
	ret
```
到此为止， 梳理起来do_signal的处理流程如下：

ret_from_sys_call->do_signal->iret->handler->return->sa_restorer->return->origin eip

如下图所示:

![do_signal_flow](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/do_signal_flow.png)