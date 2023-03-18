---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理signal.c详解

signal.c主要涉及的是进程的信号处理。该章节中最难理解的是do_singal函数。

## sys_sgetmask
```c
int sys_ssetmask(int newmask)
```
该函数的作用是设置信号的屏蔽图，即进程对哪些信号可以不做处理。

## sys_ssetmask
```c
int sys_ssetmask(int newmask)
```
用于设置新的信号屏蔽位图。其中SIGKILL是不可以被屏蔽的。

``` ~(1<<(SIGKILL-1))``` 保证了SIGKILL的屏蔽位为0。

```c
int old=current->blocked;

current->blocked = newmask & ~(1<<(SIGKILL-1));
```
## save_old
```c
static inline void save_old(char * from,char * to)
```
该函数在sys_sigaction中被调用， 其作用是将旧的sigaction对象拷贝到用户地址空间。

其中调用了put_fs_byte函数，其定义在segment.h文件中，其作用是把内核态一个字节的数据拷贝到由 fs:addr 指向的用户态内存地址空间。

下面分析该函数的代码。

首先对to所在的内存进行校验， 接着进行遍历，将from的内容拷贝到to的位置， 实际就是拷贝了from位置的sigaction对象到to位置。
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
	*(to++) = get_fs_byte(from++);
```

## sys_signal
```c
int sys_signal(int signum, long handler, long restorer)
```
该函数是sys_signal的信号处理函数。

程序首先对入参signum做校验，其大小必须在区间[1，32]中，并且其值不得为SIGKILL（9）。
```c
struct sigaction tmp;

if (signum<1 || signum>32 || signum==SIGKILL)
	return -1;
```

接下来设置信号处理函数以及对应的一些标志。例如SA_ONESHOT代表将只执行一次就会将信号处理函数恢复为之前的处理函数。

除此以外还会将信号的默认处理行为保存在sa_restorer中。
```c
tmp.sa_handler = (void (*)(int)) handler;
tmp.sa_mask = 0;
tmp.sa_flags = SA_ONESHOT | SA_NOMASK;
tmp.sa_restorer = (void (*)(void)) restorer;
```

接着取出改信号原来处理函数作为返回值返回。然后将上面构建好的sigaction类型的tmp对象放置于进程的sigaction数组的对应位置。
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
## do_signal
```c
void do_signal(long signr,long eax, long ebx, long ecx, long edx,
	long fs, long es, long ds,
	long eip, long cs, long eflags,
	unsigned long * esp, long ss)
```

![do_signal1](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/signal_raw.png)


![do_after](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/signal_after.png)


![sa_restore](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/signal/sa_restore.png)

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

