---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 boot目录head.s详解

## 模块简介

在head.s中，操作系统主要做了如下几件事：
- 重新设置中断描述符和全局描述符
- 检查A20地址线是否开启
- 检查数学协处理器
- 初始化页表并开启分页
- 跳转到main函数执行

## 过程详解

### 重新设置IDT和GDT

在setup.s中我们已经设置过了IDT和GDT， 为什么还要再设置一遍？

因为setup.s中设置的IDT和GDT后面会被覆盖，因此在head.S中会重新设置一遍。

```x86asm
startup_32:
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
	mov %ax,%fs
	mov %ax,%gs
	lss stack_start,%esp
	call setup_idt     !设置中断
	call setup_gdt     !设置全局描述符表
	movl $0x10,%eax		# reload all the segment registers
	mov %ax,%ds		# after changing gdt. CS was already
	mov %ax,%es		# reloaded in 'setup_gdt'
	mov %ax,%fs
	mov %ax,%gs
	lss stack_start,%esp
```

中断门描述符的格式如下所示:

![中断门描述符格式](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head_idt.png)


### 检查A20地址线是否开启
下面用于检测A20地址线是否已经开启。
```x86asm
	xorl %eax,%eax
1:	incl %eax		# check that A20 really IS enabled
	movl %eax,0x000000	# loop forever if it isn't
	cmpl %eax,0x100000
	je 1b
```



### 检查数学协处理器

下面用于检查数学协处理器芯片是否存在
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
	fninit     !向协处理发出初始化命令
	fstsw %ax  !取协处理器状态字到ax寄存器中
	cmpb $0,%al
	je 1f			/* no coprocessor: have to set bits */
	movl %cr0,%eax
	xorl $6,%eax		/* reset MP, set EM */
	movl %eax,%cr0
	ret
```

### 初始化页表并开启分页

下面这里将进行页表的安装，安装的过程参考下面这张图：
![页表的设置](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head_setup_paging.png)

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

### 跳转到main函数执行

在setup_paging执行完毕之后，会通过ret返回，ret指令会将栈顶的内容弹出到PC指针中去执行。此时esp指向的位置存放的是main函数的地址。因此接下来会执行main函数。

注意到在将main入栈时，还一同入栈了一些其他参数
```x86asm
	pushl $0		# These are the parameters to main :-)
	pushl $0
	pushl $0
	pushl $L6
```
这里就需要回顾一下c语言的调用规约，如下图所示：

![启动中内存分布变化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/head_caller_stack.png)

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

欢迎大家与我交流

![](https://github.com/zgjsxx/static-img-repo/raw/main/blog/personal/chat.jpg)