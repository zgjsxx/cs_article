---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录panic.c详解

该模块只有一个函数， 即panic函数， 用于显示内核错误信息并使系统进入死循环。

在内核中，如果内核代码执行时遇到了严重的错误就会调用该函数。

## panic

```c
void panic(const char * s)
```

```c
printk("Kernel panic: %s\n\r",s);//打印内核错误日志
if (current == task[0])//如果当前是任务0，则不进行同步
    printk("In swapper task - not syncing\n\r");
else
    sys_sync();//运行文件系统同步函数
for(;;);//进入死循环
```