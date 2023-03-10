---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录system_call详解



## system_call

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
下面根据系统调用号去找到对应的调用函数
```asm
call *sys_call_table(,%eax,4)
```

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

下面判断进程的状态，
```asm
	movl current,%eax
	cmpl $0,state(%eax)		# state
	jne reschedule
	cmpl $0,counter(%eax)		# counter
	je reschedule
```

如果进程状态是ok的，也就意味着程序可以继续运行而不必被挂起， 那么就开始执行ret_from_sys_call




这段代码的作用就是将sys_call压入栈中的寄存器出栈
```asm
3:	popl %eax
	popl %ebx
	popl %ecx
	popl %edx
	pop %fs
	pop %es
	pop %ds
	iret
```