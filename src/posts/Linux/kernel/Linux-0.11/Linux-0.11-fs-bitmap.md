---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统bitmap.c详解

## 模块简介

该模块包含了两对函数，第一对是和i节点相关的**free_inode()**和**new_inode()**。第二对是和逻辑块相关的**free_block()**和**new_block()**。

## 函数详解

### free_block
```c
void free_block(int dev, int block)
```
该函数的作用是释放设备dev上的序号为block的逻辑块。 入参中的block是**磁盘上的绝对位置**。

首先从设备dev中取出超级快。如果找不到，则返回内核错误。
```c
struct super_block * sb;
struct buffer_head * bh;

if (!(sb = get_super(dev)))
    panic("trying to free block on nonexistent device");
```

接下来判断盘块号block的有效性，如果盘块号block小于数据区一个数据块的盘块号或者大于设备上的总的逻辑块， 则出错停机。
```c
if (block < sb->s_firstdatazone || block >= sb->s_nzones)
    panic("trying to free block not in datazone");
```

接下来从哈希链表中查找bh块， 如果找到了， 如果引用计数>=2， 则返回。 如果引用计数为1， 则将bh块上的b_dirt和b_uptodate属性置为0，然后将引用计数减1。
```c
bh = get_hash_table(dev,block);
if (bh) {
    if (bh->b_count != 1) {
        printk("trying to free block (%04x:%d), count=%d\n",
            dev,block,bh->b_count);
        return;
    }
    bh->b_dirt=0;
    bh->b_uptodate=0;
    brelse(bh);
}
```

接下来，将block对应的数据块位图置为0， 代表该块已经被释放。
```c
block -= sb->s_firstdatazone - 1 ;
if (clear_bit(block&8191,sb->s_zmap[block/8192]->b_data)) {
    printk("block (%04x:%d) ",dev,block+sb->s_firstdatazone-1);
    panic("free_block: bit already cleared");
}
sb->s_zmap[block/8192]->b_dirt = 1;
```

### new_block
```c
int new_block(int dev)
```
该函数的作用是向设备申请一个逻辑块。

```c
	struct buffer_head * bh;
	struct super_block * sb;
	int i,j;

	if (!(sb = get_super(dev))) //首先获取数据块的超级块
		panic("trying to get new block from nonexistant device");
	j = 8192;
	for (i=0 ; i<8 ; i++)
		if ((bh=sb->s_zmap[i])) /
			if ((j=find_first_zero(bh->b_data))<8192)//寻找空闲的标记位
				break;
	if (i>=8 || !bh || j>=8192)
		return 0;
	if (set_bit(j,bh->b_data))//设置已使用的标记
		panic("new_block: bit already set");
	bh->b_dirt = 1;
```

这里需要区别两个概念，即磁盘块号和逻辑块号。磁盘块号是一个绝对位置，而逻辑块号是一个相对位置。这两者之间有一个s_firstdatazone的差，即减去磁盘分区上的前几个块(引导块/超级快/i节点位图/逻辑块位图/i节点)。在超级块中s_firstdatazone记录了第一个数据块的磁盘号。所以，逻辑号和磁盘号之间有关系
```block = nr + s_firstdatazone -1	```

下面这里在得到存储的逻辑位置(i,j)之后，计算绝对位置时，便使用了上述公式```j += i*8192 + sb->s_firstdatazone-1```:
```c
	j += i*8192 + sb->s_firstdatazone-1;
	if (j >= sb->s_nzones)
		return 0;
	if (!(bh=getblk(dev,j)))//获取该block的bh块
		panic("new_block: cannot get block");
	if (bh->b_count != 1)
		panic("new block: count is != 1");
	clear_block(bh->b_data);//清除数据
	bh->b_uptodate = 1;
	bh->b_dirt = 1;
	brelse(bh);
	return j;
```
### free_inode
```c
void free_inode(struct m_inode * inode)
```
该函数的作用是释放指定的inode节点。该函数在iput函数(inode.c)中如果文件的链接数为0的时候被调用。

m_前缀代表是内存中存储的i节点格式。 d_前缀代表的是磁盘中i节点格式。

```c
	struct super_block * sb;
	struct buffer_head * bh;

	if (!inode)//inode地址为空
		return;
	if (!inode->i_dev) {//i节点设备号为0，代表没有使用
		memset(inode,0,sizeof(*inode));
		return;
	}
	if (inode->i_count>1) {//i节点还有其他引用
		printk("trying to free inode with count=%d\n",inode->i_count);
		panic("free_inode");
	}
	if (inode->i_nlinks)//文件链接数不为0
		panic("trying to free inode with links");
	if (!(sb = get_super(inode->i_dev)))//获取i节点所在设备的超级块
		panic("trying to free inode on nonexistent device");
	if (inode->i_num < 1 || inode->i_num > sb->s_ninodes)
		panic("trying to free inode 0 or nonexistant inode");
	if (!(bh=sb->s_imap[inode->i_num>>13]))
		panic("nonexistent imap in superblock");
	if (clear_bit(inode->i_num&8191,bh->b_data))//清除使用标记位
		printk("free_inode: bit already cleared.\n\r");
	bh->b_dirt = 1;
	memset(inode,0,sizeof(*inode));
```

### new_inode
```c
struct m_inode * new_inode(int dev)
```
该函数的作用是向dev设备申请一个i节点。

```c
	struct m_inode * inode;
	struct super_block * sb;
	struct buffer_head * bh;
	int i,j;

	if (!(inode=get_empty_inode()))//从内存i节点表获取一个空闲项
		return NULL;
	if (!(sb = get_super(dev)))
		panic("new_inode with unknown device");
	j = 8192;
	for (i=0 ; i<8 ; i++)
		if ((bh=sb->s_imap[i]))
			if ((j=find_first_zero(bh->b_data))<8192)//寻找空闲的标记位
				break;
	if (!bh || j >= 8192 || j+i*8192 > sb->s_ninodes) {
		iput(inode);
		return NULL;
	}
	if (set_bit(j,bh->b_data))
		panic("new_inode: bit already set");
	bh->b_dirt = 1;
	inode->i_count=1;//给i节点进行赋值
	inode->i_nlinks=1;
	inode->i_dev=dev;
	inode->i_uid=current->euid;
	inode->i_gid=current->egid;
	inode->i_dirt=1;
	inode->i_num = j + i*8192;
	inode->i_mtime = inode->i_atime = inode->i_ctime = CURRENT_TIME;
	return inode;
```