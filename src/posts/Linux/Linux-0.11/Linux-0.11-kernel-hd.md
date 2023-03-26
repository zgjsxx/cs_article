---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---
# Linux-0.11 kernel目录hd.c详解


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

## controller_ready
```c
static int controller_ready(void)
```
该函数的作用就是循环等待硬盘控制器就绪。

硬盘控制器状态寄存器端口是0x1f7, 
```c
#define HD_STATUS	0x1f7	/* see status-bits */
```

```c
int retries=100000;

while (--retries && (inb_p(HD_STATUS)&0x80));//检查状态寄存器busy位（第7位）
return (retries);
```

## win_result
```c
static int win_result(void)
```
该函数的作用是检查硬盘执行命令后的结果。

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

```c
register int port asm("dx");

if (drive>1 || head>15)
  panic("Trying to write bad sector");
if (!controller_ready())
  panic("HD controller not ready");
do_hd = intr_addr; // do_hd 函数指针将在硬盘中断程序中被调用
outb_p(hd_info[drive].ctl,HD_CMD); //向控制寄存器(0x3f6)输出控制字节
port=HD_DATA;  //置dx 为数据寄存器端口(0x1f0)
outb_p(hd_info[drive].wpcom>>2,++port);
outb_p(nsect,++port);  //参数：读/写扇区总数
outb_p(sect,++port);   //参数：起始扇区
outb_p(cyl,++port);    //参数：柱面号低8 位
outb_p(cyl>>8,++port); //参数：柱面号高8 位
outb_p(0xA0|(drive<<4)|head,++port);  //参数：驱动器号+磁头号
outb(cmd,++port);      //命令：硬盘控制命令
```


## drive_busy
```c
static int drive_busy(void)
```

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
reset_controller();
hd_out(nr,hd_info[nr].sect,hd_info[nr].sect,hd_info[nr].head-1,
	hd_info[nr].cyl,WIN_SPECIFY,&recal_intr);
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

将HD_DATA端口依次读取256个字（512字节）到buffer中。
```c
port_read(HD_DATA,CURRENT->buffer,256);
```
接着对请求中的一些标记进行修改。
```c
CURRENT->errors = 0;//清除出错次数
CURRENT->buffer += 512;//调整buffer指针
CURRENT->sector++;//起始扇区+1
```

```c
if (--CURRENT->nr_sectors) {
  do_hd = &read_intr;
  return;
}
end_request(1);
do_hd_request();//再次调用do_hd_request去处理其他硬盘请求项
```

## write_intr
```c
static void write_intr(void)
```
该函数是磁盘的写终端调用函数。

```c
if (--CURRENT->nr_sectors) {//如果还有扇区要写
  CURRENT->sector++;//当前请求扇区号+1
  CURRENT->buffer += 512;//当前请求缓冲区指针增加512
  do_hd = &write_intr; //设置函数指针位write_intr
  port_write(HD_DATA,CURRENT->buffer,256);//向数据端口写256字（512字节）
  return;
}
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

首先对读写请求进行校验。
```c
INIT_REQUEST;
dev = MINOR(CURRENT->dev);
block = CURRENT->sector;
if (dev >= 5*NR_HD || block+2 > hd[dev].nr_sects) {
	end_request(0);
	goto repeat;
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
} else if (CURRENT->cmd == READ) {
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


