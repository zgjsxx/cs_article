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
该函数用于比较name的和de->name的前len个字符是否相等。

首先对参数进行校验。如果目录项指针de为空， 或者de中的inode节点指针为空，或者长度len大于文件名的最大长度，则直接返回0。

接下来是对目录项中文件名的长度进行校验，如果其长度大于len，则```de->name[len]```的值不为NULL。在这种情况下，直接返回0。

```c
register int same ;

if (!de || !de->inode || len > NAME_LEN)
	return 0;
if (len < NAME_LEN && de->name[len])
	return 0;
```

下面通过一段汇编实现字符串指定长度的比较。

其中，esi指向name，edi指向de->name, ecx的值为len， 将eax的值赋值给same。
```c
__asm__("cld\n\t"//清方向位
	"fs ; repe ; cmpsb\n\t"//用户空间 执行循环比较 while(ecx--) esi++ == edi++
	"setz %%al"//如果结果一样，则设置al = 1
	:"=a" (same)
	:"0" (0),"S" ((long) name),"D" ((long) de->name),"c" (len)
	);
return same;
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
该函数作用是根据文件路径pathname打开一个文件，找到其inode。

```c
const char * basename;
int inr,dev,namelen;
struct m_inode * dir, *inode;
struct buffer_head * bh;
struct dir_entry * de;

if ((flag & O_TRUNC) && !(flag & O_ACCMODE))
	flag |= O_WRONLY;
mode &= 0777 & ~current->umask;
mode |= I_REGULAR;
```

```c
if (!(dir = dir_namei(pathname,&namelen,&basename)))
	return -ENOENT;
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