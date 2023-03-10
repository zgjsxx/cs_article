---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统bitmap.c详解


## free_block
```c
void free_block(int dev, int block)
```
该函数的作用是释放设备dev上的序号为block的逻辑块。

首先从设备dev中取出超级快。
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

## new_block
```c
int new_block(int dev)
```

## free_inode
```c
void free_inode(struct m_inode * inode)
```
该函数的作用是释放指定的inode节点。该函数在iput函数(inode.c)中如果文件的链接数为0的时候被调用。

## new_inode
```c
struct m_inode * new_inode(int dev)
```