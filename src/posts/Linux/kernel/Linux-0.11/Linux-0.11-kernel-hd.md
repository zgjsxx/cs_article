---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---
# Linux-0.11 kernel目录hd.c详解

在讲解hd.c的函数之前，需要先介绍一些宏定义，inb, inb_p, outb, outb_p。

**inb**宏的作用是去IO端口读取一个byte的数据。

在内嵌汇编中， ```:"d" (port))```是输入，将port值写入了edx。 ```:"=a" (_v)```是输出，即将AL的值写入_v中。

而汇编指令```inb %%dx,%%al```的作用是从端口dx中读取一个字节放入al中。

```c
#define inb(port) ({ \
unsigned char _v; \
__asm__ volatile ("inb %%dx,%%al"
		:"=a" (_v)
		:"d" (port)); \
_v; \
})
```

**inb_p**宏的作用也是去IO端口读取一个字节的数据，但是其使用两个jmp 1f进行延迟。
```c
#define inb_p(port) ({ \
unsigned char _v; \
__asm__ volatile ("inb %%dx,%%al\n" \
    "\tjmp 1f\n" \
    "1:\tjmp 1f\n" \
    "1:"
	:"=a" (_v)
	:"d" (port)); \
_v; \
})
```

**outb**宏的作用是向IO端口写入一个字节的数据。
将value写入al中，将port写入edx中，最后使用汇编指令outb向port写入数据内容。
```c
#define outb(value,port) \
__asm__ ("outb %%al,%%dx"
			:
			:"a" (value),"d" (port))
```

**outb_p**宏的作用与outb作用类似，只不过使用了jmp进行延时。
```c
#define outb_p(value,port) \
__asm__ ("outb %%al,%%dx\n" \
		"\tjmp 1f\n" \
		"1:\tjmp 1f\n" \
		"1:"
		:
		:"a" (value),"d" (port))
```

## sys_setup
```c
int sys_setup(void * BIOS)
```
该函数在main.c文件中的init方法中被调用。

```c
void init(void)
{
	int pid,i;
	setup((void *) &drive_info);
	...
}
```
从调用关系可以得出， 入参BIOS指针指向drive_info。

该方法的最先定义了一些变量，其中利用static变量callable控制该方法只会被调用一次。
```c
static int callable = 1;
int i,drive;
unsigned char cmos_disks;
struct partition *p;
struct buffer_head * bh;

if (!callable)
	return -1;
callable = 0;
```

接下来如果定义了HD_TYPE，则一次去BIOS内存地址出去读取数据拷贝到hd_info变量中。
```c
#ifndef HD_TYPE
	for (drive=0 ; drive<2 ; drive++) {
		hd_info[drive].cyl = *(unsigned short *) BIOS;//柱面数
		hd_info[drive].head = *(unsigned char *) (2+BIOS);//磁头数
		hd_info[drive].wpcom = *(unsigned short *) (5+BIOS);//写前预补偿柱面号
		hd_info[drive].ctl = *(unsigned char *) (8+BIOS);//控制字节
		hd_info[drive].lzone = *(unsigned short *) (12+BIOS);//磁头着陆区柱面号
		hd_info[drive].sect = *(unsigned char *) (14+BIOS);//每磁道扇区数
		BIOS += 16;
	}
	if (hd_info[1].cyl)
		NR_HD=2;//磁盘数
	else
		NR_HD=1;
#endif
```

接下来设置硬盘分区数据
```c
	for (i=0 ; i<NR_HD ; i++) {
		hd[i*5].start_sect = 0;
		hd[i*5].nr_sects = hd_info[i].head*
				hd_info[i].sect*hd_info[i].cyl;
	}
```

NR_HD=0， 两个硬盘都不是AT控制器兼容的。
```c
if ((cmos_disks = CMOS_READ(0x12)) & 0xf0)
	if (cmos_disks & 0x0f)
		NR_HD = 2;
	else
		NR_HD = 1;
else
	NR_HD = 0;
```

如果NR_HD=0，则将两个硬盘的结构全部清零。如果NR_HD=1，则将第二块硬盘结构清零。
```c
for (i = NR_HD ; i < 2 ; i++) {
	hd[i*5].start_sect = 0;
	hd[i*5].nr_sects = 0;
}
```

