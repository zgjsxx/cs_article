---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 入口函数main.c详解

## 模块简介
main.c大部分代码主要是对内核进行初始化，而main.c开始，就都是c语言编写的内核了。
## 函数详解

### time_init
```c
static void time_init(void)
```
该函数读取CMOS时钟信息作为系统的开机时间。

```c
	struct tm time;

	do {
		time.tm_sec = CMOS_READ(0);//当前的秒数
		time.tm_min = CMOS_READ(2);//当前分钟值
		time.tm_hour = CMOS_READ(4);//当前小时数
		time.tm_mday = CMOS_READ(7);//当前的天数
		time.tm_mon = CMOS_READ(8);//当前的月份
		time.tm_year = CMOS_READ(9);//当前的年份
	} while (time.tm_sec != CMOS_READ(0));
	BCD_TO_BIN(time.tm_sec); //转换成二进制数值
	BCD_TO_BIN(time.tm_min);
	BCD_TO_BIN(time.tm_hour);
	BCD_TO_BIN(time.tm_mday);
	BCD_TO_BIN(time.tm_mon);
	BCD_TO_BIN(time.tm_year);
	time.tm_mon--;
	startup_time = kernel_mktime(&time);//调用kernel_mktime构建时间，详情参考Linux-0.11 kernel目录mktime.c详解
```

### main
```c
void main(void)	
```
在head.s中会跳转main函数中进行执行。

```c
if (memory_end > 16*1024*1024)
    memory_end = 16*1024*1024;
if (memory_end > 12*1024*1024) 
    buffer_memory_end = 4*1024*1024;
else if (memory_end > 6*1024*1024)
    buffer_memory_end = 2*1024*1024;
else
    buffer_memory_end = 1*1024*1024;
```

接下来就是对各个模块进行初始化。其内容在具体的模块都有讲解，这里不再赘述。在这最后，会重新打开中断。
```c
	mem_init(main_memory_start,memory_end);
	trap_init();
	blk_dev_init();
	chr_dev_init();
	tty_init();
	time_init();
	sched_init();
	buffer_init(buffer_memory_end);
	hd_init();
	floppy_init();
	sti();
```

接下来，将切换到用户态去执行进程0。
```c
	move_to_user_mode();
	if (!fork()) {		/* we count on this going ok */
		init();
	}
```

在分析move_to_user_mode，我们回顾一下sched_init函数中和进程0相关的部分。

在sched_init函数中设置了进程0的ldt和tss。其中ldt部分的定义如下：

```c
    //ldt
	{ \
        {0,0}, \
        {0x9f,0xc0fa00}, \
		{0x9f,0xc0f200}, \
	}, \
```

其中代码段为{0x0000009f,0x00c0fa00}， 数据段为{0x0000009f,0x00c0f200}

接下来我们依次分析。

首先是代码段，{0x0000009f,0x00c0fa00}， 翻译成二进制,注意是按照小端序列，如下所示：
```c
63-48:00000000 11000000
47-32:11111010 00000000
31-16:00000000 00000000
15-00:00000000 10011111
```

按照段描述符的定义，代码段的分析结果如下
:
段基址:00000000 00000000 00000000 00000000
段限长:0x009f * 4k


接下来是数据段，{0x0000009f,0x00c0f200}， 翻译成二进制,注意是按照小端序列，如下所示：
```c
63-48:00000000 11000000
47-32:11110010 00000000
31-16:00000000 00000000
15-00:00000000 10011111
```
按照段描述符的定义，数据段的分析结果如下

段基址:00000000 00000000 00000000 00000000
段限长:0x009f * 4k

由此可以看出，进程0的代码段和数据段都映射到线性地址为0处。

数据段和代码段唯一不同的是TYPE字段不同，代码段是1010，代表是代码段，其可读可执行。数据段是0010，代表数据段，且可读可写。

因此sched_init为这里切换进程0到用户态执行打下了铺垫。

下面我们就来看move_to_user_mode， 其定义如下：

```c
#define move_to_user_mode() \
__asm__ ("movl %%esp,%%eax\n\t" \
	"pushl $0x17\n\t" \
	"pushl %%eax\n\t" \
	"pushfl\n\t" \
	"pushl $0x0f\n\t" \
	"pushl $1f\n\t" \
	"iret\n" \
	"1:\tmovl $0x17,%%eax\n\t" \
	"movw %%ax,%%ds\n\t" \
	"movw %%ax,%%es\n\t" \
	"movw %%ax,%%fs\n\t" \
	"movw %%ax,%%gs" \
	:::"ax")
```

看到其中使用了iret指令，因此这里其实是模拟了一个中断的压栈情况。其效果就是在iret返回时，使得ss=0x17,cs=0x0f
![move_to_user_mode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-init/move_to_user_mode.png)

接着通过movw指令，将ds、es、fs、gs都设置为0x17。

通过这一番操作，这些寄存器中的DPL都是3了，也就是用户态了。因此，可以这样总结，move_to_user_mode实际就是将cs/ds/es/fs/gs/ss 都设置为用户态的值。

在这最后，进程0开始fork出进程1， 而自己则进入pause，因此进程0又被称为idle进程。
```c
	if (!fork()) {		/* we count on this going ok */
		init();
	}
	for(;;) pause();
```

### init
```c
void init(void)
```
init进程是系统中真正的第一个进程。

```c
	int pid,i;
	setup((void *) &drive_info);
```


```c
	(void) open("/dev/tty0",O_RDWR,0);
	(void) dup(0);
	(void) dup(0);
	printf("%d buffers = %d bytes buffer space\n\r",NR_BUFFERS,
		NR_BUFFERS*BLOCK_SIZE);
	printf("Free mem: %d bytes\n\r",memory_end-main_memory_start);
```


执行shell程序，加载/etc/rc
```c
	if (!(pid=fork())) {
		close(0);
		if (open("/etc/rc",O_RDONLY,0))
			_exit(1);
		execve("/bin/sh",argv_rc,envp_rc);
		_exit(2);
	}
```

```c
	if (pid>0)
		while (pid != wait(&i))
			/* nothing */;
```

```c
	while (1) {
		if ((pid=fork())<0) {
			printf("Fork failed in init\r\n");
			continue;
		}
		if (!pid) {
			close(0);close(1);close(2);
			setsid();
			(void) open("/dev/tty0",O_RDWR,0);
			(void) dup(0);
			(void) dup(0);
			_exit(execve("/bin/sh",argv,envp));
		}
		while (1)
			if (pid == wait(&i))
				break;
		printf("\n\rchild %d died with code %04x\n\r",pid,i);
		sync();
	}
	_exit(0);	/* NOTE! _exit, not exit() */
```
## Q & A