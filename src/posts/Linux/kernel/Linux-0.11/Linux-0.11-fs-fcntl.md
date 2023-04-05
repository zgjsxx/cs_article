---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统fcntl.c详解

## 模块简介


## 函数详解

### dupfd
```c
static int dupfd(unsigned int fd, unsigned int arg)
```


### sys_dup2
```c
int sys_dup2(unsigned int oldfd, unsigned int newfd)
```


### sys_dup
```c
int sys_dup(unsigned int fildes)
```

### sys_fcntl
```c
int sys_fcntl(unsigned int fd, unsigned int cmd, unsigned long arg)
```

## Q & A