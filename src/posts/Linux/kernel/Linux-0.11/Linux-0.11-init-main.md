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

### main

```c
void main(void)	
```

在head.s中会跳转main函数中进行执行。

main函数的开始定义了一些数据，包含了根设备的设备号，硬盘参数表信息，最大内存地址。

```c
#define EXT_MEM_K (*(unsigned short *)0x90002)
#define DRIVE_INFO (*(struct drive_info *)0x90080)
#define ORIG_ROOT_DEV (*(unsigned short *)0x901FC)

 	ROOT_DEV = ORIG_ROOT_DEV;
 	drive_info = DRIVE_INFO;        // 复制0x90080处的硬盘参数
	memory_end = (1<<20) + (EXT_MEM_K<<10);     // 内存大小=1Mb + 扩展内存(k)*1024 byte
	memory_end &= 0xfffff000;                   // 忽略不到4kb(1页)的内存数
```

这里需要回忆一下，setup.s中所建立的一些数据：

|内存地址|长度(字节)|名称|描述|
|--|--|--|--|
|0x90002|2|扩展内存数|系统从1MB开始的扩展内存数值|
|0x90080|16|硬盘参数表|第1个硬盘的参数表|
|0x90090|16|硬盘参数表|第2个硬盘的参数表|
|0x901FC|2|根设备号|根文件系统所在的设备号(bootsect.s设置)|

根设备信息号从```0x901fc```处获取，第一块硬盘的信息从```0x90080```处获取，扩展内存的数量从```0x90002```处获取。

这里根据设备总内存的大小决定高速缓存的位置。此外如果定义了虚拟盘```RAMDISK```，还需要预留一块内存。

```c
if (memory_end > 16*1024*1024)
    memory_end = 16*1024*1024;
if (memory_end > 12*1024*1024) 
    buffer_memory_end = 4*1024*1024;
else if (memory_end > 6*1024*1024)
    buffer_memory_end = 2*1024*1024;
else
    buffer_memory_end = 1*1024*1024;
#ifdef RAMDISK
	main_memory_start += rd_init(main_memory_start, RAMDISK*1024);
#endif
```

这样定义好的内存各个模块的作用如下图所示：

![memory-area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-init/memory-area.png)

接下来就是对各个模块进行初始化。其内容在具体的模块都有讲解，这里不再赘述。

各个模块的初始化完毕之后，就可以重新打开中断了。

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

在分析```move_to_user_mode```之前，我们需要看一下```sched_init```函数中和进程0相关的部分。

由于后面的0号进程是用户态进程，因此```sched_init```中设置了LDTR寄存器的值。 LDTR寄存器的高13位代表位于GDTR中的索引。进程0的LDT位于GDT表中的第5项，因此索引为LDTR=(5<<3)。进程n的LDTR的位置是(5<<3) + (2n << 3)， 因为LDT和TSS是交替存放的，所以需要n需要乘以2。

```c
#define FIRST_TSS_ENTRY 4
#define FIRST_LDT_ENTRY (FIRST_TSS_ENTRY+1)
#define _LDT(n) ((((unsigned long) n)<<4)+(FIRST_LDT_ENTRY<<3))
#define lldt(n) __asm__("lldt %%ax"::"a" (_LDT(n)))

sched_init(){
	...
	lldt(0);
	...
}
```
设置完LDTR寄存器之后，下面要设置的就是LDT项的内容。

在```sched_init```函数中设置了进程0的```ldt```和```tss```。其中```ldt```部分的定义如下：

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

```shell
63-48:00000000 11000000
47-32:11111010 00000000
31-16:00000000 00000000
15-00:00000000 10011111
```

按照段描述符的定义，代码段的分析结果如下:

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

有了这些铺垫之后，下面就可以通过```move_to_user_mode```切换到用户态了，其定义如下：

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

看到其中使用了```iret```指令，因此这里其实是模拟了一个中断的压栈情况。其效果就是在```iret```返回时，使得```ss=0x17,cs=0x0f```

