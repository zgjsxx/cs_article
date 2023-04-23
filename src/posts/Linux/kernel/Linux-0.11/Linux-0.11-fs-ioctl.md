---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统ioctl.c详解

## 模块简介
该模块实现了输入/输出控制系统调用ioctl函数。在Linux-0.11版本中，仅包含了tty_ioctl的实现。

## 函数详解

### sys_ioctl
```c
int sys_ioctl(unsigned int fd, unsigned int cmd, unsigned long arg)
```
该函数是io的控制函数。

首先进行一些参数校验。如果fd大于进程可打开的文件数，或者fd对应的文件结构体不存在时，返回-EBADF。

此外获取fd对应的文件属性，如果该文件既不是字符设备又不是块设备，返回-EINVAL。 并且如果该设备的主设备号超过了系统已有的设备数，或者设备对应的ioctl函数不存在，返回错误信息。

```c
struct file * filp;
int dev,mode;

if (fd >= NR_OPEN || !(filp = current->filp[fd]))//如果fd大于进程可打开的文件数，或者fd对应的文件结构体不存在时，返回-EBADF。
    return -EBADF;
mode=filp->f_inode->i_mode;
if (!S_ISCHR(mode) && !S_ISBLK(mode))//如果该文件既不是字符设备又不是块设备，返回-EINVAL
    return -EINVAL;
dev = filp->f_inode->i_zone[0];
if (MAJOR(dev) >= NRDEVS)//如果该设备的主设备号超过了系统已有的设备数,返回错误
    return -ENODEV;
if (!ioctl_table[MAJOR(dev)])//如果设备对应的ioctl函数不存在，返回错误信息
    return -ENOTTY;
```

经过一番检查之后，下面调用设备对应的ioctl函数。

```c
return ioctl_table[MAJOR(dev)](dev,cmd,arg);
```

系统中设备对应的ioctl函数定义如下，Linux-0.11内核只有tty相关的tty_ioctl方法。
```c
static ioctl_ptr ioctl_table[]={
	NULL,		/* nodev */
	NULL,		/* /dev/mem */
	NULL,		/* /dev/fd */
	NULL,		/* /dev/hd */
	tty_ioctl,	/* /dev/ttyx */
	tty_ioctl,	/* /dev/tty */
	NULL,		/* /dev/lp */
	NULL};		/* named pipes */
```

## Q & A