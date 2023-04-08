---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 boot目录head.s详解


## 模块简介

## 过程详解

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