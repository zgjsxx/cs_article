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

## kill_session

## sys_kill

## tell_father

## do_exit
```c
int do_exit(long code)
```

## sys_exit

## sys_waitpid
