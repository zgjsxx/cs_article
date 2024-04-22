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
- 1. 当系统中存在运行状态的进程，则比较所有的进程的counter，取出拥有最大的counter的进程继续执行。如果系统中所有运行状态的进程的counter都为0， 则重新调整所有进程的counter。并取出序号最小的运行状态的进程继续执行。
- 2. 当系统中不存在处于运行状态的进程，则切换0号进程运行。

读到这里，可以清晰的了解到Linux-0.11的进程切换算法是基于时间片和优先级结合的调度机制。

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

该函数与```sleep_on```类似，但是该函数会将任务的状态修改为**可中断的等待状态**， 而```sleep_on```则是将任务修改为**不可中断的等待状态**。因此通过```interruptible_sleep_on```而等待的task是可以被信号唤醒的。 而通过```sleep_on```而等待的task是**不会被信号唤醒的**，只能通过```wake_up```函数唤醒。

这个点在```schedule```方法中也可以看出，当进程状态是```TASK_INTERRUPTIBLE```，可以被信号唤醒。

```c
	if (((*p)->signal & ~(_BLOCKABLE & (*p)->blocked)) &&
	(*p)->state==TASK_INTERRUPTIBLE)
		(*p)->state=TASK_RUNNING;
```


![interruptible_sleep_on示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/interruptible_sleep_on.png)

下面这段代码与```sleep_on```并无太大区别， 只是将进程的状态修改为可中断的等待状态。

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

该函数的作用就是唤醒某一个任务。*p是任务等待队列的头指针。由于新的等待任务是插入在等待队列头指针处，因此唤醒的是最后进入等待队列的任务。

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

入参nr代表软驱号，其范围是（0-3）。因此程序的开始先进行参数的判断。

```c
    // 系统最多4个软驱。
	if (nr>3)
		panic("floppy_on: nr>3");
```

// 下面数组分别存放各软驱在马达停转之前需维持的时间。程序中设定为10000个滴答，1个滴答=1/100秒，因此是100秒。
```c
static int moff_timer[4]={0,0,0,0};
moff_timer[nr]=10000;		/* 100 s = very big :-) */
```

然后取当前DOR寄存器值到临时变量mask中，并把指定软驱的马达启动标志置位。

```c
	cli();				/* use floppy_off to turn it off */
	mask |= current_DOR;
    // 如果当前没有选择软驱，则首先复位其他软驱的选择位，然后置指定软驱选择位。
	if (!selected) {
		mask &= 0xFC;
		mask |= nr;
```

current_DOR定义如下所示：
```c
unsigned char current_DOR = 0x0C;       // 允许DMA中断请求、启动FDC
```

该寄存器每位的定义如下：
- 位7-4：分别控制驱动器D-A马达的启动。1-启动；0-关闭。
- 位3：1 - 允许DMA和中断请求；0 - 禁止DMA和中断请求。
- 位2：1 - 允许软盘控制器；0 - 复位软盘控制器。
- 位1-0：00-11，用于选择控制的软驱A-D。

```shell
+---------------+------+------+-------+
+   reg[7：4]   |reg[3]|reg[2]|reg[1:0|
+---------------+------+------+-------+
+    0000       +  1   +  1   +  00   +
+-------------------------------------+
```

因此current_DOR的含义是允许DMA中断请求、启动软盘控制器。

mask设置的1代表运行A马达的启动。

```c
unsigned char mask = 0x10 << nr;
```


如果数字输出寄存器的当前值与要求的值不同，则向FDC数字输出端口输出新值(mask)，

并且如果要求启动的马达还没有启动，则置相应软驱的马达启动定时器值(HZ/2 = 0.5秒，或50个滴答)。

若已经启动，则再设置启动定时为2个滴答，能满足下面```do_floppy_timer()```中先递减后判断的要求。执行本次定时代码的要求即可。此后更新当前数字输出寄存器```current_DOR```。

随后可以开启中断。

```c
	if (mask != current_DOR) {
		outb(mask,FD_DOR);
		if ((mask ^ current_DOR) & 0xf0)
			mon_timer[nr] = HZ/2;
		else if (mon_timer[nr] < 2)
			mon_timer[nr] = 2;
		current_DOR = mask;
	}
	sti();                      // 开中断
	return mon_timer[nr];       // 最后返回启动马达所需的时间值
```


### floppy_on
```c
void floppy_on(unsigned int nr)
```

该函数等待指定软驱马达启动所需时间。

等待指定软驱马达启动所需的一段时间，然后返回。设置指定软驱的马达启动到正常转速所需的延时，然后睡眠等待。在定时中断过程中会一直递减判断这里设定的延时值。当延时到期，就会唤醒这里的等待进程。

