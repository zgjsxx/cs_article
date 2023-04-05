---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统char_dev.c详解

## 模块简介

## 函数详解

### rw_ttyx
```c
static int rw_ttyx(int rw,unsigned minor,char * buf,int count,off_t * pos)
```

### rw_tty
```c
static int rw_tty(int rw,unsigned minor,char * buf,int count, off_t * pos)
```

### rw_ram
```c
static int rw_ram(int rw,char * buf, int count, off_t *pos)
```
### rw_mem
```c
static int rw_mem(int rw,char * buf, int count, off_t * pos)
```

### rw_kmem
```c
static int rw_kmem(int rw,char * buf, int count, off_t * pos)
```


### rw_port
```c
static int rw_port(int rw,char * buf, int count, off_t * pos)
```

### rw_memory
```c
static int rw_memory(int rw, unsigned minor, char * buf, int count, off_t * pos)
```


### rw_char
```c
int rw_char(int rw,int dev, char * buf, int count, off_t * pos)
```

## Q & A