---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理system_call.s详解

## 模块简介

本节主要介绍了在Linux-0.11中关于系统调用的相关实现。Linux-0.11使用```int 0x80```中断以及eax寄存器中存储的功能号去调用内核中所提供的功能，在系统调用发生的过程中伴随着用户态向内核态的主动切换。

需要注意的时，用户通常并不是直接使用系统调用的中断，而是libc中所提供的接口函数实现。

## 过程分析

### system_call

当0x80号中断发生的时候，CPU除了切入内核态之外，还会自动完成下列几件事：

1.找到当前进程的内核栈, 通过tss中的esp0 ss0定位

2.在内核栈中依次压入用户态的寄存器SS、ESP、EFLAGS、CS、EIP

当内核从系统调用中返回的时候，需要调用"iret"指令来返回用户态，显然iret代表的是内核栈中一系列的寄存器SS、ESP、EFLAGS、CS、EIP弹出操作。

在system_call中会将DS、ES、FS、EDX、ECX、EBX入栈。

在调用sys_call函数时，会将系统调用号传给eax， 因此首先判断eax是否超过了最大的系统调用号。

```asm
cmpl $nr_system_calls-1,%eax
ja bad_sys_call
```

接下来将一些寄存器压栈
```asm
push %ds
push %es
push %fs
pushl %edx
pushl %ecx		# push %ebx,%ecx,%edx as parameters
pushl %ebx		# to the system call
```

将es和ds指向了内核的数据段， 将fs指向了用户的数据段。
0x10 = |0 0 0 0 0 0 0 0 0 0 0 1 0| 0 | 0 0|

段选择子 = 2
TI = 0
RPL = 0

0x17 = |0 0 0 0 0 0 0 0 0 0 0 1 0| 1 | 1 1|

段选择子 = 2
TI = 1
RPL = 3

```asm
movl $0x10,%edx		# set up ds,es to kernel space
mov %dx,%ds
mov %dx,%es
movl $0x17,%edx		# fs points to local data space
mov %dx,%fs
```
下面根据系统调用号去找到对应的调用函数。

```asm
call *sys_call_table(,%eax,4)
```

在AT&T的标准中，```_array(,%eax,4)```所代表的地址是```[_sys_call_table + %eax * 4]```,即功能号所对应的内核系统调用函数的地址。

sys_call_table在sys.h中定义

```c
fn_ptr sys_call_table[] = { sys_setup, sys_exit, sys_fork, sys_read,
sys_write, sys_open, sys_close, sys_waitpid, sys_creat, sys_link,
sys_unlink, sys_execve, sys_chdir, sys_time, sys_mknod, sys_chmod,
sys_chown, sys_break, sys_stat, sys_lseek, sys_getpid, sys_mount,
sys_umount, sys_setuid, sys_getuid, sys_stime, sys_ptrace, sys_alarm,
sys_fstat, sys_pause, sys_utime, sys_stty, sys_gtty, sys_access,
sys_nice, sys_ftime, sys_sync, sys_kill, sys_rename, sys_mkdir,
sys_rmdir, sys_dup, sys_pipe, sys_times, sys_prof, sys_brk, sys_setgid,
sys_getgid, sys_signal, sys_geteuid, sys_getegid, sys_acct, sys_phys,
sys_lock, sys_ioctl, sys_fcntl, sys_mpx, sys_setpgid, sys_ulimit,
sys_uname, sys_umask, sys_chroot, sys_ustat, sys_dup2, sys_getppid,
sys_getpgrp, sys_setsid, sys_sigaction, sys_sgetmask, sys_ssetmask,
sys_setreuid,sys_setregid, sys_iam, sys_whoami };
```

找到系统调用号之后，call命令就将转到相应的地址执行。

当系统调用执行完毕之后，下面判断进程的状态：

```asm
	movl current,%eax
	cmpl $0,state(%eax)		# state
	jne reschedule
	cmpl $0,counter(%eax)		# counter
	je reschedule
```

如果进程状态是ok的，也就意味着程序可以继续运行而不必被挂起， 那么就开始执行ret_from_sys_call。

### ret_from_sys_call

当系统调用执行完毕之后，会执行ret_from_sys_call的代码，从而返回用户态。

在系统调用返回之前，这里还要做的一件事情就是处理进程收到的信号。寄存器中存储的是当前运行的进程current的pcb的地址。这里可以回顾一下pcb的结构，signal的偏移量是16，而blocked的偏移量是33*16。

```c
struct task_struct {
/* these are hardcoded - don't touch */
	long state;	/* -1 unrunnable, 0 runnable, >0 stopped */
	long counter;
	long priority;
	long signal;
	struct sigaction sigaction[32];
	long blocked;	
	/*....*/
```

因此这里定义了两个常量singal=16，blocked=33*16，通过这样的操作将signal的内容存到ebx寄存器中，将blocked的内容存到ecx寄存器中。然后将blocked信号取反和进程收到的信号做与运算（!block & signal），就可以得到进程收到的有效的信号。

```x86asm
	movl signal(%eax),%ebx
	movl blocked(%eax),%ecx
	notl %ecx
	andl %ebx,%ecx
	bsfl %ecx,%ecx
	je 3f
	btrl %ecx,%ebx
	movl %ebx,signal(%eax)
	incl %ecx
	pushl %ecx
	call do_signal
```

在信号处理完毕之后，就是将sys_call压入栈中的寄存器出栈，最后调用iret返回用户态执行的位置。

```x86asm
3:	popl %eax
	popl %ebx
	popl %ecx
	popl %edx
	pop %fs
	pop %es
	pop %ds
	iret
```


### sys_fork

在sys_fork中将调用copy_process完成最后的进程fork的过程，下面是sys_fork的编码，其是一段汇编代码，这是少数用汇编写的sys_开头的函数，大多数sys_开头的内核方法都是c语言编写的。

```x86asm
sys_fork:
	call find_empty_process
	testl %eax,%eax
	js 1f
	push %gs
	pushl %esi
	pushl %edi
	pushl %ebp
	pushl %eax
	call copy_process
	addl $20,%esp
1:	ret
```

sys_fork首先调用find_empty_process去进程task_struct数组中寻找一个空位，如果寻找不到就直接返回。如果寻找到了，就将一些寄存器压栈，进而调用copy_process方法。在调用sys_fork方法时，内核栈的状态如下所示：

![内核栈的状态](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/system_call_stack.png)