---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理asm.s详解](#linux-011-kernel目录进程管理asms详解)
	- [模块简介](#模块简介)
	- [函数详解](#函数详解)
		- [no\_error\_code](#no_error_code)
		- [error\_code](#error_code)
		- [Intel保留中断号的含义](#intel保留中断号的含义)
			- [divide\_error:](#divide_error)
			- [debug](#debug)
			- [nmi](#nmi)
			- [int3](#int3)
			- [overflow](#overflow)
			- [bounds](#bounds)
			- [invalid\_op](#invalid_op)
			- [coprocessor\_segment\_overrun](#coprocessor_segment_overrun)
			- [reserved](#reserved)
			- [double\_fault](#double_fault)
			- [invalid\_TSS](#invalid_tss)
			- [segment\_not\_present](#segment_not_present)
			- [stack\_segment](#stack_segment)
			- [general\_protection](#general_protection)


# Linux-0.11 kernel目录进程管理asm.s详解

## 模块简介

该模块和CPU异常处理相关，在代码结构上```asm.s```和```traps.c```强相关。 CPU探测到异常时，主要分为两种处理方式，一种是有错误码，另一种是没有错误码，对应的方法就是**error_code**和**no_error_code**。在下面的函数详解中，将主要以两个函数展开。

## 函数详解

### no_error_code

对于一些异常而言，CPU在出现这些异常时不会将error code压入栈中。其和一般的中断类似，会将```ss```,```esp```,```eflags```,```cs```,```eip```这几个寄存器的值压入内核栈中。如下图所示：

![无错误码的情景](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/trap/no_error.png)

接下来，以```divide_error```为例，详细解释这一过程。

```divide_error```也就是所谓的0号中断，通常指的是**除零异常**或**除法错误**。这个中断在进行除法运算时如果被除数为0时会触发。

在x86架构的处理器上，除零异常会引发中断，中断向量号为0。当除零异常发生时，CPU会转移控制权到预定义的中断处理程序。在操作系统内核中，可以通过注册一个特定的中断处理程序来处理这个异常，通常是在中断描述符表（IDT）中指定中断向量0对应的处理程序地址。

Linux-0.11中在trap.c中设置0x0号中断的处理方法是```divide_error```。

```
	set_trap_gate(0,&divide_error);
```

```divide_error```具体的定义是在```asm.s```中，首先会将```do_divide_error```的地址压入内核栈中。

```xchgl``` 汇编指令用于交换指定寄存器和指定内存地址处的值。在这里，```xchgl %eax,(%esp)``` 的作用是将 ```%eax``` 寄存器的值与栈顶指针指向的内存位置处的值进行交换，也就是将 ```%eax``` 的值压入栈中，并将栈顶位置处的值存入 ```%eax``` 中。

```asm
divide_error:
	pushl $do_divide_error
no_error_code:
	xchgl %eax,(%esp)
```

接下来就是需要保存一些CPU上下文，将 ```%ebx```、```%ecx```、```%edx```、```%edi```、```%esi```、```%ebp```、```%ds```、```%es``` 和 ```%fs``` 推入栈中，保存它们的值以便稍后恢复。

```asm
pushl %ebx
pushl %ecx
pushl %edx
pushl %edi
pushl %esi
pushl %ebp
push %ds
push %es
push %fs
```

在保护好CPU上下文之后，接下来就是为调用```do_divide_error```做一些准备，将入参压入栈。```void do_divide_error```的原型是```void do_divide_error(long esp, long error_code)```。这里入参```esp```是指中断调用之后堆栈指针的指向，```esp```指向的位置存储的是原```eip```。

在```do_divide_error```方法中，通过```esp```的值打印一些信息。

```asm
pushl $0		# "error code"
lea 44(%esp),%edx
pushl %edx
```

将下来初始化段寄存器，加载内核的数据段选择符。

```asm
movl $0x10,%edx
mov %dx,%ds
mov %dx,%es
mov %dx,%fs
```

这些工作都准备完成之后，就通过call去调用```do_divide_error```这个c函数。

```asm
call *%eax
```

调用完毕之后，恢复现场。

```asm
addl $8,%esp
pop %fs
pop %es
pop %ds
popl %ebp
popl %esi
popl %edi
popl %edx
popl %ecx
popl %ebx
popl %eax
iret
```

通过```divide_error```的例子，我们知道当0号中断发生时，会在栈上构建出一些参数，最后将调用```do_divide_error```打印一些出错信息以提示用户发生中断的信息以用于检查问题。打印完毕之后，将栈上的环境恢复到中断之前的样子。

### error_code

对于一些异常而言，CPU在出现这些异常除了会将```ss```,```esp```,```eflags```,```cs```,```eip```这几个寄存器的值压入内核栈中以外，还会将```error_code```压入内核栈中。如下图所示：

![有错误码的情景](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/trap/has_error.png)


下面会以```double_fault```为例，来理解带有错误码的处理过程。

在计算机体系结构中，"double fault"（双重故障）是一种处理器异常的情况，它发生在处理一个异常时又发生了另一个异常。在 x86 架构中，通常指的是处理器在处理一个异常时（如页面错误或非法指令），由于某种原因（通常是由于处理第一个异常时的问题），导致触发了第二个异常。这个第二个异常就是双重故障。

出现该异常时，会将```do_double_fault```的地址压入栈中。

```x86asm
double_fault:
	pushl $do_double_fault
```

随后会将```error_code```的值写入```eax```寄存器中，将```do_double_fault```的地址写入```ebx```寄存器中。

```asm
error_code:
	xchgl %eax,4(%esp)		# error code <-> %eax
	xchgl %ebx,(%esp)		# &function <-> %ebx
```

接下来保存CPU的上下文

```asm
pushl %ecx
pushl %edx
pushl %edi
pushl %esi
pushl %ebp
push %ds
push %es
push %fs
```

接下来做的也是为调用c函数做准备。

```do_double_fault```有2个入参，因此需要将```error_code```和```esp```压入栈中

```c
void do_double_fault(long esp, long error_code)
```

这段汇编就是将```error_code```和出错的地址压入栈中。

```asm
pushl %eax			    # error code
lea 44(%esp),%eax		# offset
pushl %eax
```

将下来初始化段寄存器，加载内核的数据段选择符。

```asm
movl $0x10,%edx
mov %dx,%ds
mov %dx,%es
mov %dx,%fs
```

这些工作都准备完成之后，就调用```do_double_fault```这个c函数。

```asm
call *%ebx
```

最后的工作便是用于恢复CPU上下文，

```x86asm
addl $8,%esp
pop %fs
pop %es
pop %ds
popl %ebp
popl %esi
popl %edi
popl %edx
popl %ecx
popl %ebx
popl %eax
iret
```

### Intel保留中断号的含义

```asm.s```剩下的部分定义了每种中断号的入口方法，例如上面我们举例的divide_error和double_fault。

下面总结了Linux-0.11中对于不同中断号的定义。

|中断号|名称|类型|信号|说明|
|--|--|--|--|--|
|0|Divide error|故障|SIGFPE|进行除以0操作时产生|
|1|Debug|陷阱/故障|SIGTRAP|当进行程序单步跟踪调试时，设置了标志寄存器eflags的T标志时产生这个中断|
|2|nmi|硬件||有不可屏蔽中断NMI产生|
|3|Breakpoint|陷阱|SIGTRAP|由断点指令int3产生，与debug处理相同|
|4|Overflow|陷阱|SIGSEGV|eflags的溢出标志OF引起|
|5|Bounds check|故障|SIGSEGV|寻址到有效地址以外时引起|
|6|Invalid Opcode|故障|SIGILL|CPU执行时发现一个无效的指令操作码|
|7|Device not available|故障|SIGSEGV|设备不存在，指协处理器。在两种情况下会产生该中断：(a)CPU遇到一个转义指令并且EM置位时。在这种情况下处理程序应该模拟导致异常的指令：(b)MP和TS都在置位状态时，CPU遇到WAIT或一个转义指令。在这种情况下，处理程序在必要时应该更新协处理器的状态。|
|8|Double fault|异常终止|SEGSEGV|双故障错误|
|9|Coprocessor segment overrun|异常终止|SIGFPE|协处理器段超出。|
|10|Invalid TSS|故障|SIGSEGV|CPU切换时发现TSS无效|
|11|Segment not present|故障|SIGBUS|描述符指定的段不存在|
|12|Stack segment|故障|SIGBUS|堆栈段不存在或寻址超出堆栈段|
|13|General protection|故障|SIGSEGV|没有符合80386保护机制的操作引起|
|14|Page fault|故障|SIGSEGV|页不存在内存|
|15|Reserved||||
|16|Coprocessor error|故障|SIGFPE|协处理器发出的出错信息引起。|

下面我们梳理下每个中断方法的定义。

#### divide_error:

无error code，其将```do_divide_error```的地址压入栈中。

```asm
pushl $do_divide_error
```

随后进入```no_error_code```的处理流程。

#### debug

无```error code```，其将```do_int3```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
debug:
	pushl $do_int3		# _do_debug
	jmp no_error_code
```

#### nmi

无```error code```，其将```do_nmi```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
nmi:
	pushl $do_nmi
	jmp no_error_code
```

#### int3

无```error code```，其将```do_int3```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
int3:
	pushl $do_int3
	jmp no_error_code
```

#### overflow

无```error code```，其将```do_overflow```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
overflow:
	pushl $do_overflow
	jmp no_error_code
```

#### bounds

无```error code```，其将```do_bounds```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
bounds:
	pushl $do_bounds
	jmp no_error_code
```

#### invalid_op

无```error code```，其将```do_invalid_op```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
invalid_op:
	pushl $do_invalid_op
	jmp no_error_code
```

#### coprocessor_segment_overrun

无error code，其将```coprocessor_segment_overrun```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
coprocessor_segment_overrun:
	pushl $do_coprocessor_segment_overrun
	jmp no_error_code
```

#### reserved

无```error code```，其将```reserved```的地址压入栈中，进而进入```no_error_code```的流程。

```x86asm
reserved:
	pushl $do_reserved
	jmp no_error_code
```

#### double_fault

有```error code```，其将```do_double_fault```的地址压入栈中，进而进入```error_code```的流程。

```asm
double_fault:
	pushl $do_double_fault
```

#### invalid_TSS

有```error code```，其将```do_invalid_TSS```的地址压入栈中，进而进入```error_code```的流程。

```x86asm
invalid_TSS:
	pushl $do_invalid_TSS
	jmp error_code
```

#### segment_not_present

有```error code```，其将```do_segment_not_present```的地址压入栈中，进而进入```error_code```的流程。

```x86asm
segment_not_present:
	pushl $do_segment_not_present
	jmp error_code
```

#### stack_segment

有```error code```，其将```do_stack_segment```的地址压入栈中，进而进入```error_code```的流程。

```x86asm
stack_segment:
	pushl $do_stack_segment
	jmp error_code
```

#### general_protection

有```error code```，其将```do_general_protection```的地址压入栈中，进而进入```error_code```的流程。

```x86asm
general_protection:
	pushl $do_general_protection
	jmp error_code
```
