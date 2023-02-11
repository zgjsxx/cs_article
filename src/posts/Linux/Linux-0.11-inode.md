---
category:
  - Linux
Tags:
  - Linux
---

# Linux-0.11 文件系统inode.c详解

## read_inode

```c
static void read_inode(struct m_inode * inode);
```

该函数的作用是通过inode的编号，在磁盘上找到inode块的内容。

回顾一下minix文件系统的分布，如下图所示:

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/minixfs.drawio.png)

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/inode_map.drawio.png)

其中引导块为一个block，超级块为一个block，inode位图的大小在超级块中定义，逻辑块位图的大小在超级块中定义。跳过这些块，就可以来到inode节点块的起点。

那么inode节点会在哪个block中呢？

inode节点的序号从0开始， 但是0号是个保留号， 实际存储并不会存0号inode， 因此inode的实际起始位置是1。

因此序号为n的inode，在磁盘上的盘块号为:

block = 1 + 1 + s_imap_blocks + s_zmap_blocks + (n - 1)/每个磁盘块存储的inode数量。

找到了inode所在的磁盘块， 计算inode在该块中的下标， 则通过

index = (n - 1) % 每个磁盘块存储的inode数量

到此， 给定一个inode号，就可以从磁盘上找到对应的inode节点。


```C
if (!(sb=get_super(inode->i_dev)))
    panic("trying to read inode without dev");
block = 2 + sb->s_imap_blocks + sb->s_zmap_blocks +
    (inode->i_num-1)/INODES_PER_BLOCK;
if (!(bh=bread(inode->i_dev,block)))
    panic("unable to read i-node block");
*(struct d_inode *)inode =
    ((struct d_inode *)bh->b_data)
        [(inode->i_num-1)%INODES_PER_BLOCK];
```

## iget(int dev,int nr)

```c
iget(int dev,int nr)
```
该函数的作用主要是通过设备号和inode的序号获取对应的inode节点。

需要注意的是，如果一个硬盘上装有**多个文件系统**，需要处理**一个inode节点是另一个文件系统挂载点**的情况。

如果i节点是某个文件系统的安装点， 则在超级块的表中搜索即可搜索到。 若找到了相应的超级块， 则将该i节点写盘。再从安装此i节点的文件系统的超级快块上取设备号，并令i节点为1。

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/inode_iget.png)




## iput
```c
放回一个i节点。 该函数主要用于将i节点的引用计数递减1。
```

## write_inode
```c
static void write_inode(struct m_inode * inode)
```
该函数在搜索inode节点的功能上和read_inode相同。

有所区别的是该函数是修改一个inode的值， 因此在找到inode节点后需要进行赋值， 并将buffer块标记为脏页，以回写到磁盘上。

```c
((struct d_inode *)bh->b_data)
    [(inode->i_num-1)%INODES_PER_BLOCK] =
        *(struct d_inode *)inode;
bh->b_dirt=1;
inode->i_dirt=0;
```

## get_empty_inode
```c
struct m_inode * get_empty_inode(void)
```
该函数的作用是从空闲的inode表中获取一个空闲的i节点项。

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/get_empty_inode.png)


## _bmap
```c
static int _bmap(struct m_inode * inode,int block,int create)
```
该函数的作用就是映射文件数据块到盘块的处理操作。

如果block号小于7， 则直接寻址。

如果block号大于7， 小于等于7 + 512， 则通过一次寻址。

如果block号大于7 + 512 ， 小于等于7 + 512 + 512 * 512， 则通过二次寻址。

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/inode_search_address.png)


## create_block
```c
int create_block(struct m_inode * inode, int block)
```

create block底层调用了_bmap函数，去磁盘上申请一个逻辑块， 并与inode关联， 通过返回该逻辑块的盘块号。

## bmap
```c
int bmap(struct m_inode * inode,int block)
```
该函数的作用是通过文件数据块的块号返回其磁盘上的盘块号。

## sync_inodes
```c
void sync_inodes(void)
```
将inode表中的脏的数据刷到磁盘上。

## invalidate_inodes
```c
void invalidate_inodes(int dev)
```
释放设备dev在内存i节点表中的所有i节点。

## lock_inode
```c
static inline void lock_inode(struct m_inode * inode)
```

锁定某个inode。
```c
cli();//关中断
while (inode->i_lock)
    sleep_on(&inode->i_wait);
inode->i_lock=1; //将该inode的锁定状态修改为1
sti();//开中断
```

## wait_on_inode
```c
static inline void wait_on_inode(struct m_inode * inode)
```
等待inode块解锁。

该代表较为简单， 直接通过注释进行解释。

```c
cli(); //关中断
while (inode->i_lock) 
    sleep_on(&inode->i_wait); //如果该inode被加锁， 就将当前进程状态修改为TASK_UNINTERRUPTIBLE
sti();//开中断
```
## unlock_inode

```c
static inline void unlock_inode(struct m_inode * inode)
```

对该inode 解锁。
```c
inode->i_lock=0;//将该inode的锁定状态修改为0.
wake_up(&inode->i_wait);//唤醒等待该inode的进程
```