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

### rd_load