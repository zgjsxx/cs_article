---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录ll_rw_blk.c详解

## lock_buffer
```c
static inline void lock_buffer(struct buffer_head * bh)
```

## unlock_buffer
```c
static inline void unlock_buffer(struct buffer_head * bh)
```

## add_request
```c
static void add_request(struct blk_dev_struct * dev, struct request * req)
```

## make_request
```c
static void make_request(int major,int rw, struct buffer_head * bh)
```

## ll_rw_block
```c
void ll_rw_block(int rw, struct buffer_head * bh)
```

## blk_dev_init
```c
void blk_dev_init(void)
```