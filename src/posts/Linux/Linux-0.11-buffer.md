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

在main.c文件中给定了buffer_end的大小定义。

```c
if (memory_end > 16*1024*1024)
    memory_end = 16*1024*1024;
if (memory_end > 12*1024*1024) 
    buffer_memory_end = 4*1024*1024;
else if (memory_end > 6*1024*1024)
    buffer_memory_end = 2*1024*1024;
else
    buffer_memory_end = 1*1024*1024;
```

内存大小>12Mb，buffer_end=4Mb

6Mb<内存大小<=12Mb，buffer_end=4Mb

如果内存大小<=6Mb，buffer_end=1Mb



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


## remove_from_queues
```c
static inline void remove_from_queues(struct buffer_head * bh)
```


## insert_into_queues
```c
static inline void insert_into_queues(struct buffer_head * bh)
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


