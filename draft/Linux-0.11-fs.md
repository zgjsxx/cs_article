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



知道了inode的序号，如何在硬盘上查找到inode块的内容？

回顾一下minux文件系统的分布， 如下图所示:

![inode](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/minix_fs.drawio.png)

其中引导块为一个block，超级块为一个block，inode位图的大小在超级块中定义，逻辑块位图的大小在超级块中定义，

因此序号为n的inode， 在磁盘上的盘块号

n = 1 + 1 + s_imap_blocks + s_zmap_blocks + n - 1/每个磁盘块存储的inode数量


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