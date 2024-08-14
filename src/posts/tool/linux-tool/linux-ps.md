---
category: 
- Linux
- tool
---


# ps命令


ps查看pid/ppid/pgid/sid/stat

```shell
ps  xao pid,ppid,pgid,sid,stat,comm  |head -n 1; ps  xao pid,ppid,pgid,sid,stat,comm  |grep a.out
```

```shell
PID    PPID    PGID     SID STAT COMMAND
36255    1695   36255    1695 S+   a.out
36256   36255   36255    1695 S+   a.out
```

STAT列的含义：
- D 不可中断的睡眠态
- I 空闲内核线程
- R 运行态
- S 可中断的睡眠态
- T 由作业控制信号停止
- t 在跟踪期间被调试器停止(GDB)
- Z 僵尸进程

除此以外，还有一些额外的符号：
- < 高优先级
- N 低优先级
- s 会话首进程
- l 多线程
- + 前台进程组

ps 查看一个终端的进程

```shell
ps -t pts/0
```