
# Linux-0.11 文件系统
```c
struct buffer_head * getblk(int dev,int block)
```
**作用**:获取高速缓存中指定的缓存块


```c
bread(int dev,int block)
```
**作用**:从设备上读取一个逻辑块内容到缓存块上

```c
iget(int dev,int nr)
```

## 知道了inode的序号，如何在硬盘上查找到inode块的内容？

回顾一下minux文件系统的分布， 如下图所示:

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/minixfs.drawio.png)

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/inode_map.drawio.png)

其中引导块为一个block，超级块为一个block，inode位图的大小在超级块中定义，逻辑块位图的大小在超级块中定义。 跳过这些块， 就可以来到inode节点块的起点。

那么inode节点会在哪个block中呢？

inode节点的序号从0开始， 但是0号是个保留号， 实际存储并不会存0号inode， 因此inode的实际起始位置是1。


因此序号为n的inode， 在磁盘上的盘块号为:

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


字节Byte是计算机数据处理的最小单位，习惯上用大写的B表示，每个字节有8个二进制位，其中**最右边**的一位为最低位，**最左边**的一位为最高位，每个二进制位的值不是0就是1。一个字节由8个二进制位组成。也就是1字节Byte等于8比特Bit。这也是计算机设计时规定的。一个字节最大为8个1（11111111）即2的8次方，总共是256种状态。


```c
static struct m_inode * get_dir(const char * pathname)
```

绝对路径

/home/work/test.c

/   ->找到 /的inode
thisname = "home/work/test.c"

namelen=4


指定长度的字符串和de->name做比较
```c
static int match(int len,const char * name,struct dir_entry * de)
```
name字符串的前len个字符与de->name做比较

m_inode:内存中存取的inode的内容

d_inode:磁盘中的inode的内容


sys_open->open_namei->