---
category: 
- Linux
- tool
---

- [top命令详解](#top命令详解)
  - [概述](#概述)
  - [常用参数](#常用参数)
  - [top命令内容](#top命令内容)
  - [使用技巧](#使用技巧)
    - [多核CPU监控](#多核cpu监控)
    - [切换内存的单位](#切换内存的单位)
    - [限制展示任务的数量](#限制展示任务的数量)
    - [只展示指定用户的任务](#只展示指定用户的任务)
    - [按照CPU占用量进行排序](#按照cpu占用量进行排序)
    - [按照任务的内存使用量进行排序](#按照任务的内存使用量进行排序)
    - [top交互模式下查看帮助](#top交互模式下查看帮助)


# top命令详解

## 概述

top命令是Linux下常用的性能分析工具，能够实时显示系统中各个进程的资源占用状况，其作用类似于windows系统中的任务管理器。

![git ssh key](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/top/windows_task_manger.png)

top命令可以动态显示系统的负载情况，本文将详细介绍top命令的方方面面。

## 常用参数

top命令支持一些参数，下面是一些常用的参数：
- -d：设置刷新频率。
- -n：设置刷新的次数。
- -p：显示指定进程的信息。
- -u：显示指定用户的进程信息。
- -o：指定排序字段。
- -h：显示帮助信息。

显示每 2 秒刷新一次且仅刷新 10 次的进程信息：
```shell
top -d 2 -n 10
```

显示指定用户 root 的进程信息：
```shell
top -u root
```

显示指定进程 ID 为 123 的信息：
```shell
top -p 123
```

以内存使用率排序：
```shell
top -o %MEM
```

## top命令内容

通常```top```命令的输出如下所示，它包含了很多方面的数据，例如CPU，内存，系统的任务等等数据。

```shell
top - 10:32:42 up 38 min,  2 users,  load average: 0.00, 0.00, 0.00
Tasks: 237 total,   1 running, 236 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.3 us,  0.4 sy,  0.0 ni, 99.1 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
MiB Mem :   3635.0 total,   3229.8 free,    441.0 used,    170.1 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3194.0 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1461 root      20   0    7252   3672   3280 S   0.7   0.1   0:00.03 bash
   1621 root      20   0   10700   4360   3476 R   0.7   0.1   0:00.05 top
   1477 root      20   0       0      0      0 I   0.3   0.0   0:00.01 kworker/0:0-events
      1 root      20   0  103372  12748   9724 S   0.0   0.3   0:02.18 systemd
      2 root      20   0       0      0      0 S   0.0   0.0   0:00.04 kthreadd
      3 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 rcu_gp
      4 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 rcu_par_gp
      5 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 slub_flushwq
      6 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 netns
      8 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/0:0H-events_highpri
     10 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 kworker/0:1H-events_highpri
     11 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 mm_percpu_wq
     13 root      20   0       0      0      0 I   0.0   0.0   0:00.00 rcu_tasks_kthre
```

下面便一行一行的看看top命令的数据。

第一行其实代表了系统的启动时间和系统的平均负载。

```shell
top - 10:32:42 up 38 min,  2 users,  load average: 0.00, 0.00, 0.00
```

```top - 10:32:42 up 38 min ```代表当前系统的时间是```10:32:42```，并且该机器已经启动了```38 min```。```2 users```代表当前有两个用户登录。```load average: 0.00, 0.00, 0.00```代表的是系统最近5、10和15分钟内的平均负载。

这里需要注意的是平均负载并不是代表CPU的使用率。简单来说，**平均负载**是指单位时间内，系统处于**可运行状态**和**不可中断状态**的平均进程数，也就是**平均活跃进程数**。

所谓可运行状态和不可中断状态是指：
- 可运行状态(R)：正在CPU上运行或者正在等待CPU的进程状态，如上；
- 不可中断状态(D)：不可中断是指一些正在处于内核关键流程的进程，如果盲目打断，会造成不可预知的后果，比如正在写磁盘的进程，盲目被打断，可能会造成读写不一致的问题。

因此这里再次强调load average和CPU使用率并没有直接关系，其值可以大于100。

其实第一行的显示数据和命令```uptime```的作用是一样的。

第二行显示的是关于**进程状态**的总结。

进程可以处于不同的状态，这里显示了处于各种状态的进程数量，例如正在运行的任务、睡眠的任务、停止的任务、僵尸进程的数量等。

在下面的显示中， 系统总共有237个进程，其中1个进程处于running状态，236个进程处于sleeping状态，0个进程处于stop状态，0个进程处于僵尸进程状态。

```shell
Tasks: 237 total,   1 running, 236 sleeping,   0 stopped,   0 zombie
```

第三行是比较关键的一行，线上定位问题的时候，会经常关注这个点。

```shell
%Cpu(s):  0.3 us,  0.4 sy,  0.0 ni, 99.1 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
```

这里的每一个参数的含义如下所示：
- us, user： 用户空间的CPU百分比
- sy，system: 内核空间占用的CPU百分比
- ni，niced：调整过优先级的用户进程占用CPU百分比
- id，idle: 空闲CPU的百分比
- wa，IO wait: 用于等待IO完成的CPU时间
- hi：处理硬件中断的CPU时间
- si: 处理软件中断的CPU时间
- st：这个虚拟机被hypervisor偷去的CPU时间（译注：如果当前处于一个hypervisor下的vm，实际上hypervisor也是要消耗一部分CPU处理时间的）。


第四部分是关于内存部分的数据。这里包含了两行，

第一行是物理内存的使用情况，第二行是关于交换分区的使用情况。

```shell
MiB Mem :   3635.0 total,   3229.8 free,    441.0 used,    170.1 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3194.0 avail Mem
```

第一行的含义如下：
- 3635.0 total — 物理内存总量（3265MB )
- 3229.8 free — 空闲的内存总量（ 3229.8MB ）
- 441.0 used — 使用中的内存总量（ 441.0MB ）
- 170.1 buff/cache — block buffer + page cache 所占用的内存大小 （169M）

这里补充一句buff/cache的内容，在Linux 2.4以前，**page cache**和**buffer cache**是两个独立的缓存，Linux 2.4开始**page cache**和**buffer cache**进行了统一。

第二行的含义如下：
- 2072.0 total - 交换分区的总量
- 2072.0 free - 空闲的交换分区的总量
- 0.0 used - 已使用的交换分区大小
- 3194.0 avail Mem： 这个值是系统的估算值，表示可用于启动新程序的物理内存大小（不包括 swap 空间）

第五部分是关于**每个进程的数据**：

```shell
    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1461 root      20   0    7252   3672   3280 S   0.7   0.1   0:00.03 bash
   1621 root      20   0   10700   4360   3476 R   0.7   0.1   0:00.05 top
   1477 root      20   0       0      0      0 I   0.3   0.0   0:00.01 kworker/0:0-events
      1 root      20   0  103372  12748   9724 S   0.0   0.3   0:02.18 systemd
      2 root      20   0       0      0      0 S   0.0   0.0   0:00.04 kthreadd
      3 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 rcu_gp
```

在横向列出的系统属性和状态下面，是以列显示的进程。不同的列代表下面要解释的不同属性。

- PID：进程ID，进程的唯一标识符
- USER：进程所有者的实际用户名。
- PR：进程的调度优先级。这个字段的一些值是'rt'。这意味这这些进程运行在实时态。
- NI：进程的nice值（优先级)。NI的值处于[-20, 19]，越小的值意味着越高的优先级。
- VIRT：进程使用的虚拟内存。默认是KB。
- RES：驻留内存大小。驻留内存是任务使用的非交换物理内存大小，默认是KB。
- SHR：SHR是进程使用的共享内存，默认是KB。
- S：这个是进程的状态。它有以下不同的值:
  - D – 不可中断的睡眠态。
  - R – 运行态
  - S – 睡眠态
  - T – 被跟踪或已停止
  - Z – 僵尸态
- CPU：自从上一次更新时到现在任务所使用的CPU时间百分比。
- MEM：进程使用的可用物理内存百分比。
- TIME：任务启动后到现在所使用的全部CPU时间，精确到百分之一秒。
- COMMAND：运行进程所使用的命令。


## 使用技巧

### 多核CPU监控

在top的基本视图中，按数字1，可以监控每个逻辑CPU的状况，例如下面的例子，我的虚拟机包含了4个cpu，这里显示了4个CPU的运行状况。

```shell
top - 13:35:11 up  3:40,  2 users,  load average: 0.00, 0.02, 0.00
Tasks: 234 total,   1 running, 233 sleeping,   0 stopped,   0 zombie
%Cpu0  :  0.3 us,  0.7 sy,  0.0 ni, 98.7 id,  0.0 wa,  0.3 hi,  0.0 si,  0.0 st
%Cpu1  :  0.7 us,  0.3 sy,  0.0 ni, 98.7 id,  0.0 wa,  0.0 hi,  0.3 si,  0.0 st
%Cpu2  :  0.3 us,  0.7 sy,  0.0 ni, 99.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu3  :  0.3 us,  0.3 sy,  0.0 ni, 99.3 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   3635.0 total,   3188.5 free,    461.1 used,    209.5 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3173.9 avail Mem
```

### 切换内存的单位

- 切换任务区的内存单位
  
在top的基本试图中，按字母e，可以切换每个任务占用内存的大小的单位, 从 KB、MB、GB、TB、PB 到 EB 循环切换。下面切换为了以MB为单位：

```shell
top - 14:45:06 up  4:59,  1 user,  load average: 0.02, 0.01, 0.00
Tasks: 228 total,   2 running, 226 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.3 us,  0.3 sy,  0.0 ni, 99.2 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
MiB Mem :   3635.0 total,   3193.4 free,    454.6 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3180.4 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  94996 root      20   0   10.4m   4.3m   3.4m R   0.7   0.1   0:00.05 top
   1712 root      20   0    0.0m   0.0m   0.0m I   0.3   0.0   0:35.48 kworker/0:0-events
      1 root      20   0  165.1m  12.5m   9.6m S   0.0   0.3   1:38.13 systemd
      2 root      20   0    0.0m   0.0m   0.0m S   0.0   0.0   0:00.05 kthreadd
      3 root       0 -20    0.0m   0.0m   0.0m I   0.0   0.0   0:00.00 rcu_gp
      4 root       0 -20    0.0m   0.0m   0.0m I   0.0   0.0   0:00.00 rcu_par_gp
```

- 切换汇总区的内存单位
使用大小字母E，可以实现汇总区域的内存的单位从 KB、MB、GB、TB、PB 到 EB 循环切换。

```shell
top - 14:54:18 up  5:08,  1 user,  load average: 0.02, 0.02, 0.00
Tasks: 227 total,   2 running, 225 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.3 us,  0.4 sy,  0.0 ni, 99.1 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
KiB Mem :  3722236 total,  3268096 free,   467500 used,   216364 buff/cache
KiB Swap:  2121724 total,  2121724 free,        0 used.  3254736 avail Mem

top - 14:54:34 up  5:08,  1 user,  load average: 0.02, 0.02, 0.00
Tasks: 227 total,   1 running, 226 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.4 us,  0.4 sy,  0.0 ni, 99.0 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st
MiB Mem :   3635.0 total,   3186.9 free,    461.2 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3173.8 avail Mem

top - 14:54:44 up  5:08,  1 user,  load average: 0.01, 0.02, 0.00
Tasks: 227 total,   1 running, 226 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
GiB Mem :      3.5 total,      3.1 free,      0.4 used,      0.2 buff/cache
GiB Swap:      2.0 total,      2.0 free,      0.0 used.      3.1 avail Mem
```

### 限制展示任务的数量

快捷键 n 用于限制要展示的任务的数量，0 表示无限制。默认是全部展示（超过一页需要翻页）。

这里输入n之后，再输入5，选择只显示5条记录

```shell
top - 14:47:34 up  5:01,  1 user,  load average: 0.05, 0.03, 0.00
Tasks: 227 total,   1 running, 226 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.5 us,  1.5 sy,  0.0 ni, 97.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   3635.0 total,   3187.3 free,    460.8 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3174.2 avail Mem
Maximum tasks = 0, change to (0 is unlimited)5
    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
      1 root      20   0  169040  12832   9800 S   0.0   0.3   1:38.14 systemd
      2 root      20   0       0      0      0 S   0.0   0.0   0:00.05 kthreadd
```

显示如下：

```shell
top - 14:48:16 up  5:02,  1 user,  load average: 0.02, 0.02, 0.00
Tasks: 228 total,   1 running, 227 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.3 us,  0.5 sy,  0.0 ni, 99.0 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
MiB Mem :   3635.0 total,   3190.8 free,    457.2 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3177.8 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1386 root      20   0   84320  22744  19808 S   0.3   0.6   0:00.09 smbd
   1514 root      20   0    7252   3696   3304 S   0.3   0.1   0:51.33 bash
  90783 root      20   0       0      0      0 I   0.3   0.0   0:00.02 kworker/2:2-mm_percpu_wq
  95906 root      20   0   10700   4356   3472 R   0.3   0.1   0:00.05 top
      1 root      20   0  169040  12832   9800 S   0.0   0.3   1:38.14 systemd
```

### 只展示指定用户的任务

快捷键 u 表示要过滤的用户，可以加 ! 前缀表示反向条件。可以输入 UID 或者 username，直接回车表示取消这个过滤条件。

```shell
top - 14:49:30 up  5:03,  1 user,  load average: 0.00, 0.02, 0.00
Tasks: 229 total,   2 running, 227 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.5 us,  0.4 sy,  0.0 ni, 98.9 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
MiB Mem :   3635.0 total,   3190.0 free,    458.0 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3177.0 avail Mem
Which user (blank for all) root
    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
     46 root      20   0       0      0      0 S   0.3   0.0   0:00.28 kcompactd0
   1454 root      20   0   19112   7260   5176 S   0.3   0.2   0:33.76 sshd
   1514 root      20   0    7252   3696   3304 S   0.3   0.1   0:51.54 bash
```

### 按照CPU占用量进行排序

运行top命令后，键入大写字母P，可以对任务的CPU使用情况进行排序，有两种途径：
- 打开大写键盘的情况下，直接按p
- 为打开大写键盘的情况下，shift+p。

```shell
top - 15:01:01 up  5:15,  1 user,  load average: 0.02, 0.03, 0.00
Tasks: 228 total,   2 running, 226 sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.8 us,  2.8 sy,  0.0 ni, 94.4 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   3635.0 total,   3189.3 free,    458.8 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3176.2 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    727 root      20   0   26128   9688   8596 S   7.4   0.3   0:00.16 systemd-journal
  99654 root      20   0   10700   4356   3476 R   3.7   0.1   0:00.74 top
      1 root      20   0  169040  12832   9800 S   0.0   0.3   1:38.14 systemd
      2 root      20   0       0      0      0 S   0.0   0.0   0:00.05 kthreadd
      3 root       0 -20       0      0      0 I   0.0   0.0   0:00.00 rcu_gp
```


### 按照任务的内存使用量进行排序
运行top命令后，键入大写字母M，可以对任务的CPU使用情况进行排序，有两种途径：
- 打开大写键盘的情况下，直接按m
- 为打开大写键盘的情况下，shift+m。

```shell
top - 15:02:25 up  5:16,  1 user,  load average: 0.00, 0.02, 0.00
Tasks: 229 total,   1 running, 228 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.4 us,  0.4 sy,  0.0 ni, 99.0 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
MiB Mem :   3635.0 total,   3187.3 free,    460.8 used,    211.3 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3174.2 avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
   1386 root      20   0   84320  22744  19808 S   0.0   0.6   0:00.09 smbd
    813 root      20   0  257068  21184  16536 S   0.0   0.6   0:01.22 NetworkManager
    872 root      20   0   72880  17140  14664 S   0.0   0.5   0:00.62 nmbd
      1 root      20   0  169040  12832   9800 S   0.0   0.3   1:38.14 systemd
   1436 root      20   0   18764  12060  10248 S   0.0   0.3   0:00.03 sshd
   1433 root      20   0   18756  12036  10184 S   0.0   0.3   0:00.04 sshd
```

### top交互模式下查看帮助

在交互模式下，敲入h可以查看帮助信息：

![top-interactive-help](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/top/top_help.png)