---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统namei.c详解

## 模块简介

## 函数详解

### permission
```c
static int permission(struct m_inode * inode,int mask)
```


### match
```c
static int match(int len,const char * name,struct dir_entry * de)
```


### find_entry
```c
static struct buffer_head * find_entry(struct m_inode ** dir,
	const char * name, int namelen, struct dir_entry ** res_dir)
```
### add_entry
```c
static struct buffer_head * add_entry(struct m_inode * dir,
	const char * name, int namelen, struct dir_entry ** res_dir)
```

### get_dir
```c
static struct m_inode * get_dir(const char * pathname)
```

### dir_namei
```c
static struct m_inode * dir_namei(const char * pathname,
	int * namelen, const char ** name)
```

### namei
```c
struct m_inode * namei(const char * pathname)
```
### open_namei
```c
int open_namei(const char * pathname, int flag, int mode,
	struct m_inode ** res_inode)
```

### sys_mknod
```c
int sys_mknod(const char * filename, int mode, int dev)
```

### sys_mkdir
```c
int sys_mkdir(const char * pathname, int mode)
```

### empty_dir
```c
static int empty_dir(struct m_inode * inode)
```

### sys_rmdir
```c
int sys_rmdir(const char * name)
```

### sys_unlink
```c
int sys_unlink(const char * name)
```

### sys_link
```c
int sys_link(const char * oldname, const char * newname)
```

## Q & A