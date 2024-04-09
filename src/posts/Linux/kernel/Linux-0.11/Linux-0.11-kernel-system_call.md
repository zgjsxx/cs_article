---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理system\_call.s详解](#linux-011-kernel目录进程管理system_calls详解)
	- [模块简介](#模块简介)
	- [过程分析](#过程分析)
		- [system\_call](#system_call)
		- [ret\_from\_sys\_call](#ret_from_sys_call)
		- [sys\_fork](#sys_fork)
		- [coprocessor\_error](#coprocessor_error)
		- [device\_not\_available](#device_not_available)
		- [timer\_interrupt](#timer_interrupt)
		- [hd\_interrupt](#hd_interrupt)
		- [floppy\_interrupt](#floppy_interrupt)
- [do\_floppy为一函数指针，将被赋值实际处理C函数指针。该指针在被交换放到eax寄存器后](#do_floppy为一函数指针将被赋值实际处理c函数指针该指针在被交换放到eax寄存器后)
- [就将do\_floppy变量置空。然后测试eax中原指针是否为空，若是则使指针指向C函数。](#就将do_floppy变量置空然后测试eax中原指针是否为空若是则使指针指向c函数)
		- [parallel\_interrupt](#parallel_interrupt)


# Linux-0.11 kernel目录进程管理system_call.s详解

## 模块简介

本节主要介绍了在Linux-0.11中关于系统调用的相关实现。Linux-0.11使用```int 0x80```中断以及```eax```寄存器中存储的功能号去调用内核中所提供的功能，在系统调用发生的过程中伴随着用户态向内核态的主动切换。

需要注意的时，用户通常并不是直接使用系统调用的中断，而是libc中所提供的接口函数实现。

系统调用处理过程的整个流程如下图所示：

![系统调用](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/system_call/syscall_flow.png)

## 过程分析

### system_call

当0x80号中断发生的时候，CPU除了切入内核态之外，还会自动完成下列几件事：

1.找到当前进程的内核栈, 通过```tss```中的```esp0``` ```ss0```定位

2.在内核栈中依次压入用户态的寄存器```SS```、```ESP```、```EFLAGS```、```CS```、```EIP```

当内核从系统调用中返回的时候，需要调用```iret```指令来返回用户态，显然iret代表的是内核栈中一系列的寄存器```SS```、```ESP```、```EFLAGS```、```CS```、```EIP```弹出操作。

在```system_call```中会将DS、ES、FS、EDX、ECX、EBX入栈。

在调用```sys_call```函数时，会将系统调用号传给```eax```， 因此首先判断```eax```是否超过了最大的系统调用号, 如果超出了，就跳到 ```bad_sys_call``` 标签处处理错误。

```x86asm
cmpl $nr_system_calls-1,%eax
ja bad_sys_call
```

接下来的几行代码保存了原来的段寄存器值，因为系统调用会改变这些寄存器的值。

```x86asm
push %ds
push %es
push %fs
```

下面入栈的ebx、ecx和edx中放着系统调用相应C语言函数的调用函数。这几个寄存器入栈的顺序是由GNU GCC规定的，ebx 中可存放第1个参数，ecx中存放第2个参数，edx中存放第3个参数。

```x86asm
pushl %edx
pushl %ecx		# push %ebx,%ecx,%edx as parameters
pushl %ebx		# to the system call
```

接下来将```es```和```ds```设置为```0x10```。

```x86asm
movl $0x10,%edx		# set up ds,es to kernel space
mov %dx,%ds
mov %dx,%es
```

```0x10```多次出现，可以分解为```0x10 = 0000000000010_0_00```，即段选择子 = 2，TI = 0，RPL = 0。这里之际就是让```ds```和```es```指向了内核数据段。

接下来将```fs```设置为```0x17```。可以分解为```0x17 = 0000000000010_1_11```。即段选择子 = 2，TI = 1，RPL = 3。这里之际就是让```fs``指向了用户数据段。


```x86asm
movl $0x17,%edx		# fs points to local data space
mov %dx,%fs
```

下面根据系统调用号去找到对应的调用函数。

```asm
call *sys_call_table(,%eax,4)
```

在AT&T的标准中，```_array(,%eax,4)```所代表的地址是```[_sys_call_table + %eax * 4]```,即功能号所对应的内核系统调用函数的地址。

```sys_call_table```在```sys.h```中定义

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

如果进程状态是ok的，也就意味着程序可以继续运行而不必被挂起， 那么就开始执行```ret_from_sys_call```。

### ret_from_sys_call

当系统调用执行完毕之后，会执行```ret_from_sys_call```的代码，从而返回用户态。

这里首先判别当前任务是否是初始任务task0,如果是则不比对其进行信号量方面的处理，直接返回。

```x86asm
	movl current,%eax		# task[0] cannot have signals
	cmpl task,%eax
	je 3f                   # 向前(forward)跳转到标号3处退出中断处理
```

通过对原调用程序代码选择符的检查来判断调用程序是否是用户任务。如果不是则直接退出中断。这是因为任务在内核态执行时不可抢占。否则对任务进行信号量的识别处理。这里比较选择符是否为用户代码段的选择符0x000f(RPL=3,局部表，第一个段(代码段))来判断是否为用户任务。如果不是则说明是某个中断服务程序跳转到上面的，于是跳转退出中断程序。如果原堆栈段选择符不为0x17(即原堆栈不在用户段中)，也说明本次系统调用的调用者不是用户任务，则也退出。

```x86asm
	cmpw $0x0f,CS(%esp)		# was old code segment supervisor ?
	jne 3f
	cmpw $0x17,OLDSS(%esp)		# was stack segment = 0x17 ?
	jne 3f
```

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

因此这里定义了两个常量```singal=16```，```blocked=33*16```，通过这样的操作将signal的内容存到```ebx```寄存器中，将```blocked```的内容存到ecx寄存器中。然后将```blocked```信号取反和进程收到的信号做与运算（!block & signal），就可以得到进程收到的有效的信号。

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

在信号处理完毕之后，就是将```sys_call```压入栈中的寄存器出栈，最后调用```iret```返回用户态执行的位置。

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

在sys_fork中将调用```copy_process```完成最后的进程fork的过程，下面是```sys_fork```的代码，其是一段汇编代码，这是少数用汇编写的sys_开头的函数，大多数sys_开头的内核方法都是c语言编写的。

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

```sys_fork```首先调用```find_empty_process```去进程```task_struct```数组中寻找一个空位，如果寻找不到就直接返回。如果寻找到了，就将一些寄存器压栈，进而调用```copy_process```方法。在调用```sys_fork```方法时，内核栈的状态如下所示：

![内核栈的状态](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/system_call_stack.png)

### coprocessor_error

这段代码是一个处理协处理器错误的中断处理程序。

```x86asm
coprocessor_error:
	push %ds
	push %es
	push %fs
	pushl %edx
	pushl %ecx
	pushl %ebx
	pushl %eax
	movl $0x10,%eax                 # ds,es置为指向内核数据段
	mov %ax,%ds
	mov %ax,%es
	movl $0x17,%eax                 # fs置为指向局部数据段(出错程序的数据段)
	mov %ax,%fs
	pushl $ret_from_sys_call        # 把下面调用返回的地址入栈。
	jmp math_error                  # 执行C函数math_error(在math/math_emulate.c中)
```

首先，它保存了当前的数据段寄存器```ds```、```es```、```fs``` 到堆栈中，以便后续恢复。

接着，它将 ```edx```、```ecx```、```ebx```、```eax``` 寄存器的值依次压入堆栈中，保存了这些寄存器的内容。

然后，它将 ```ds``` 和 ```es``` 寄存器设置为指向内核数据段，即将数据段选择符设置为 ```0x10```，以确保后续操作在内核数据段中进行。

```fs``` 寄存器被设置为指向局部数据段，即设置数据段选择符为 ```0x17```，这可能是为了在错误处理中访问特定于错误情况的数据。

接着，它将一个返回地址 ret_from_sys_call 压入堆栈，该地址指示了错误处理程序返回后要返回的位置。

最后，它通过 ```jmp``` 指令跳转到 ```math_error``` 函数，执行实际的错误处理。这个函数在 math/math_emulate.c 中实现。

```c
void math_error(void)
{
	__asm__("fnclex");
	if (last_task_used_math)
		last_task_used_math->signal |= 1<<(SIGFPE-1);
}
```

```fnclex``` 指令用于清除数学协处理器状态字（FP status word），确保在处理错误之前清除任何悬而未决的数学操作结果，以避免错误状态的传播。

然后，它检查变量 ```last_task_used_math``` 是否为真（非空）。如果上一个使用数学协处理器的任务存在，它将设置该任务的信号字段中的 ```SIGFPE``` 位，通过位运算 1<<```(SIGFPE-1)``` 来设置该位，```SIGFPE``` 是表示浮点运算错误的信号。这样做是为了标记任务曾经发生过浮点运算错误，以便后续处理。

总的来说，这段代码是在处理协处理器错误时执行的，它准备了一些寄存器和数据段，然后跳转到特定的错误处理函数。

### device_not_available

设备不存在或协处理器不存在。类型：错误；无错误码。

如果控制寄存器CRO中EM(模拟)标志置位，则当CPU执行一个协处理器指令时就会引发该中断，这样CPU就可以有机会让这个中断处理程序模拟协处理器指令。CRO的交换标志TS是在CPU执行任务转换时设置的。TS可以用来确定什么时候协处理器中的内容与CPU正在执行的任务不匹配了。当CPU在运行一个协处理器转义指令时发现TS置位时，就会引发该中断。此时就可以保存前一个任务的协处理器内容，并恢复新任务的协处理器执行状态。该中断最后将转移到标号ret_from_sys_call处执行下去(检测并处理信号)。

```x86asm
device_not_available:
	push %ds
	push %es
	push %fs
	pushl %edx
	pushl %ecx
	pushl %ebx
	pushl %eax
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
	movl $0x17,%eax
	mov %ax,%fs
	pushl $ret_from_sys_call    # 把下面跳转或调用的返回地址入栈。
	clts				# clear TS so that we can use math
	movl %cr0,%eax
	testl $0x4,%eax			# EM (math emulation bit)
	je math_state_restore   # 执行C函数
	pushl %ebp
	pushl %esi
	pushl %edi
	call math_emulate
	popl %edi
	popl %esi
	popl %ebp
	ret
```

首先，它保存了当前的数据段寄存器 ```ds```、```es```、```fs``` 到堆栈中，以便后续恢复。

接着，它将 ```edx```、```ecx```、```ebx```、```eax``` 寄存器的值依次压入堆栈中，保存了这些寄存器的内容。

然后，它将 ```ds``` 和 ```es``` 寄存器设置为指向内核数据段，即将数据段选择符设置为 ```0x10```，以确保后续操作在内核数据段中进行。

```fs``` 寄存器被设置为指向局部数据段，即设置数据段选择符为 ```0x17```，这可能是为了在错误处理中访问特定于错误情况的数据。

接着，它将一个返回地址 ```ret_from_sys_call``` 压入堆栈，该地址指示了中断处理程序返回后要返回的位置。

```clts``` 指令用于清除任务切换标志位（TS），以允许使用数学协处理器。

接下来，它通过读取控制寄存器 ```CR0``` 来检查数学仿真位```EM```，如果未设置，即协处理器为可用状态，则跳转到 ```math_state_restore``` 执行相应的 C 函数。

如果数学仿真位被设置，即协处理器不可用，则调用 ```math_emulate``` 函数来模拟数学操作。

```c
void math_emulate(long edi, long esi, long ebp, long sys_call_ret,
	long eax,long ebx,long ecx,long edx,
	unsigned short fs,unsigned short es,unsigned short ds,
	unsigned long eip,unsigned short cs,unsigned long eflags,
	unsigned short ss, unsigned long esp)
{
	unsigned char first, second;

/* 0x0007 means user code space */
	if (cs != 0x000F) {
		printk("math_emulate: %04x:%08x\n\r",cs,eip);
		panic("Math emulation needed in kernel");
	}
	first = get_fs_byte((char *)((*&eip)++));
	second = get_fs_byte((char *)((*&eip)++));
	printk("%04x:%08x %02x %02x\n\r",cs,eip-2,first,second);
	current->signal |= 1<<(SIGFPE-1);
}
```

函数接受了一系列参数，包括寄存器的值和当前的代码段、指令指针等信息。

首先，它检查当前的代码段是否为用户代码空间（```0x000F```）。如果不是，则打印错误消息并引发 panic。这表示内核中出现了需要数学模拟的情况，这通常是不允许的，因此会导致内核崩溃。

如果当前代码段确实为用户代码空间，它会依次从指令指针处读取两个字节的数据，即模拟执行用户空间的指令。然后，它打印所读取的指令的地址、内容。

最后，它将当前任务的信号字段中的 ```SIGFPE``` 位设置为1，表示发生了浮点运算错误。

### timer_interrupt

```
timer_interrupt:
	push %ds		# save ds,es and put kernel data space
	push %es		# into them. %fs is used by _system_call
	push %fs
	pushl %edx		# we save %eax,%ecx,%edx as gcc doesn't
	pushl %ecx		# save those across function calls. %ebx
	pushl %ebx		# is saved as we use that in ret_sys_call
	pushl %eax
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
	movl $0x17,%eax
	mov %ax,%fs
	incl jiffiesss
	movb $0x20,%al		# EOI to interrupt controller #1
	outb %al,$0x20      # 操作命令字OCW2送0x20端口
	movl CS(%esp),%eax
	andl $3,%eax		# %eax is CPL (0 or 3, 0=supervisor)
	pushl %eax
	call do_timer		# 'do_timer(long CPL)' does everything from
	addl $4,%esp		# task switching to accounting ...
	jmp ret_from_sys_call
```

首先，它保存了当前的数据段寄存器 ```ds```、```es```、```fs``` 到堆栈中，以便后续恢复。

接着，它将 ```edx```、```ecx```、```ebx```、```eax``` 寄存器的值依次压入堆栈中，保存了这些寄存器的内容。

然后，它将 ```ds``` 和 ```es``` 寄存器设置为指向内核数据段，即将数据段选择符设置为 ```0x10```，以确保后续操作在内核数据段中进行。

```fs``` 寄存器被设置为指向局部数据段，即设置数据段选择符为 ```0x17```，这可能是为了在中断处理中访问特定于定时器的数据。

```incl jiffies``` 增加了全局变量 ```jiffies```，它用于跟踪系统运行时间。

接下来，它向中断控制器发送 ```End-of-Interrupt（EOI）```信号，以告知硬件中断处理已完成。

然后，它从堆栈中取出当前特权级别（CPL），并将其压入堆栈，作为参数传递给 ```do_timer()``` 函数。```do_timer()```函数负责执行任务切换、计时等工作。

最后，它调用 ```do_timer()``` 函数，并通过 ```ret_from_sys_call``` 返回到系统调用的返回路径。

### hd_interrupt

```x86asm
hd_interrupt:
	pushl %eax
	pushl %ecx
	pushl %edx
	push %ds
	push %es
	push %fs
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
	movl $0x17,%eax
	mov %ax,%fs
# 由于初始化中断控制芯片时没有采用自动EOI，所以这里需要发指令结束该硬件中断。
	movb $0x20,%al
	outb %al,$0xA0		# EOI to interrupt controller #1
	jmp 1f			# give port chance to breathe
1:	jmp 1f
# do_hd定义为一个函数指针，将被赋值read_intr()或write_intr()函数地址。放到edx
# 寄存器后就将do_hd指针变量置为NULL。然后测试得到的函数指针，若该指针为空，则
# 赋予该指针指向C函数unexpected_hd_interrupt()，以处理未知硬盘中断。
1:	xorl %edx,%edx
	xchgl do_hd,%edx
	testl %edx,%edx             # 测试函数指针是否为NULL
	jne 1f                      # 若空，则使指针指向C函数unexpected_hd_interrup().
	movl $unexpected_hd_interrupt,%edx
1:	outb %al,$0x20              # 送主8259A中断控制器EOI命令(结束硬件中断)
	call *%edx		# "interesting" way of handling intr.
	pop %fs                     # 上句调用do_hd指向C函数
	pop %es
	pop %ds
	popl %edx
	popl %ecx
	popl %eax
	iret
```

### floppy_interrupt

floppy_interrupt:
	pushl %eax
	pushl %ecx
	pushl %edx
	push %ds
	push %es
	push %fs
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
	movl $0x17,%eax
	mov %ax,%fs
	movb $0x20,%al
	outb %al,$0x20		# EOI to interrupt controller #1
# do_floppy为一函数指针，将被赋值实际处理C函数指针。该指针在被交换放到eax寄存器后
# 就将do_floppy变量置空。然后测试eax中原指针是否为空，若是则使指针指向C函数。
	xorl %eax,%eax
	xchgl do_floppy,%eax
	testl %eax,%eax
	jne 1f
	movl $unexpected_floppy_interrupt,%eax
1:	call *%eax		# "interesting" way of handling intr.
	pop %fs
	pop %es
	pop %ds
	popl %edx
	popl %ecx
	popl %eax
	iret

### parallel_interrupt

该方法是```int 0x27```并行口中断处理程序，对硬件中断请求信号IRQ7。

```x86asm
parallel_interrupt:
	pushl %eax
	movb $0x20,%al
	outb %al,$0x20
	popl %eax
	iret
```

```pushl %eax```: 将 ```%eax``` 寄存器的值压入堆栈。这是为了在执行 ```iret``` 指令之前保存 ```%eax``` 寄存器的值。

```movb $0x20,%al```: 将立即数 0x20 移动到 %al 寄存器中。这个操作是为了向主中断控制器发送 End-of-Interrupt（EOI）信号，告知它当前处理的中断已经完成。

```outb %al,$0x20```: 将 %al 寄存器的值（即 0x20）写入 I/O 端口 ```0x20```，以向主中断控制器发送 EOI 信号，表示中断处理已经完成。

```popl %eax```: 从堆栈中弹出之前保存的 %eax 寄存器的值，恢复到中断处理程序执行之前的状态。

```iret```: 执行中断返回指令，从堆栈中弹出标志寄存器、代码段寄存器和指令指针的值，恢复到中断发生时的执行现场，并继续执行中断点之后的指令。

可以看出在Linux-0.11版本内核还未实现，这里只是发送EOI指令。