![move_to_user_mode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-init/move_to_user_mode.png)

接着通过```movw```指令，将```ds```、```es```、```fs```、```gs```都设置为```0x17```。

这里解释一下```0x17```和```0x0f```, 这两个段描述符的共性是都代码用户态，且位于LDT表中。 区别是0x17位于LDT表的第2项，即数据段，0x0f位于LDT表的第1项，即代码段。(此前```cs = 0x08```, ```ss = 0x10```,代表内核态)。

```shell
0x17 = 00010_1_11
0x0f = 00001_1_11
```

通过这一番操作，这些寄存器中的DPL都是3了，也就是用户态了。因此，可以这样总结，```move_to_user_mode```实际就是将```cs/ds/es/fs/gs/ss``` 都设置为用户态的值。

在这最后，进程0开始fork出进程1(init进程)， 而自己则进入pause，因此进程0又被称为idle进程。

```c
	if (!fork()) {		/* we count on this going ok */
		init();
	}
	for(;;) pause();
```

关于init进程所做的事情，可以参考下文。

### init

```c
void init(void)
```

init进程是系统中真正的第一个进程。

setup()是一个系统调用。用于读取硬盘参数包括分区表信息并加载虚拟盘(若存在的话)和安装根文件系统设备。该函数用25行上的宏定义，对应函数是sys_setup()，在块设备子目录kernel/blk_drv/hd.c中。

```c
	int pid,i;
	setup((void *) &drive_info);
```

下面以读写访问方式打开设备```/dev/tty0```,它对应终端控制台。由于这是第一次打开文件操作，因此产生的文件句柄号(文件描述符)肯定是0。该句柄是UNIX类操作系统默认的控制台标准输入句柄stdin。这里再把它以读和写的方式别人打开是为了复制产生标准输出(写)句柄stdout和标准出错输出句柄stderr。函数前面的"(void)"前缀用于表示强制函数无需返回值。

```c
	(void) open("/dev/tty0",O_RDWR,0);
	(void) dup(0);
	(void) dup(0);
	printf("%d buffers = %d bytes buffer space\n\r",NR_BUFFERS,
		NR_BUFFERS*BLOCK_SIZE);
	printf("Free mem: %d bytes\n\r",memory_end-main_memory_start);
```

创建子进程并执行 ```/etc/rc``` 脚本，以初始化系统。如果子进程创建或执行失败，则打印错误信息并退出。

```c
	if (!(pid=fork())) {
		close(0);
		if (open("/etc/rc",O_RDONLY,0))
			_exit(1);
		execve("/bin/sh",argv_rc,envp_rc);
		_exit(2);
	}
```

下面还是父进程(1)执行语句。wait()等待子进程停止或终止，返回值应是子进程的进程号(pid)。这三句的作用是父进程等待子进程的结束。&i是存放返回状态信息的位置。如果wait()返回值不等于子进程号，则继续等待。

```c
	if (pid>0)
		while (pid != wait(&i))
			/* nothing */;
```

如果执行到这里，说明刚创建的子进程的执行已停止或终止了。下面循环中首先再创建一个子进程，如果出错，则显示“初始化程序创建子进程失败”信息并继续执行。对于所创建的子进程将关闭所有以前还遗留的句柄(stdin, stdout, stderr),新创建一个会话并设置进程组号，然后重新打开/dev/tty0作为stdin,并复制成stdout和sdterr.再次执行系统解释程序/bin/sh。但这次执行所选用的参数和环境数组另选了一套。然后父进程再次运行wait()等待。如果子进程又停止了执行，则在标准输出上显示出错信息“子进程pid挺直了运行，返回码是i”,然后继续重试下去....，形成一个“大”循环。此外，wait()的另外一个功能是处理孤儿进程。如果一个进程的父进程先终止了，那么这个进程的父进程就会被设置为这里的init进程(进程1)，并由init进程负责释放一个已终止进程的任务数据结构等资源。

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

