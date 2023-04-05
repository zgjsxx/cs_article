---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统open.c详解

## 模块简介

## 函数详解

### sys_ustat
```c
int sys_ustat(int dev, struct ustat * ubuf)
```

### sys_utime
```c
int sys_utime(char * filename, struct utimbuf * times)
```

### sys_access
```c
int sys_access(const char * filename,int mode)
```


### sys_chdir
```c
int sys_chdir(const char * filename)
```

### sys_chroot
```c
int sys_chroot(const char * filename)
```


### sys_chmod
```c
int sys_chmod(const char * filename,int mode)
```

### sys_chown
```c
int sys_chown(const char * filename,int uid,int gid)
```
### sys_open
```c
int sys_open(const char * filename,int flag,int mode)
```
### sys_creat
```c
int sys_creat(const char * pathname, int mode)
```
### sys_close
```c
int sys_close(unsigned int fd)
```
## Q & A