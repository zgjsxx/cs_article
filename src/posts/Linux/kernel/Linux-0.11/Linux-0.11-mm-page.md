---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 page.s详解

## _page_fault函数
_page_fault:
页异常中断处理程序(中断14)， 主要分为两种情况处理。 一种是由于缺页引起的页异常中断，通过调用do_no_page(error_code, address)来处理， 二是由页写保护引起的页异常， 此时用页写保护处理函数do_wp_page(error_code, address)来处理。

如果对这里的汇编指令不熟悉的， 可以看一下另一篇文章**Linux-0.11中的汇编**进行学习。

```assemble
.globl page_fault

page_fault:
	xchgl %eax,(%esp) //取出出错码到EAX
	pushl %ecx //保存寄存器
	pushl %edx
	push %ds
	push %es
	push %fs
	movl $0x10,%edx
	mov %dx,%ds
	mov %dx,%es
	mov %dx,%fs
	movl %cr2,%edx
	pushl %edx
	pushl %eax
	testl $1,%eax  //这里测试EAX寄存器的第0位是否为0，如果为0，那么说明是缺页中断
	jne 1f  //如果等于1，说明是写保护异常，因此调用do_wp_page
	call do_no_page//否则调用缺页中断处理函数
	jmp 2f
1:	call do_wp_page
2:	addl $8,%esp
	pop %fs   //寄存器回复
	pop %es
	pop %ds
	popl %edx
	popl %ecx
	popl %eax
	iret
```