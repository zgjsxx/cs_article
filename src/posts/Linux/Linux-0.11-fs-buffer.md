---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统buffer.c详解

## buffer_init
```c
void buffer_init(long buffer_end)
```

该函数的作用主要是初始化磁盘的高速缓冲区.

刚开始使用h指向了start_buffer的位置。
```c
struct buffer_head * h = start_buffer;
void * b;
int i;
```

start_buffer定义为end的位置，即内存中system模块的结束的位置。
```c
struct buffer_head * start_buffer = (struct buffer_head *) &end;
```
经过这个步骤之后h实际上指向了内核高速缓冲区的低地址。


接下来使用了b指针指向了内核告诉缓冲区的高地址。
```c
if (buffer_end == 1<<20)
  b = (void *) (640*1024);
else
  b = (void *) buffer_end;
```
这里根据buffer_end的值的不同，决定了b的指向。

在main.c文件中给定了buffer_end的大小定义:

- 内存大小>12Mb，buffer_end=4Mb
- 6Mb<内存大小<=12Mb，buffer_end=2Mb
- 如果内存大小<=6Mb，buffer_end=1Mb

知道了buffer_end的值，那么很容易通过条件语句得到b的值。

那么为什么要对buffer_end的值进行讨论呢？

这主要是因为物理内存中640K-1M的区域内存放了显存和BIOS ROM，因此当buffer_end=1M， 高速缓冲区是一块， 如果buffer_end>1M， 那么高速缓冲区是两块， 这个点通过下面这张图可以清晰的了解到。

![buffer_init](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/buffer/buffer_init.png)

buffer_init接下来要做的就是对这些高速缓冲区进行初始化
```c
while ( (b -= BLOCK_SIZE) >= ((void *) (h+1)) ) {
  h->b_dev = 0;
  h->b_dirt = 0;
  h->b_count = 0;
  h->b_lock = 0;
  h->b_uptodate = 0;
  h->b_wait = NULL;
  h->b_next = NULL;
  h->b_prev = NULL;
  h->b_data = (char *) b;
  h->b_prev_free = h-1;
  h->b_next_free = h+1;
  h++;
  NR_BUFFERS++;
  if (b == (void *) 0x100000)
    b = (void *) 0xA0000;
}
```
让每一个buffer_header节点使用b_data指针指向一个数据块block(1k)。然后h指针加1，b指针减1。直到h和b指针指向的区别相交。

这些buffer_header用一个双向链表进行串联。

需要注意的是， 当内存大于6Mb时， 高速缓冲区有两块， 当b指针在移动时，如果**移动到了1Mb的地址**时，也就是到了显存和BIOS ROM的高地址边界时， 需要跳过它，直接来到640Kb的地址。也就是下面这两行代码。

```c
if (b == (void *) 0x100000)
  b = (void *) 0xA0000;
```
h指针和b指针移动进行初始化的效果如下图所示：

![buffer_init](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/buffer/buffer_init2.png)

最后这段代码， 将free_list指向了第一个buffer_header块。然后让首尾两个buffer_header相接， 形成完整的双向链表。 最后的话，将高速哈希表中的每一行初始化为NULL。
```c
free_list = start_buffer;
free_list->b_prev_free = h;
h->b_next_free = free_list;
for (i=0;i<NR_HASH;i++)
  hash_table[i]=NULL;
```


## find_buffer
```c
static struct buffer_head * find_buffer(int dev, int block)
```
该函数的作用是从哈希队列中按照设备号和逻辑块号去查询对应的缓冲区块。

首先根据设备号和块号查找到哈希数组的下标，找到下标对应的bh， 遍历该bh通过b_next连接起来的链表， 看该链表中是否有匹配的。如下图所示：

![find_buffer](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-fs/buffer/find_buffer.png)

这个过程的代码如下：

```c
for (tmp = hash(dev,block) ; tmp != NULL ; tmp = tmp->b_next)//计算哈希值， 遍历该哈希桶上的链表
  if (tmp->b_dev==dev && tmp->b_blocknr==block)  //如果设备号和块号相同， 代表找到了， 返回bh块
    return tmp;
return NULL;
```

