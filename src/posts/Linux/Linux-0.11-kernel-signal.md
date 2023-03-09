---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理signal.c详解

signal.c主要涉及的是进程的信号处理。

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

```c
int old=current->blocked;

current->blocked = newmask & ~(1<<(SIGKILL-1));
```
## save_old
```c
static inline void save_old(char * from,char * to)
```

## get_new
```c
static inline void get_new(char * from,char * to)
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


## do_signal
```c
void do_signal(long signr,long eax, long ebx, long ecx, long edx,
	long fs, long es, long ds,
	long eip, long cs, long eflags,
	unsigned long * esp, long ss)
```
