---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录printk.c详解

该模块只有一个函数， 即printk函数， 用于在内核中向控制台打印字符串，

## printk

**printk 与 printf 的差异**

其实这两个函数几乎是相同的, 出现这种差异是因为 tty_write 函数需要使用 fs 指向的被显示的字符串, 而 fs 是专门用于存放**用户态段选择符**的, 因此, 在内核态时, 为了配合 tty_write函数, printk 会把 fs 修改为**内核态数据段**选择符 ds 中的值, 这样才能正确指向内核的数据缓冲区, 当然这个操作会先对 fs 进行压栈保存, 调用 tty_write 完毕后再出栈恢复. 总结说来, printk 与 printf 的差异是由 fs 造成的, 所以差异也是围绕对 fs 的处理。

```c
va_list args;
int i;

va_start(args, fmt);
i=vsprintf(buf,fmt,args);//将字符串格式化到buf中
va_end(args);
__asm__("push %%fs\n\t"//将当前的fs保存起来
  "push %%ds\n\t"//将当前的ds放入栈
  "pop %%fs\n\t"//fs = ds
  "pushl %0\n\t"//字符串长度 ax寄存器
  "pushl $buf\n\t"//将buf地址压入栈中
  "pushl $0\n\t"//将数值0压入栈中，代表显示通道
  "call tty_write\n\t"//调用tty_write tty_write(unsigned channel, char * buf, int nr)
  "addl $8,%%esp\n\t"
  "popl %0\n\t"//将长度发给到ax寄存器中
  "pop %%fs"//将fs弹出
  ::"r" (i):"ax","cx","dx");
return i;
```