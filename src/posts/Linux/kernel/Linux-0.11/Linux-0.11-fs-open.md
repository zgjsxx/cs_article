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

该函数的作用是获取文件系统信息。不过Linux-0.11版本尚未实现。
```c
    return -ENOSYS;
```

### sys_utime
```c
int sys_utime(char * filename, struct utimbuf * times)
```

该函数的作用是设置文件的修改和访问时间。

首先调用namei函数(fs/namei.c)获取文件的i节点， 接着从入参中提取出访问时间和修改时间。
```c
struct m_inode * inode;
long actime,modtime;

if (!(inode=namei(filename)))
    return -ENOENT;
if (times) {
    actime = get_fs_long((unsigned long *) &times->actime);
    modtime = get_fs_long((unsigned long *) &times->modtime);
} else
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
```c
return sys_open(pathname, O_CREAT | O_TRUNC, mode);
```
### sys_close
```c
int sys_close(unsigned int fd)
```

```c
struct file * filp;

if (fd >= NR_OPEN)
    return -EINVAL;
current->close_on_exec &= ~(1<<fd);
if (!(filp = current->filp[fd]))
    return -EINVAL;
current->filp[fd] = NULL;
if (filp->f_count == 0)
    panic("Close: file count is 0");
if (--filp->f_count)
    return (0);
iput(filp->f_inode);
return (0);
```
## Q & A