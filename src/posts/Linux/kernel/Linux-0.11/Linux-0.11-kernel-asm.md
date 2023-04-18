---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理asm.s详解

## 模块简介

该模块和CPU异常处理相关，在代码结构上asm.s和traps.c强相关。 CPU探测到异常时，主要分为两种处理方式，一种是有错误码，另一种是没有错误码，对应的方法就是**error_code**和**no_error_code**。在下面的函数详解中，将主要以两个函数展开。

## 函数详解

### no_error_code

对于一些异常而言，CPU在出现这些异常时不会将error code压入栈中。其和一般的中断类似，会将ss,esp,eflags,cs,eip这几个寄存器的值压入内核栈中。如下图所示：

![无错误码的情景](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/trap/no_error.png)

接下来，以divide_error为例，其会将do_divide_error的地址压入内核栈中， no_error_code第一步便是将do_divide_error的值存入eax中。

```asm
no_error_code:
	xchgl %eax,(%esp)
```

no_error_code接下来就是保存一些CPU上下文，
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

在保护好CPU上下文之后，接下来就是为调用do_divide_error做一些准备，将入参压入栈。
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

这些工作都准备完成之后，就通过call去调用do_divide_error这个c函数。
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