接下来就是获取硬盘的分区表信息。
```c
for (drive=0 ; drive<NR_HD ; drive++) {
	if (!(bh = bread(0x300 + drive*5,0))) {//300 305是设别号
		printk("Unable to read partition table of drive %d\n\r",
			drive);
		panic("");
	}
	if (bh->b_data[510] != 0x55 || (unsigned char)
		bh->b_data[511] != 0xAA) {//硬盘标志位0xAA55
		printk("Bad partition table on drive %d\n\r",drive);
		panic("");
	}
	p = 0x1BE + (void *)bh->b_data;
	for (i=1;i<5;i++,p++) {
		hd[i+5*drive].start_sect = p->start_sect;
		hd[i+5*drive].nr_sects = p->nr_sects;
	}
	brelse(bh);
}
```

最后将加载虚拟盘和挂载根文件系统。
```c
if (NR_HD)
	printk("Partition table%s ok.\n\r",(NR_HD>1)?"s":"");
rd_load();//加载虚拟盘
mount_root();//挂载根文件系统。
```
## controller_ready
```c
static int controller_ready(void)
```
该函数的作用就是循环等待硬盘控制器就绪。

硬盘控制器状态寄存器端口是0x1f7, 从该端口中读取一个字节的数据，并检查其最高位是否为0，如果为0，就代表已经就绪，如果为1， 则代表尚未就绪。

```c
int retries=100000;

while (--retries && (inb_p(HD_STATUS)&0x80));//检查状态寄存器busy位（第7位）
return (retries);
```

## win_result
```c
static int win_result(void)
```
该函数的作用是检查硬盘执行命令后的结果。0为正常， 1为错误。

首先使用inb_p去读取HD_STATUS的值，如果控制器忙， 读写错误或命令执行错误， 则返回1。如果没有错误，则返回0.
```c
int i=inb_p(HD_STATUS);//取出硬盘控制器的状态信息。

if ((i & (BUSY_STAT | READY_STAT | WRERR_STAT | SEEK_STAT | ERR_STAT))
	== (READY_STAT | SEEK_STAT))
	return(0); /* ok */
if (i&1) i=inb(HD_ERROR);//如果ERR_STAT置位
return (1);
```

## hd_out
```c
static void hd_out(unsigned int drive,unsigned int nsect,unsigned int sect,
		unsigned int head,unsigned int cyl,unsigned int cmd,
		void (*intr_addr)(void))
```
该函数的作用是向硬盘控制器发送命令。

该函数的开头对参数进行校验，如果不合法则抛出内核错误。
```c
register int port asm("dx");//定义局部变量，并放入寄存器dx中。

if (drive>1 || head>15)//驱动器号大于1(驱动器号只能是0或者1)， 磁头号大于15.
  panic("Trying to write bad sector");
if (!controller_ready())//控制器没有准备好
  panic("HD controller not ready");
```

接下来就要对一些IO端口进行写数据，首先我们先了解一下这些端口。

|端口|名称|读操作|写操作|
|--|--|--|--|
|0x1f0|HD_DATA|数据寄存器||
|0x1f1|HD_ERROR|错误寄存器||
|0x1f2|HD_NSECTOR|扇区数寄存器  总扇区数||
|0x1f3|HD_SECTOR|扇区号寄存器 起始扇区 ||
|0x1f4|HD_LCYL|柱面号寄存器 柱面号低字节 ||
|0x1f5|HD_HCYL|柱面号寄存器 柱面号高字节 ||
|0x1f6|HD_CURRENT|磁头寄存器 磁头号 ||
|0x1f7|HD_STATUS|主状态寄存器 |命令寄存器|
|0x3f6|HD_CMD| |硬盘控制寄存器|
|0x3f7||数字输入寄存器 ||

hd_out接下来的过程就是向这些端口依次写入数据。

```c
do_hd = intr_addr; // do_hd 函数指针将在硬盘中断程序中被调用
outb_p(hd_info[drive].ctl,HD_CMD); //向控制寄存器(0x3f6)输出控制字节
port=HD_DATA;  //置dx 为数据寄存器端口(0x1f0)
outb_p(hd_info[drive].wpcom>>2,++port);  //0x1f1
outb_p(nsect,++port);  //参数：读/写扇区总数 0x1f2
outb_p(sect,++port);   //参数：起始扇区 0x1f3
outb_p(cyl,++port);    //参数：柱面号低8 位  0x1f4
outb_p(cyl>>8,++port); //参数：柱面号高8 位  0x1f5
outb_p(0xA0|(drive<<4)|head,++port);  //参数：驱动器号+磁头号 0x1f6
outb(cmd,++port);      //命令：硬盘控制命令 0x1f7
```

## drive_busy
```c
static int drive_busy(void)
```
该函数的作用是**等待硬盘就绪**。

该函数循环检查硬盘的状态寄存器的忙标志位。如果busy位复位，则返回0。如果没有复位，则返回1。

