---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录printk.c详解

## printk

printk与printf的差异， 是什么导致一个运行在用户态一个运行在用户态？

其实这两个函数几乎是相同的， 出现这种差异是因为tty_write函数需要使用fs指向被显示的字符串， 而fs是专门用于存放用户态段选择符的，因此在内核态时，为了配合tty_write函数，printk会把fs修改为内核态数据段选择符ds中的值，这样才能正确指向内核的数据缓冲区，当然也需要对fs进行压栈保存，调用tty_write完毕后再出栈。总结来说，printk和printf的差异是由fs造成的，所以差异也是围绕对fs的处理。