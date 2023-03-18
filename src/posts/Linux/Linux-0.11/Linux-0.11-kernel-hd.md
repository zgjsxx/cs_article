---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---
# Linux-0.11 kernel目录hd.c详解

## read_intr
```c
static void read_intr(void)
```
该函数是磁盘的读中断调用函数。

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

```c
if (--CURRENT->nr_sectors) {
  CURRENT->sector++;
  CURRENT->buffer += 512;
  do_hd = &write_intr;
  port_write(HD_DATA,CURRENT->buffer,256);
  return;
}
```

## do_hd_request
```c
void do_hd_request(void)
```
## hd_out
```c
static void hd_out(unsigned int drive,unsigned int nsect,unsigned int sect,
		unsigned int head,unsigned int cyl,unsigned int cmd,
		void (*intr_addr)(void))
```
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

## recal_intr
```c
static void recal_intr(void)
```

## bad_rw_intr
```c
static void bad_rw_intr(void)
```

## unexpected_hd_interrupt
```c
void unexpected_hd_interrupt(void)
```

## reset_controller
```c
static void reset_controller(void)
```

## drive_busy
```c
static int drive_busy(void)
```

## win_result
```c
static int win_result(void)
```

# controller_ready
```c
static int controller_ready(void)
```

## sys_setup
```c
int sys_setup(void * BIOS)
```
## hd_init
```c
void hd_init(void)
```


