---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理sys.c详解](#linux-011-kernel目录进程管理sysc详解)
  - [模块简介](#模块简介)
  - [函数详解](#函数详解)
    - [sys\_setregid](#sys_setregid)
    - [sys\_time](#sys_time)
    - [sys\_setreuid](#sys_setreuid)
    - [sys\_setuid](#sys_setuid)
    - [sys\_stime](#sys_stime)
    - [sys\_times](#sys_times)
    - [sys\_brk](#sys_brk)
    - [sys\_setpgid](#sys_setpgid)
    - [sys\_getpgrp](#sys_getpgrp)
    - [sys\_setsid](#sys_setsid)
    - [sys\_uname](#sys_uname)
    - [sys\_umask](#sys_umask)
    - [sys\_setgid](#sys_setgid)
  - [未实现方法](#未实现方法)
    - [sys\_ftime](#sys_ftime)
    - [sys\_break](#sys_break)
    - [sys\_ptrace](#sys_ptrace)
    - [sys\_stty](#sys_stty)
    - [sys\_gtty](#sys_gtty)
    - [sys\_rename](#sys_rename)
    - [sys\_prof](#sys_prof)
    - [sys\_acct](#sys_acct)
    - [sys\_phys](#sys_phys)
    - [sys\_lock](#sys_lock)
    - [sys\_mpx](#sys_mpx)
    - [sys\_ulimit](#sys_ulimit)
  - [Q \& A](#q--a)
    - [1.ruid euid suid现代系统行为](#1ruid-euid-suid现代系统行为)


# Linux-0.11 kernel目录进程管理sys.c详解

## 模块简介

在sys.c模块中，有很多关于进程id、进程组id、用户id、用户组id的系统调用。 另外在该文件，诸如```sys_ftime```，```sys_break```等函数在Linux-0.11版本中尚未实现。

该程序中含有许多进程ID(pid)，进程组ID(pgrp或pgid)，用户ID(uid)、用户组ID(gid)、实际用户ID(ruid)、有效用户ID(euid)以及会话ID(session)等的操作函数。

一个用户有用户ID(uid)和用户组ID(gid)。这两个ID是passwd文件中对用户设置的，通常被称之为实际用户ID(ruid)和实际组ID(rgid)。而在每个文件的i节点信息中都保存着宿主的用户ID和组ID，主要用于访问或者执行文件时的权限判断操作。另外在一个进程的任务数据结构中，为了实现不同功能而保存了3种用户ID和组ID。如下所示：

|类别|用户ID|组ID|
|--|--|--|
|进程的|uid - 用户ID。指明拥有该进程的用户|gid - 组ID。指明拥有该进程的用户组|
|有效的|euid - 有效用户ID。指明访问文件的权限|egid - 有效组ID。指明访问文件的权限|
|保存的|suid - 保存的用户ID。当执行文件的设置用户ID标志(set-user-ID置位时，suid中保存着执行文件的uid，否则suid等于进程的euid|sgid - 保存的组ID。当执行文件的设置组ID标志set-group-ID置位时，sgid中保存着执行文件的gid。否则sgid等于进程的egid。|


## 函数详解

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

### sys_time
```c
int sys_time(long * tloc)
```

该函数的作用是返回从1970年1月1日 00：00：00开始到此刻的秒数。该方法是```time```的系统调用， 入参是一个```time_t```类型的数据。

```c
#include <time.h>

time_t time(time_t *timer);
```

由于参数是一个指针，而其所指位置在用户空间，因此需要使用函数```put_fs_long```来访问该值。在进入内核中运行时，段寄存器fs被默认地指向当前用户数据空间。因此该函数就可利用```fs```来访问用户空间中的值。

```c
    int i;

    i = CURRENT_TIME;
    if (tloc) {
        verify_area(tloc,4);
        put_fs_long(i,(unsigned long *)tloc);
    }
    return i;
```

CURRENT_TIME的定义如下所示， 等于系统的开机时间加上目前的滴答数/100。这里除以100的原因是定时器发出中断的频率是100Hz，也即没10ms发出一次时钟中断。

```c
    CURRENT_TIME (startup_time+jiffies/HZ)
```

### sys_setreuid

```c
int sys_setreuid(int ruid, int euid)
```

该函数的作用是设置实际用户id(ruid)和有效用户id(euid)。

现代系统的```setuid```逻辑如下：
- 当可执行文件的开启了设置用户 id 位后，执行该文件后 （execve），该进程的 euid 和 suid 将被设置为该文件的 owner。
- 如果当前进程的 euid 是 root，则 setuid 会设置所有的 ruid、euid 和 suid。
- 如果当前进程的 euid 不是 root，则 setuid 只会设置 euid，且这个 euid 的可选值只能是 ruid 或 suid，也就是说，一个由开启了设置用户 id 位的可执行文件启动的进程，这个进程 euid 可以在 ruid 和 suid 之间来回切换。

这里的逻辑和现代系统略微不同。

首先看第一个if分支。有三种条件会修改ruid。
- current->euid 等于 ruid，这种情况现代系统不会修改ruid
- old_ruid 等于 ruid，由于old_ruid = current->uid，所以等于没有修改。(无效代码)
- suser，超级用户会修改ruid，和现代系统一致。


接着看第二个if分支。有三种条件会修改euid：
- old_ruid 等于euid ，这种情况和现代系统一致。
- current->euid 等于 euid，等于没有修改。(无效代码)
- suser，超级用户会修改euid，和现代系统一致。

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

现代系统的行为可以参考Q&A。

### sys_setuid

```c
int sys_setuid()
```

该函数用设置任务uid。其内部调用```sys_setreuid```函数实现。

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

### sys_setgid

```c
int sys_setgid(int gid)
```

该函数用于设置进程组号。

```c
return(sys_setregid(gid, gid));
```

## 未实现方法

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


## Q & A

### 1.ruid euid suid现代系统行为

```c
#include <sys/types.h>
#include <unistd.h>
#include <stdio.h>
#include <grp.h>

int main() {
    uid_t oruid, oeuid, osuid;
    getresuid(&oruid, &oeuid, &osuid); // 非 POSIX.1 标准
    uid_t ruid, euid, suid;

    printf("origin\n");
    getresuid(&ruid, &euid, &suid); // 非 POSIX.1 标准
    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    printf("\n");

    printf("setuid(origin ruid = %d)\n", oruid);
    setuid(oruid);
    getresuid(&ruid, &euid, &suid); // 非 POSIX.1 标准
    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    printf("\n");

    printf("setuid(origin suid = %d)\n", osuid);
    setuid(osuid);
    getresuid(&ruid, &euid, &suid); // 非 POSIX.1 标准
    printf("ruid: %d, euid: %d, suid: %d\n", ruid, euid, suid);
    return 0;
}

```
首先进行编译 ```sudo gcc 03-set-uid-bit.c```。

然后将开启该文件的设置用户 id 位，并将该可执行文件的 owner 设置为 root，并执行该测试程序 ```sudo chown root:root a.out && sudo chmod u+s a.out && ./a.out```，输出如下。

```shell
origin
ruid: 1000, euid: 0, suid: 0

setuid(origin ruid = 1000)
ruid: 1000, euid: 1000, suid: 1000

setuid(origin suid = 0)
ruid: 1000, euid: 1000, suid: 1000
```

然后将开启该文件的设置用户 id 位，并将该可执行文件的 owner 设置为 普通用户，并执行该测试程序 ```sudo chown root:root a.out && sudo chmod u+s a.out && ./a.out```，输出如下。

```shell
origin
ruid: 1000, euid: 1001, suid: 1001

setuid(origin ruid = 1000)
ruid: 1000, euid: 1000, suid: 1001

setuid(origin suid = 1001)
ruid: 1000, euid: 1001, suid: 1001
```

总结：

- 当可执行文件的开启了设置用户 id 位后，执行该文件后 （execve），该进程的 euid 和 suid 将被设置为该文件的 owner。
- 如果当前进程的 euid 是 root，则 setuid 会设置所有的 ruid、euid 和 suid。
- 如果当前进程的 euid 不是 root，则 setuid 只会设置 euid，且这个 euid 的可选值只能是 ruid 或 suid，也就是说，一个由开启了设置用户 id 位的可执行文件启动的进程，这个进程 euid 可以在 ruid 和 suid 之间来回切换。
