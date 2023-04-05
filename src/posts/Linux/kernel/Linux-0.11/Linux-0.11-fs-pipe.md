---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统pipe.c详解

## 模块简介

## 函数详解

### read_pipe
```c
int read_pipe(struct m_inode * inode, char * buf, int count)
```

### write_pipe
```c
int write_pipe(struct m_inode * inode, char * buf, int count)
```

### sys_pipe
```c
int sys_pipe(unsigned long * fildes)
```

## Q & A