```c
unsigned int i;

for (i = 0; i < 10000; i++)//循环读取硬盘的主状态寄存器HD_STATUS，等待就绪位
	if (READY_STAT == (inb_p(HD_STATUS) & (BUSY_STAT|READY_STAT)))
		break;
i = inb(HD_STATUS);
i &= BUSY_STAT | READY_STAT | SEEK_STAT;
if (i == (READY_STAT | SEEK_STAT))
	return(0);
printk("HD controller times out\n\r");//打印等待超时
return(1);
```

## reset_controller
```c
static void reset_controller(void)
```
该函数用于重新校正硬盘控制器。

```c
int	i;

outb(4,HD_CMD);//向硬盘控制寄存器端口发送复位控制
for(i = 0; i < 100; i++) nop();//循环等待一段时间
outb(hd_info[0].ctl & 0x0f ,HD_CMD);//发送正常的控制字节
if (drive_busy())//检查控制器是否还是处于忙的状态
	printk("HD-controller still busy\n\r");
if ((i = inb(HD_ERROR)) != 1)
	printk("HD-controller reset failed: %02x\n\r",i);
```

## reset_hd
```c
static void reset_hd(int nr)
```
该函数的作用是复位硬盘。

```c
reset_controller();//复位硬盘控制器
hd_out(nr,hd_info[nr].sect,hd_info[nr].sect,hd_info[nr].head-1,
	hd_info[nr].cyl,WIN_SPECIFY,&recal_intr);//发送硬盘控制命令， recal_intr是硬盘中断处理函数中调用的函数
```

## unexpected_hd_interrupt
```c
void unexpected_hd_interrupt(void)
```
该函数仅仅用于在出现意外硬盘中断的时候打印一行日志。

```c
printk("Unexpected HD interrupt\n\r");
```

## bad_rw_intr
```c
static void bad_rw_intr(void)
```
该函数是读写硬盘失败的处理函数。如果读写扇区出错次数大于等于7次时，结束当前请求项，并唤醒等待该请求的进程。

如果读写扇区的时候，出错次数超过了3次，则对硬盘控制器进行复位。

```c
if (++CURRENT->errors >= MAX_ERRORS)
	end_request(0);
if (CURRENT->errors > MAX_ERRORS/2)
	reset = 1;
```

## read_intr
```c
static void read_intr(void)
```
该函数是磁盘的**读中断调用函数**。

硬盘的中断处理函数是hd_interrupt，这个是在hd_init函数中设置的。当硬盘中断发生的时候，将调用do_hd指向的函数， 而do_hd则是在do_hd_request函数中通过hd_out进行设置的。

因此当do_hd_request要去读扇区时，就会设置do_hd为read_intr，这样当硬盘中断到来时，就会调用read_intr进行处理。器处理流程如下图所示：

![read_intr](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/Linux-0.11-kernel/block/read_intr_flow.png)

首先检查硬盘控制器是否返回错误信息。

```c
if (win_result()) {
	bad_rw_intr();
	do_hd_request();
	return;
}
```

将HD_DATA端口依次读取256个字（512字节）到buffer中。
```c
port_read(HD_DATA,CURRENT->buffer,256);
```
接着对请求中的一些标记进行修改。
```c
CURRENT->errors = 0;//清除出错次数
CURRENT->buffer += 512;//调整buffer指针
CURRENT->sector++;//起始扇区+1
if (--CURRENT->nr_sectors) {
  do_hd = &read_intr;//尚有数据还未读完，因此设置下一次的中断处理函数还是read_intr
  return;
}
end_request(1);
do_hd_request();//再次调用do_hd_request去处理其他硬盘请求项
```

## write_intr
```c
static void write_intr(void)
```
该函数是磁盘的写中断调用函数。

首先检查硬盘控制器是否返回错误信息。

```c
if (win_result()) {
	bad_rw_intr();
	do_hd_request();
	return;
}
```

```c
if (--CURRENT->nr_sectors) {//如果还有扇区要写
    CURRENT->sector++;//当前请求扇区号+1
    CURRENT->buffer += 512;//当前请求缓冲区指针增加512
    do_hd = &write_intr; //设置函数指针位write_intr
    port_write(HD_DATA,CURRENT->buffer,256);//向数据端口写256字（512字节）
    return;
}
end_request(1);
do_hd_request();
```

## recal_intr
```c
static void recal_intr(void)
```
该函数的作用是重新复位中断调用函数。

```c
if (win_result())
	bad_rw_intr();
do_hd_request();
```


