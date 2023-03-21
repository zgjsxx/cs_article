---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录exit.c详解

## release
```c
void release(struct task_struct * p)
```
该函数的作用是去释放进程在任务数组中占用的位置， 并且将进程的描述符PCB占用的内存进行释放。

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

## send_sig
```c
static inline int send_sig(long sig,struct task_struct * p,int priv)
```
该函数的作用是向进程的传递一个信号。

首先对信号的数值大小做一个校验。

```c
if (!p || sig<1 || sig>32)
  return -EINVAL;
```

接着判断发送信号的进程的有效用户和待接受信号的进程的有效用户是否相等，并判断是否是超级用户， 如果二者满足其一， 就可以设置待接受进程的信号位。否则就可以报权限错误。
```c
if (priv || (current->euid==p->euid) || suser())
  p->signal |= (1<<(sig-1));
else
  return -EPERM;
```

## kill_session
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
## sys_kill
```c
int sys_kill(int pid,int sig)
```

1. pid大于零时，pid是信号欲送往的进程的标识。
2. pid等于零时，信号将送往所有与调用kill()的那个进程属同一个使用组的进程。
3. pid等于-1时，信号将送往所有调用进程有权给其发送信号的进程，除了进程1(init)。
4. pid小于-1时，信号将送往以-pid为组标识的进程。

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

## tell_father

## do_exit
```c
int do_exit(long code)
```

## sys_exit

## sys_waitpid
