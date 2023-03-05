---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理sched.c详解

sched.c主要功能是负责进程的调度，其最核心的函数就是schedule。
。。

## schedule
```c
void schedule(void)
```

```c
for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
    if (*p) {
        if ((*p)->alarm && (*p)->alarm < jiffies) { //如果设置了任务定时的值alarm， 并且已经过期
                (*p)->signal |= (1<<(SIGALRM-1)); //将信号的SIGALARM位置为1
                (*p)->alarm = 0;
            }
        if (((*p)->signal & ~(_BLOCKABLE & (*p)->blocked)) &&
        (*p)->state==TASK_INTERRUPTIBLE)//如果信号位图中除了被阻塞的信号外还有其他信号， 并且任务处于可终端状态
            (*p)->state=TASK_RUNNING; //修改任务的状态为就绪态
    }
```


下面这段代码就是任务调度的核心代码。这里会从所有任务从选取counter值最大的任务作用下一个运行的任务去执行。

```c
while (1) {
	c = -1;
	next = 0;
	i = NR_TASKS;
	p = &task[NR_TASKS];//从最后一个任务开始
	while (--i) { //遍历所有的task， 取出其中counter最大的task
		if (!*--p)
			continue;
		if ((*p)->state == TASK_RUNNING && (*p)->counter > c)//取出所有任务中counter值最大的任务作为下一个任务
			c = (*p)->counter, next = i;
	}
	if (c) break;
	for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
		if (*p)
			(*p)->counter = ((*p)->counter >> 1) +
					(*p)->priority;//更新counter值 counter = counter/2 + priority
}
switch_to(next);
```

## show_task
```c
void show_task(int nr,struct task_struct * p)
```
该函数的作用是显示任务序号为nr的进程的pid，进程状态以及内核栈剩余的大小。


```c
int i,j = 4096-sizeof(struct task_struct);

printk("%d: pid=%d, state=%d, ",nr,p->pid,p->state);
i=0;
```

此时j指向PCB所在内存页的顶部， i指向task_struct结构体的下一个字节。下面这段代码的所用实际就是统计内核栈中空闲大小。

![show_task](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/sched/show_task.png)

```c
while (i<j && !((char *)(p+1))[i])
	i++;
printk("%d (of %d) chars free in kernel stack\n\r",i,j);
```

## show_stat
```c
void show_stat(void)
```
该函数内部调用show_task函数，实际上就是遍历task数组， 调用show_stat函数显示进程相关信息。
```c
int i;

for (i=0;i<NR_TASKS;i++)
	if (task[i])
		show_task(i,task[i]);
```
## math_state_restore
```c
void math_state_restore()
```

## sys_pause
```c
int sys_pause(void)
```
该函数是pause的系统调用。该函数会将当前任务的状态修改为可中断的状态， 并调用schedule函数去进行进程的调度。

调用pause函数的进程会进入睡眠状态， 直到收到一个信号。

```c
current->state = TASK_INTERRUPTIBLE;
schedule();
```

## sleep_on
```c
void sleep_on(struct task_struct **p)
```

## wake_up
```c
void wake_up(struct task_struct **p)
```


## ticks_to_floppy_on
```c
int ticks_to_floppy_on(unsigned int nr)
```

## floppy_on
```c
void floppy_on(unsigned int nr)
```

## floppy_off
```c
void floppy_off(unsigned int nr)
```

## do_floppy_timer
```c
void do_floppy_timer(void)
```

## add_timer 
```c
add_timer(long jiffies, void (*fn)(void))
```
## do_timer
```c
void do_timer(long cpl)
```



## sys_alarm
```c
int sys_alarm(long seconds)
```

该函数用于设置报警值。

jiffies是指的是系统开机到目前经历的滴答数。

current->alarm的单位也是系统滴答数。

因此(current->alarm - jiffies) /100 就代表就的定时器还剩下多少秒。

![进程定时器]()

接着便按照入参seconds的值重新设置进程alarm值。



## sys_getpid
```c
int sys_getpid(void)
```


## sys_getppid
```c
int sys_getppid(void)
```

## sys_getuid
```c
int sys_getuid(void)
```

## sys_geteuid
```c
int sys_geteuid(void)
```

## sys_getgid
```c
int sys_getgid(void)
```

## sys_getegid
```c
int sys_getegid(void)
```

## sys_nice
```c
int sys_nice(long increment)
```

## sched_init
```c
void sched_init(void)
```

```c
outb_p(0x36,0x43);		/* binary, mode 3, LSB/MSB, ch 0 */
outb_p(LATCH & 0xff , 0x40);	/* LSB */
outb(LATCH >> 8 , 0x40);	/* MSB */
```
