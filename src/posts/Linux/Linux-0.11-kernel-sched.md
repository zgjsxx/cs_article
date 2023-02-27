---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理sched.c详解

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


```c
while (1) {
	c = -1;
	next = 0;
	i = NR_TASKS;
	p = &task[NR_TASKS];//从最后一个任务开始
	while (--i) { //遍历所有的task， 取出其中counter最大的task
		if (!*--p)
			continue;
		if ((*p)->state == TASK_RUNNING && (*p)->counter > c)
			c = (*p)->counter, next = i;
	}
	if (c) break;
	for(p = &LAST_TASK ; p > &FIRST_TASK ; --p)
		if (*p)
			(*p)->counter = ((*p)->counter >> 1) +
					(*p)->priority;//更新counter值
}
switch_to(next);
```


## sys_pause
```c
int sys_pause(void)
```


## sleep_on
```c
void sleep_on(struct task_struct **p)
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