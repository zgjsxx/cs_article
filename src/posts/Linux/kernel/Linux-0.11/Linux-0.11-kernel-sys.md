---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录进程管理sys.c详解

## 模块简介


## 函数详解

### sys_ftime
```c
int sys_ftime()
```

未实现。

### sys_break
```c
int sys_break()
```

未实现。

### sys_ptrace
```c
int sys_ptrace()
```

用于当前进程对子进程进行调试。

### sys_stty
```c
int sys_stty()
```

改变并打印终端设置。

未实现。

### sys_gtty
```c
int sys_gtty()
```
获取进程终端信息。

未实现。
### sys_rename
```c
int sys_rename()
```
修改文件名。

未实现。

### sys_prof
```c
int sys_prof()
```
未实现。

### sys_setregid
```c
int sys_setregid(int rgid, int egid)
```
该函数用于设置进程的实际组id或者有效组id。
```c
	if (rgid>0) {
		if ((current->gid == rgid) || 
		    suser())
			current->gid = rgid;
		else
			return(-EPERM);
	}
	if (egid>0) {
		if ((current->gid == egid) ||
		    (current->egid == egid) ||
		    (current->sgid == egid) ||
		    suser())
			current->egid = egid;
		else
			return(-EPERM);
	}
	return 0;
```

### sys_setgid
```c
int sys_setgid(int gid)
```
该函数用于设置进程组号。
```c
return(sys_setregid(gid, gid));
```

### sys_acct
```c
int sys_acct()
```

未实现。

### sys_phys
```c
int sys_phys()
```

未实现。

### sys_lock
```c
int sys_lock()
```

未实现。

### sys_mpx
```c
int sys_mpx()
```

未实现。

### sys_ulimit
```c
int sys_ulimit()
```

未实现。

### sys_time
```c
int sys_time(long * tloc)
```

返回从1970年1月1日 00：00：00开始到此刻的秒数。
```c
int i;

i = CURRENT_TIME;
if (tloc) {
    verify_area(tloc,4);
    put_fs_long(i,(unsigned long *)tloc);
}
return i;
```

### sys_setreuid
```c
int sys_setreuid(int ruid, int euid)
```
该函数的作用是设置实际用户id(ruid)和有效用户id(euid)。
```c
int old_ruid = current->uid;

if (ruid>0) {
    if ((current->euid==ruid) ||
                (old_ruid == ruid) ||
        suser())
        current->uid = ruid;
    else
        return(-EPERM);
}
if (euid>0) {
    if ((old_ruid == euid) ||
                (current->euid == euid) ||
        suser())
        current->euid = euid;
    else {
        current->uid = old_ruid;
        return(-EPERM);
    }
}
return 0;
```

### sys_setuid
```c
int sys_setuid()
```
该函数用设置任务uid。其内部调用sys_setreuid函数实现。

```c
return(sys_setreuid(uid, uid));
```

### sys_stime
```c
int sys_stime()
```
该函数的作用是获取开机时间的秒数。
```c
if (!suser())
    return -EPERM;
startup_time = get_fs_long((unsigned long *)tptr) - jiffies/HZ;
return 0;
```

### sys_times
```c
int sys_times(struct tms * tbuf)
```
该函数的作用是获取当前进程的时间统计值。

其通过put_fs_long将pcb中和时间相关的数据拷贝到tbuf中。utime代表用户态运行时间，stime代表内核态运行时间，cutime代表子进程用户运行时间，cstime代表子进程内核态运行时间。
```c
if (tbuf) {
    verify_area(tbuf,sizeof *tbuf);
    put_fs_long(current->utime,(unsigned long *)&tbuf->tms_utime);
    put_fs_long(current->stime,(unsigned long *)&tbuf->tms_stime);
    put_fs_long(current->cutime,(unsigned long *)&tbuf->tms_cutime);
    put_fs_long(current->cstime,(unsigned long *)&tbuf->tms_cstime);
}
return jiffies;
```

### sys_brk
```c
int sys_brk(unsigned long end_data_seg)
```
该函数的作用用于设置堆区的指针brk的值。
```c
if (end_data_seg >= current->end_code &&
    end_data_seg < current->start_stack - 16384)
    current->brk = end_data_seg;
return current->brk;
```

### sys_setpgid
```c
int sys_setpgid(int pid, int pgid)
```
该函数的作用是将进程号等于pid的进程的组号设置为pgid。
```c
int i;

if (!pid)
    pid = current->pid;
if (!pgid)
    pgid = current->pid;
for (i=0 ; i<NR_TASKS ; i++)
    if (task[i] && task[i]->pid==pid) {
        if (task[i]->leader)//如果不是会话leader，则没有权限
            return -EPERM;
        if (task[i]->session != current->session)//必须要属于同一个会话
            return -EPERM;
        task[i]->pgrp = pgid;
        return 0;
    }
return -ESRCH;
```

### sys_getpgrp
```c
int sys_getpgrp(void)
```
该函数用于返回当前进程的进程组号。

```c
return current->pgrp;
```
### sys_setsid
```c
int sys_setsid(void)
```
该函数用于创建一个session，并设置进程为会话首领。
```c
if (current->leader && !suser())//该进程已经是leader，但是不是超级用户，则返回-EPERM。
    return -EPERM;
current->leader = 1;//设置leader = 1
current->session = current->pgrp = current->pid;//设置进程会话号
current->tty = -1;//设置进程没有控制中断
return current->pgrp;
```
### sys_uname
```c
int sys_uname(struct utsname * name)
```

该函数用于获取系统名称等信息。

```c
static struct utsname thisname = {
    "linux .0","nodename","release ","version ","machine "
};
int i;

if (!name) return -ERROR;
verify_area(name,sizeof *name);
for(i=0;i<sizeof *name;i++)
    put_fs_byte(((char *) &thisname)[i],i+(char *) name);
return 0;
```

### sys_umask
```c
int sys_umask(int mask)
```
设置当前进程创建文件的属性屏蔽码为```(mask & 0777)```。

```0777```代表数字是一个八进制数字，即000111111111。

```c
int old = current->umask;

current->umask = mask & 0777;
return (old);
```


## Q & A