---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理signal.c详解](#linux-011-kernel目录进程管理signalc详解)
	- [模块简介](#模块简介)
	- [函数详解](#函数详解)
		- [sys\_sgetmask](#sys_sgetmask)
		- [sys\_ssetmask](#sys_ssetmask)
		- [save\_old](#save_old)
		- [get\_new](#get_new)
		- [sys\_signal](#sys_signal)
		- [sys\_sigaction](#sys_sigaction)
		- [do\_signal](#do_signal)

# Linux-0.11 kernel目录进程管理signal.c详解

## 模块简介

signal.c主要涉及的是进程的信号处理。该章节中最难理解的是**do_signal**函数。

在unix系统中，信号是一种"软件中断"处理机制。有许多较为复杂的程序会使用到信号。信号机制提供了一种处理异步时间的方法。例如用户在终端键盘上键入ctrl-C组合来终止一个程序的执行。该操作就会产生一个SIGINT信号，并被发送到当前的前台执行的进程中。

## 函数详解

### sys_sgetmask

```c
int sys_sgetmask()
```

该函数的作用是获取进程的**信号的屏蔽图**，即进程对哪些信号可以不做处理。

代码很简单，就是返回进程PCB中的**blocked**字段，```blocked```字段是一个long类型的数据，有32个bit。

```c
	return current->blocked;
```

### sys_ssetmask

```c
int sys_ssetmask(int newmask)
```

用于设置**新的信号屏蔽位图**。其中```SIGKILL```是不可以被屏蔽的。

``` ~(1<<(SIGKILL-1))``` 保证了SIGKILL的屏蔽位为0。

```c
int old=current->blocked;//保存旧的信号屏蔽位

current->blocked = newmask & ~(1<<(SIGKILL-1));//设置新的信号屏蔽位
return old;
```

### save_old

```c
static inline void save_old(char * from,char * to)
```

该函数在**sys_sigaction**中被调用，其作用是将旧的```sigaction```对象拷贝到用户地址空间。该方法的调用关系如下：

```shell
├── int 0x80
  └── sys_sigaction
	└── save_old
```

下面分析该函数的代码。

首先对```to```所在的内存调用```verify_area```(fork.c中)进行校验。

接着进行遍历，将```from```的内容拷贝到```to```的位置，实际就是拷贝了```from```位置的```sigaction```对象到```to```位置。

```c
verify_area(to, sizeof(struct sigaction));//对内存区域进行校验
for (i=0 ; i< sizeof(struct sigaction) ; i++) {
	put_fs_byte(*from,to);
	from++;
	to++;
}
```

其中调用了```put_fs_byte```函数，其定义在```segment.h```文件中，其作用是把内核态一个字节的数据拷贝到由 ```fs:addr``` 指向的用户态内存地址空间。

```*from```指向内核空间， ```*to```指向用户空间，由于二者的段描述符不相同，因此拷贝时，不能直接复制，需要使用```put_fs_byte```。

### get_new

```c
static inline void get_new(char * from,char * to)
```

该函数在**sys_sigaction**中被调用，其作用是将用户设置的```sigaction```传递到内核中。

其中调用了```get_fs_byte```函数， 其定义在segment.h文件中， 其作用是把```fs:from``` 指向的用户态内存的一个字节拷贝到内核态to的地址中。该函数借助了```fs```寄存器，在```system_call```函数中，将```fs```寄存器设置为了```0x17```，指向了用户的数据段。

```c
int i;

for (i=0 ; i< sizeof(struct sigaction) ; i++)
	*(to++) = get_fs_byte(from++);//拷贝用户空间的一个字节
```

学习完```save_old```/```get_new```要有一个概念，内核态与用户态进行数据传输时，要借助于```fs```寄存器。

### sys_signal

```c
int sys_signal(int signum, long handler, long restorer)
```

该函数是```signal()```的系统调用，其用于设置信号的处理函数。

```sys_signal```有三个入参， 而```signal```函数只有两个入参(如下所示)，这第三个参数```restorer```是在编译的过程中由编译器加入的，其作用将在```do_signal```中阐述。

```c
	typedef void sigfunc(int);
	sigfunc *signal(int signr, sigfunc *handler);
```

程序首先对入参```signum```做校验，其大小必须在区间```[1，32]```中，并且其值不得为SIGKILL（9）。

```c
struct sigaction tmp;

if (signum<1 || signum>32 || signum==SIGKILL)//对signum做检查
	return -1;
```

```sa_restorer```保存的是恢复处理函数，会在```do_signal```函数中再次被提到， 其作用就是在信号处理函数结束之后，恢复现场。

接下来设置信号处理函数以及对应的一些标志。根据提供的参数组建```sigaction```结构内容。```sa_handler```是指定的信号处理句柄(函数)。```sa_mask```是执行信号处理句柄时的信号屏蔽码。```sa_flags```是执行时的一些标志组合。这里设定该信号处理句柄只使用1次后就恢复到默认值，并允许信号在自己的处理句柄中收到。

```SA_ONESHOT``` 和 ```SA_NOMASK``` 都是信号处理器的标志（flags）。它们的作用如下：

- SA_ONESHOT 表示信号处理器只会被执行一次。也就是说，当信号发生时，处理器被调用后，它会自动被系统设置为默认行为（通常是终止进程）。
- SA_NOMASK标志通常是指定在信号处理函数执行期间不阻塞其他信号。在信号处理函数执行期间，内核通常会阻塞同一信号类型的其他实例，以避免竞态条件和递归调用。但是，如果设置了SA_NOMASK标志，则处理函数的执行期间不会阻塞相同类型的信号。

```c
	tmp.sa_handler = (void (*)(int)) handler;//设置信号的handler
	tmp.sa_mask = 0;//设置信号的屏蔽码
	tmp.sa_flags = SA_ONESHOT | SA_NOMASK;
	tmp.sa_restorer = (void (*)(void)) restorer;
```

接着取出该信号的旧的处理函数作为返回值返回。然后将上面构建好的```sigaction```类型的tmp对象放置于进程的```sigaction```数组的对应位置。

```c
	handler = (long) current->sigaction[signum-1].sa_handler;
	current->sigaction[signum-1] = tmp;
```

### sys_sigaction

```c
int sys_sigaction(int signum, const struct sigaction * action,
	struct sigaction * oldaction)
```

该函数是```sigaction()```的系统调用。

程序首先对入参signum做校验，其大小必须在区间[1，32]中，并且其值不得为SIGKILL（9）。

```c
if (signum < 1 || signum > 32 || signum == SIGKILL)
	return -1;
```

接下来进行设置新的```action```并且返回了之前设置的```oldaction```。这里使用到了之前提到的```get_new```和```save_old```方法。

```c
tmp = current->sigaction[signum - 1];
get_new ((char *) action, (char *) (signum - 1 + current->sigaction));
if (oldaction)
	save_old ((char *) &tmp, (char *) oldaction);
```


如果设置了```SA_NOMASK```标志，则代表在信号处理函数执行期间不阻塞其他信号，允许信号在自己的信号句柄中收到信号，令屏蔽码位0，否则设置屏蔽本信号。

```c
if (current->sigaction[signum-1].sa_flags & SA_NOMASK)
	current->sigaction[signum-1].sa_mask = 0;
else
	current->sigaction[signum-1].sa_mask |= (1<<(signum-1));
```

### do_signal

```c
void do_signal(long signr,long eax, long ebx, long ecx, long edx,
	long fs, long es, long ds,
	long eip, long cs, long eflags,
	unsigned long * esp, long ss)
```

该函数是进程接收到信号执行信号处理方法的主体。其在**ret_from_sys_call**中被调用，即从系统调用返回的过程中被调用。

在系统调用过程中，内核栈的情况如下图所示：

![do_signal1](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/signal/signal_raw.png)

在该函数中，首先根据信号的id，取出对应的sigaction结构。

```c
unsigned long sa_handler;
long old_eip=eip;
struct sigaction * sa = current->sigaction + signr - 1;
int longs;
unsigned long * tmp_esp;
```

从sigaction结构体中取出```sa_handler```， 如果该```handler```的值为1， 代表是```SIG_IGN```，即忽略该信号， 则直接返回。

如果```sa_handler```的值是0，即SIG_DFL，即使用默认的信号处理方式，如果信号是```SIGCHILD```,则直接返回， 如果不是，则程序直接退出。

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

接下来， 如果sa_flags含有```SA_ONESHOT```标记， 代表本次信号处理函数执行之后，就恢复默认处理方式。

```c
if (sa->sa_flags & SA_ONESHOT)
	sa->sa_handler = NULL;
```

下面的代码就是设置让系统调用返回时去执行信号处理函数。

首先将```eip```设置为信号处理函数的地址，当中断处理函数调用结束之后通过```iret```返回之后， 就会去执行中断处理函数。 同时也会将原来通过INT压栈的一些寄存器的值保存在用户栈中。

```*(&eip) = sa_handler```就设置了新的```eip```值，这种做法，如果是c语言中的函数调用是不起作用的，因为在函数调用结束后，会因为```esp```指针的上移而丢弃掉， 而```do_signal```是在汇编程序中被调用，因此调用完毕之后，不会丢弃掉这些参数。

随后将一些寄存器的值保存在用户栈下，在执行完信号处理函数之后，将使用```sa_restorer```进行恢复。如果设置了```SA_NOMASK```，则代表不会修改进程PCB中的blocked参数，因此只需要放7个参数到栈上。而当设置了```sa->sa_flags```之后，会修改进程PCB中的blocked参数，需要在信号处理函数执行完毕之后还原为原来的blocked参数，因此也需要入栈，即入栈8个参数。

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

![do_after](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/signal/signal_after.png)

当信号处理函数执行完毕，通过```return```返回时，就会去执行```sa_restorer```处的代码。

![sa_restore](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/signal/sa_restore.png)

下面就将解答之前在```sys_signal```中抛出的问题，```sa_restorer```是干什么的？ 

```sa_restorer```实际就是用于**恢复用户栈**，并且让程序**恢复到系统调用之前的上下文**。 

编译器会在编译程序中调用libc库中信号系统调用函数把```sa_restorer```作为参数传递给```sys_signal```或者```sigaction```。

signal入参没有```sa_flag```，因此传入```__sig_restore```。

```c
void (*signal(int sig, __sighandler_t func))(int)
{
	void (*res)();.
	register int __fooebx __asm__ ("bx") = sig;
	__asm__("int $0x80":"=a"(res):
	"0" (_NR_signal), "r" (__fooebx), "c"(func), "d"((long)__sig_restore)
}
```

sigaction有```sa_flag```参数，因此可以```sa_flag```参数决定传入```__sig_restore```或者是```__masksig_restore```。

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

```__sig_restore```和```__masksig_restore```的定义如下所示:

其二者区别就在于栈中的参数是7个还是8个。

```x86asm
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

到此为止， 梳理起来```do_signal```的处理流程如下：

```shell
ret_from_sys_call->do_signal->iret->handler->return->sa_restorer->return->origin eip
```

如下图所示:

![do_signal_flow](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/signal/do_signal_flow.png)