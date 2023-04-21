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
该函数用于放回指定设备的超级块。
```c
	struct super_block * sb;
	/* struct m_inode * inode;*/
	int i;
```

首先判断该设备是否是根文件系统设备，如果是，则直接返回。
```c
	if (dev == ROOT_DEV) {
		printk("root diskette changed: prepare for armageddon\n\r");
		return;
	}
```

接着开始读取该设备的超级块。如果该超级块的挂载位置i节点s_imount还没有处理，则打印告警并返回。
```c
	if (!(sb = get_super(dev)))
		return;
	if (sb->s_imount) {
		printk("Mounted disk changed - tssk, tssk\n\r");
		return;
	}
```

找到该设备的超级块这时候，首先需要锁定该超级块。接着释放i节点位图和逻辑块位图。结束之后，对该超级块进行解锁，并返回。
```c	
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
该函数的作用是用于读取指定设备的超级块。

程序的开始定义了一些变量，对进行一些校验。
```c
	struct super_block * s;
	struct buffer_head * bh;
	int i,block;

	if (!dev)
		return NULL;
	check_disk_change(dev);
```

接着从超级块数组中获取一个超级块。如果已经存在，则直接返回该超级块的指针。如果不存在，则找出一个空闲的位置（s_dev=0）。找到之后边进行初始化。
```c
	if ((s = get_super(dev)))
		return s;
	for (s = 0+super_block ;; s++) {
		if (s >= NR_SUPER+super_block)
			return NULL;
		if (!s->s_dev)
			break;
	}
	s->s_dev = dev;
	s->s_isup = NULL;
	s->s_imount = NULL;
	s->s_time = 0;
	s->s_rd_only = 0;
	s->s_dirt = 0;
```

接下来就是读取该设备的第一个磁盘块到内存中。（第0个磁盘块是引导，第一个磁盘块是超级块。）
```c
	if (!(bh = bread(dev,1))) {
		s->s_dev=0;
		free_super(s);
		return NULL;
	}
	*((struct d_super_block *) s) =
		*((struct d_super_block *) bh->b_data);
	brelse(bh);
```

接下俩检查其魔数，如果不是0x137F，则不能处理。
```c
	if (s->s_magic != SUPER_MAGIC) {
		s->s_dev = 0;
		free_super(s);
		return NULL;
	}
```

接下来开始读取i节点位图和逻辑块位图数据。i节点位图在设备的第2号块开始，共占用s_imap_blocks块。逻辑块位图在i节点位图之后，共占用s_zmap_blocks块。
```c
	for (i=0;i<I_MAP_SLOTS;i++)
		s->s_imap[i] = NULL;
	for (i=0;i<Z_MAP_SLOTS;i++)
		s->s_zmap[i] = NULL;
	block=2;
	for (i=0 ; i < s->s_imap_blocks ; i++)
		if ((s->s_imap[i]=bread(dev,block)))
			block++;
		else
			break;
	for (i=0 ; i < s->s_zmap_blocks ; i++)
		if ((s->s_zmap[i]=bread(dev,block)))
			block++;
		else
			break;
```

接下来如果文件系统信息有问题，则意味着初始化失败，则进行失败的处理。
```c
	if (block != 2+s->s_imap_blocks+s->s_zmap_blocks) {
		for(i=0;i<I_MAP_SLOTS;i++)
			brelse(s->s_imap[i]);
		for(i=0;i<Z_MAP_SLOTS;i++)
			brelse(s->s_zmap[i]);
		s->s_dev=0;
		free_super(s);
		return NULL;
	}
```

程序运行到这里，说明一切正常。因为0号i节点和0号数据块是不能使用的，因此将i节点位图和逻辑块位图的0号位置设置为1。
```c
	s->s_imap[0]->b_data[0] |= 1;
	s->s_zmap[0]->b_data[0] |= 1;
	free_super(s);
	return s;
```
### sys_umount
```c
int sys_umount(char * dev_name)
```

该函数用于卸载一个文件系统。

程序的开始定义了一些变量，接着通过设备名称获取其i节点。
```c
	struct m_inode * inode;
	struct super_block * sb;
	int dev;

	if (!(inode=namei(dev_name)))
		return -ENOENT;
```

对于设备节点而言，其设备号存放在i节点的```i_zone[0]```中。如果该i节点不是一个块设备文件，则不能进行卸载，于是返回错误。
```c
	dev = inode->i_zone[0];
	if (!S_ISBLK(inode->i_mode)) {
		iput(inode);
		return -ENOTBLK;
	}
	iput(inode);
