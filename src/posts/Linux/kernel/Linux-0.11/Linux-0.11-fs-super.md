---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统super.c详解

## 模块简介

## 函数详解

### lock_super
```c
static void lock_super(struct super_block * sb)
```


### free_super
```c
static void free_super(struct super_block * sb)
```

### wait_on_super
```c
static void wait_on_super(struct super_block * sb)
```

### get_super
```c
struct super_block * get_super(int dev)
```

### put_super
```c
void put_super(int dev)
```

### read_super
```c
static struct super_block * read_super(int dev)
```

### sys_umount
```c
int sys_umount(char * dev_name)
```

### sys_mount
```c
int sys_mount(char * dev_name, char * dir_name, int rw_flag)
```

### mount_root
```c
void mount_root(void)
```
## Q & A