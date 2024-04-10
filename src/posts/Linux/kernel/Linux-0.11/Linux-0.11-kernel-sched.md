---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理sched.c详解](#linux-011-kernel目录进程管理schedc详解)
	- [模块简介](#模块简介)
	- [函数详解](#函数详解)
		- [schedule](#schedule)
		- [show\_task](#show_task)
		- [show\_stat](#show_stat)
		- [math\_state\_restore](#math_state_restore)
		- [sys\_pause](#sys_pause)
		- [sleep\_on](#sleep_on)
		- [interruptible\_sleep\_on](#interruptible_sleep_on)
		- [wake\_up](#wake_up)
		- [ticks\_to\_floppy\_on](#ticks_to_floppy_on)
		- [floppy\_on](#floppy_on)
		- [floppy\_off](#floppy_off)
		- [do\_floppy\_timer](#do_floppy_timer)
		- [add\_timer](#add_timer)
		- [do\_timer](#do_timer)
		- [sys\_alarm](#sys_alarm)
		- [sys\_getpid](#sys_getpid)
		- [sys\_getppid](#sys_getppid)
		- [sys\_getuid](#sys_getuid)
		- [sys\_geteuid](#sys_geteuid)
		- [sys\_getgid](#sys_getgid)
		- [sys\_getegid](#sys_getegid)
		- [sys\_nice](#sys_nice)
		- [sched\_init](#sched_init)


# Linux-0.11 kernel目录进程管理sched.c详解

## 模块简介

sched.c是内核中有关任务(进程调度管理的程序)，其中包括有关调度的基本函数(sleep_on()、wakeup()、schedule()等)以及一些简单的系统调用函数(比如getpid())。系统时钟中断处理函数do_timer()也被放置在本程序中。另外，为了便于软盘驱动器定时处理的编程，Linux也将有关软盘定时操作的几个函数放到了这里。

## 函数详解

### schedule

```c
void schedule(void)
```

schedule函数的基本功能可以分为两大块， 第一块是**检查task中的报警信息和信号**， 第二块则是**进行任务的调度**。

在第一块中，首先从任务数组的尾部任务开始，检查alarm是否小于当前系统滴答值，如果小于则代表alarm时间已经到期。将进程的signal中的SIGALARM位置1。

接着就看如果检查进程的信号中如果处理BLOCK位以外还有别的信号，并且如果任务处于可中断状态，则将任务置为就绪状态。

```c
int i,next,c;
struct task_struct ** p;

for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
    if (*p) {
        if ((*p)->alarm && (*p)->alarm < jiffies) { //如果设置了任务定时的值alarm， 并且已经过期
                (*p)->signal |= (1<<(SIGALRM-1)); //将信号的SIGALARM位置为1
                (*p)->alarm = 0;
            }
        if (((*p)->signal & ~(_BLOCKABLE & (*p)->blocked)) &&
        (*p)->state==TASK_INTERRUPTIBLE)//如果信号位图中除了被阻塞的信号外还有其他信号， 并且任务处于可中断状态
            (*p)->state=TASK_RUNNING; //修改任务的状态为就绪态
    }
```

第二块的代码就是任务调度的核心代码。

这里会从任务数组的尾部任务开始进行遍历，从所有任务从选取counter值最大的任务作为下一个运行的任务去执行。

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
	//如果当前没有RUNNING状态的任务的counter可以大于-1，那么则去更新counter的值，counter = counter/2 + priority
	for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
		if (*p)
			(*p)->counter = ((*p)->counter >> 1) +
					(*p)->priority;//更新counter值 counter = counter/2 + priority
}
//切换任务执行next
switch_to(next);
```

注意如果所有运行状态的任务时间片为0的时候，重新调整所有任务的时间片。这里的算法是```counter = counter/2 + priority```。

```c
	if (c) break;
	//如果当前没有RUNNING状态的任务的counter可以大于-1，那么则去更新counter的值，counter = counter/2 + priority
	for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
		if (*p)
			(*p)->counter = ((*p)->counter >> 1) +
					(*p)->priority;//更新counter值 counter = counter/2 + priority
```

总结起来：
1. 当系统中存在运行状态的进程，则比较所有的进程的counter，取出拥有最大的counter的进程继续执行。如果系统中所有运行状态的进程的counter都为0， 则重新调整所有进程的counter。并取出序号最小的运行状态的进程继续执行。
2. 当系统中不存在处于运行状态的进程，则切换0号进程运行。

最后梳理一下，哪些地方会调用到```schedule```：
- do_exit
- sys_waitpid
- sys_pause 
- sleep_on
- interruptible_sleep_on
- do_timer
- tty_write

### show_task

```c
void show_task(int nr,struct task_struct * p)
```

show_task方法在show_stat方法中被调用。调用关系如下：

```shell
├── func(keyboard.S)
  └── show_task
	└── do_timer
```

该函数的作用是显示任务序号为```nr```的进程的```pid```，进程状态以及内核栈剩余的大小。

```c
int i,j = 4096-sizeof(struct task_struct);

printk("%d: pid=%d, state=%d, ",nr,p->pid,p->state);
i=0;
```

此时j指向PCB所在内存页的顶部， i指向```task_struct```结构体的下一个字节。下面这段代码的所用实际就是统计内核栈中空闲大小。

![show_task](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/show_task.png)

```c
while (i<j && !((char *)(p+1))[i])
	i++;
printk("%d (of %d) chars free in kernel stack\n\r",i,j);
```

内核栈的位置是在fork.c中```copy_process```设置的。

### show_stat

```c
void show_stat(void)
```

该函数内部调用```show_task```函数，实际上就是遍历```task```数组， 调用```show_stat```函数显示进程相关信息。

```c
int i;

for (i=0;i<NR_TASKS;i++)//遍历task数组
	if (task[i])
		show_task(i,task[i]);//调用show_task
```

### math_state_restore

```c
void math_state_restore()
```

该方法的调用层级如下所示：

```shell
├── int 0x7
  └── device_not_available
	└── math_state_restore
```

该函数的作用是将当前协处理器内容保存到老协处理器状态数组中，并将当前任务的协处理器内容加载进协处理器。

这个条件判断检查上一个使用数学协处理器的任务是否与当前任务相同。如果是，则说明上一个任务就是当前任务，不需要进行任何操作，直接返回。这是一种优化，避免在不必要的情况下重复保存和恢复数学协处理器的状态。

```c
if (last_task_used_math == current)
    return;
```

```fwait``` 指令是协处理器指令，用于确保之前的协处理器操作已经完成。在发送新的协处理器指令之前，必须确保之前的操作已经完成。

如果上一个任务使用了数学协处理器，则使用 ```fnsave``` 指令保存其协处理器状态到该任务的 ```tss.i387``` 结构中。```fnsave``` 指令将协处理器的状态保存到内存中。

```c
__asm__("fwait");

if (last_task_used_math) {
    __asm__("fnsave %0"::"m" (last_task_used_math->tss.i387));
}
```

更新 ```last_task_used_math``` 指针，指向当前任务。这是为了在下一次调用时，可以知道上一个使用数学协处理器的任务是哪一个。

如果当前任务曾经使用过数学协处理器，则使用 ```frstor``` 指令从任务的 ```tss.i387``` 结构中恢复其协处理器状态。```frstor``` 指令从内存中加载协处理器的状态。

如果当前任务是第一次使用数学协处理器，则使用 ```fninit``` 指令向协处理器发送初始化命令，并设置当前任务的 used_math 标志为 1，表示该任务已经使用了数学协处理器。

```c
	last_task_used_math=current;
	if (current->used_math) {
		__asm__("frstor %0"::"m" (current->tss.i387));
	} else {
		__asm__("fninit"::);        // 向协处理器发初始化命令
		current->used_math=1;       // 设置已使用协处理器标志
	}
```

### sys_pause

```c
int sys_pause(void)
```

该函数是```pause```的系统调用。该函数会将当前任务的状态修改为可中断的状态， 并调用```schedule```函数去进行进程的调度。

调用```pause```函数的进程会进入睡眠状态， 直到收到一个信号。

```c
current->state = TASK_INTERRUPTIBLE;
schedule();
```

### sleep_on

```c
void sleep_on(struct task_struct **p)
```

该函数的作用是将当前的task置为**不可中断的等待状态**， 直到被```wake_up```唤醒再继续执行。入参p是等待任务队列的头指针。通过p指针和tmp变量将等待的任务串在了一起。

![sleep_on示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/sleep_on.png)

该函数首先对一些异常情况进行了处理他， 例如p是空指针。或者当前task是任务0。

```c
struct task_struct *tmp;

// 若指针无效，则退出。（指针所指的对象可以是NULL，但指针本身不会为0)。
if (!p)
	return;
if (current == &(init_task.task))	// 如果当前任务是任务0，则死机(impossible!)。
	panic ("task[0] trying to sleep");
```

接着让当前等待任务的头指针指向当前任务。并将当前任务修改为**不可中断的等待状态**。进行调用schedule函数让操作系统切换其他任务执行。

```c
tmp = *p;
*p = current;
current->state = TASK_UNINTERRUPTIBLE;
schedule();	
```

当程序从```schedule```返回继续执行时，说明任务已经被显式的```wake_up```，如果此时还有其他进程仍然在等待，那么也一同唤醒。

因为任务都在等待同样的资源， 那么当资源可用的时候， 就可以唤醒所有等待的任务。

```c
if (tmp)			// 若还存在等待的任务，则也将其置为就绪状态（唤醒）。
	tmp->state = 0;
```

这里的将```tmp->state = 0```具有传递性，如果当前进程被唤醒，则将```sleep```链的下一个进程唤醒。当CPU执行到下一个进程时，又会将再下一个进程的状态状态改为运行态，以此类推。

### interruptible_sleep_on 

```c
void interruptible_sleep_on (struct task_struct **p)
```

该函数与```sleep_on```类似，但是该函数会将任务的状态修改为**可中断的等待状态**， 而sleep_on则是将任务修改为**不可中断的等待状态**。因此通过interruptible_sleep_on而等待的task是可以被信号唤醒的。 而通过sleep_on而等待的task是**不会被信号唤醒的**，只能通过wake_up函数唤醒。

![interruptible_sleep_on示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/interruptible_sleep_on.png)

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

由于任务是可以被信号唤醒的，因此下面需要判断唤醒的任务是否是等待任务队列的头节点。如果不是则需要等待其他任务。

```c
if (*p && *p != current)
{
	(**p).state = 0;
	goto repeat;
}
```

下面一句代码有误，应该是```*p = tmp```，让队列头指针指向其余等待任务，否则在当前任务之前插入
等待队列的任务均被抹掉了

```c
*p = NULL;
if (tmp)
	tmp->state = 0;
```

### wake_up

```c
void wake_up(struct task_struct **p)
```

该函数的作用就是唤醒某一个任务。其用于唤醒p指向的等待队列中的任务。


```c
if (p && *p)
{
	(**p).state = 0;		// 置为就绪（可运行）状态。
	*p = NULL;
}
```

### ticks_to_floppy_on

```c
int ticks_to_floppy_on(unsigned int nr)
```

该函数指定软盘到正常运转状态所需延迟滴答数（时间）。

### floppy_on
```c
void floppy_on(unsigned int nr)
```

该函数等待指定软驱马达启动所需时间。

### floppy_off

```c
void floppy_off(unsigned int nr)
```

关闭相应的软驱马达停转定时器3s。

```c
moff_timer[nr]=3*HZ;
```

### do_floppy_timer
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

### add_timer 
```c
add_timer(long jiffies, void (*fn)(void))
```、
该函数的作用是设置定时值和相应的处理函数。

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

![timer移动示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/add_timer.png)
```c
while (p->next && p->next->jiffies < p->jiffies) {
	p->jiffies -= p->next->jiffies;//减去下一个timer的jiffies
	fn = p->fn;//将当前的fn保存给临时变量
	p->fn = p->next->fn;//将当前的fn设置为下一个timer的fn
	p->next->fn = fn;//将下一个timer的fn设置为临时变量fn
	jiffies = p->jiffies;//将jiffies保存给一个临时变量
	p->jiffies = p->next->jiffies;//将当前的jiffies设置为下一个timer的jiffies
	p->next->jiffies = jiffies;//将下一个timer的jiffies设置为当前的jiffies
	p = p->next;
	//这一步骤实际上将p向后挪动到合适的位置， 并把jiffies转化成相对值。
}
```

### do_timer

```c
void do_timer(long cpl)
```

该函数是时钟中断的处理函数。其在system_call.s中的timer_interrupt函数中被调用。调用层级如下所示：

```shell
├── int 0x20
  └── timer_interrupt
	└── do_timer
```

参数```cp```表示的是当前的特权级， 0表示时钟中断发生时，当前运行在内核态，3表示时钟中断发生时，当前运行在用户态。

程序的开始判断扬声器发生次数是否已经到。如果到了，就停止发声。

```c
	extern int beepcount;               // 扬声器发声滴答数
	extern void sysbeepstop(void);      // 关闭扬声器。

    // 如果发声计数次数到，则关闭发声。(向0x61口发送命令，复位位0和1，位0
    // 控制8253计数器2的工作，位1控制扬声器)
	if (beepcount)
		if (!--beepcount)
			sysbeepstop();
```

这里代码似乎可以简化为

```c
if(beepcount == 1) {
	--beepcount;
	sysbeepstop();
	}
```

```sysbeepstop```定义在```console.c```中，向```0x61```口发送命令，复位位0和1，即```0xFC = 11111100```，位0控制8253计数器2的工作，位1控制扬声器)

```c
void sysbeepstop(void)
{
	/* disable counter 2 */
	outb(inb_p(0x61)&0xFC, 0x61);
}
```

下面的代码根据```cpl```的值将进程PCB中的```utime```和```stime```进行修改。如果```cpl```为0，则增加stime(supervisor time)， 如果```cpl```为3， 则增加```utime```。

```c
if (cpl)
	current->utime++;
else
	current->stime++;
```

下面对定时器的链表进行遍历。 将链表的第一个定时器的滴答数减1。如果滴答数已经等于0， 代表该定时器已经到期，那么需要调用相应的处理程序进行处理。定时器是会在```add_timer```被创建。

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

### sys_alarm
```c
int sys_alarm(long seconds)
```

该函数用于设置**报警值**。

jiffies是指的是系统开机到目前经历的滴答数。

current->alarm的单位也是系统滴答数。

因此(current->alarm - jiffies) /100 就代表就是当前的定时器还剩下多少秒。

而设置alarm值则需要加上系统当前的滴答数据jiffies， 如下图所示:

![sys_alarm](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/sys_alarm.png)


### sys_getpid
```c
int sys_getpid(void)
```
该函数用于获取进程的pid。

### sys_getppid
```c
int sys_getppid(void)
```
该函数用于获取父进程的pid。

### sys_getuid
```c
int sys_getuid(void)
```
该函数用于获取用户的uid。

### sys_geteuid
```c
int sys_geteuid(void)
```
该函数用于获取用户的有效id(euid)。

### sys_getgid
```c
int sys_getgid(void)
```
获取组和id号(gid)。

### sys_getegid
```c
int sys_getegid(void)
```
取有效的组id(egid)

### sys_nice
```c
int sys_nice(long increment)
```
该函数的作用是降低进程在调度时的优先级。

### sched_init
```c
void sched_init(void)
```
该函数的作用是初始化进程调度模块。

首先在gdt表中设置任务0的tss和ldt值。接着对其他任务的tss和ldt进行初始化。
```c
set_tss_desc(gdt+FIRST_TSS_ENTRY,&(init_task.task.tss));
set_ldt_desc(gdt+FIRST_LDT_ENTRY,&(init_task.task.ldt));
p = gdt+2+FIRST_TSS_ENTRY;
for(i=1;i<NR_TASKS;i++) {
	task[i] = NULL;
	p->a=p->b=0;
	p++;
	p->a=p->b=0;
	p++;
}
```

显式地将任务0的tss加载到寄存器tr中， 显式地将任务0的ldt加载到ldtr中。

```c
ltr(0);
lldt(0);
```

下面的代码用于初始化8253定时器。通道0，选择工作方式3，二进制计数方式。
```c
outb_p(0x36,0x43);		/* binary, mode 3, LSB/MSB, ch 0 */
outb_p(LATCH & 0xff , 0x40);	/* LSB */
outb(LATCH >> 8 , 0x40);	/* MSB */
```

设置时钟中断处理程序的处理函数， 设置系统调用的中断处理函数。
```c
set_intr_gate(0x20,&timer_interrupt);
outb(inb_p(0x21)&~0x01,0x21);
set_system_gate(0x80,&system_call);
```