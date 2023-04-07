---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录tty_ioctl.c详解

## 模块简介

## 函数详解


### change_speed
```c
static void change_speed(struct tty_struct * tty)
```
该函数的作用是用于设置终端传输波特率。
```c
unsigned short port,quot;

if (!(port = tty->read_q.data))//获取串口的端口地址(0x3f8或者0x2f8)
    return;
quot = quotient[tty->termios.c_cflag & CBAUD];//获取波特率因此quot
cli();//关中断
outb_p(0x80,port+3);		/* set DLAB */
outb_p(quot & 0xff,port);	/* LS of divisor */
outb_p(quot >> 8,port+1);	/* MS of divisor */
outb(0x03,port+3);		/* reset DLAB */
sti();//开中断
```


### flush
```c
static void flush(struct tty_queue * queue)
```


### wait_until_sent
```c
static void wait_until_sent(struct tty_struct * tty)
```


### send_break
```c
static void send_break(struct tty_struct * tty)
```

### get_termios
```c
static int get_termios(struct tty_struct * tty, struct termios * termios)
```

### set_termios
```c
static int set_termios(struct tty_struct * tty, struct termios * termios)
```

### get_termio
```c
static int get_termio(struct tty_struct * tty, struct termio * termio)
```

### set_termio
```c
static int set_termio(struct tty_struct * tty, struct termio * termio)
```

### tty_ioctl
```c
int tty_ioctl(int dev, int cmd, int arg)
```
该函数用于终端设备的io控制。

函数用于从tty_table数组中获取对应dev的tty结构体。
```c
	struct tty_struct * tty;
	if (MAJOR(dev) == 5) {
		dev=current->tty;
		if (dev<0)
			panic("tty_ioctl: dev<0");
	} else
		dev=MINOR(dev);
	tty = dev + tty_table;
```

接下来，根据cmd的类型去调用对应的方法。

如果cmd等于TCGETS，调用get_termios去获取获取终端termios的结构信息。

如果cmd等于TCSETSF，则用于刷新输入队列。

如果cmd等于TCSETSW，则用于等待输出队列中所有数据处理完。

如果cmd等于TCSETS，则用于设置终端的结构信息。

如果cmd等于TCGETA，则用于获取终端termio结构中的信息。

如果cmd等于TCSETAF，则用于刷新输入队列。

如果cmd等于TCSETAW，则用于等待输出队列中的所有数据处理完。

如果cmd等于TCSETA，则用于设置终端termio结构信息。

如果cmd等于TCSBRK， 则用于发送break。


```c
	switch (cmd) {
		case TCGETS:
			return get_termios(tty,(struct termios *) arg);
		case TCSETSF:
			flush(&tty->read_q); /* fallthrough */
		case TCSETSW:
			wait_until_sent(tty); /* fallthrough */
		case TCSETS:
			return set_termios(tty,(struct termios *) arg);
		case TCGETA:
			return get_termio(tty,(struct termio *) arg);
		case TCSETAF:
			flush(&tty->read_q); /* fallthrough */
		case TCSETAW:
			wait_until_sent(tty); /* fallthrough */
		case TCSETA:
			return set_termio(tty,(struct termio *) arg);
		case TCSBRK:
			if (!arg) {
				wait_until_sent(tty);
				send_break(tty);
			}
			return 0;
		case TCXONC:
			return -EINVAL; /* not implemented */
		case TCFLSH:
			if (arg==0)
				flush(&tty->read_q);
			else if (arg==1)
				flush(&tty->write_q);
			else if (arg==2) {
				flush(&tty->read_q);
				flush(&tty->write_q);
			} else
				return -EINVAL;
			return 0;
		case TIOCEXCL:
			return -EINVAL; /* not implemented */
		case TIOCNXCL:
			return -EINVAL; /* not implemented */
		case TIOCSCTTY:
			return -EINVAL; /* set controlling term NI */
		case TIOCGPGRP:
			verify_area((void *) arg,4);
			put_fs_long(tty->pgrp,(unsigned long *) arg);
			return 0;
		case TIOCSPGRP:
			tty->pgrp=get_fs_long((unsigned long *) arg);
			return 0;
		case TIOCOUTQ:
			verify_area((void *) arg,4);
			put_fs_long(CHARS(tty->write_q),(unsigned long *) arg);
			return 0;
		case TIOCINQ:
			verify_area((void *) arg,4);
			put_fs_long(CHARS(tty->secondary),
				(unsigned long *) arg);
			return 0;
		case TIOCSTI:
			return -EINVAL; /* not implemented */
		case TIOCGWINSZ:
			return -EINVAL; /* not implemented */
		case TIOCSWINSZ:
			return -EINVAL; /* not implemented */
		case TIOCMGET:
			return -EINVAL; /* not implemented */
		case TIOCMBIS:
			return -EINVAL; /* not implemented */
		case TIOCMBIC:
			return -EINVAL; /* not implemented */
		case TIOCMSET:
			return -EINVAL; /* not implemented */
		case TIOCGSOFTCAR:
			return -EINVAL; /* not implemented */
		case TIOCSSOFTCAR:
			return -EINVAL; /* not implemented */
		default:
			return -EINVAL;
	}
```
## Q & A
