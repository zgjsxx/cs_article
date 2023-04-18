---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统char_dev.c详解

## 模块简介

char_dev.c文件主要负责字符设备的访问方法。

## 函数详解

### rw_ttyx
```c
static int rw_ttyx(int rw,unsigned minor,char * buf,int count,off_t * pos)
```
该函数是串口终端的读写函数。

```c
return ((rw==READ)?tty_read(minor,buf,count):
    tty_write(minor,buf,count));
```
### rw_tty
```c
static int rw_tty(int rw,unsigned minor,char * buf,int count, off_t * pos)
```

该函数是控制台终端的读写函数。

```c
	if (current->tty<0)
		return -EPERM;
	return rw_ttyx(rw,current->tty,buf,count,pos);
```
### rw_ram
```c
static int rw_ram(int rw,char * buf, int count, off_t *pos)
```

内存数据读写函数。 空壳子，该版本没有实现。
### rw_mem
```c
static int rw_mem(int rw,char * buf, int count, off_t * pos)
```
物理内存数据读写函数。 空壳子，该版本没有实现。
### rw_kmem
```c
static int rw_kmem(int rw,char * buf, int count, off_t * pos)
```
内核虚拟内存数据读写函数。 空壳子，该版本没有实现。

### rw_port
```c
static int rw_port(int rw,char * buf, int count, off_t * pos)
```
该函数时端口读写的函数。

参入pos代表的是端口号。

程序内容比较简单，就是循环进行端口的读写。
```c
	int i=*pos;

	while (count-->0 && i<65536) {
		if (rw==READ)
			put_fs_byte(inb(i),buf++);
		else
			outb(get_fs_byte(buf++),i);
		i++;
	}
	i -= *pos;
	*pos += i;
	return i;
```
### rw_memory
```c
static int rw_memory(int rw, unsigned minor, char * buf, int count, off_t * pos)
```

该函数是内存设备文件的读写函数。

下面的大多数函数都只是一个空壳子，暂未实现。

```c
	switch(minor) {
		case 0:
			return rw_ram(rw,buf,count,pos);
		case 1:
			return rw_mem(rw,buf,count,pos);
		case 2:
			return rw_kmem(rw,buf,count,pos);
		case 3:
			return (rw==READ)?0:count;	/* rw_null */
		case 4:
			return rw_port(rw,buf,count,pos);
		default:
			return -EIO;
	}
```

### rw_char
```c
int rw_char(int rw,int dev, char * buf, int count, off_t * pos)
```
该函数时字符设备的读写操作函数。

```c
	crw_ptr call_addr;

	if (MAJOR(dev)>=NRDEVS)
		return -ENODEV;
	if (!(call_addr=crw_table[MAJOR(dev)]))
		return -ENODEV;
	return call_addr(rw,MINOR(dev),buf,count,pos);
```

## Q & A