## get_hash_table
```c
struct buffer_head * get_hash_table(int dev, int block)
```
该函数的作用是从哈希链表中找到指定的bh块。其内部调用了find_buffer函数， 内部增加了如果bh块被其他进程占用情况的处理。

从下面的代码可以看出， 首先调用了find_buffer函数寻找执行的bh块， 如果没有找到， 就直接返回，暗示**可能要再去自由链表上去搜索**。

```c
for (;;) {
  if (!(bh=find_buffer(dev,block)))
    return NULL;
```

如果找到了bh块，就是看这个块是否有其他进程加锁，如果没有就将引用计数加1。如果有的话就等待锁的释放。
```c
bh->b_count++;
wait_on_buffer(bh);
if (bh->b_dev == dev && bh->b_blocknr == block)
  return bh;
bh->b_count--;
```
## getblk
```c
struct buffer_head * getblk(int dev,int block)
```

该函数的作用是从**哈希链表**和**自由链表**两个地方寻找可用的bh块。

该函数先从哈希链表中寻找指定的bh块。如果找到了就直接返回。
```c
if ((bh = get_hash_table(dev,block)))
  return bh;
```

当从哈希表中没有找到对应的bh块时， 就需要去自由链表中查找一个**品质**最好的块。品质是根据bh块的b_dirt和b_lock去计算的。 在遍历过程中， 会查看某个块是否引用计数为0, 为0则放入备选项， 然后继续遍历， 如果后续找到了更**品质**的块， 就更新该备选项。遍历结束之后就找到了最佳的bh块。

```c
do {
  if (tmp->b_count)
    continue;
  if (!bh || BADNESS(tmp)<BADNESS(bh)) {
    bh = tmp;
    if (!BADNESS(tmp))
      break;
  }
/* and repeat until we find something good */
} while ((tmp = tmp->b_next_free) != free_list);
```

如果这个过程， 仍然没有找到可用的bh块， 代表现在高速缓冲区很繁忙，则需要等待。
```c
if (!bh) {
  sleep_on(&buffer_wait);
  goto repeat;
}
```


如果经过上述步骤找到了一个**最佳品质**的bh块之后，如果该块有锁，则等待锁的释放， 如果没有锁， 但是有脏数据， 就将脏数据写盘。
```c
wait_on_buffer(bh);
if (bh->b_count)
  goto repeat;
while (bh->b_dirt) {
  sync_dev(bh->b_dev);
  wait_on_buffer(bh);
  if (bh->b_count)
    goto repeat;
}
```

如果该block已经被添加到哈希链表中， 则需要重新寻找。
```c
if (find_buffer(dev,block))
  goto repeat;
```

到此为止，终于找到了可用的bh块，将其初始化，并且插入到哈希链表中。
```c
bh->b_count=1;
bh->b_dirt=0;
bh->b_uptodate=0;
remove_from_queues(bh);
bh->b_dev=dev;
bh->b_blocknr=block;
insert_into_queues(bh);
```
## remove_from_queues
```c
static inline void remove_from_queues(struct buffer_head * bh)
```
该函数的作用是将buffer_header(简称bh)从空闲链表和哈希队列中移除。

下面这段代码作用是将bh从哈希队列中移除。
```c
if (bh->b_next)
  bh->b_next->b_prev = bh->b_prev;
if (bh->b_prev)
  bh->b_prev->b_next = bh->b_next;
if (hash(bh->b_dev,bh->b_blocknr) == bh)
  hash(bh->b_dev,bh->b_blocknr) = bh->b_next;
```

下面这段代码作用是将bh从自由链表中移除。
```c
if (!(bh->b_prev_free) || !(bh->b_next_free))
  panic("Free block list corrupted");
bh->b_prev_free->b_next_free = bh->b_next_free;
bh->b_next_free->b_prev_free = bh->b_prev_free;
if (free_list == bh)
  free_list = bh->b_next_free;
```

## insert_into_queues
```c
static inline void insert_into_queues(struct buffer_head * bh)
```
该函数的作用就是将bh插入到空闲链表的尾部，并通入哈希函数插入到指定的哈希队列中。

