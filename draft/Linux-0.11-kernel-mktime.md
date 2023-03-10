---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录mktime.c详解


## kernel_mktime
```c
long kernel_mktime(struct tm * tm)
```
该函数的作用是计算1970年以来的秒数。