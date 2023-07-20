---
category: 
- Linux
- tool
---


# top命令详解

## 概述
![git ssh key](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/top/windows_task_manger.png)



## top命令内容

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

首先看看第一行代表什么？

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

第二行显示的是关于进程状态的总结。

进程可以处于不同的状态。这里显示了全部进程的数量。除此之外，还有正在运行、睡眠、停止、僵尸进程的数量。

例如下面的显示， 系统总共有237个进程，其中1个进程处于running状态，236个进程处于sleeping状态，0个进程处于stop状态，0个进程处于僵尸进程状态。

```shell
Tasks: 237 total,   1 running, 236 sleeping,   0 stopped,   0 zombie
```

第三行是比较关键的一行，线上定位问题的时候，会经常关注这个点。

```shell
%Cpu(s):  0.3 us,  0.4 sy,  0.0 ni, 99.1 id,  0.0 wa,  0.1 hi,  0.1 si,  0.0 st
```
这里的每一个参数的含义如下所示：
- us, user： 运行(未调整优先级的) 用户进程的CPU时间
- sy，system: 运行内核进程的CPU时间
- ni，niced：运行已调整优先级的用户进程的CPU时间
- wa，IO wait: 用于等待IO完成的CPU时间
- hi：处理硬件中断的CPU时间
- si: 处理软件中断的CPU时间
- st：这个虚拟机被hypervisor偷去的CPU时间（译注：如果当前处于一个hypervisor下的vm，实际上hypervisor也是要消耗一部分CPU处理时间的）。


第四部分是关于内存部分的数据

```shell
MiB Mem :   3635.0 total,   3229.8 free,    441.0 used,    170.1 buff/cache
MiB Swap:   2072.0 total,   2072.0 free,      0.0 used.   3194.0 avail Mem
```

第五部分是关于每个进程的数据：
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
- VIRT：进程使用的虚拟内存。
- RES：驻留内存大小。驻留内存是任务使用的非交换物理内存大小。
- SHR：SHR是进程使用的共享内存。
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

## 高亮显示当前运行进程
