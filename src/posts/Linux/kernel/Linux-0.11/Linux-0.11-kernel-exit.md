---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录exit.c详解](#linux-011-kernel目录exitc详解)
  - [模块简介](#模块简介)
  - [函数详解](#函数详解)
    - [release](#release)
    - [send\_sig](#send_sig)
    - [kill\_session](#kill_session)
    - [sys\_kill](#sys_kill)
    - [tell\_father](#tell_father)
    - [do\_exit](#do_exit)
    - [sys\_exit](#sys_exit)
    - [sys\_waitpid](#sys_waitpid)


# Linux-0.11 kernel目录exit.c详解

## 模块简介

该程序主要描述了进程(任务)终止和退出的有关处理内容。主要包含：
- 进程释放
- 会话(进程组)终止
- 程序退出处理函数
- 杀死进程/终止进程/挂起进程等系统调用

## 函数详解

### release

```c
void release(struct task_struct * p)
```

该函数的作用是去释放进程在任务数组中占用的位置，并且将进程的描述符PCB占用的内存进行释放。其调用关系如下所示：

```shell
├── sys_waitpid
  └── release

├── do_exit
  └── tell_father
    └── release
```

release代码如下所示，比较简单，直接看注释即可理解。

```c
int i;

if (!p) //如果p为空指针什么也不做
    return;
for (i=1 ; i<NR_TASKS ; i++)
    if (task[i]==p) {//找到了对应的数组项
        task[i]=NULL;//将该项置空
        free_page((long)p);//释放该内存页
        schedule();//重新进行调用
        return;
    }
panic("trying to release non-existent task");
```

### send_sig

```c
static inline int send_sig(long sig,struct task_struct * p,int priv)
```

该函数的作用是向进程的传递一个信号。

首先对信号的数值大小做一个校验。合法范围是[1，32]

```c
if (!p || sig<1 || sig>32)
  return -EINVAL;
```

接着判断发送信号的进程的有效用户和待接受信号的进程的有效用户是否相等，并判断是否是超级用户， 如果二者满足其一， 就可以设置待接受进程的信号位。否则就可以报权限错误。

设置信号的过程很简单，```p->signal |= (1<<(sig-1));```， 即将进程PCB中signal变量的队医你个信号位写1即可。

```c
if (priv || (current->euid==p->euid) || suser())
  p->signal |= (1<<(sig-1));
else
  return -EPERM;
```

### kill_session

```c
static void kill_session(void)
```

该函数的作用是向所有和当前进程的session相同的其他进程发送SIGHUP信号。

```c
struct task_struct **p = NR_TASKS + task;

while (--p > &FIRST_TASK) {
  if (*p && (*p)->session == current->session)
    (*p)->signal |= 1<<(SIGHUP-1);
}
```

### sys_kill

```c
int sys_kill(int pid,int sig)
```

该方法是系统调用```kill()```的实现，可用于向任何进程或进程组发送任何信号。不要被```kill```的名字误解，其并非只是杀死进程。

根据pid的值不同，有kill有不同的行为，概括如下：
- 1. pid大于零时，pid是信号欲送往的进程的标识。
- 2. pid等于零时，信号将送往所有与调用kill()的那个进程属同一个使用组的进程。
- 3. pid等于-1时，信号将送往所有调用进程有权给其发送信号的进程，除了进程1(init)。
- 4. pid小于-1时，信号将送往以-pid为组标识的进程。

```c
struct task_struct **p = NR_TASKS + task;
int err, retval = 0;

if (!pid) while (--p > &FIRST_TASK) {
  if (*p && (*p)->pgrp == current->pid) 
    if ((err=send_sig(sig,*p,1)))
      retval = err;
} else if (pid>0) while (--p > &FIRST_TASK) {
  if (*p && (*p)->pid == pid) 
    if ((err=send_sig(sig,*p,0)))
      retval = err;
} else if (pid == -1) while (--p > &FIRST_TASK) {
  if ((err = send_sig(sig,*p,0)))
    retval = err;
} else while (--p > &FIRST_TASK)
  if (*p && (*p)->pgrp == -pid)
    if ((err = send_sig(sig,*p,0)))
      retval = err;
return retval;
```

### tell_father

```c
static void tell_father(int pid)
```

该函数用于向父进程发送SIGCHLD信号。

这里在处理时，如果父进程已先行终止，则子进程应该被进程1收容。Linux-0.11中如果没有找到父进程则自己释放。

```c
	int i;

	if (pid)
		for (i=0;i<NR_TASKS;i++) {
			if (!task[i])
				continue;
			if (task[i]->pid != pid)
				continue;
			task[i]->signal |= (1<<(SIGCHLD-1));
			return;
		}
/* if we don't find any fathers, we just release ourselves */
/* This is not really OK. Must change it to make father 1 */
	printk("BAD BAD - no father found\n\r");
	release(current);
```

### do_exit

```c
int do_exit(long code)
```

```do_exit```是系统调用```exit```的入口方法，其用于退出处理程序。

其调用关系如下所示：

```shell
├── sys_exit
  └── do_exit
```

程序的开始首先是释放当前进程**代码段**和**数据段**的内存页。

```c
    int i;
    free_page_tables(get_base(current->ldt[1]),get_limit(0x0f));
    free_page_tables(get_base(current->ldt[2]),get_limit(0x17));
```

然后遍历进程表，如果当前进程有子进程，那么将子进程的父进程设置为1号进程(init进程)。如果该子进程已经处于僵死(ZOMBIE)状态，则向进程1发送子进程终止的信号。

```c
for (i=0 ; i<NR_TASKS ; i++)
  if (task[i] && task[i]->father == current->pid) {
    task[i]->father = 1;
    if (task[i]->state == TASK_ZOMBIE)
      /* assumption task[1] is always init */
      (void) send_sig(SIGCHLD, task[1], 1);
  }
```

接下来关闭当前进程打开着的所有文件。

```c
	for (i=0 ; i<NR_OPEN ; i++)
		if (current->filp[i])
			sys_close(i);
```

对当前进程的工作目录pwd，根目录root以及执行程序文件的i节点进行同步操作，放回各个i节点并分别置空(释放)。

```c
	iput(current->pwd);
	current->pwd=NULL;
	iput(current->root);
	current->root=NULL;
	iput(current->executable);
	current->executable=NULL;
```

如果当前进程是会话头领(leader)进程并且其有控制终端，则释放该终端。

```c
	if (current->leader && current->tty >= 0)
		tty_table[current->tty].pgrp = 0;
```

如果当前进程上次使用过协处理器，则将```last_task_used_math```置空。

```c
	if (last_task_used_math == current)
		last_task_used_math = NULL;
```

如果当前进程是leader进程，则终止该会话的所有相关进程。

```c
	if (current->leader)
		kill_session();
```

将当前进程置为僵死状态，表明当前进程已经释放了资源，并保存退出码。通知父进程（当前进程的父进程），向其发送 SIGCHLD 信号，告知子进程已经停止或终止。最后，调用调度函数 schedule()，重新调度进程运行，让父进程处理僵死状态的其他善后事宜。

```c
	current->state = TASK_ZOMBIE;
	current->exit_code = code;
    // 通知父进程，也即向父进程发送信号SIGCHLD - 子进程将停止或终止。
	tell_father(current->father);
	schedule();                     // 重新调度进程运行，以让父进程处理僵死其他的善后事宜。
```

### sys_exit

```c
int sys_exit (int error_code)
```

该函数的内部调用了```do_exit```函数实现进程的退出。

### sys_waitpid

```c
int sys_waitpid (pid_t pid, unsigned long *stat_addr, int options)
```

该函数是```waitpid```函数的系统调用，其作用是挂起当前进程，直到进程号等于入参pid的子进程退出。

|参数值|说明|
|--|--|
|pid < -1|等待进程组号为pid绝对值的任何子进程|
|pid = -1|等待任何子进程，此时的waitpid()函数就退化成了普通的wait()函数|
|pid = 0|等待进程组号与目前进程相同的任何子进程，也就是说任何和调用waitpid()函数的进程在同一个进程组的进程|
|pid > 0|等待进程号为pid的子进程|

```c
for(p = &LAST_TASK ; p > &FIRST_TASK ; --p) {
    if (!*p || *p == current)
        continue;
    if ((*p)->father != current->pid)//如果当前项不是当前进程的子进程
        continue;
    if (pid>0) {
        if ((*p)->pid != pid)//不是要寻找的子进程
            continue;
    } else if (!pid) {
        if ((*p)->pgrp != current->pgrp)//属于同一个进程组
            continue;
    } else if (pid != -1) {
        if ((*p)->pgrp != -pid)//进程组号等于pid的绝对值
            continue;
    }
```

如果前3个对pid的判断都不符合，则表示当前进程正在等待其任何子进程，也即```pid=-1```的情况，此时所选择到的进程p或者是其进程号等于指定pid，或者是当前进程组中的任何子进程，或者
是进程号等于指定pid绝对值的子进程，或者是任何子进程(此时指定的pid等于-1)。接下来根据这个子进程p所处的状态来处理。

这里的判断包含两种场景，一种是进程状态是```TASK_STOPPED```， 一种是进程状态是```TASK_ZOMBIE```。

对于```TASK_STOPPED```：

子进程p处于停止状态时，如果此时WUNTRACED标志没有置位，表示程序无须立刻返回，于是继续扫描处理其他进程。如果```WUNTRACED```置位，则把状态信息```0x7f```放入```*stat_addr```，并立刻返回子进程号```pid```。这里```0x7f```表示的返回状态是```wifstopped（）```宏为真。

对于```TASK_ZOMBIE```：

如果子进程p处于僵死状态，则首先把它在用户态和内核态运行的时间分别累计到当前进程(父进程)中，然后取出子进程的pid和退出码，并释放该子进程。最后返回子进程的退出码和pid。

通常情况下，父进程会继续运行而不等待子进程的终止。但是，当父进程调用类似 ```waitpid()``` 的系统调用来等待子进程时，父进程需要知道子进程的状态，包括子进程消耗的 CPU 时间。因此，在子进程终止后，其 CPU 时间会被记录下来，以供父进程查询。

```c
		switch ((*p)->state) {

			case TASK_STOPPED:
				if (!(options & WUNTRACED))
					continue;
				put_fs_long(0x7f,stat_addr);
				return (*p)->pid;

			case TASK_ZOMBIE:
				current->cutime += (*p)->utime;
				current->cstime += (*p)->stime;
				flag = (*p)->pid;                   // 临时保存子进程pid
				code = (*p)->exit_code;             // 取子进程的退出码
				release(*p);                        // 释放该子进程
				put_fs_long(code,stat_addr);        // 置状态信息为退出码值
				return flag;                        // 返回子进程的pid
            // 如果这个子进程p的状态既不是停止也不是僵死，那么就置flag=1,表示找到过一个符合
            // 要求的子进程，但是它处于运行态或睡眠态。
			default:
				flag=1;
				continue;
		}
```