```c
	cli();                                  // 关中断
    // 如果马达启动定时还没到，就一直把当前进程置为不可中断睡眠状态并放入等待马达运行的队列中。
	while (ticks_to_floppy_on(nr))
		sleep_on(nr+wait_motor);
	sti();                                  // 开中断
```

floppy_on的执行过程如下图所示：

![floppy_on的执行过程](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/sched/floppy_on.png)

### floppy_off

```c
void floppy_off(unsigned int nr)
```

关闭相应的软驱马达停转定时器3s。

```c
moff_timer[nr]=3*HZ;
```

置关闭相应软驱马达停转定时器(3秒)。若不使用该函数明确关闭指定的软驱马达，则在马达开启100秒之后也会被关闭

### do_floppy_timer

```c
void do_floppy_timer(void)
```

软盘定时处理子程序。调用关系如下所示：

```shell
├── int 0x20
  └── timer_interrupt
	└── do_timer
		└── do_floppy_timer
```

更新马达启动定时值和马达关闭停转计时值。该子程序会在时钟定时中断过程中被调用，因此系统每经过一个滴答(10ms)就会被调用一次，随时更新马达开启或停转定时器
的值。如果某一个马达停转定时到，则将数字输出寄存器马达启动位复位。

```c
	int i;
	unsigned char mask = 0x10;

	for (i=0 ; i<4 ; i++,mask <<= 1) {
		if (!(mask & current_DOR))          // 如果不是DOR指定的马达则跳过。
			continue;
		if (mon_timer[i]) {                 // 如果马达启动定时到则唤醒进程。
			if (!--mon_timer[i])
				wake_up(i+wait_motor);
		} else if (!moff_timer[i]) {        // 如果马达停转定时到则复位相应马达，并更新数字输出寄存器
			current_DOR &= ~mask;
			outb(current_DOR,FD_DOR);
		} else
			moff_timer[i]--;                // 否则马达停转计时递减。
	}
```

如果有一个马达启动定时到则唤醒进程。

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

否则马达停转计时递减。

```c
  moff_timer[i]--;
```

### add_timer 

```c
add_timer(long jiffies, void (*fn)(void))
```

该函数的作用是设置定时值和相应的处理函数。

在了解```add_timer```方法之前，首先了解一下timer_list的结构。包含两个元素：
- jiffies 定时滴答数
- 定时处理函数

```c
static struct timer_list {
	long jiffies;                   // 定时滴答数
	void (*fn)();                   // 定时处理程序
	struct timer_list * next;       // 链接指向下一个定时器
} timer_list[TIME_REQUESTS], * next_timer = NULL;   // next_timer是定时器队列头指针
```

如果定时的值小于0， 那么立即调用处理函数。
```c
if (jiffies <= 0)
	(fn)();
```

如果定时的值大于0， 那么首先取```timer_list```数组中寻找一个位置，将该位置上的滴答数设置为```jiffies```，将该位置上的``fn```设置为入参fn。并让next_timer指向它。

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

由于```next_timer```这个链表上的jiffies是一个相对值，即相对于前面一个timer还有多久到期。因此上面步骤的timer也需要进行转换。

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

```jiffies```是指的是系统开机到目前经历的滴答数。

```current->alarm```的单位也是系统滴答数。

因此```(current->alarm - jiffies) /100``` 就代表就是当前的定时器还剩下多少秒。

而设置```alarm```值则需要加上系统当前的滴答数据```jiffies```， 如下图所示:

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

首先在```gdt```表中设置任务0的```tss```和```ldt```值。接着对其他任务的tss和ldt进行初始化。
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

下面这句话用于将EFLAGS的NT标志进行复位。
主要执行了三个指令：
- ```pushfl```：将标志寄存器（flags register）的内容（通常包括 CPU 状态标志，比如进位标志、零标志等）压入栈中。
- ```andl``` $0xffffbfff,(%esp)：将栈顶的值与 0xffffbfff 进行按位与运算。这个操作的目的是将 NT（Nested Task）标志位清零，0xffffbfff 是一个掩码，将 NT 位清零，其余位不变。
- ```popfl```：将修改后的标志寄存器的值弹出栈，并恢复到标志寄存器中。

```c
	__asm__("pushfl ; andl $0xffffbfff,(%esp) ; popfl");        // 复位NT标志
