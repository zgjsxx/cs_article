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

下面这里测试EAX寄存器的第0位是否为0，如果为0，那么说明是缺页中断， 就执行do_no_page， 如果不为0， 说明该页存在， 不是缺页中断， 那么就会进行跳转从而执行do_wp_page写保护异常处理函数。

如果对这里的汇编指令不熟悉的， 可以看一下另一篇文章**Linux-0.11中的汇编**进行学习。

```assemble
testl $1,%eax
jne 1f
call do_no_page
jmp 2f
1:	call do_wp_page
```