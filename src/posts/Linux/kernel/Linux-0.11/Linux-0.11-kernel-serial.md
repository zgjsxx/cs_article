---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录serial.c详解](#linux-011-kernel目录serialc详解)
  - [模块简介](#模块简介)
  - [函数详解](#函数详解)
    - [init](#init)
    - [rs\_init](#rs_init)
    - [rs\_write](#rs_write)

# Linux-0.11 kernel目录serial.c详解

## 模块简介

## 函数详解


### init

```c
static void init(int port)
```

```c
static void init(int port)
{
    // 设置线路控制寄存器的DLAB位(位7)
	outb_p(0x80,port+3);	/* set DLAB of line control reg */
    // 发送波特率因子低字节，0x30 -> 2400bps
	outb_p(0x30,port);	/* LS of divisor (48 -> 2400 bps */
    // 发送波特率因子高字节，0x00
	outb_p(0x00,port+1);	/* MS of divisor */
    // 复位DLAB位,数据位为8位
	outb_p(0x03,port+3);	/* reset DLAB */
    // 设置DTR,RTS,辅助用户输出2
	outb_p(0x0b,port+4);	/* set DTR,RTS, OUT_2 */
    // 除了写(写保持空)以外，允许所有中断源中断
	outb_p(0x0d,port+1);	/* enable all intrs but writes */
    // 读数据口，以进行复位操作(?)
	(void)inb(port);	/* read data port to reset things (?) */
}
```

### rs_init

初始化串行中断程序和串行接口中断描述符表IDT中的门描述符设置宏set_intr_gate()在include/asm/system.h中实现

```c
void rs_init(void)
{
    // 下面两句用于设置两个串行口的中断门描述符。rsl_interrupt是串口1的中断处理过程指正。
    // 串口1使用的中断是int 0x24，串口2的是int 0x23.
	set_intr_gate(0x24,rs1_interrupt);      // 设置串行口1的中断门向量(IRQ4信号)
	set_intr_gate(0x23,rs2_interrupt);      // 设置串行口2的中断门向量(IRQ3信号)
	init(tty_table[1].read_q.data);         // 初始化串行口1(.data是端口基地址)
	init(tty_table[2].read_q.data);         // 初始化串行口2
	outb(inb_p(0x21)&0xE7,0x21);            // 允许主8259A响应IRQ3、IRQ4中断请求
}
```

### rs_write

```c
void rs_write(struct tty_struct * tty)
{
	cli();
	if (!EMPTY(tty->write_q))
		outb(inb_p(tty->write_q.data+1)|0x02,tty->write_q.data+1);
	sti();
}
```
