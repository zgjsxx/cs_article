---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统block_dev.c详解

## 模块简介

## 函数详解

### block_write
```c
int block_write(int dev, long * pos, char * buf, int count)
```

### block_read
```c
int block_read(int dev, unsigned long * pos, char * buf, int count)
```


## Q & A