下面这段代码的作用就是将bh插入到双向链表的尾部
```c
bh->b_next_free = free_list;
bh->b_prev_free = free_list->b_prev_free;
free_list->b_prev_free->b_next_free = bh;
free_list->b_prev_free = bh;
```
下面这段代码就是将bh插入到哈希表的首部。
```c
bh->b_prev = NULL;
bh->b_next = NULL;
if (!bh->b_dev)
  return;
bh->b_next = hash(bh->b_dev,bh->b_blocknr);
hash(bh->b_dev,bh->b_blocknr) = bh;
bh->b_next->b_prev = bh;
```

## brelse
```c
void brelse(struct buffer_head * buf)
```
该函数的作用是释放一个bh块。

将该块的引用计数减1。
```c
if (!(buf->b_count--))
  panic("Trying to free free buffer");
```


## bread
```c
struct buffer_head * bread(int dev,int block)
```
该函数的作用是用于去指定的设备上读取相应的块。

首先在高速缓冲区中找到一个bh块， 随后调用磁盘读写函数ll_rw_block向磁盘设别发出读请求， 将磁盘内容读取到bh块中。
```c
if (!(bh=getblk(dev,block)))
  panic("bread: getblk returned NULL\n");
if (bh->b_uptodate)
  return bh;
ll_rw_block(READ,bh);
```

## bread_page
```c
void bread_page(unsigned long address,int dev,int b[4])
```
该函数的作用是用于去指定的设备上读取4个逻辑块到内存中， 也就是读取4k内容到一个内存页中。

该函数分为两个过程， 第一个过程是将磁盘数据块拷贝到bh块中。
```c
for (i=0 ; i<4 ; i++)
  if (b[i]) {
    if ((bh[i] = getblk(dev,b[i])))
      if (!bh[i]->b_uptodate)
        ll_rw_block(READ,bh[i]);
  } else
    bh[i] = NULL;
```

第二个过程是将bh块中的内容拷贝到指定的内存中。
```c
for (i=0 ; i<4 ; i++,address += BLOCK_SIZE)
  if (bh[i]) {
    wait_on_buffer(bh[i]);
    if (bh[i]->b_uptodate)
      COPYBLK((unsigned long) bh[i]->b_data,address);
    brelse(bh[i]);
  }
```

## breada
```c
struct buffer_head * breada(int dev,int first, ...)
```
breada函数是bread函数的拓展，如果只传递一个块号， 那么就是bread。 如果传递多个块号，就会读取多个逻辑块的值到高速缓存。

这个函数使用了可变参数列表， 但是其功能与bread类似， 不再赘述。

```c
va_list args;
struct buffer_head * bh, *tmp;

va_start(args,first);
if (!(bh=getblk(dev,first)))
  panic("bread: getblk returned NULL\n");
if (!bh->b_uptodate)
  ll_rw_block(READ,bh);
while ((first=va_arg(args,int))>=0) {
  tmp=getblk(dev,first);
  if (tmp) {
    if (!tmp->b_uptodate)
      ll_rw_block(READA,bh);
    tmp->b_count--;
  }
}
va_end(args);
wait_on_buffer(bh);
if (bh->b_uptodate)
  return bh;
brelse(bh);
return (NULL);
```
## wait_on_buffer
```c
static inline void wait_on_buffer(struct buffer_head * bh)
```
该函数的作用是如果一个bh块被加锁， 那么将等待该bh块解锁。
## sys_sync
```c
int sys_sync(void)
```
该函数的作用是将所有高速缓冲bh块的脏数据写盘。

## sync_dev
```c
int sync_dev(int dev)
```
该函数的作用是将所有高速缓冲中某个设别的bh块的脏数据写盘。

## invalidate_buffer
```c
static void inline invalidate_buffers(int dev)
```
该函数的作用是将所有某个设备的bh块中的b_uptodate和b_dirt置为0。

## check_disk_change
```c
void check_disk_change(int dev)
```
该函数的作用是检查磁盘是否已经更换。 如果已经更换， 就要对更新高速缓冲区的状态。

