---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统file_dev.c详解

## 模块简介

## 函数详解

### file_read
```c
int file_read(struct m_inode * inode, struct file * filp, char * buf, int count)
```
该函数是文件读的函数。

首先定义了一些参数，这里不做介绍，下面用到时，再详解。
```c
int left,chars,nr;
struct buffer_head * bh;
```

接着进行参数的校验， 如果入参count等于0， 代表不读任何数据，则直接返回0。
```c
if ((left=count)<=0)
    return 0;
```

接下来，只要left值不为0，那么首先调用bmap函数获取当前文件指针指向的数据块磁盘上的逻辑位置nr。得到nr值之后，调用bread函数读取一个盘块的数据到bh块中。
```c
while (left) {
    if ((nr = bmap(inode,(filp->f_pos)/BLOCK_SIZE))) {
        if (!(bh=bread(inode->i_dev,nr)))
            break;
    } else
        bh = NULL;
```

接下来计算文件指针指向的数据块中还剩下多少内容，将其和left相比，计算出两者较小值赋值给chars。接着将文件指针加上chars，将left减去chars。
```c
nr = filp->f_pos % BLOCK_SIZE;
chars = MIN( BLOCK_SIZE-nr , left );
filp->f_pos += chars;
left -= chars;
```

接下来便开始本轮的文件读，调用put_fs_bytes拷贝数据到buf中。
```c
if (bh) {
    char * p = nr + bh->b_data;
    while (chars-->0)
        put_fs_byte(*(p++),buf++);
    brelse(bh);
} else {
    while (chars-->0)
        put_fs_byte(0,buf++);
}
```

程序的最后修改了文件的atime属性。返回读取的字节数。
```c
inode->i_atime = CURRENT_TIME;
return (count-left)?(count-left):-ERROR;
```

### file_write
```c
int file_write(struct m_inode * inode, struct file * filp, char * buf, int count)
```

该函数是文件写的函数。

首先定义了一些参数，这里不做介绍，下面用到时，再详解。
```c
off_t pos;
int block,c;
struct buffer_head * bh;
char * p;
int i=0;
```

当flag中设置了```O_APPEND```参数时，将pos指针指向文件尾。否则指向当前文件指针的位置。
```c
if (filp->f_flags & O_APPEND)
    pos = inode->i_size;
else
    pos = filp->f_pos;
```

接下来，当i小于count时进入循环，首先调用create_block从磁盘上获取一个逻辑块号，调用bread将磁盘块中的内容拷贝到bh中。
```c
while (i<count) {
    if (!(block = create_block(inode,pos/BLOCK_SIZE)))
        break;
    if (!(bh=bread(inode->i_dev,block)))
        break;
```

对于当前的逻辑块，其已经写 pos % BLOCK_SIZE个字节， 其距离数据块的末尾还有(BLOCK_SIZE - c)个字节。
```c
c = pos % BLOCK_SIZE;
p = c + bh->b_data;
bh->b_dirt = 1;
c = BLOCK_SIZE-c;
if (c > count-i) c = count-i;
pos += c;
if (pos > inode->i_size) {
    inode->i_size = pos;
    inode->i_dirt = 1;
}
i += c;
```
最后调用get_fs_bytes指针将buf中的数据拷贝到bh块中。
```c
while (c-->0)
    *(p++) = get_fs_byte(buf++);
brelse(bh);
```


```c
inode->i_mtime = CURRENT_TIME;
if (!(filp->f_flags & O_APPEND)) {
    filp->f_pos = pos;
    inode->i_ctime = CURRENT_TIME;
}
```
## Q & A
