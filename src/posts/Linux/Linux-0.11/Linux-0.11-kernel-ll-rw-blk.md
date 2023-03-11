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
该函数的作用是锁定指定的缓冲块。
```c
cli();//关中断
while (bh->b_lock)//如果缓冲区已被锁定就睡眠，一直到缓冲区解锁
    sleep_on(&bh->b_wait);
bh->b_lock=1;//立即锁定缓冲区
sti();//开中断
```

## unlock_buffer
```c
static inline void unlock_buffer(struct buffer_head * bh)
```
该函数的作用是解锁指定的缓冲块。
```c
if (!bh->b_lock)//如果该缓冲区没有加锁，则打印出错信息
    printk("ll_rw_block.c: buffer not locked\n\r");
bh->b_lock = 0;//对缓冲区解锁
wake_up(&bh->b_wait);//唤醒等待该缓冲区的任务。
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
该函数的作用是创建请求项并插入请求队列中。

首先判断命令是否READA或者是WRITEA。READA代表预读取，WRITEA代表预写入。 所以当命令是预读取或者是预写入，如果bh块被锁，那么就放弃，直接返回。如果bh块没有被锁，那么就当作普通的READ和WRITE。

```c
	struct request * req;
	int rw_ahead;

/* WRITEA/READA is special case - it is not really needed, so if the */
/* buffer is locked, we just forget about it, else it's a normal read */
	if ((rw_ahead = (rw == READA || rw == WRITEA))) {
		if (bh->b_lock)
			return;
		if (rw == READA)
			rw = READ;
		else
			rw = WRITE;
	}
```

如果命令不是读或者写，那么就是一个致命错误，直接通过panic抛出错误。对命令校验之后，就去锁定该数据块。如果命令是写操作，但是该数据块并没有脏数据，则没有必要去写块设备，就可以对bh块进行解锁。除此以外，如果命令是读操作，但是该bh块中的内容已经是最新的，也没有必要去读块设备，就可以对bh块进行解锁。
```c
if (rw!=READ && rw!=WRITE)
    panic("Bad block dev command, must be R/W/RA/WA");
lock_buffer(bh);
if ((rw == WRITE && !bh->b_dirt) || (rw == READ && bh->b_uptodate)) {
    unlock_buffer(bh);
    return;
}
```

下面需要从request数组中寻找一个位置来创建该请求。对于读请求而言，将会从数组的尾部开始搜索。对于写请求而言，将会从数组的2/3处开始搜索。 如果找到了位置，那么就开始进行创建，如果没有找到位置，就sleep_on进行等待。
```c
	if (rw == READ)
		req = request+NR_REQUEST;
	else
		req = request+((NR_REQUEST*2)/3);
/* find an empty request */
	while (--req >= request)
		if (req->dev<0)
			break;
/* if none found, sleep on new requests: check for rw_ahead */
	if (req < request) {
		if (rw_ahead) {
			unlock_buffer(bh);
			return;
		}
		sleep_on(&wait_for_request);
		goto repeat;
	}
```

当找到该位置时，就在该位置上进行构建请求。构建完之后，调用add_request插入到电梯队列中。
```c
/* fill up the request-info, and add it to the queue */
	req->dev = bh->b_dev;
	req->cmd = rw;
	req->errors=0;
	req->sector = bh->b_blocknr<<1;
	req->nr_sectors = 2;
	req->buffer = bh->b_data;
	req->waiting = NULL;
	req->bh = bh;
	req->next = NULL;
	add_request(major+blk_dev,req);
```
## ll_rw_block
```c
void ll_rw_block(int rw, struct buffer_head * bh)
```
该函数的作用就是读写数据块。

下面一段代码用于对bh块对应的设备做相应的校验。如果主设备号不存在，或者该设备对应的请求操作函数不存在，就显示出错信息。
```c
if ((major=MAJOR(bh->b_dev)) >= NR_BLK_DEV ||
!(blk_dev[major].request_fn)) {
    printk("Trying to read nonexistent block-device\n\r");
    return;
}
```

如果校验没有问题就调用make_request建立块设备读写请求。
```c
make_request(major,rw,bh);
```

## blk_dev_init
```c
void blk_dev_init(void)
```
该函数的作用是初始化块设备。

遍历request数组，对request数组中每一项的dev设置为-1， 对next指针设置为NULL。
```c
for (i=0 ; i<NR_REQUEST ; i++) {
    request[i].dev = -1;
    request[i].next = NULL;
}
```