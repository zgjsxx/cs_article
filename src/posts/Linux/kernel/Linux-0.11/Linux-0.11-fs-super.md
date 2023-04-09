---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统super.c详解

## 模块简介

## 函数详解

### lock_super
```c
static void lock_super(struct super_block * sb)
```
该函数的作用是锁定bh块。

```c
    cli();//关中断
    while (sb->s_lock)//如果已经被锁定
        sleep_on(&(sb->s_wait));//将当前任务置为不可中断的等待状态，并添加到该超级快等待队列。
    sb->s_lock = 1;//锁定该超级快
    sti();//关中断
```

### free_super
```c
static void free_super(struct super_block * sb)
```
对指定超级块进行解锁。

```c
	cli();//关中断
	sb->s_lock = 0;//对超级块进行解锁
	wake_up(&(sb->s_wait));//唤醒等待该超级块的进程
	sti();//开中断
```

### wait_on_super
```c
static void wait_on_super(struct super_block * sb)
```
该函数的作用是等待超级块解锁。
```c
	cli();//关中断
	while (sb->s_lock)//如果已经被锁定
		sleep_on(&(sb->s_wait));//将当前任务置为不可中断的等待状态，并添加到该超级快等待队列。
	sti();//开中断
```

### get_super
```c
struct super_block * get_super(int dev)
```
获取指定设备的超级块。
```c
	struct super_block * s;

	if (!dev)
		return NULL;
	s = 0+super_block;
	while (s < NR_SUPER+super_block)
		if (s->s_dev == dev) {
			wait_on_super(s);
			if (s->s_dev == dev)
				return s;
			s = 0+super_block;
		} else
			s++;
	return NULL;
```

### put_super
```c
void put_super(int dev)
```

```c
	struct super_block * sb;
	/* struct m_inode * inode;*/
	int i;

	if (dev == ROOT_DEV) {
		printk("root diskette changed: prepare for armageddon\n\r");
		return;
	}
	if (!(sb = get_super(dev)))
		return;
	if (sb->s_imount) {
		printk("Mounted disk changed - tssk, tssk\n\r");
		return;
	}
	lock_super(sb);
	sb->s_dev = 0;
	for(i=0;i<I_MAP_SLOTS;i++)
		brelse(sb->s_imap[i]);
	for(i=0;i<Z_MAP_SLOTS;i++)
		brelse(sb->s_zmap[i]);
	free_super(sb);
	return;
```

### read_super
```c
static struct super_block * read_super(int dev)
```

读取该设备的第一个磁盘块。第0个磁盘块是引导，第一个磁盘块是超级块。
```c
	if (!(bh = bread(dev,1))) {
		s->s_dev=0;
		free_super(s);
		return NULL;
	}
```
### sys_umount
```c
int sys_umount(char * dev_name)
```

### sys_mount
```c
int sys_mount(char * dev_name, char * dir_name, int rw_flag)
```

### mount_root
```c
void mount_root(void)
```
该函数的作用是安装根文件系统。

该函数的最初定义了一些变量，对d_inode的结构的长度进行校验。
```c
	int i,free;
	struct super_block * p;
	struct m_inode * mi;

	if (32 != sizeof (struct d_inode))
		panic("bad i-node size");
```

如果根文件系统在软盘中，就提示插入跟文件系统盘。
```c
	for(i=0;i<NR_FILE;i++)
		file_table[i].f_count=0;
	if (MAJOR(ROOT_DEV) == 2) {
		printk("Insert root floppy and press ENTER");
		wait_for_keypress();
	}
```

初始化超级块数组。
```c
	for(p = &super_block[0] ; p < &super_block[NR_SUPER] ; p++) {
		p->s_dev = 0;
		p->s_lock = 0;
		p->s_wait = NULL;
	}
```

读取根文件系统的超级块。
```c
	if (!(p=read_super(ROOT_DEV)))
		panic("Unable to mount root");
```

读取根目录的i节点。
```c
	if (!(mi=iget(ROOT_DEV,ROOT_INO)))
		panic("Unable to read root i-node");
```

该函数在init进程中调用，下面设置init进程PCB的pwd和root。

```c
	mi->i_count += 3 ;	/* NOTE! it is logically used 4 times, not 1 */
	p->s_isup = p->s_imount = mi;
	current->pwd = mi;
	current->root = mi;
```

统计空闲的i节点数量。
```c
	free=0;
	i=p->s_nzones;
	while (-- i >= 0)
		if (!set_bit(i&8191,p->s_zmap[i>>13]->b_data))
			free++;
	printk("%d/%d free blocks\n\r",free,p->s_nzones);
```

统计空闲的逻辑块节点。
```c
	free=0;
	i=p->s_ninodes+1;
	while (-- i >= 0)
		if (!set_bit(i&8191,p->s_imap[i>>13]->b_data))
			free++;
	printk("%d/%d free inodes\n\r",free,p->s_ninodes);
```
## Q & A