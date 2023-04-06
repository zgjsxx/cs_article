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
该函数用于复制文件描述符。

入参fd代表计划复制的文件描述符。 arg代表新的文件描述符的最小值。

首先检查参数的有效性，如果fd大于进程最大可以打开的文件数，或者fd对应文件结构不存在，则返回-EBADF。如果arg大于了NR_OPEN，则返回EINVAL。
```c
	if (fd >= NR_OPEN || !current->filp[fd])
		return -EBADF;
	if (arg >= NR_OPEN)
		return -EINVAL;
```

接着，从arg开始遍历，寻找合适的文件描述符用于复制。如果没有找到，则返回EMFILE。
```c
while (arg < NR_OPEN)
    if (current->filp[arg])
        arg++;
    else
        break;
if (arg >= NR_OPEN)
    return -EMFILE;
```

接下来复位close_on_exec中该句柄位。将fd对应的文件指针拷贝到arg对应的文件指针中。
```c
current->close_on_exec &= ~(1<<arg);
(current->filp[arg] = current->filp[fd])->f_count++;
return arg;
```

### sys_dup2
```c
int sys_dup2(unsigned int oldfd, unsigned int newfd)
```
该函数与sys_dup函数类似，区别是其在进行文件描述符的复制时，如果newfd已经打开，其会进行关闭。

```c
sys_close(newfd);
return dupfd(oldfd,newfd);
```

### sys_dup
```c
int sys_dup(unsigned int fildes)
```
该函数是复制文件描述符dup的系统调用。

其内部调用sys_dup函数，新的文件描述符从0开始寻找。

```c
return dupfd(fildes,0);
```

### sys_fcntl
```c
int sys_fcntl(unsigned int fd, unsigned int cmd, unsigned long arg)
```
该函数时文件控制系统调用的函数。其具有多个功能。

首先检查函数的入参，如果大于进程最大可以打开的文件数或者fd对应的文件结构体不存在，则返回-EBADF。
```c
struct file * filp;

if (fd >= NR_OPEN || !(filp = current->filp[fd]))
    return -EBADF;
```

接下来，根据cmd的不同类型，实现不同的功能。

如果cmd是F_DUPFD，则调用dupfd进行文件描述符的拷贝。

如果cmd是F_GETFD，则用于获取fd对应的执行时关闭的标志。

如果cmd是F_SETFD，则用于设置fd对应的执行时关闭的标志。

如果cmd是F_GETFL，则用于返回文件的状态标志和访问模式。

如果cmd是F_SETFL, 则用于设置文件的状态标志和访问模式。

cmd等于F_GETLK/F_SETLK/F_SETLKW，还没有实现。
```c
switch (cmd) {
    case F_DUPFD:
        return dupfd(fd,arg);
    case F_GETFD:
        return (current->close_on_exec>>fd)&1;
    case F_SETFD:
        if (arg&1)
            current->close_on_exec |= (1<<fd);
        else
            current->close_on_exec &= ~(1<<fd);
        return 0;
    case F_GETFL:
        return filp->f_flags;
    case F_SETFL:
        filp->f_flags &= ~(O_APPEND | O_NONBLOCK);
        filp->f_flags |= arg & (O_APPEND | O_NONBLOCK);
        return 0;
    case F_GETLK:	case F_SETLK:	case F_SETLKW:
        return -1;
    default:
        return -1;
}
```

## Q & A