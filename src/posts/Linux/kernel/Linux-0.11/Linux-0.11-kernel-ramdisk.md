---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录进程管理ramdisk.c详解](#linux-011-kernel目录进程管理ramdiskc详解)
	- [函数详解](#函数详解)
		- [rd\_init](#rd_init)
		- [do\_rd\_request](#do_rd_request)
		- [rd\_load](#rd_load)


# Linux-0.11 kernel目录进程管理ramdisk.c详解

ramdisk.c是内存虚拟盘的驱动程序。虚拟盘设备是一种利用物理内存来模拟实际磁盘存储数据的方式。其目的是提高对磁盘数据的读写操作速度。除了占用一些宝贵的内存资源外，其主要缺点是一旦系统崩溃或关闭，虚拟盘中的所有数据将全部消失。因此虚拟盘中通常存放一些系统命令等常用工具程序或临时数据，而非重要的输入文档。

## 函数详解

### rd_init

```c
long rd_init(long mem_start, int length)
```

该方法的作用是返回内存虚拟盘ramdisk所需要的内存量。

首先设置设备的```request_fn```为```do_rd_request```。进而设置了虚拟判断起始地址和长度。参数在main.c中传递。对于16M系统，起始地址是4MB。

```c
	blk_dev[MAJOR_NR].request_fn = DEVICE_REQUEST;
	rd_start = (char *) mem_start;
	rd_length = length;
	cp = rd_start;
```

接下来将虚拟盘的区域进行清零。

```c
	for (i=0; i < length; i++)
		*cp++ = '\0';
	return(length);
```

### do_rd_request

```c
void do_rd_request(void)
```

该函数的作用是处理当前的虚拟盘的请求。

首先检查请求项的合法性，若已没有请求项则退出。然后计算请求项目处理的虚拟盘中起始扇区在物理内存中对应的地址addr和占用的内存字节长度值len。如果当前请求项中的子设备号不为1或者对应内存起始位置大于虚拟盘末尾，则结束该请求项，并跳转到repeat处。

```c
	int	len;
	char	*addr;

	INIT_REQUEST;
	addr = rd_start + (CURRENT->sector << 9); // CURRENT->sector * 512
	len = CURRENT->nr_sectors << 9;           // CURRENT->nr_sector * 512
	// 检查参数的合法性
	if ((MINOR(CURRENT->dev) != 1) || (addr+len > rd_start+rd_length)) {
		end_request(0);
		goto repeat;
	}
```

接下来进行实际的读取操作。由于是对内存进行操作，不涉及和外设进行交互，其代码相对比较简单。

- 如果是写命令(WRITE)，则将请求项缓冲区的内容复制到地址addr处，长度为len字节。
- 如果是读命令(READ)，则将addr开始的内存内容复制到请求项缓冲区中，长度为len字节。否则显示命令不存在，死机。

```c
	if (CURRENT-> cmd == WRITE) {
		(void ) memcpy(addr,
			      CURRENT->buffer,
			      len);
	} else if (CURRENT->cmd == READ) {
		(void) memcpy(CURRENT->buffer, 
			      addr,
			      len);
	} else
		panic("unknown ramdisk-command");
	end_request(1);
	goto repeat;
```

### rd_load

```c
void rd_load(void)
```

该函数的作用是尝试把根文件系统加载到虚拟盘中。其调用关系如下：

```shell
├── sys_setup
  └── rd_load
```

如果在编译Linux-0.11内核源代码时，在配置文件中定义了RAMDISK的大小值，则内核代码在引导并初始化RAMDISK区域后就会首先尝试检测启动盘上的第256磁盘块，开始处是否存在一个根文件系统。

首先，检查系统中是否存在虚拟盘，如果```rd_length```长度为0，则返回。如果根文件系统不是软盘，则也退出。

```c
	if (!rd_length)
		return;
	printk("Ram disk: %d bytes, starting at 0x%x\n", rd_length,
		(int) rd_start);
	if (MAJOR(ROOT_DEV) != 2)
		return;
```

接下来读根文件系统的基本参数。即读软盘块256+1，256和256+2。 这里block+1指定的是超级块。检查其魔数是否是期望的，如果不是，则代表软盘上没有跟文件系统。

```c
	bh = breada(ROOT_DEV,block+1,block,block+2,-1);
	if (!bh) {
		printk("Disk error while looking for ramdisk!\n");
		return;
	}
	*((struct d_super_block *) &s) = *((struct d_super_block *) bh->b_data);
	brelse(bh);
	if (s.s_magic != SUPER_MAGIC)
		/* No ram disk image present, assume normal floppy boot */
		return;
```

我们试图把整个根文件系统读入到内存虚拟盘中。对于一个文件系统而言，其超级块结构的```s_nzones```字段中保存者总逻辑块数。一个逻辑块中含有的数据块由字段```s_log_zone_size```指定。

这里主要判断文件系统中的数据块总数是否大于内存虚拟盘所能容纳的块数的情况，如果是，则不能执行加载操作。

```c
	nblocks = s.s_nzones << s.s_log_zone_size;
	if (nblocks > (rd_length >> BLOCK_SIZE_BITS)) {
		printk("Ram disk image too big!  (%d blocks, %d avail)\n", 
			nblocks, rd_length >> BLOCK_SIZE_BITS);
		return;
	}
```

如果虚拟盘可以容纳的下文件系统的总的数据块。则循环将磁盘上的跟文件系统映像文件加载到虚拟盘上。

如果需要加载的盘块数大于2块，则使用```breada```进行预读取。这里的读取过程并不复杂，就是一个循环的过程。

```c
	cp = rd_start;
	while (nblocks) {
		if (nblocks > 2) 
			bh = breada(ROOT_DEV, block, block+1, block+2, -1);
		else
			bh = bread(ROOT_DEV, block);
		if (!bh) {
			printk("I/O error on block %d, aborting load\n", 
				block);
			return;
		}
		(void) memcpy(cp, bh->b_data, BLOCK_SIZE);
		brelse(bh);
		printk("\010\010\010\010\010%4dk",i);
		cp += BLOCK_SIZE;
		block++;
		nblocks--;
		i++;
	}
```

下面这里打印时用到了退格```\010```，因为前面的打印中使用了占位符```0000k```。

```c
printk("Loading %d bytes into ram disk... 0000k", 
		nblocks << BLOCK_SIZE_BITS);
...
printk("\010\010\010\010\010%4dk",i);
```

当boot盘中从256盘块开始的整个根文件系统加载完毕之后，我们显示done，并将目前的根文件系统设备号修改为```0x0101```。

```c
	printk("\010\010\010\010\010done \n");
	ROOT_DEV=0x0101;
```