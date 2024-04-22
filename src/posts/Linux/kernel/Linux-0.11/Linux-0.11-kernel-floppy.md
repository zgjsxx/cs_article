---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录floppy.c详解](#linux-011-kernel目录floppyc详解)
	- [模块简介](#模块简介)
	- [函数详解](#函数详解)
		- [floppy\_deselect](#floppy_deselect)
		- [floppy\_change](#floppy_change)
		- [setup\_DMA](#setup_dma)
		- [output\_byte](#output_byte)
		- [result](#result)
		- [bad\_flp\_intr](#bad_flp_intr)
		- [rw\_interrupt](#rw_interrupt)
		- [setup\_rw\_floppy](#setup_rw_floppy)
		- [seek\_interrupt](#seek_interrupt)
		- [transfer](#transfer)
		- [recal\_interrupt](#recal_interrupt)
		- [unexpected\_floppy\_interrupt](#unexpected_floppy_interrupt)
		- [recalibrate\_floppy](#recalibrate_floppy)
		- [reset\_interrupt](#reset_interrupt)
		- [reset\_floppy](#reset_floppy)
		- [floppy\_on\_interrupt](#floppy_on_interrupt)
		- [do\_fd\_request](#do_fd_request)
	- [floppy\_init](#floppy_init)

# Linux-0.11 kernel目录floppy.c详解

## 模块简介

程序的开始定义了软盘的结构。软盘参数有：
- size：大小，扇区数
- sect：每磁道扇区数
- head：磁头数
- track： 磁道数/柱面数
- stretch: 对磁道是否要特殊处理
- gap：扇区间隙长度
- rate 数据传输速率，0表示500kbps， 1表示300kbps， 2表示250kbps。
- specl 参数(高4位步进速率，f=1ms， e=2ms， d=3ms。低4为磁头卸载时间， 1=16ms， 2=32ms)

```c
static struct floppy_struct {
	unsigned int size, sect, head, track, stretch;
	unsigned char gap,rate,spec1;
} floppy_type[] = {
	{    0, 0,0, 0,0,0x00,0x00,0x00 },	/* no testing */
	{  720, 9,2,40,0,0x2A,0x02,0xDF },	/* 360kB PC diskettes */
	{ 2400,15,2,80,0,0x1B,0x00,0xDF },	/* 1.2 MB AT-diskettes */
	{  720, 9,2,40,1,0x2A,0x02,0xDF },	/* 360kB in 720kB drive */
	{ 1440, 9,2,80,0,0x2A,0x02,0xDF },	/* 3.5" 720kB diskette */
	{  720, 9,2,40,1,0x23,0x01,0xDF },	/* 360kB in 1.2MB drive */
	{ 1440, 9,2,80,0,0x23,0x01,0xDF },	/* 720kB in 1.2MB drive */
	{ 2880,18,2,80,0,0x1B,0x00,0xCF },	/* 1.44MB diskette */
};
```

## 函数详解

### floppy_deselect

```c
void floppy_deselect(unsigned int nr)
```

该函数的作用是取消指定软驱。

首先判断指定的软驱nr有没有被选中，如果没有被选中，则显示警告信息。

```c
	if (nr != (current_DOR & 3))
		printk("floppy_deselect: drive not selected\n\r");
```

这里再回顾一下```current_DOR```的作用。

```c
// 位7-4：分别控制驱动器D-A马达的启动。1-启动；0-关闭。
// 位3：1 - 允许DMA和中断请求；0 - 禁止DMA和中断请求。
// 位2：1 - 允许软盘控制器；0 - 复位软盘控制器。
// 位1-0：00-11，用于选择控制的软驱A-D。
unsigned char current_DOR = 0x0C;       // 允许DMA中断请求、启动FDC
```

接下来复位软驱已选定标志selected，并唤醒等待选择该软驱的任务。

```c
	selected = 0;
	wake_up(&wait_on_floppy_select);
```

### floppy_change

```c
int floppy_change(unsigned int nr)
```

该方法用于检测指定软驱中软盘的更换情况。

首先启动等待指定软驱nr。

在软盘启动之后，我们来查看一下当前选择的软驱是不是函数参数指定的软驱nr，并且已经选定了其他软驱，则让当前任务进入可中断等待状态。

如果当前没有选择其他软驱或者其他软驱被取消选定而使当前任务被唤醒时，当前软驱仍然不是指定的软驱nr，则跳转到函数开始处重新循环等待。

```c
repeat:
	floppy_on(nr);
	while ((current_DOR & 3) != nr && selected)
		interruptible_sleep_on(&wait_on_floppy_select);
	if ((current_DOR & 3) != nr)
		goto repeat;
```

选择软盘控制器已选定我们指定的软驱nr。于是取数字输入寄存器DIR的值。如果其最高位7置位，则表示软盘已经更换。

```c
	if (inb(FD_DIR) & 0x80) {
		floppy_off(nr);
		return 1;
	}
	floppy_off(nr);
	return 0;
```


### setup_DMA

```shell
├── setup_rw_floppy
  └── setup_DMA
```

### output_byte

### result

### bad_flp_intr

```c
static void bad_flp_intr(void)
```

软盘读写出错处理函数。

如果出错次数大于最大出错次数(8次)，则不再对当前请求项作进一步的操作尝试。如果读写出错次数超过MAX_ERRORS/2，则需要对软驱作复位处理，于是设置复位标志。否则只需要校正一下磁头位置。

```c
	CURRENT->errors++;
	if (CURRENT->errors > MAX_ERRORS) {
		floppy_deselect(current_drive);
		end_request(0);
	}
	if (CURRENT->errors > MAX_ERRORS/2)
		reset = 1;
	else
		recalibrate = 1;
```

### rw_interrupt

```c
	if (result() != 7 || (ST0 & 0xf8) || (ST1 & 0xbf) || (ST2 & 0x73)) {
		if (ST1 & 0x02) {
			printk("Drive %d is write protected\n\r",current_drive);
			floppy_deselect(current_drive);
			end_request(0);
		} else
			bad_flp_intr();
		do_fd_request();
		return;
	}
	if (command == FD_READ && (unsigned long)(CURRENT->buffer) >= 0x100000)
		copy_buffer(tmp_floppy_area,CURRENT->buffer);
	floppy_deselect(current_drive);
	end_request(1);
	do_fd_request();
```

### setup_rw_floppy

```c
inline void setup_rw_floppy(void)
```

该方法用于设置DMA通道2并向软盘控制器输出命令和参数。

```c
	setup_DMA();
	do_floppy = rw_interrupt;
	output_byte(command);
	output_byte(head<<2 | current_drive);
	output_byte(track);
	output_byte(head);
	output_byte(sector);
	output_byte(2);		/* sector size = 512 */
	output_byte(floppy->sect);
	output_byte(floppy->gap);
	output_byte(0xFF);	/* sector size (0xff when n!=0 ?) */
	if (reset)
		do_fd_request();
```

### seek_interrupt

### transfer

```c
static void transfer(void)
```

该方法是读写数据传输函数。

如果当前驱动器参数不是指定的驱动器的参数，发送设置驱动器参数命令。然后判断当前数据传输速率是否与指定驱动器一致，若不是就发送指定软驱的速率到数据传输速率控制器```FD_DCR```。

```c
	if (cur_spec1 != floppy->spec1) {
		cur_spec1 = floppy->spec1;
		output_byte(FD_SPECIFY);
		output_byte(cur_spec1);		/* hut etc */
		output_byte(6);			/* Head load time =6ms, DMA */
	}
	if (cur_rate != floppy->rate)
		outb_p(cur_rate = floppy->rate,FD_DCR);
```

若上面任何一个```output_byte```操作执行错误，则复位标志reset就会被置位。因此我们需要检测一下reset标志。

```c
	if (reset) {
		do_fd_request();
		return;
	}
```

如果不需要寻道，则设置DMA并向软盘控制器发送相应的操作命令。

```c
	if (!seek) {
		setup_rw_floppy();
		return;
	}
```

否则就执行寻道处理。

```c
	do_floppy = seek_interrupt;
	if (seek_track) {//起始磁道号不为0
		output_byte(FD_SEEK);
		output_byte(head<<2 | current_drive);
		output_byte(seek_track);
	} else {//起始磁道号为0
		output_byte(FD_RECALIBRATE);//发送重新校正命令
		output_byte(head<<2 | current_drive);
	}
	if (reset)
		do_fd_request();
```

### recal_interrupt

### unexpected_floppy_interrupt

### recalibrate_floppy

### reset_interrupt

### reset_floppy

```c
static void reset_floppy(void)
```

该方法的作用是复位软盘控制器。

该函数首先设置参数和标志，把复位标志清0，然后把软驱变量cur_spec1和cur_rate设置为无效。因为复位后，这两个参数就需要重新设置。接着设置重新校正标志。


```c
	int i;

	reset = 0;
	cur_spec1 = -1;
	cur_rate = -1;
	recalibrate = 1;
```

接下来设置软盘中断处理函数为reset_interrupt，并设置FDC执行复位操作。

```c
	printk("Reset-floppy called\n\r");
	cli();
	do_floppy = reset_interrupt;
	outb_p(current_DOR & ~0x04,FD_DOR);
	for (i=0 ; i<100 ; i++)
		__asm__("nop");
	outb(current_DOR,FD_DOR);
	sti();
```

### floppy_on_interrupt

```c
static void floppy_on_interrupt(void)
```

软驱启动定时中断调用函数。

如果当前驱动器号与数字输出寄存器中断DOR中的不同，则需要重新设置DOR。否则直接调用读写软盘传输函数```transfer```。

```c
	selected = 1; //设置已经选定当前驱动器标志
	if (current_drive != (current_DOR & 3)) { 
		current_DOR &= 0xFC;
		current_DOR |= current_drive;
		outb(current_DOR,FD_DOR);
		add_timer(2,&transfer);
	} else
		transfer();
```

### do_fd_request

```c
void do_fd_request(void)
```

软盘读写请求项处理函数。

首先检查是否有复位标志或重新校正标志置位，若有，则仅执行相关标志的处理功能后就返回。如果复位标志已置位，则执行软盘复位操作并返回。如果重新校正标志已置位，则执行软盘重新校正操作并返回。

```c
	unsigned int block;

	seek = 0;
	if (reset) {
		reset_floppy();
		return;
	}
	if (recalibrate) {
		recalibrate_floppy();
		return;
	}
```

这里再回顾一下将绝对的块号block转换为磁盘的(柱面C， 磁头H ，扇区S)公式。

其中， ```block```与```(C，H，S)```的换算公式如下所示:

```shell
	block=C*总磁头数*每磁道扇区数+H*每磁道扇区数+S
```

因此：

- 扇区号 = block%每磁道扇区数
- 磁头号 = (block/每磁道扇区数)%磁头数
- 磁道号/柱面号 = (block/每磁道扇区数)/磁头数

```c
	sector = block % floppy->sect;
	block /= floppy->sect;
	head = block % floppy->head;
	track = block / floppy->head;
	seek_track = track << floppy->stretch;
```

再看看是否还需要首先执行寻道操作。如果寻道号与当前磁头所在磁道号不同，则需要进行寻道操作。于是设置需要寻道标志seek。最后我们设置执行的软盘命令command。

```c
	if (seek_track != current_track)
		seek = 1;
	sector++;
	if (CURRENT->cmd == READ)
		command = FD_READ;
	else if (CURRENT->cmd == WRITE)
		command = FD_WRITE;
	else
		panic("do_fd_request: unknown command");
	add_timer(ticks_to_floppy_on(current_drive),&floppy_on_interrupt);
```

## floppy_init

```c
void floppy_init(void)
```

该方法的作用是对软盘进行初始化。

首先设置了软盘块设备请求项处理函数为```do_fd_request```。

```c
blk_dev[MAJOR_NR].request_fn = DEVICE_REQUEST; 
```

此外设置软盘中断(0x26)处理函数为```floppy_interrupt```。

```outb(inb_p(0x21)&~0x40,0x21)```:

```0x21```是主片命令字```OCW1```的端口地址， ```~0x40 = ~01000000 = 10111111```， 即将主片IR6的位置复位， 主片的IR6用于接受软盘的中断，因此该语句的作用是**允许软盘的中断**。

```c
set_trap_gate(0x26,&floppy_interrupt);              // 设置陷阱门描述符
outb(inb_p(0x21)&~0x40,0x21);                       // 复位软盘中断请求屏蔽位
```