```

NT 标志是 x86 架构中的一个标志位，位于 EFLAGS 寄存器的第 14 位（从右往左数）。NT 标志用于指示 CPU 是否支持任务切换（task switching）功能。

EFLAGS还有一些其他标志位，如下所示：
- CF（Carry Flag）进位标志：用于处理无符号整数运算时的进位情况。
- PF（Parity Flag）奇偶标志：用于指示结果中包含的 1 的位数是否为偶数。
- AF（Adjust Flag）辅助进位标志：用于处理 BCD（Binary Coded Decimal）运算中的进位情况。
- ZF（Zero Flag）零标志：用于指示运算结果是否为零。
- SF（Sign Flag）符号标志：用于指示运算结果的符号（正或负）。
- TF（Trap Flag）陷阱标志：用于启用单步调试模式。
- IF（Interrupt Enable Flag）中断允许标志：用于控制外部中断的允许或禁止。
- DF（Direction Flag）方向标志：用于控制字符串操作的方向，比如向上或向下。
- OF（Overflow Flag）溢出标志：用于指示有符号整数运算是否发生了溢出。

下面的代码显式地将任务0的tss加载到寄存器tr中， 显式地将任务0的ldt加载到ldtr中。

```c
	ltr(0);
	lldt(0);
```

ltr和lldt的定义如下所示：

```c
#define ltr(n) __asm__("ltr %%ax"::"a" (_TSS(n)))
#define lldt(n) __asm__("lldt %%ax"::"a" (_LDT(n)))
```

```ltr(n)``` 宏：

这个宏用于加载任务状态段（TSS）的选择子，从而切换到新的任务上下文。

```"ltr %%ax"``` 是汇编指令，它将 AX 寄存器中的值加载到任务寄存器（Task Register，TR）中，从而指定新的 ```TSS```。

```::"a" (_TSS(n))``` 是输入限定符，指定了 AX 寄存器的值为 ```_TSS(n)```，```_TSS(n)``` 可能是一个宏，用于生成 TSS 的选择子值。

```lldt(n)``` 宏：

这个宏用于加载局部描述符表（LDT）的选择子，从而切换到新的 LDT。

```"lldt %%ax"``` 是汇编指令，它将 AX 寄存器中的值加载到局部描述符表寄存器（Local Descriptor Table Register, LDTR）中，从而指定新的 LDT。

```::"a" (_LDT(n))``` 是输入限定符，指定了 AX 寄存器的值为 ```_LDT(n)```，```_LDT(n)``` 可能是一个宏，用于生成 LDT 的选择子值。

下面的代码用于初始化8253定时器。通道0，选择工作方式3，二进制计数方式。

```c
// PC机8253定时芯片的输入时钟频率约为1.193180MHz. Linux内核希望定时器发出中断的频率是
// 100Hz，也即没10ms发出一次时钟中断。因此这里的LATCH是设置8253芯片的初值。
#define LATCH (1193180/HZ)
outb_p(0x36,0x43);		/* binary, mode 3, LSB/MSB, ch 0 */
outb_p(LATCH & 0xff , 0x40);	/* LSB */
outb(LATCH >> 8 , 0x40);	/* MSB */
```

```outb_p(0x36,0x43)```：

这一行向 I/O 端口地址 ```0x43``` 发送字节 ```0x36```。在 PC 架构中，```0x43``` 是 PIT 的控制寄存器端口，```0x36``` 是控制字节，用于配置 PIT 的工作模式。
0x36 中的不同位用于设置 PIT 的工作模式、计数值的读取方式（LSB/MSB）等。在这里，0x36 设置了二进制计数模式（binary mode）、工作模式 3（mode 3）、以及将计数值作为 LSB/MSB 分别写入的方式。

```outb_p(LATCH & 0xff , 0x40)```：

- 这一行向 I/O 端口地址 0x40 发送了 LATCH 的低字节（LSB）。
- LATCH 可能是一个宏或者变量，代表了 PIT 的计数值（定时器的计数器初始值）。在这里，& 0xff 用于确保只发送 LATCH 的低 8 位。

```outb(LATCH >> 8 , 0x40)```：

这一行向 I/O 端口地址 0x40 发送了 LATCH 的高字节（MSB）。```LATCH >> 8``` 是将 LATCH 向右移动 8 位，以获取其高字节部分。

综合起来，这段代码配置了 PIT 为二进制计数模式，工作模式 3，然后向 PIT 发送了计数器的初始值（分为低字节和高字节），从而开始了一个间隔定时器的计数。(PIT 是 Programmable Interval Timer 的缩写，中文意为可编程间隔定时器)


最后设置时钟中断处理程序的处理函数， 设置系统调用的中断处理函数。

```c
set_intr_gate(0x20,&timer_interrupt);
outb(inb_p(0x21)&~0x01,0x21);
set_system_gate(0x80,&system_call);
```