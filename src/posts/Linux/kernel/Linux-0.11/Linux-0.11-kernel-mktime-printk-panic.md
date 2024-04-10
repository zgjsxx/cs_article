---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录mktime.c/printk.c/panic.c详解](#linux-011-kernel目录mktimecprintkcpanicc详解)
  - [mktime.c模块简介](#mktimec模块简介)
  - [函数详解](#函数详解)
    - [kernel\_mktime](#kernel_mktime)
  - [printk.c模块简介](#printkc模块简介)
  - [函数详解](#函数详解-1)
    - [printk](#printk)
  - [panic.c模块简介](#panicc模块简介)
  - [函数详解](#函数详解-2)
    - [panic](#panic)


# Linux-0.11 kernel目录mktime.c/printk.c/panic.c详解

## mktime.c模块简介

该模块较为简单，仅有一个函数，仅在内核中使用，计算系统开机时的滴答数。

## 函数详解

### kernel_mktime
```c
long kernel_mktime(struct tm * tm)
```

该函数的作用是计算1970年以来的秒数。 其在time_init函数中调用，用于获取开机的时间。

首先计算开机时距离1970年有多少年。如果tm_year大于70， 说明年份在区间[1970-1999]中。如果tm_year小于70，说明年份在区间[2000， 2069]。依次进行判断计算出距离1970的年数year。在计算一年的秒数时使用的是365天，因此还需要加上闰年的天数， 即```DAY*((year+1)/4)```。

```c
long res;
int year;
if (tm->tm_year >= 70) 
  year = tm->tm_year - 70;
else
  year = tm->tm_year + 100 -70; 
  res = YEAR*year + DAY*((year+1)/4);
```

接着计算出当前年份的月份所占有的秒数。同时由于month数组的2月计算的是29天，因此如果当年不是闰年，需要减去一天。

```c
res += month[tm->tm_mon];
if (tm->tm_mon>1 && ((year+2)%4))
  res -= DAY;
```

最后一步就是加上开机时的(日， 小时， 秒)对应的秒数。

```c
res += DAY*(tm->tm_mday-1);
res += HOUR*tm->tm_hour;
res += MINUTE*tm->tm_min;
res += tm->tm_sec;
return res;
```

## printk.c模块简介

该模块只有一个函数， 即printk函数， 用于在内核中向控制台打印字符串，

## 函数详解

### printk

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
## panic.c模块简介

该模块只有一个函数， 即panic函数， 用于显示内核错误信息并使系统进入死循环。

在内核中，如果内核代码执行时遇到了严重的错误就会调用该函数。

## 函数详解

### panic

```c
void panic(const char * s)
```
该函数的作用就是在内核出现严重错误的时候显示出错信息，进行死循环。
```c
printk("Kernel panic: %s\n\r",s);//打印内核错误日志
if (current == task[0])//如果当前是任务0，则不进行同步
    printk("In swapper task - not syncing\n\r");
else
    sys_sync();//运行文件系统同步函数
for(;;);//进入死循环
```