---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---
# Linux-0.11 kernel目录hd.c详解

## read_intr
```c
static void read_intr(void)
```
该函数是磁盘的读中断调用函数。
