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
该函数的作用是将块设备读写请求插入到电梯队列中。

如果当前设备的请求为空，就将入参中的请求作为设备电梯队列的头节点。并且立即调用。
```c
if (!(tmp = dev->current_request)) {
    dev->current_request = req;
    sti();
    (dev->request_fn)();
    return;
}
```


```c
#define IN_ORDER(s1,s2) \
((s1)->cmd<(s2)->cmd || ((s1)->cmd==(s2)->cmd && \
((s1)->dev < (s2)->dev || ((s1)->dev == (s2)->dev && \
(s1)->sector < (s2)->sector))))
```
上述代码是比较难懂的，可以使用if-else来帮助理解
```c
bool inorder(request &s1, request &s2)
{
    if(s1.cmd < s2.cmd>){
        return true;
    }
    else if(s1.cmd == s2.cmd){
        if(s1.dev < s2.dev){
            return true;
        }
        else if(s1.dev == s2.dev){
            if(s1.sector < s2.sector){
                return true;
            }
            return false;//s1.sector > s2.sector
        }
        return false;//s1.dev > s2.dev
    }
    return false;//s1.cmd > s2.cmd
}
```

展开上面的if-else结构逻辑就清晰了很多，IN_ORDER实际上就是一次对操作类型，设备号， 扇区号作比较， 并且操作类型优先级大于设备号，设备号优先级大于扇区号。

对于操作类型而言，读操作优先级大于写操作。对于设备号而言，设备号小的设备优先级大于设备号大的设备的优先级。对于扇区而言，扇区序号小的扇区优先级高于扇区序号大的扇区。

参考:
https://blog.csdn.net/suppercoder/article/details/19619777

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