---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统block_dev.c详解

## 模块简介

## 函数详解

### block_write
```c
int block_write(int dev, long * pos, char * buf, int count)
```
该函数的作用是进行块设备的写。

入参dev代表设备号，pos代表磁盘中的位置(字节数)，buf是待写数据的缓冲区，count是需要写入的字符数量。

程序的开始定义了一些变量，其中使用了位运算计算出了pos对应的block和在该block中的偏移量offset。
```c
	int block = *pos >> BLOCK_SIZE_BITS;
	int offset = *pos & (BLOCK_SIZE-1);
	int chars;
	int written = 0;
	struct buffer_head * bh;
	register char * p;
```

接下来使用breada将block块中的内容读取到内存中。
```c
	while (count>0) {
		chars = BLOCK_SIZE - offset;
		if (chars > count)
			chars=count;
		if (chars == BLOCK_SIZE)
			bh = getblk(dev,block);
		else
			bh = breada(dev,block,block+1,block+2,-1);
		block++;
		if (!bh)
			return written?written:-EIO;
```

接着，从block开始的数据块中开始写入数据，如果该block写完之后，还没有结束，那么则进行下一轮循环。同时需要将该block的脏数据位设置为1。
```c
    p = offset + bh->b_data;
    offset = 0;
    *pos += chars;
    written += chars;
    count -= chars;
    while (chars-->0)
        *(p++) = get_fs_byte(buf++);
    bh->b_dirt = 1;
    brelse(bh);
```

程序的最后返回写入的数据总数。
```c
	return written;
```
### block_read
```c
int block_read(int dev, unsigned long * pos, char * buf, int count)
```
该函数的作用是进行块设备的读。

入参dev代表设备号，pos代表磁盘中的位置(字节数)，buf是接收缓冲区，count是需要读取的字符数量。

程序的开始定义了一些变量，其中使用了位运算计算出了pos对应的block和在该block中的偏移量offset。
```c
    int block = *pos >> BLOCK_SIZE_BITS;
    int offset = *pos & (BLOCK_SIZE-1);
    int chars;
    int read = 0;
    struct buffer_head * bh;
    register char * p;
```

接下来使用breada将block块中的内容读取到内存中。
```c
while (count>0) {
    chars = BLOCK_SIZE-offset;
    if (chars > count)
        chars = count;
    if (!(bh = breada(dev,block,block+1,block+2,-1)))
        return read?read:-EIO;
```
接着，从block开始的数据块中开始读取数据，如果该block读完之后，还没有结束，那么则进行下一轮循环。
```c
    block++;
    p = offset + bh->b_data;
    offset = 0;
    *pos += chars;
    read += chars;
    count -= chars;
    while (chars-->0)
        put_fs_byte(*(p++),buf++);
    brelse(bh);
```
## Q & A

### block_read中获取商和余数为什么不使用/和%？

在block_read函数中，```block=(*pos)/1024```， ```offset=(*pos)%1024```。 由于除数是2的次幂，因此求商和余数可以使用位运算进行加速，这可以当作一个范式。
```c
int block = *pos >> BLOCK_SIZE_BITS;
int offset = *pos & (BLOCK_SIZE-1);
```