得注意的是，这段代码在退出时使用 _exit(0) 而不是 exit()。这是因为 _exit() 是一个系统调用，直接终止进程，而 exit() 则是一个库函数，会执行一系列清理操作后再调用 _exit() 终止进程。

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

从 CMOS 中读取秒、分、时、日、月、年等时间信息。由于 CMOS 读取速度较慢，为了减少时间误差，在读取所有时间值后，如果此时 CMOS 中秒值发生了变化，就重新读取所有值，以确保时间的准确性。

随后将读取的时间值从BCD码转换为二进制。调整月份的值，因为在结构体中月份的范围通常是 0 到 11。使用 kernel_mktime 函数计算开机时间，并将结果存储在 startup_time 变量中。这样，系统就能够根据 CMOS 中的时间信息初始化系统时间。

在读取时间时，使用到了```CMOS_READ```方法。

```c
#define CMOS_READ(addr) ({ \
	outb_p(0x80|addr,0x70); \
	inb_p(0x71); \
})
```

这段代码是一个宏定义，用于读取 CMOS 芯片中的数据。让我们来解释一下这个宏的具体作用：

- CMOS_READ(addr) 宏接受一个参数 addr，代表要读取的 CMOS 地址。
- 宏定义的主体部分包含了两条指令：
  - outb_p(0x80|addr, 0x70);：向端口 0x70 中写入一个值，该值是地址 addr 的基础上加上 0x80。这告诉 CMOS 芯片我们要读取的地址。
  - inb_p(0x71);：从端口 0x71 中读取一个字节的数据，该数据就是 CMOS 芯片中指定地址的内容。
- 大括号 {} 中的内容表示这个宏的返回值，即执行完以上两条指令后，会返回从 CMOS 芯片中读取的数据。

0x70和0x71是用于访问CMOS寄存器的两个I/O端口。通常情况下，向0x70端口写入要访问的CMOS寄存器地址，然后从0x71端口读取或写入数据。而0x80是CMOS芯片中的寄存器地址的基地址偏移，通过将其与要读取或写入的寄存器地址相加，可以将读取或写入的地址传递给CMOS芯片。

程序中还是用了```BCD_TO_BIN```将 BCD（Binary-Coded Decimal）码表示的数字转换为二进制表示的数字。

```c
#define BCD_TO_BIN(val) ((val)=((val)&15) + ((val)>>4)*10)
```

在BCD码中，一个字节中的高四位表示十进制数的十位，低四位表示个位。因此，需要将这个BCD码转换为对应的十进制数。

这个宏定义中的操作如下：

- ```((val) & 15)```：通过与操作符 & 和掩码 15（二进制表示为00001111）获取BCD码的低四位（个位）所对应的值。
- ```((val) >> 4) * 10```：通过右移操作符 >> 将BCD码的高四位（十位）移到低四位，然后乘以10，得到十进制数的十位所对应的值。
- ```((val) & 15) + ((val) >> 4) * 10```：将个位和十位的值相加，得到十进制数的整体值。

最终，将这个计算结果赋值给 val，从而完成了BCD码到二进制数的转换。关于BCD码可以Q&A。

## Q & A

1. 什么是BCD码？

BCD（Binary-Coded Decimal）码是一种数字编码系统，用于将十进制数字表示为二进制形式。在BCD码中，每个十进制数位用四位二进制数来表示，通常每个十进制数位的取值范围为0到9。

举例来说，十进制数 73 的BCD码表示为 0111 0011，其中高四位（0111）表示十位数 7，低四位（0011）表示个位数 3。

BCD码与二进制码不同之处在于，BCD码是直接对十进制数位进行编码，而不像纯粹的二进制码一样对整数进行编码。这种编码方式使得BCD码在数字处理中更易于理解和处理，特别是在需要进行精确计算或与人类数学习惯相匹配的应用中。