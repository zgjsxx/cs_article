---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统open.c详解

## 模块简介

对于一个文件系统，需要提供一些封装好的系统调用提供给应用层调用。例如打开一个文件，对于应用层而言，其并不关心底层的inode和buffer_cache的操作。 open.c便是提供这样的一个功能。

同样是文件系统high-level的API的有:
- **open.c**
- exec.c
- stat.c
- fcntl.c
- ioctl.c


## 函数详解

### sys_ustat
```c
int sys_ustat(int dev, struct ustat * ubuf)
```

该函数的作用是获取文件系统信息。不过Linux-0.11版本尚未实现。

在代码实现中，仅仅是返回了一个错误码ENOSYS。
```c
    return -ENOSYS;
```

### sys_utime
```c
int sys_utime(char * filename, struct utimbuf * times)
```

该函数的作用是设置文件的修改和访问时间。入参中，filename代表文件名， times是一个访问和修改时间结构的指针。

首先调用namei函数(fs/namei.c)获取文件的i节点， 因为一个文件与时间相关的信息存储在inode节点中。 接着从入参中提取出访问时间和修改时间。

```c
	struct m_inode * inode;
	long actime,modtime;

	if (!(inode=namei(filename)))//获取文件的i节点
		return -ENOENT;
	if (times) {//如果times指针不为空，则从times中获取。
		actime = get_fs_long((unsigned long *) &times->actime);
		modtime = get_fs_long((unsigned long *) &times->modtime);
	} else//如果times指针为空，则直接从系统时间获取
		actime = modtime = CURRENT_TIME;
```
接着将i节点的访问时间和修改时间进行修改， 并设置该i节点有脏数据。

```c
	inode->i_atime = actime;
	inode->i_mtime = modtime;
	inode->i_dirt = 1;
	iput(inode);
	return 0;
```

### sys_access
```c
int sys_access(const char * filename,int mode)
```

```c
struct m_inode * inode;
int res, i_mode;

mode &= 0007;
if (!(inode=namei(filename)))
    return -EACCES;
i_mode = res = inode->i_mode & 0777;
iput(inode);
if (current->uid == inode->i_uid)
    res >>= 6;
else if (current->gid == inode->i_gid)
    res >>= 6;
if ((res & 0007 & mode) == mode)
    return 0;
/*
    * XXX we are doing this test last because we really should be
    * swapping the effective with the real user id (temporarily),
    * and then calling suser() routine.  If we do call the
    * suser() routine, it needs to be called last. 
    */
if ((!current->uid) &&
    (!(mode & 1) || (i_mode & 0111)))
    return 0;
return -EACCES;
```
### sys_chdir
```c
int sys_chdir(const char * filename)
```
该函数的作用是改变当前进程的工作目录。

首先通过namei找到路径filename对应的i节点。节点将该i节点设置给PCB中的pwd字段。
```c
struct m_inode * inode;

if (!(inode = namei(filename)))
    return -ENOENT;
if (!S_ISDIR(inode->i_mode)) {
    iput(inode);
    return -ENOTDIR;
}
iput(current->pwd);
current->pwd = inode;
return (0);
```
### sys_chroot
```c
int sys_chroot(const char * filename)
```

该函数的作用是修改进程的根目录。

首先通过namei找到路径filename对应的i节点。节点将该i节点设置给PCB中的root字段。
```c
struct m_inode * inode;

if (!(inode=namei(filename)))
    return -ENOENT;
if (!S_ISDIR(inode->i_mode)) {
    iput(inode);
    return -ENOTDIR;
}
iput(current->root);
current->root = inode;
return (0);
```

### sys_chmod
```c
int sys_chmod(const char * filename,int mode)
```
该函数的作用是用于修改文件的权限。

```c
struct m_inode * inode;

if (!(inode=namei(filename)))
    return -ENOENT;
if ((current->euid != inode->i_uid) && !suser()) {
    iput(inode);
    return -EACCES;
}
inode->i_mode = (mode & 07777) | (inode->i_mode & ~07777);
inode->i_dirt = 1;
iput(inode);
return 0;
```

### sys_chown
```c
int sys_chown(const char * filename,int uid,int gid)
```

该函数的作用是修改文件的拥有用户和拥有组。
```c
	struct m_inode * inode;

	if (!(inode=namei(filename)))
		return -ENOENT;
	if (!suser()) {
		iput(inode);
		return -EACCES;
	}
	inode->i_uid=uid;
	inode->i_gid=gid;
	inode->i_dirt=1;
	iput(inode);
	return 0;
```
### sys_open
```c
int sys_open(const char * filename,int flag,int mode)
```

```c
	struct m_inode * inode;
	struct file * f;
	int i,fd;

	mode &= 0777 & ~current->umask;
	for(fd=0 ; fd<NR_OPEN ; fd++)
		if (!current->filp[fd])
			break;
	if (fd>=NR_OPEN)
		return -EINVAL;
	current->close_on_exec &= ~(1<<fd);
	f=0+file_table;
	for (i=0 ; i<NR_FILE ; i++,f++)
		if (!f->f_count) break;
	if (i>=NR_FILE)
		return -EINVAL;
	(current->filp[fd]=f)->f_count++;
	if ((i=open_namei(filename,flag,mode,&inode))<0) {
		current->filp[fd]=NULL;
		f->f_count=0;
		return i;
	}
/* ttys are somewhat special (ttyxx major==4, tty major==5) */
	if (S_ISCHR(inode->i_mode)) {
		if (MAJOR(inode->i_zone[0])==4) {
			if (current->leader && current->tty<0) {
				current->tty = MINOR(inode->i_zone[0]);
				tty_table[current->tty].pgrp = current->pgrp;
			}
		} else if (MAJOR(inode->i_zone[0])==5)
			if (current->tty<0) {
				iput(inode);
				current->filp[fd]=NULL;
				f->f_count=0;
				return -EPERM;
			}
	}
/* Likewise with block-devices: check for floppy_change */
	if (S_ISBLK(inode->i_mode))
		check_disk_change(inode->i_zone[0]);
	f->f_mode = inode->i_mode;
	f->f_flags = flag;
	f->f_count = 1;
	f->f_inode = inode;
	f->f_pos = 0;
	return (fd);
```
### sys_creat
```c
int sys_creat(const char * pathname, int mode)
```
该函数是创建文件的系统调用。

其内部调用了sys_open函数，传递参数时，设置flag = O_CREAT | O_TRUNC。

```c
return sys_open(pathname, O_CREAT | O_TRUNC, mode);
```


### sys_close
```c
int sys_close(unsigned int fd)
```
该函数是关闭文件的系统调用。

```c
	struct file * filp;

	if (fd >= NR_OPEN)//如果fd大于了程序可以打开的最大的文件数，则返回错误。
		return -EINVAL;
	current->close_on_exec &= ~(1<<fd);//将执行时关闭的句柄位图复位为0
	if (!(filp = current->filp[fd]))//fd对应的进程文件描述符并没有对应的文件结构体，则返回错误。
		return -EINVAL;
	current->filp[fd] = NULL;//将fd对应的文件结构体置为NULL
	if (filp->f_count == 0)
		panic("Close: file count is 0");
	if (--filp->f_count)//减少引用计数，如果f_count不为0， 代表还有其他进程在使用该文件结构体，则直接返回
		return (0);
	iput(filp->f_inode);//否则代表没有进程在使用该文件结构体，则可以进行放回操作
	return (0);
```
## Q & A