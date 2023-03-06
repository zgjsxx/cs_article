---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理sched.c详解

sched.c主要功能是负责进程的调度，其最核心的函数就是schedule。


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
该函数的作用是将当前的task置为不可中断的等待状态， 直到被wake_up唤醒再继续执行。

入参p是等待任务队列的头指针。

该函数首先对一些异常情况进行了处理他， 例如p是空指针。或者当前task是任务0。

```c
struct task_struct *tmp;

// 若指针无效，则退出。（指针所指的对象可以是NULL，但指针本身不会为0)。
if (!p)
	return;
if (current == &(init_task.task))	// 如果当前任务是任务0，则死机(impossible!)。
	panic ("task[0] trying to sleep");
```

接着让当前等待任务的头指针指向当前任务。并将当前任务修改为不可中断的等待状态。进行调用schedule函数让操作系统切换其他任务执行。
```c
tmp = *p;
*p = current;
current->state = TASK_UNINTERRUPTIBLE;
schedule ();	
```

当代码执行到当前部分时，说明任务已经被显式的wake_up，如果此时还有其他进程仍然在等待，那么也一同唤醒。

因为任务都在等待同样的资源， 那么当资源可用的时候， 就可以唤醒所有等待的任务。
```c
if (tmp)			// 若还存在等待的任务，则也将其置为就绪状态（唤醒）。
	tmp->state = 0;
```

## interruptible_sleep_on 
```c
void interruptible_sleep_on (struct task_struct **p)
```
该函数与sleep类似，但是该函数会将任务的状态修改为可中断的等待状态， 而sleep_on则是将任务修改为不可中断的等待状态。

下面这段代码与sleep_on并无太大区别， 只是将进程的状态修改为可中断的等待状态。

```c
	struct task_struct *tmp;

	if (!p)
		return;
	if (current == &(init_task.task))
		panic ("task[0] trying to sleep");
	tmp = *p;
	*p = current;
repeat:
	current->state = TASK_INTERRUPTIBLE;
	schedule ();
```

如果等待队列中还有其他任务，说明当前任务被放入队列后又有其他新的任务被放入了等待队列中。

```c
if (*p && *p != current)
{
	(**p).state = 0;
	goto repeat;
}
```

下面一句代码有误，应该是*p = tmp，让队列头指针指向其余等待任务，否则在当前任务之前插入
等待队列的任务均被抹掉了
```c
*p = NULL;
if (tmp)
	tmp->state = 0;
```

## wake_up
```c
void wake_up(struct task_struct **p)
```
该函数的作用就是唤醒某一个任务。


```c
if (p && *p)
{
	(**p).state = 0;		// 置为就绪（可运行）状态。
	*p = NULL;
}
```

## ticks_to_floppy_on
```c
int ticks_to_floppy_on(unsigned int nr)
```
该函数指定软盘到正常运转状态所需延迟滴答数（时间）。

## floppy_on
```c
void floppy_on(unsigned int nr)
```
该函数等待指定软驱马达启动所需时间。

## floppy_off
```c
void floppy_off(unsigned int nr)
```

关闭相应的软驱马达停转定时器3s。
```c
moff_timer[nr]=3*HZ;
```


## do_floppy_timer
```c
void do_floppy_timer(void)
```


如果马达启动定时到则唤醒进程。
```c
if (mon_timer[i]) {
	if (!--mon_timer[i])
		wake_up(i+wait_motor);
```

如果马达停转定时到期则复位相应马达启动位，并更新数字输出到寄存器。

```c
else if (!moff_timer[i]) {
	current_DOR &= ~mask;
	outb(current_DOR,FD_DOR);
```

## add_timer 
```c
add_timer(long jiffies, void (*fn)(void))
```
如果定时的值小于0， 那么立即调用处理函数。
```c
if (jiffies <= 0)
	(fn)();
```

如果定时的值大于0， 那么首先取timer_list数组中寻找一个位置，将该位置上的滴答数设置为jiffies，将该位置上的fn设置为入参fn。并让next_timer指向它。
```c
for (p = timer_list ; p < timer_list + TIME_REQUESTS ; p++)
	if (!p->fn)
		break;
if (p >= timer_list + TIME_REQUESTS)
	panic("No more time requests free");
p->fn = fn;
p->jiffies = jiffies;
p->next = next_timer;
next_timer = p;
```

下面这段代码的作用是将刚刚插入链表中的timer移动的合适的位置。

由于next_timer这个链表上的jiffies是一个相对值，即相对于前面一个timer还有多久到期。因此上面步骤的timer也需要进行转换。

![timer移动示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-kernel/sched/add_timer.png)
```c
while (p->next && p->next->jiffies < p->jiffies) {
	p->jiffies -= p->next->jiffies;//减去下一个timer的jiffies
	fn = p->fn;//将当前的fn保存给临时变量
	p->fn = p->next->fn;//将当前的fn设置为下一个timer的fn
	p->next->fn = fn;//将下一个timer的fn设置为当前的fn
	jiffies = p->jiffies;//将jiffies保存给一个临时变量
	p->jiffies = p->next->jiffies;//将当前的jiffies设置为下一个timer的jiffies
	p->next->jiffies = jiffies;//将下一个timer的jiffies设置为当前的jiffies
	p = p->next;
	//这一步骤实际上将p向后挪动到合适的位置， 并把jiffies转化成相对值。
}
```

## do_timer
```c
void do_timer(long cpl)
```
该函数是时钟中断的处理函数。其在system_call.s中的timer_interrupt函数中被调用。

参数cpl表示的是当前的特权级， 0表示时钟中断发生时，当前运行在内核态，3表示时钟中断发生时，当前运行在用户态。

下面的代码根据cpl的值将进程PCB中的utime和stime进行修改。如果cpl为0，则增加stime(supervisor time)， 如果cpl为3， 则增加utime。

```c
if (cpl)
	current->utime++;
else
	current->stime++;
```

下面对定时器的链表进行遍历。 将链表的第一个定时器的滴答数减1。如果滴答数已经等于0， 代表该定时器已经到期，那么需要调用相应的处理程序进行处理。
```c
if (next_timer) {
	next_timer->jiffies--;
	while (next_timer && next_timer->jiffies <= 0) {
		void (*fn)(void);
		
		fn = next_timer->fn;
		next_timer->fn = NULL;
		next_timer = next_timer->next;
		(fn)();
	}
}
```

下面代码则是将当前运行的进程的时间片减去1，如果此时进程时间片没有用完，该函数则返回。 如果此时进程时间已经用完，则将时间片设置为0。并且如果此时cpl表明中断发生用户态，那么还将会触发进程的调度。
```c
if ((--current->counter)>0) return;
current->counter=0;
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
该函数用于获取进程的pid。

## sys_getppid
```c
int sys_getppid(void)
```
该函数用于获取父进程的pid。

## sys_getuid
```c
int sys_getuid(void)
```
该函数用于获取用户的uid。

## sys_geteuid
```c
int sys_geteuid(void)
```
该函数用于获取用户的有效id(euid)。

## sys_getgid
```c
int sys_getgid(void)
```
获取组和id号(gid)。

## sys_getegid
```c
int sys_getegid(void)
```
取有效的组id(egid)

## sys_nice
```c
int sys_nice(long increment)
```
该函数的作用是降低进程在调度时的优先级。

## sched_init
```c
void sched_init(void)
```

```c
outb_p(0x36,0x43);		/* binary, mode 3, LSB/MSB, ch 0 */
outb_p(LATCH & 0xff , 0x40);	/* LSB */
outb(LATCH >> 8 , 0x40);	/* MSB */
```
