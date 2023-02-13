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
这里根据buffer_end的值的不同， 决定了b的指向。

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


## get_hash_table
```c
struct buffer_head * get_hash_table(int dev, int block)
```

## getblk
```c
struct buffer_head * getblk(int dev,int block)
```

## remove_from_queues
```c
static inline void remove_from_queues(struct buffer_head * bh)
```


## insert_into_queues
```c
static inline void insert_into_queues(struct buffer_head * bh)
```


## brelse
```c
void brelse(struct buffer_head * buf)
```

## bread
```c
struct buffer_head * bread(int dev,int block)
```


## bread_page
```c
void bread_page(unsigned long address,int dev,int b[4])
```

## breada
```c
struct buffer_head * breada(int dev,int first, ...)
```


## wait_on_buffer
```c
static inline void wait_on_buffer(struct buffer_head * bh)
```

## sys_sync
```c
int sys_sync(void)
```


## sync_dev
```c
int sync_dev(int dev)
```


## invalidate_buffer
```c
static void inline invalidate_buffers(int dev)
```


## check_disk_change
```c
void check_disk_change(int dev)
```

