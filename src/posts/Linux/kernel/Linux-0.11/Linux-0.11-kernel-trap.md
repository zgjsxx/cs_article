---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理trap.c详解](#linux-011-kernel目录进程管理trapc详解)
	- [模块简介](#模块简介)
	- [函数详解](#函数详解)
		- [die](#die)
		- [trap\_init](#trap_init)
		- [中断函数入口](#中断函数入口)
			- [do\_double\_fault](#do_double_fault)
			- [do\_general\_protection](#do_general_protection)
			- [do\_divide\_error](#do_divide_error)
			- [do\_int3](#do_int3)
			- [do\_nmi](#do_nmi)
			- [do\_debug](#do_debug)
			- [do\_overflow](#do_overflow)
			- [do\_bounds](#do_bounds)
			- [do\_invalid\_op](#do_invalid_op)
			- [do\_device\_not\_available](#do_device_not_available)
			- [do\_coprocessor\_segment\_overrun](#do_coprocessor_segment_overrun)
			- [do\_invalid\_TSS](#do_invalid_tss)
			- [do\_segment\_not\_present](#do_segment_not_present)
			- [do\_stack\_segment](#do_stack_segment)
			- [do\_coprocessor\_error](#do_coprocessor_error)
			- [do\_reserved](#do_reserved)


# Linux-0.11 kernel目录进程管理trap.c详解

## 模块简介

trap.c程序主要包括一些在处理异常故障（硬件中断）底层代码asm.s文件中调用的相应c函数。用于显示出错位置和出错号等调试信息。大部分的方法都会使用```die```方法显示详细的出错信息。

trap.c中还有一个重要的方法```trap_init```，该方法在init/main.c中被调用，用于初始化硬件异常处理中断向量(陷阱门)，并设置允许中断请求信号的倒来。

## 函数详解

### die

```c
static void die(char * str,long esp_ptr,long nr)
```

d该函数用于在出现异常时，打印一些出错信息。

```c
long * esp = (long *) esp_ptr;
int i;

printk("%s: %04x\n\r",str,nr&0xffff);
printk("EIP:\t%04x:%p\nEFLAGS:\t%p\nESP:\t%04x:%p\n",
	esp[1],esp[0],esp[2],esp[4],esp[3]);
printk("fs: %04x\n",_fs());
printk("base: %p, limit: %p\n",get_base(current->ldt[1]),get_limit(0x17));
if (esp[4] == 0x17) {
	printk("Stack: ");
	for (i=0;i<4;i++)
		printk("%p ",get_seg_long(0x17,i+(long *)esp[3]));
	printk("\n");
}
str(i);
printk("Pid: %d, process nr: %d\n\r",current->pid,0xffff & i);
for(i=0;i<10;i++)
	printk("%02x ",0xff & get_seg_byte(esp[1],(i+(char *)esp[0])));
printk("\n\r");
do_exit(11);		/* play segment exception */
```

函数首先将传递进来的堆栈指针 ```esp_ptr``` 转换为长整型指针 ```esp```，以便于后续对堆栈内容的读取。接着用 printk 打印出一些异常信息的标题，以及异常号的低16位。这些信息可能包含异常的类型或来源。

```c
long * esp = (long *) esp_ptr;
int i;

printk("%s: %04x\n\r",str,nr&0xffff);
```

接着，打印当前堆栈中的关键寄存器值，包括指令指针（EIP）、标志寄存器（EFLAGS）和堆栈指针（ESP）。

```c
printk("EIP:\t%04x:%p\nEFLAGS:\t%p\nESP:\t%04x:%p\n",
	esp[1],esp[0],esp[2],esp[4],esp[3]);
```

然后，它打印当前任务的文件系统段寄存器值（fs），以及当前任务局部描述符表（LDT）中第二个段描述符指向的段的基址和段限长。

```c
printk("fs: %04x\n",_fs());
printk("base: %p, limit: %p\n",get_base(current->ldt[1]),get_limit(0x17));
```

这里使用get_base和get_limit方法获取段基址和段限长，这里基于段描述符的结构进行实现。

```shell
+-------------------+-----------------+
| 段描述符字段       | 字节            |
+-------------------+-----------------+
| 基址 23:16        | [7]             |
+-------------------+-----------------+
| 其他              | [6] 高4位        |
+-------------------+-----------------+
| 基址 29:16        | [6] 低4位        |
+-------------------+-----------------+
| 其他              | [5]             |
+-------------------+-----------------+
| 其他              | [4]             |
+-------------------+-----------------+
| 基址 23:16        | [4]             |
+-------------------+-----------------+
| 基址 15:0         | [2-3]           |
+-------------------+-----------------+
| 段限长 15:0       | [0-1]           |
+-------------------+-----------------+

```

接下来如果堆栈在用户数据段，则还会打印16字节堆栈内容。

```c
	if (esp[4] == 0x17) {
		printk("Stack: ");
		for (i=0;i<4;i++)
			printk("%p ",get_seg_long(0x17,i+(long *)esp[3]));
		printk("\n");
	}
```

最后打印了任务号，进程号，10字节指令码。

```c
str(i);                 // 取当前运行任务的任务号
printk("Pid: %d, process nr: %d\n\r",current->pid,0xffff & i);
for(i=0;i<10;i++)
	printk("%02x ",0xff & get_seg_byte(esp[1],(i+(char *)esp[0])));
printk("\n\r");
do_exit(11);		/* play segment exception */
```

这里相对难懂的是这句代码。 

```c
for(i=0;i<10;i++)
	printk("%02x ",0xff & get_seg_byte(esp[1],(i+(char *)esp[0])));
```

```esp[1]```的内容是cs段描述符， ```esp[0]```的内容是EIP指针。这段代码的作用是打印当前栈帧中连续 10 个字节的十六进制值，以便在调试时查看栈上的内容。

### trap_init

trap_init方法的原型如下所示：

```c
void trap_init(void)
```

下面是异常(陷阱)中断程序初始化子程序。设置它们的中断调用门(中断向量)。```set_trap_gate```与```set_system_gate```都使用了IDT中的陷阱门，它们之间的区别在于前者设置的特权级为0，后者是3。

```c
	int i;

	set_trap_gate(0,&divide_error);
	set_trap_gate(1,&debug);
	set_trap_gate(2,&nmi);
	set_system_gate(3,&int3);	/* int3-5 can be called from all */
	set_system_gate(4,&overflow);
	set_system_gate(5,&bounds);
	set_trap_gate(6,&invalid_op);
	set_trap_gate(7,&device_not_available);
	set_trap_gate(8,&double_fault);
	set_trap_gate(9,&coprocessor_segment_overrun);
	set_trap_gate(10,&invalid_TSS);
	set_trap_gate(11,&segment_not_present);
	set_trap_gate(12,&stack_segment);
	set_trap_gate(13,&general_protection);
	set_trap_gate(14,&page_fault);
	set_trap_gate(15,&reserved);
	set_trap_gate(16,&coprocessor_error);
	for (i=17;i<48;i++)
		set_trap_gate(i,&reserved);
	set_trap_gate(45,&irq13);
	outb_p(inb_p(0x21)&0xfb,0x21);
	outb(inb_p(0xA1)&0xdf,0xA1);
	set_trap_gate(39,&parallel_interrupt);
```

除了陷阱门以外，还有一种中断门，其方法是```set_intr_gate```。

**中断门**和**陷阱门**是两种不同类型的门，用于在 x86 架构中实现中断和异常处理。它们之间的主要区别在于如何处理被调用的处理程序（即中断服务例程或异常处理例程）的返回方式。

中断门（Interrupt Gate）：

- 中断门用于处理中断请求（IRQs）或外部设备产生的中断。当硬件引发中断时，CPU会从当前执行的代码转到中断门指定的中断服务例程中执行。中断门通常用于处理需要及时响应并可能涉及硬件处理的情况，如键盘输入、定时器中断等。
- 中断门在调用中断服务例程时会关闭中断标志位（IF），这意味着在执行中断服务例程期间，CPU不会响应其他中断请求。
- 中断服务例程执行完毕后，通常会通过 IRET 指令返回到被中断的程序，IRET 会恢复中断标志位，从而允许其他中断请求再次被响应。

陷阱门（Trap Gate）：

- 陷阱门用于处理软件产生的异常或陷阱，如除零错误、调试异常等。与中断不同，陷阱是由当前运行的程序显式地触发的，而不是由外部设备引发的。
- 与中断门不同，陷阱门在调用陷阱处理例程时不会关闭中断标志位，这意味着在处理陷阱期间，其他中断仍然可以被响应。
- 陷阱处理例程执行完毕后，同样通过 IRET 指令返回到被中断的程序，恢复中断标志位。

总的来说，中断门和陷阱门之间的主要区别在于中断门会关闭中断，而陷阱门不会。中断门通常用于处理需要及时响应且可能涉及硬件处理的情况，而陷阱门则用于处理软件产生的异常或陷阱。

```set_trap_gate```和```set_system_gate```都是通过```_set_gate```宏定义实现的。

```c
#define _set_gate(gate_addr,type,dpl,addr) \
__asm__ ("movw %%dx,%%ax\n\t" \
	"movw %0,%%dx\n\t" \
	"movl %%eax,%1\n\t" \
	"movl %%edx,%2" \
	: \
	: "i" ((short) (0x8000+(dpl<<13)+(type<<8))), \
	"o" (*((char *) (gate_addr))), \
	"o" (*(4+(char *) (gate_addr))), \
	"d" ((char *) (addr)),
	"a" (0x00080000))
```

这个是内嵌汇编，理解起来有一定难度，我们慢慢读。

在```head.s```中，我们曾经将所有的中断描述符都设置为了```ignore_int```。这里再回顾一下当时的过程，使用了EDX存储高32位数据，EAX存储了低32位数据。

```shell
63                                      32 
+------------------+-+-+------+---+-----+
+                  | |D |     |   |     +
+  偏移地址高16位   |P|P |01110|000|     +
+                  | |L |     |   |     +
+------------------+-+--+-----+---+-----+
+   addr[31：16]   |1|00|01110|000|00000+
+------------------+-+--+-----+---+-----+
+                 EDX                   +
+---------------------------------------+
```

```shell
31                                     0
+------------------+-------------------+
+     段描述符      +   偏移地址低16位   +
+------------------+-------------------+
+       0x8        +    addr[31：16]   +
+------------------+-------------------+
+                 EAX                  +
+--------------------------------------+
```

这里的```_set_gate```同样使用EDX存储高32位数据，EAX存储了低32位数据。

首先理解下占位符%0-%4：
- %0 由dpl和type组合成的类型标识字。修改存在为1，```0x8000 = 0x10000000_00000000```，相当于将存在位设置为1，设置dpl的值(dpl<<13)， 并设置中断的类型是陷阱门还是中断门(type<<8)。
- %1 描述符低32位地址
- %2 描述符高32位地址
- %3 edx等于中断程序入口地址
- %4 eax，高位设置位0x8，即段描述符是0x8。

这里```edx```被初始化了中断程序入口地址。于是后面需要将其进行拆分，低16位要拆分到```eax```中。下面这句汇编的含义便是如此：

```x86asm
movw %%dx,%%ax\n\t" 
```

接下来将构建好的类型标识字赋给```edx```的低16位，即```dx```

```x86asm
movw %0,%%dx
```

到此为止，edx和eax组装完毕，将其赋值到指定的内存地址上。

```x86asm
"movl %%eax,%1\n\t" \
"movl %%edx,%2"
```

其实过程和之前设置```ignore_int```大同小异。

### 中断函数入口

下面这部分是很多中断执行的最终的入口，大部分都是调用了```die```方法。

#### do_double_fault

```c
void do_double_fault(long esp, long error_code)
```

调用die打印double fault的出错信息。

```c
{
	die("double fault",esp,error_code);
}
```

#### do_general_protection

```c
void do_general_protection(long esp, long error_code)
```

调用die打印general protection的出错信息。

```c
{
	die("general protection",esp,error_code);
}
```

#### do_divide_error

```c
void do_divide_error(long esp, long error_code)
```

调用die打印divide error的出错信息。

```c
{
	die("divide error",esp,error_code);
}
```

#### do_int3

```c
void do_int3(long * esp, long error_code,
		long fs,long es,long ds,
		long ebp,long esi,long edi,
		long edx,long ecx,long ebx,long eax)
``` 

打印int3的信息。

```c
	int tr;

	__asm__("str %%ax":"=a" (tr):"0" (0));
	printk("eax\t\tebx\t\tecx\t\tedx\n\r%8x\t%8x\t%8x\t%8x\n\r",
		eax,ebx,ecx,edx);
	printk("esi\t\tedi\t\tebp\t\tesp\n\r%8x\t%8x\t%8x\t%8x\n\r",
		esi,edi,ebp,(long) esp);
	printk("\n\rds\tes\tfs\ttr\n\r%4x\t%4x\t%4x\t%4x\n\r",
		ds,es,fs,tr);
	printk("EIP: %8x   CS: %4x  EFLAGS: %8x\n\r",esp[0],esp[1],esp[2]);
```

#### do_nmi

```c
void do_nmi(long esp, long error_code)
```

调用die打印nmi的出错信息。

```c
die("nmi",esp,error_code);
```

#### do_debug

```c
void do_debug(long esp, long error_code)
```

调用die打印debug的出错信息。

```c
die("debug",esp,error_code);
```

#### do_overflow

```c
void do_overflow(long esp, long error_code)
```

调用die打印overflow的出错信息。

```c
die("overflow",esp,error_code);
```

#### do_bounds

```c
void do_bounds(long esp, long error_code)
```

调用die打印bounds的出错信息。

```c
die("bounds",esp,error_code);
```

#### do_invalid_op

```c
void do_invalid_op(long esp, long error_code)
```

调用die打印invalid operand的出错信息。

```c
die("invalid operand",esp,error_code);
```

#### do_device_not_available

```c
void do_device_not_available(long esp, long error_code)
```

调用die打印device not available的出错信息。

```c
die("device not available",esp,error_code);
```

#### do_coprocessor_segment_overrun

```c
void do_coprocessor_segment_overrun(long esp, long error_code)
```

调用die打印coprocessor segment overrun的出错信息。

```c
die("coprocessor segment overrun",esp,error_code);
```

#### do_invalid_TSS

```c
void do_invalid_TSS(long esp,long error_code)
```

调用die打印do_invalid_TSS的出错信息。

```c
die("invalid TSS",esp,error_code);
```

#### do_segment_not_present

```c
void do_segment_not_present(long esp,long error_code)
```

调用die打印do_segment_not_present的出错信息。

```c
die("segment not present",esp,error_code);
```

#### do_stack_segment

```c
void do_stack_segment(long esp,long error_code)
```

调用die打印do_stack_segment的出错信息。

```c
die("stack segment",esp,error_code);
```

#### do_coprocessor_error

```c
void do_coprocessor_error(long esp, long error_code)
```

```c
	if (last_task_used_math != current)
		return;
	die("coprocessor error",esp,error_code);
```

首先，函数检查 last_task_used_math 是否等于当前任务 current，如果不相等，则说明上次使用浮点数单元的任务不是当前任务，这意味着上一次的错误处理已经由其他任务处理了，因此当前任务无需处理该错误，直接返回。如果 last_task_used_math 等于当前任务 current，则说明上次使用浮点数单元的任务就是当前任务，需要当前任务来处理这个错误。

函数调用 die 函数，传递了错误消息字符串 "coprocessor error"、栈指针 esp 和错误代码 error_code 作为参数。这个 die 函数用于在内核发生严重错误时停止程序的执行，进行错误信息的输出和系统的关闭或者重启。

在Linux-0.11中，```do_coprocessor_error```没有被调用的地方。

```trap_init```中设置的协处理器错误的中断函数入口是```coprocessor_error```，其定义在```system_call.s```中。

```c
set_trap_gate(16,&coprocessor_error);
```

#### do_reserved

```c
void do_reserved(long esp, long error_code)
```

调用die打印do_reserved的出错信息。

```c
die("reserved (15,17-47) error",esp,error_code);
```