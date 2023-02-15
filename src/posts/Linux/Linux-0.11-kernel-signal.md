---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理signal.c详解

## sys_sgetmask
```c
int sys_ssetmask(int newmask)
```
该函数的作用是设置信号的屏蔽图，即进程对哪些信号可以不做处理。

## sys_ssetmask
```c
int sys_ssetmask(int newmask)
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


## sys_sigaction
```c
int sys_sigaction(int signum, const struct sigaction * action,
	struct sigaction * oldaction)
```

## do_signal
```c
void do_signal(long signr,long eax, long ebx, long ecx, long edx,
	long fs, long es, long ds,
	long eip, long cs, long eflags,
	unsigned long * esp, long ss)
```
