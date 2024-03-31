---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 boot目录head.s详解](#linux-011-boot目录heads详解)
	- [模块简介](#模块简介)
	- [过程详解](#过程详解)
		- [step1：重新设置IDT和GDT](#step1重新设置idt和gdt)
		- [step2：检查A20地址线是否开启](#step2检查a20地址线是否开启)
		- [step3: 检查数学协处理器](#step3-检查数学协处理器)
		- [step4：初始化页表并开启分页](#step4初始化页表并开启分页)
		- [step5：跳转到main函数执行](#step5跳转到main函数执行)
	- [Q \& A](#q--a)
		- [setup\_paging在建立页表时会将head.s的部分代码覆盖，怎么保证不会把正在执行的代码覆盖？](#setup_paging在建立页表时会将heads的部分代码覆盖怎么保证不会把正在执行的代码覆盖)


# Linux-0.11 boot目录head.s详解

## 模块简介

从这里开始，内核完全是在保护模式下运行了。head.s汇编程序与前面的语法格式不同，它采用的是AT&T汇编格式，需要使用GNU的gas和gld进行编译链接。

在head.s中，操作系统主要做了如下几件事：
- 重新设置中断描述符和全局描述符
- 检查A20地址线是否开启
- 检查x87数学协处理器
- 初始化页表并开启分页
- 跳转到main函数执行

## 过程详解

### step1：重新设置IDT和GDT

下面是head.s的17-32行，其作用是重新设置IDT和GDT。

在setup.s中我们已经设置过了IDT和GDT， 为什么还要再设置一遍？

因为setup.s中设置的IDT和GDT后面会被覆盖，因此在head.s中会重新设置一遍。

```x86asm
.globl startup_32
startup_32:
	movl $0x10,%eax      ！0x10 = 0000000000010_00_0, GDT表中的第2项，即内核数据段
	mov %ax,%ds
	mov %ax,%es
	mov %ax,%fs
	mov %ax,%gs
	lss stack_start,%esp   ！定义在sched.c中 
	call setup_idt     !设置中断
	call setup_gdt     !设置全局描述符表
	movl $0x10,%eax		# reload all the segment registers
	mov %ax,%ds		    # after changing gdt. CS was already
	mov %ax,%es		    # reloaded in 'setup_gdt'
	mov %ax,%fs
	mov %ax,%gs
	lss stack_start,%esp
```

这段代码的开始依次将```ds```,```es```，```fs```和```gs```设置为```0x10```。

接下来设置了栈指针。

```x86asm
lss stack_start,%esp   ！定义在sched.c中 
```

栈顶指针的位置定义在了sched.c中，因此这样操作之后，```ss = 0x10```, ```esp```指向了user_stack的最后一个元素。

```c
long user_stack [ PAGE_SIZE>>2 ] ;
struct {
	long * a;
	short b;
	} stack_start = { & user_stack [PAGE_SIZE>>2] , 0x10 };
```

接着调用```setup_idt```方法对中断描述符进行初始化，```setup_idt```方法位于head.s的88-95行：

```x86asm
setup_idt:
	lea ignore_int,%edx        // 将ignore_int的地址传递给edx
	movl $0x00080000,%eax      // 将选择符0x0008放入eax的高16位中
	movw %dx,%ax		       // 将偏移值的低16位移入ax中
	movw $0x8E00,%dx	       /* interrupt gate - dpl=0, present */

	lea idt,%edi
	mov $256,%ecx
rp_sidt:
	movl %eax,(%edi)
	movl %edx,4(%edi)
	addl $8,%edi
	dec %ecx
	jne rp_sidt
	lidt idt_descr
	ret
```

在阅读该段代码之前，需要首先了解中断门描述符的格式，如下所示:

![中断门描述符格式](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head/head_idt.png)

代码中使用```eax```作为中断门的0-31位， ```edx```作为中断门的32-63位。

首先观察对于```eax```的操作。将ignore_int的地址赋给了```edx```，随后将```0x0008```赋值给```eax```。最后将```ignore_int```的低16位放到的```eax```中。

```x86asm
	lea ignore_int,%edx        // 将ignore_int的地址传递给edx
	movl $0x00080000,%eax      // 将选择符0x0008放入eax的高16位中
	movw %dx,%ax		       // 将偏移值的低16位移入ax中
```

操作结束之后```eax```的构成如下所示，其实就是组装好了中断描述符的低31位。

```shell
31                                     0
+------------------+-------------------+
+     段描述符      +   偏移地址低16位   +
+------------------+-------------------+
+       0x8        + ignore_int[15：0] +
+------------------+-------------------+
+                 EAX                  +
+--------------------------------------+
```

接下来构建```edx```。```edx```的高16位先前已经组装好，存储的是```ignore_int[31：16]```。 ```edx```的低16位存储的是中断描述符的属性，设置存在位P为1， DPL=0。

```x86asm
movw $0x8E00,%dx	 // 0x8E00 = 1_00_0111000000000
```

组装好之后的```edx```的布局如下所示：

```shell
63                                      32 
+------------------+-+-+------+---+-----+
+                  | |D |     |   |     +
+  偏移地址高16位   |P|P |01110|000|     +
+                  | |L |     |   |     +
+------------------+-+--+-----+---+-----+
+ ignore[31：16]   |1|00|01110|000|00000+
+------------------+-+--+-----+---+-----+
+                 EDX                   +
+---------------------------------------+
```

接下来的事情就比较简单了，循环的给中断表中的256项内容都设置成哑中断(```ignore_int```)。最后使用```lidt idt_descr```加载中断描述符表```ldit```要求6字节操作数，前2字节是idt表的限长，后4字节是idt表在线性空间的32位基地址。

```x86asm
	lea idt,%edi
	mov $256,%ecx
rp_sidt:
	movl %eax,(%edi)
	movl %edx,4(%edi)
	addl $8,%edi
	dec %ecx
	jne rp_sidt
	lidt idt_descr
	ret
```

下图显示了```setup_idt```的之后，中断描述符的情况：

![setup_idt](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head/setup_idt.png)

这里再看一下哑中断(```ignore_int```)做了些什么，其位于head.s的148-172行。

```x86asm
/* This is the default interrupt "handler" :-) */
int_msg:
	.asciz "Unknown interrupt\n\r"
.align 2
ignore_int:
	pushl %eax
	pushl %ecx
	pushl %edx
	push %ds
	push %es
	push %fs
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
	mov %ax,%fs
	pushl $int_msg
	call printk
	popl %eax
	pop %fs
	pop %es
	pop %ds
	popl %edx
	popl %ecx
	popl %eax
	iret
```

该方法其实只是会调用```printk```向中断打印一句```Unknown interrupt```。

接下来继续看```setup_gdt```，其比较简单，直接使用```lgdt```将```gdt_descr```加载进全局描述符寄存器。

```setup_gdt:
	lgdt gdt_descr
	ret
```

```gdt_descr```内容如下所示，设置了长度为256*8字节， 地址位于```gdt```。

```x86asm
gdt_descr:
	.word 256*8-1		# so does gdt (not that that's any
	.long gdt		# magic number, but it works for me :^)
```

gdt处定义的内容如下所示：

```x86asm
gdt:	.quad 0x0000000000000000	/* NULL descriptor */
	.quad 0x00c09a0000000fff	/* 16Mb */ 0x08
	.quad 0x00c0920000000fff	/* 16Mb */  0x10
	.quad 0x0000000000000000	/* TEMPORARY - don't use */
	.fill 252,8,0			/* space for LDT's and TSS's etc */
```

```gdt```表中第一项是一个空置。第二项和第三项是内核代码段和数据段。其含义如下所示：

0x00c09a00_00000fff   
- 段基址 = 0x00000000  
- 段长度 = 0xfff+1 = 4096 * 4Kb = 16MB
- 段类型值 = 9a， 代表存在于内存中，段特权级别为0，可读可执行代码段，段代码是32位，颗粒度是4KB

0x00c09200_00000fff   
- 段基址 = 0x00000000
- 段长度 = 0xfff+1 = 4096 * 4Kb = 16MB
- 段类型值 = 92， 代表存在于内存中，段特权级别为0，可读可写数据段，段代码是32位，颗粒度是4KB

后续的252项是```LDT```和```TSS```，这里为其开启存储空间，后续会对其进行操作。

程序的最后，重新给段寄存器进行赋值。再次设置为0x10。

```x86asm
	movl $0x10,%eax		# reload all the segment registers
	mov %ax,%ds		    # after changing gdt. CS was already
	mov %ax,%es		    # reloaded in 'setup_gdt'
	mov %ax,%fs
	mov %ax,%gs
	lss stack_start,%esp
```

### step2：检查A20地址线是否开启

下面用于检测A20地址线是否已经开启。

```x86asm
	xorl %eax,%eax
1:	incl %eax		# check that A20 really IS enabled
	movl %eax,0x000000	# loop forever if it isn't
	cmpl %eax,0x100000
	je 1b
```

如果没有开启A20地址线，那么其寻址空间是```0-fffff```。超过```fffff```的部分的地址的高位将会被移除，这就会产生地址环绕。

例如```1_00000```去除了高位的1之后，就是```000000```。对```00000```处写一个值，然后看```1_00000```处的值是否相同，如果相同，则代表产生了地址环绕，A20没有开启。如果不相同，则代表没有地址环绕，A20成功开启。

### step3: 检查数学协处理器

下面head.s的45-65行，用于检查x87数学协处理器芯片是否存在, x87数学协处理器主要用于浮点数的计算，x86_64下浮点数运算的指令有xmm和x87两种。我的另一篇文章[汇编语言-浮点数](https://zgjsxx.github.io/posts/Program_language/Assembly_language/fullerton_CSci241/Lecture10-float-point.html#x87%E6%B5%AE%E7%82%B9%E6%95%B0%E6%8C%87%E4%BB%A4)中有相关介绍。

```x86asm
	movl %cr0,%eax		# check math chip
	andl $0x80000011,%eax	# Save PG,PE,ET
/* "orl $0x10020,%eax" here for 486 might be good */
	orl $2,%eax		# set MP
	movl %eax,%cr0
	call check_x87
	jmp after_page_tables

/*
 * We depend on ET to be correct. This checks for 287/387.
 */
check_x87:
	fninit          !向协处理发出初始化命令
	fstsw %ax       !取协处理器状态字到ax寄存器中
	cmpb $0,%al
	je 1f			/* no coprocessor: have to set bits */
	movl %cr0,%eax
	xorl $6,%eax		/* reset MP, set EM */
	movl %eax,%cr0
	ret
```

这里检查的主要思路是修改控制寄存器CRO，假设协处理器存在，执行一个协处理器指令，如果出错则说明协处理器不存在。

这里首先修改了cr0寄存器，将MP位为设置为1。

```x86asm
	movl %cr0,%eax		# check math chip
	andl $0x80000011,%eax	# Save PG,PE,ET
/* "orl $0x10020,%eax" here for 486 might be good */
	orl $2,%eax		# set MP
	movl %eax,%cr0
```

这里需要了解一下cr0寄存器的结构：

|比特位|名称|完整的名称|描述|
|--|--|--|--|
|0|PE|启用保护模式|如果为1，则启用保护模式，否则系统处于实模式|
|1|MP|监控协处理器|控制 WAIT/FWAIT 指令与 CR0 中 TS 标志的交互|
|2|EM|仿真|如果设置，则不存在 x87 浮点单元，如果清除，则存在 x87 FPU|
|3|TS|任务切换|仅在使用 x87 指令后才允许在任务切换时保存 x87 任务上下文|
|4|ET|扩展类型|在 386 上，它允许指定外部数学协处理器是 80287 还是 80387|
|5|NE|数学错误|设置时启用内部 x87 浮点错误报告，否则启用 PC 风格 x87 错误检测|
|16|WP|写保护|设置后，当特权级别为 0 时，CPU 无法写入只读页|
|18|AM|对齐掩码|如果设置了 AM、设置了 AC 标志（在 EFLAGS 寄存器中）且特权级别为 3，则启用对齐检查|
|29|NW|非直写|全局启用/禁用直写式缓存|
|30|CD|缓存禁用|全局启用/禁用缓存|
|32|PG|分页|如果为 1，则启用分页并使用 § CR3 寄存器，否则禁用分页。|

这里向协处理器发出初始化命令，取协处理器状态字到ax寄存器中，如果协处理器储不存在，则```al = 0```。

```x86asm
	fninit
	fstsw %ax
	cmpb $0,%al
```

如果存在，则将80287设置为保护模式，这里不用过多理解，大概了解即可。

```x86asm
.align 2
1:	.byte 0xDB,0xE4		/* fsetpm for 287, ignored by 387 */
	ret
```

如果协处理器不存在，需要将MP位设置为0， 将EM位设置为1。

```x86asm
	movl %cr0,%eax
	xorl $6,%eax		/* reset MP, set EM */
	movl %eax,%cr0
	ret
```

### step4：初始化页表并开启分页

下面是head.s的200-220行，其作用是初始化页表，并开启分页功能。

```x86asm
after_page_tables:
	pushl $0		# These are the parameters to main :-)
	pushl $0
	pushl $0
	pushl $L6		# return address for main, if it decides to.
	pushl $main
	jmp setup_paging

setup_paging:
	movl $1024*5,%ecx		/* 5 pages - pg_dir+4 page tables */
	xorl %eax,%eax
	xorl %edi,%edi			/* pg_dir is at 0x000 */
	cld;rep;stosl
	movl $pg0+7,pg_dir		/* set present bit/user r/w */
	movl $pg1+7,pg_dir+4		/*  --------- " " --------- */
	movl $pg2+7,pg_dir+8		/*  --------- " " --------- */
	movl $pg3+7,pg_dir+12		/*  --------- " " --------- */
	movl $pg3+4092,%edi
	movl $0xfff007,%eax		/*  16Mb - 4096 + 7 (r/w user,p) */
	std
1:	stosl			/* fill pages backwards - more efficient :-) */
	subl $0x1000,%eax
	jge 1b
	cld
	xorl %eax,%eax		 !设置页目录表基址寄存器cr3的值
	movl %eax,%cr3		
	movl %cr0,%eax       !设置启动使用分页处理
	orl $0x80000000,%eax
	movl %eax,%cr0		/* set paging (PG) bit */
	ret			/* this also flushes prefetch-queue */
```

建立页表的第一步是对**页目录表**和**页表项**进行清零的初始化操作。

```x86asm
setup_paging:
	movl $1024*5,%ecx		/* 5 pages - pg_dir+4 page tables */
	xorl %eax,%eax
	xorl %edi,%edi			/* pg_dir is at 0x000 */
	cld;rep;stosl
```

由于后面会使用```rep```前缀，因此首先需要设置循环的次数。页目录表和页表的总大小是```1024*4*(4+1)```，由于我们使用的是```stosl```，即一次进行4个字节的初始化操作，于是```ecx```设置为```1024*5```。

```xorl %eax,%eax```和 ```xorl %edi,%edi```将```eax```和```edi```设置为0。

最后使用```cld;rep;stosl```进行循环赋值。将```eax```的值依次赋值给```0x0， 0x4， 0x8 ...```。

总结起来，这里的作用就是将页目录表和页表全部清零。

接下来的操作是给页目录表进行赋值。这里我们回顾一下页目录项和页表项的结构。其中高20位代表的是帧地址。第0位表示存在位，第1位表示读写标志位，第2位表示用户超级用户标志。

```shell
31                 12   9   7 6 5 4 3   2   1 0
+--------------------+---+-+-+-+-+-+-+---+---+-+
+ Frame Address      +   |0 0|D|A|0 0+U/S|R/W|P|
+--------------------+---+-+-+-+-+-+-+---+---+-+
```

第一个页表所在的地址是```0x00001007 & 0xfffff000 = 0x1000```，属性标志是```0x00001007 & 0x00000fff = 0x07```。

第一个页表所在的地址是```0x00002007 & 0xfffff000 = 0x2000```，属性标志是```0x00002007 & 0x00000fff = 0x07```。

第一个页表所在的地址是```0x00003007 & 0xfffff000 = 0x3000```，属性标志是```0x00003007 & 0x00000fff = 0x07```。

第一个页表所在的地址是```0x00004007 & 0xfffff000 = 0x4000```，属性标志是```0x00004007 & 0x00000fff = 0x07```。

```x86asm
	movl $pg0+7,pg_dir		/* set present bit/user r/w */
	movl $pg1+7,pg_dir+4		/*  --------- " " --------- */
	movl $pg2+7,pg_dir+8		/*  --------- " " --------- */
	movl $pg3+7,pg_dir+12		/*  --------- " " --------- */
```

这一番操作使得页目录表中的四个元素指向了对应的页表,如下图所示：

![页目录表初始化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head/setup-pagetable-1.png)

接下俩就是初始化四个页表中的内容了，这里的构建方式是物理地址和线性地址一一对应的关系。

```x86asm
	movl $pg3+4092,%edi
	movl $0xfff007,%eax		/*  16Mb - 4096 + 7 (r/w user,p) */
	std
1:	stosl			/* fill pages backwards - more efficient :-) */
	subl $0x1000,%eax
	jge 1b
```

最终初始化后的页表如下图所示：

![页表的设置](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head/head_setup_paging.png)

下面设置```cr3```指向全局页目录表，并且开启分页。

```x86asm
	xorl %eax,%eax		/* pg_dir is at 0x0000 */
	movl %eax,%cr3		/* cr3 - page directory start */
	movl %cr0,%eax
	orl $0x80000000,%eax
	movl %eax,%cr0		/* set paging (PG) bit */
	ret			/* this also flushes prefetch-queue */
```

### step5：跳转到main函数执行

在setup_paging执行完毕之后，会通过ret返回，ret指令会将栈顶的内容弹出到PC指针中去执行。此时esp指向的位置存放的是main函数的地址。因此接下来会执行main函数。

注意到在将main入栈时，还一同入栈了一些其他参数
```x86asm
	pushl $0		# These are the parameters to main :-)
	pushl $0
	pushl $0
	pushl $L6
```
这里就需要回顾一下c语言的调用规约，如下图所示：

![启动中内存分布变化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head/head_caller_stack.png)

因此这里可以得到L6是main函数的返回值。立即数0，0，0将会被作为main函数的入参。

接下来再看下面的代码就很清晰了，实际就是在建立好页表的映射关系后，就开始跳转到main函数去执行了(init/main.c)。
```x86asm
after_page_tables:
	pushl $0		# These are the parameters to main :-)
	pushl $0
	pushl $0
	pushl $L6		# return address for main, if it decides to.
	pushl $main
	jmp setup_paging

setup_paging:
   ...
   ret
```

在阅读main的内容之前，我们回顾一下此时内存中的数据状态，如下所示：

![head.s结束之后内存分布](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head/head-memoryview.png)

## Q & A

### setup_paging在建立页表时会将head.s的部分代码覆盖，怎么保证不会把正在执行的代码覆盖？

可以通过反汇编查看一下system模块的内存分布

```shell
objdump -d tools/system
```

如下所示：
```
00000000 <pg_dir>:
       0:	b8 10 00 00 00       	mov    $0x10,%eax
       5:	8e d8                	mov    %eax,%ds
	   ...
0000005a <check_x87>:
      5a:	db e3                	fninit 
      5c:	9b df e0             	fstsw  %ax
      5f:	3c 00                	cmp    $0x0,%al
	  ...
00000071 <setup_idt>:
      71:	8d 15 28 54 00 00    	lea    0x5428,%edx
      77:	b8 00 00 08 00       	mov    $0x80000,%eax
	  ...
0000008e <rp_sidt>:
      8e:	89 07                	mov    %eax,(%edi)
      90:	89 57 04             	mov    %edx,0x4(%edi)
	  ...
000000a1 <setup_gdt>:
      a1:	0f 01 15 b2 54 00 00 	lgdtl  0x54b2
      a8:	c3                   	ret    
	...
00001000 <pg0>:
	...

00002000 <pg1>:
	...

00003000 <pg2>:
	...

00004000 <pg3>:
	...
00005000 <tmp_floppy_area>:
	...
00005400 <after_page_tables>:
    5400:	6a 00                	push   $0x0
    5402:	6a 00                	push   $0x0
	...
00005412 <L6>:
    5412:	eb fe                	jmp    5412 <L6>
00005414 <int_msg>:
    5414:	55                   	push   %ebp
    5415:	6e                   	outsb  %ds:(%esi),(%dx)
	...
00005428 <ignore_int>:
    5428:	50                   	push   %eax
    5429:	51                   	push   %ecx
	...
0000544e <setup_paging>:
    544e:	b9 00 14 00 00       	mov    $0x1400,%ecx
    5453:	31 c0                	xor    %eax,%eax
    5455:	31 ff                	xor  
	...
000054aa <idt_descr>:
    54aa:	ff 07                	incl   (%edi)
    54ac:	b8 54 00 00 00       	mov    $0x54,%eax
	...

000054b2 <gdt_descr>:
    54b2:	ff 07                	incl   (%edi)
    54b4:	b8                   	.byte 0xb8
    54b5:	5c                   	pop    %esp
	...

000054b8 <idt>:
	...

00005cb8 <gdt>:
	...
    5cc0:	ff 0f                	decl   (%edi)
```

可以看到代码标号setup_page的起始地址是0000544e，而内存页表和页目录表的地址范围是0x0000-0x5000。因此当程序执行到setup_page时，将建立页目录表和页表， 这将会覆盖0x0000-0x5000的部分代码，即pg_dir，check_x87，setup_idt，rp_sidt，setup_gdt， 并不会覆盖到setup_page的代码，head.s在代码的分布计算上确实是费了一番功夫。

-----

文中如有表达不正确之处，欢迎大家与我交流, 微信号codebuilding。

![wechat](https://github.com/zgjsxx/static-img-repo/raw/main/blog/personal/wechat.jpg)