```

如果该设备号存放的是根文件系统，则不能进行卸载。
```c
	if (dev==ROOT_DEV)
		return -EBUSY;
```

接下来根据设备号取出其超级块，如果该超级块中的s_imount为NULL，也就是该设备没有被挂载，则不能进行卸载。
```c
	if (!(sb=get_super(dev)) || !(sb->s_imount))
		return -ENOENT;
```

如果挂载的目录节点的i_mount字段为0，则需要打印日志提示。
```c
	if (!sb->s_imount->i_mount)
		printk("Mounted inode has i_mount=0\n");
```

接下来遍历inode表，查看该设备节点是否被占用，如果被占用则返回错误。
```c
	for (inode=inode_table+0 ; inode<inode_table+NR_INODE ; inode++)
		if (inode->i_dev==dev && inode->i_count)
				return -EBUSY;
```

程序运行到这里，就开始正式的卸载。首先将挂载的目录节点的i_mount标记为0，随后放回该挂载目录节点。随后将超级块的s_imount字段标记为NULL，并将该文件系统的根i节点进行放回。
```c
	sb->s_imount->i_mount=0;
	iput(sb->s_imount);
	sb->s_imount = NULL;
	iput(sb->s_isup);
	sb->s_isup = NULL;
```
最后释放该设备上的超级块以及位图中占用的高速缓冲块，并对该设备进行数据同步。
```c
	put_super(dev);
	sync_dev(dev);
```

### sys_mount
```c
int sys_mount(char * dev_name, char * dir_name, int rw_flag)
```
该函数的作用是用于安装文件系统。该函数是sys_开头的，是一个系统调用。

函数的开始定义了一些变量，接着通过设备名称获取其i节点。
```c
	struct m_inode * dev_i, * dir_i;
	struct super_block * sb;
	int dev;

	if (!(dev_i=namei(dev_name)))
		return -ENOENT;
```

对于设备类型的i节点，其```i_zone[0]```存放的是设备号dev。接着判断该设备是否是一个块设备文件，如果不是块设备文件，是不能挂在文件系统的，就会返回权限错误。如果权限校验没有问题，就把dev_i节点放回。

```c
	dev = dev_i->i_zone[0];   //获取其设备号dev
	if (!S_ISBLK(dev_i->i_mode)) { //判断该i节点是否是一个设备节点，如果不是则返回权限错误
		iput(dev_i);
		return -EPERM;
	}
	iput(dev_i);  //获取到dev_i
```

接下来获取dir_name对应的i节点dir_i。
```c
	if (!(dir_i=namei(dir_name))) //获取dir_name的i节点
		return -ENOENT;
```

如果dir_i这个i节点的引用计数不为1，也就是说这个i节点还被其他进程使用，或者dir_i节点是根文件系统的1号i节点，则不能进行挂载。
```c
	if (dir_i->i_count != 1 || dir_i->i_num == ROOT_INO) {
		iput(dir_i);
		return -EBUSY;
	}
```

此外，如果该i节点不是一个目录节点，则也不能进行挂载。
```c
	if (!S_ISDIR(dir_i->i_mode)) { //判断dir_i的类型，如果不是目录节点则不能进行挂载
		iput(dir_i);
		return -EPERM;
	}
```

当运行到这里时，就意味着对挂载设备和挂载目录的校验就通过了。接下来，读取设备dev的超级块。
```c
	if (!(sb=read_super(dev))) {//读取dev设备的超级块
		iput(dir_i);
		return -EBUSY;
	}
```

如果该超级块已经挂载到某个目录下，那么将返回错误。如果该目录已经挂载了其他的块设备，也返回错误。
```c
	if (sb->s_imount) {//超级块的s_imount不为空，代表该超级块已经挂载到某个目录下，则返回EBUSY
		iput(dir_i);
		return -EBUSY;
	}
	if (dir_i->i_mount) {//目标的目录节点已经挂载了其他的设备，则返回EPERM
		iput(dir_i);
		return -EPERM;
	}
```

最后便开始进行真正的挂载步骤，其实就是将超级块sb的s_imount指向挂载的目录i节点dir_i。接着将目录i节点dir_i的i_mount字段标记为1，也将i_dirt标记为1。这些执行完毕之后，将返回0。
```c
	sb->s_imount=dir_i;
	dir_i->i_mount=1;
	dir_i->i_dirt=1;
	return 0;
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