---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


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

对于一些异常而言，CPU在出现这些异常除了会将ss,esp,eflags,cs,eip这几个寄存器的值压入内核栈中以外，还会将error_code压入内核栈中。如下图所示：

![有错误码的情景](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/trap/has_error.png)


以double_fault为例，出现该异常时，会将do_double_fault的地址压入栈中。
```asm
double_fault:
	pushl $do_double_fault
```

error_code最初会将error_code的值写入eax寄存器中，将do_double_fault的地址写入ebx寄存器中。

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

接下来做的也是为调用c函数做准备，首先将error_code和出错的地址压入栈中
```asm
pushl %eax			# error code
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

这些工作都准备完成之后，就通过call去调用do_divide_error这个c函数。
```asm
call *%ebx
```
最后的工作便是用于恢复CPU上下文，
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

### divide_error:
无error code，其将do_divide_error的地址压入栈中。
```asm
pushl $do_divide_error
```

### debug
无error code，其将do_int3的地址压入栈中，进而调用no_error_code

```asm
debug:
	pushl $do_int3		# _do_debug
	jmp no_error_code
```

### nmi
无error code，其将do_nmi的地址压入栈中，进而调用no_error_code
```asm
nmi:
	pushl $do_nmi
	jmp no_error_code
```

### int3
无error code，其将do_int3的地址压入栈中，进而调用no_error_code
```asm
int3:
	pushl $do_int3
	jmp no_error_code
```

### overflow
无error code，其将do_overflow的地址压入栈中，进而调用no_error_code
```asm
overflow:
	pushl $do_overflow
	jmp no_error_code
```

### bounds
无error code，其将do_bounds的地址压入栈中，进而调用no_error_code
```asm
bounds:
	pushl $do_bounds
	jmp no_error_code
```

### invalid_op
无error code，其将do_invalid_op的地址压入栈中，进而调用no_error_code
```asm
invalid_op:
	pushl $do_invalid_op
	jmp no_error_code
```

### coprocessor_segment_overrun
无error code，其将coprocessor_segment_overrun的地址压入栈中，进而调用no_error_code
```asm
coprocessor_segment_overrun:
	pushl $do_coprocessor_segment_overrun
	jmp no_error_code
```

### reserved
无error code，其将reserved的地址压入栈中，进而调用no_error_code
```asm
reserved:
	pushl $do_reserved
	jmp no_error_code
```


### double_fault
有error code，其将do_double_fault的地址压入栈中，进而调用error_code
```asm
double_fault:
	pushl $do_double_fault
```

### invalid_TSS
有error code，其将do_invalid_TSS的地址压入栈中，进而调用error_code
```
invalid_TSS:
	pushl $do_invalid_TSS
	jmp error_code
```
### segment_not_present
有error code，其将do_segment_not_present的地址压入栈中，进而调用error_code
```asm
segment_not_present:
	pushl $do_segment_not_present
	jmp error_code
```

### stack_segment
有error code，其将do_stack_segment的地址压入栈中，进而跳转执行error_code
```asm
stack_segment:
	pushl $do_stack_segment
	jmp error_code
```
### general_protection
有error code，其将do_general_protection的地址压入栈中，进而跳转执行error_code
```asm
general_protection:
	pushl $do_general_protection
	jmp error_code
```

## Q & A