## do_hd_request
```c
void do_hd_request(void)
```
该函数是硬盘设备的读写函数。

首先对读写请求进行校验。如果请求队列中没有硬盘的读写任务，则退出。

请求的起始扇区+至少读写2扇区(1K)不能大于磁盘分区的最后一个扇区。
```c
block+2 > hd[dev].nr_sects
```

```c
int i,r = 0;
unsigned int block,dev;
unsigned int sec,head,cyl;
unsigned int nsect;

INIT_REQUEST;
dev = MINOR(CURRENT->dev);
block = CURRENT->sector;//请求的起始扇区
if (dev >= 5*NR_HD || block+2 > hd[dev].nr_sects) {
	end_request(0);
	goto repeat;
}
```

下面是本函数的一个难点，将绝对的块号转换为磁盘的(柱面C， 磁头H ，扇区S)。

其中， block与(C，H，S)的换算公式如下所示:

```
block=C*总磁头数*每磁道扇区数+H*每磁道扇区数+S
```

可以看出前两项都是每磁道扇区数的倍数， 因此使用block除以每磁道扇区数，其余数就是扇区号S，
其商如下所示:

```c
block = block/每磁道扇区数 = C*总磁头数 + H
```
使用除数除以总磁头数， 那么其余数就是H， 商就是C。

下面看代码，
输入eax = block， edx = 0， ```divl %4```中的%4就是```hd_info[dev].sect```， 代表每磁道扇区数，结果将余数赋值给变量sec， 商赋值给block。 这与我们上面的步骤是一致的。
```c
__asm__("divl %4"
		:"=a" (block),"=d" (sec)
		:"0" (block),"1" (0),"r" (hd_info[dev].sect));
```


接下来输入edx = block， eax = 0， ```divl %4```中的%4就是hd_info[dev].head， 代表系统中的总磁头数，结果将余数赋值给head， 商赋值给cyl，这与我们的分析也一致。
```c
__asm__("divl %4"
	:"=a" (cyl),"=d" (head)
	:"0" (block),"1" (0),
	"r" (hd_info[dev].head));
```

如果此时的复位标志是1， 那么就调用reset_hd进行硬盘的复位。
```c
if (reset) {
	reset = 0;
	recalibrate = 1;
	reset_hd(CURRENT_DEV);
	return;
}
```

如果此时重新校正标志是置位的， 则首先复位该标志， 然后向硬盘控制器发送重新校正的命令。
```c
if (recalibrate) {
	recalibrate = 0;
	hd_out(dev,hd_info[CURRENT_DEV].sect,0,0,0,
		WIN_RESTORE,&recal_intr);
	return;
}	
```


```c
if (CURRENT->cmd == WRITE) {//如果是写请求
	hd_out(dev,nsect,sec,head,cyl,WIN_WRITE,&write_intr);//向控制器发送写请求
	for(i=0 ; i<3000 && !(r=inb_p(HD_STATUS)&DRQ_STAT) ; i++)//循环等待
		/* nothing */ ;
	if (!r) {
		bad_rw_intr();
		goto repeat;
	}
	port_write(HD_DATA,CURRENT->buffer,256);
} else if (CURRENT->cmd == READ) { //如果是读请求
	hd_out(dev,nsect,sec,head,cyl,WIN_READ,&read_intr);
} else
	panic("unknown hd-command");
```

## hd_init
```c
void hd_init(void)
```
该函数用于硬盘系统的初始化。
```c
blk_dev[MAJOR_NR].request_fn = DEVICE_REQUEST;//设置硬盘的请求处理方法
set_intr_gate(0x2E,&hd_interrupt);//设置硬盘的中断，中断号是0x2E（46）
outb_p(inb_p(0x21)&0xfb,0x21);//允许从片发出中断
outb(inb_p(0xA1)&0xbf,0xA1);//允许硬盘的中断
```

```outb_p(inb_p(0x21)&0xfb,0x21)```:

0x21是主片命令字OCW1的端口地址， 0xfb = 11111011， 即将主片IR2的位置复位， 主片的IR2用于级联从片, 因此该语句的作用是**允许从片发出中断**。

```outb(inb_p(0xA1)&0xbf,0xA1)```:

0xA1是从片命令字OCW1的端口地址，0xbf = 10111111, 即将从片IR6的位置复位，从片的IR6用于接受硬盘的中断，因此该语句的作用是**允许硬盘的中断**。

因此以上两句的作用就是**允许了来自硬盘的中断**。


有关更多8259A中断控制器， 可以阅读 [详解8259A](https://blog.csdn.net/longintchar/article/details/79439466)


