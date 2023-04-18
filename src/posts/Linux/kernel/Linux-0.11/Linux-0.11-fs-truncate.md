---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统truncate.c详解

## 模块简介

## 函数详解

### free_ind
```c
static void free_ind(int dev,int block)
```
该函数的作用是**释放所有的一次间接块**。

该函数首先读取一次间接块到bh中, 该bh块中存储了512个盘块号。
```c
struct buffer_head * bh;
unsigned short * p;
int i;

if (!block)
    return;
if ((bh=bread(dev,block))) {
```

接下来就对这512个盘块号进行遍历，如果盘块号不为0， 就调用**free_block**(bitmap.c中)释放该盘块。遍历完毕之后，将一次间接块的bh块引用计数减1。最后将这个一次间接块也进行释放。

```c
for (i=0;i<512;i++,p++)
    if (*p)
        free_block(dev,*p);
brelse(bh);
free_block(dev,block);
```


### free_dind
```c
static void free_dind(int dev,int block)
```
该函数的作用就是**释放所有的二次间接块**。

该函数首先对盘块号的有效性进行校验。

```c
struct buffer_head * bh;
unsigned short * p;
int i;

if (!block)
    return;
```

接着读取二次间接块到bh中, 该bh块中存储了512个一次间接块的盘块号。

接下来就对这512个一次间接块的盘块号进行遍历，如果盘块号不为0， 就调用**free_ind**释放该一次间接块所有的block。遍历完毕之后，将二次间接块的bh块引用计数减1。最后将这个二次间接块也进行释放。

```c
if ((bh=bread(dev,block))) {
    p = (unsigned short *) bh->b_data;
    for (i=0;i<512;i++,p++)
        if (*p)
            free_ind(dev,*p);
    brelse(bh);
}
free_block(dev,block);
```

### truncate
```c
void truncate(struct m_inode * inode)
```
该函数的作用是释放该inode所占据的磁盘空间。 该函数在iput函数(inode.c)中如果文件的链接数为0的时候被调用。

代码最开始检查如果不是**常规文件**或者是**目录文件**，就跳过。
```c
int i;

if (!(S_ISREG(inode->i_mode) || S_ISDIR(inode->i_mode)))
    return;
```

释放直接引用块。
```c
for (i=0;i<7;i++)
    if (inode->i_zone[i]) {
        free_block(inode->i_dev,inode->i_zone[i]);
        inode->i_zone[i]=0;
    }

```

释放一次间接块和二次间接块。
```c
free_ind(inode->i_dev,inode->i_zone[7]);
free_dind(inode->i_dev,inode->i_zone[8]);
```

将一次间接块和二次间接块的地址置为0。将inode的size置为0， 将该inode设置为含有脏数据， 最后将inode的修改时候和创建时间都修改为当前时间。

```c
inode->i_zone[7] = inode->i_zone[8] = 0;
inode->i_size = 0;
inode->i_dirt = 1;
inode->i_mtime = inode->i_ctime = CURRENT_TIME;
```