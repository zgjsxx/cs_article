---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录ll\_rw\_blk.c详解](#linux-011-kernel目录ll_rw_blkc详解)
	- [模块简介](#模块简介)
	- [函数详解](#函数详解)
		- [add\_request](#add_request)
		- [make\_request](#make_request)
		- [ll\_rw\_block](#ll_rw_block)
		- [blk\_dev\_init](#blk_dev_init)
		- [lock\_buffer](#lock_buffer)
		- [unlock\_buffer](#unlock_buffer)

# Linux-0.11 kernel目录ll_rw_blk.c详解

## 模块简介

该模块的作用是处理块设备的读写，其中最重要的函数就是电梯算法**add_request**函数和**ll_rw_block**函数。

**ll_rw_block**函数的主要功能是为块设备创建块设备读写请求项，并插入到指定块设备请求队列中。实际的读写操作则是由设备的请求项处理函数```request_fn()```完成。对于硬盘操作，该函数是```do_hd_request()```， 对于软盘操作，该函数是```do_fd_request()```，对于虚拟盘，则是```do_rd_request()```。如果```ll_rw_block()```为一个块设备建立起一个请求项，并通过测试块设备的当前请求项指针为空而确定设备空闲时，就会设置该新建的请求项为当前请求项，并直接调用```request_fn()```对该请求项进行操作。否则就会使用电梯算法将新建的请求项插入到该设备的请求项链表中等待处理。

## 函数详解

### add_request

```c
static void add_request(struct blk_dev_struct * dev, struct request * req)
```

该函数的作用是将块设备读写请求**插入到电梯队列**中。调用关系如下：

```shell
├── ll_rw_block
  └── make_request
    └── add_request
```

这里首先熟悉一下两个入参的定义：

```c
struct blk_dev_struct {
	void (*request_fn)(void);
	struct request * current_request;
};
```

```c
struct request {
	int dev;		/* -1 if no request */
	int cmd;		/* READ or WRITE */
	int errors;
	unsigned long sector;
	unsigned long nr_sectors;
	char * buffer;
	struct task_struct * waiting;
	struct buffer_head * bh;
	struct request * next;
};
```

```dev```是指定块设备结构指针，该结构中有处理请求项的函数指针和当前正在请求项指针。```req```为设置好内容的请求项结构指针。函数的目的就是将```req```添加到指定设备的请求项链表中。

首先将```req```的 ```next```指针设置为空，将数据的脏数据标志置为0。

```c
	req->next = NULL;
	cli();
	if (req->bh)
		req->bh->b_dirt = 0;
```

如果当前设备的请求为空，就将入参中的请求作为设备电梯队列的头节点。并且立即调用```request_fn```。```request_fn```对于不同的设备对应不同的回调函数，对于硬盘设备而言，```request_fn```指的是```do_hd_request```，关于```do_hd_request```,将在```hd.c```中进行讲解。

```c
if (!(tmp = dev->current_request)) {
    dev->current_request = req;
    sti();
    (dev->request_fn)();
    return;
}
```

上面的部分处理了请求队列只有一个请求的场景，接下来便是当请求队列有多个请求时，如何处理优先级顺序的逻辑，也就是电梯算法部分，其中最难理解的便是宏定义```IN_ORDER```。```IN_ORDER```的定义如下所示。

```c
	#define IN_ORDER(s1,s2) \
	((s1)->cmd<(s2)->cmd || ((s1)->cmd==(s2)->cmd && \
	((s1)->dev < (s2)->dev || ((s1)->dev == (s2)->dev && \
	(s1)->sector < (s2)->sector))))
```

上述代码是比较难懂的，可以使用```if-else```来帮助理解

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

展开上面的```if-else```结构逻辑就清晰了很多，```IN_ORDER```实际上就是依次对操作类型，设备号， 扇区号作比较，并且操作类型优先级大于设备号，设备号优先级大于扇区号。

对于操作类型而言，读操作优先级大于写操作。对于设备号而言，设备号小的设备优先级大于设备号大的设备的优先级。对于扇区而言，扇区序号小的扇区优先级高于扇区序号大的扇区。

有了这个认识之后，再看下面的语句，就会简单很多，实际上就是根据优先级找到合适的位置插入数据。

```c
for ( ; tmp->next ; tmp=tmp->next)
	if ((IN_ORDER(tmp,req) || 
		!IN_ORDER(tmp,tmp->next)) &&
		IN_ORDER(req,tmp->next))
		break;
req->next=tmp->next;
tmp->next=req;
```

下面的这一段代码可以用两个if语句进行替代，即**定向扫描**和**折返扫描**两个场景。

```c
if ((IN_ORDER(tmp,req) || 
	!IN_ORDER(tmp,tmp->next)) &&
	IN_ORDER(req,tmp->next))
```

条件1：定向扫描， req在当前扫描的方向上

```c
if(tmp > req && req > tmp->next)
{
	req->next=tmp->next;
	tmp->next=req;	
}
```

条件2: 折返扫描，req在下一轮扫描的方向上

```c
if(tmp < tmp->next && req > tmp->next)
{
	req->next=tmp->next;
	tmp->next=req;	
}
```

条件2在下面的例子中插入```(0，0，20)```时有体现。

```shell
(0,0,50),(0,0,60),(0,0,80),(0,0,30),
(0,0,50),(0,0,60),(0,0,80),(0,0,20),(0,0,30),
```

这里需要阐明的是，Linux-0.11实际使用的磁盘扫描算法是**C-SCAN算法**，也是**电梯算法**（可戏称为**跳楼机**）。

其思路就是只**单向寻道**，到头后**直接复位**再次沿同方向寻道，这样对于所有磁盘位置的请求都是公平的。

我们通过下面的代码实际感受一下这个过程，我们固定```cmd```和```dev```， 只让```sector```号有区别，依次插入```50， 80， 60， 30， 20 ```，看看最后的结果如何。

```c
#include <stdio.h>
#include <stdlib.h>
 
#define READ 0
#define WRITE 1
 
struct request {
	int dev;		/* -1 if no request */
	int cmd;		/* READ or WRITE */
	int errors;
	unsigned long sector;
	unsigned long nr_sectors;
	char * buffer;
	//struct task_struct * waiting;
	//struct buffer_head * bh;
	struct request * next;
};
 
#define IN_ORDER(s1,s2) \
	((s1)->cmd<(s2)->cmd || (s1)->cmd==(s2)->cmd && \
	((s1)->dev < (s2)->dev || ((s1)->dev == (s2)->dev && \
	(s1)->sector < (s2)->sector)))
 
// 作为解析，以明白的分支结构重写一个内容一样的inorder函数
bool inorder(struct request *s1,struct request *s2)
{
	if (s1->cmd<s2->cmd)
	{
		return true;//only when s1->cmd = READ; s2->cmd = WRITE;
	}
	else if ( s1->cmd == s2->cmd )
	{
		if (s1->dev < s2->dev)
		{
			return true;// when (s1->cmd==s2->cmd) && (s1->dev<s2->dev)
		}
		else if ( s1->dev == s2->dev )
		{
			if (s1->sector<s2->sector)
			{
				return true;// when when (s1->cmd==s2->cmd) && (s1->sector<s2->sector)
			}
			return false;// when when (s1->cmd==s2->cmd) && (s1->sector>=s1->sector)
		}
		return false;// when (s1->cmd==s2->cmd) && (s1->dev>s2->dev)
	}
	return false;// when s1->cmd>s2->cmd
}
 
void AddRequest(struct request * &head,struct request *req)
{
	if (!head)
	{
		head = req;
		head->next = 0;
		return ;
	}
	struct request * tmp = head;
	for (;tmp->next;tmp = tmp->next)
	{
		if ( ( IN_ORDER(tmp,req)||
			!IN_ORDER(tmp,tmp->next)) &&
			IN_ORDER(req,tmp->next))
		{
			break;
		}
	}
	req->next = tmp->next;
	tmp->next = req;
	return;
}
 
void PrintQueen(struct request * n)
{
	while (n)
	{
		printf("(%d,%d,%d),",n->cmd,n->dev,n->sector);
		n = n->next;
	}
	printf("\n");
}
int main(int argc,char ** argv)
{
	struct request s1;
	struct request * pHead = 0;
    struct request *req = new struct request;
    req->cmd = 0;
    req->dev =  0;
    req->sector =  50;

    AddRequest(pHead,req);
    PrintQueen(pHead);   

    struct request *req3 = new struct request;
    req3->cmd = 0;
    req3->dev =  0;
    req3->sector =  80;
    AddRequest(pHead,req3);
    PrintQueen(pHead);  

    struct request *req2 = new struct request;
    req2->cmd = 0;
    req2->dev =  0;
    req2->sector =  60;
    AddRequest(pHead,req2);
    PrintQueen(pHead);  

    struct request *req5 = new struct request;
    req5->cmd = 0;
    req5->dev =  0;
    req5->sector =  30;
    AddRequest(pHead,req5);
    PrintQueen(pHead);  

    struct request *req4 = new struct request;
    req4->cmd = 0;
    req4->dev =  0;
    req4->sector =  20;
    AddRequest(pHead,req4);
    PrintQueen(pHead);  

	return 0;
}
```

上述代码的执行结果如下所示:

```shell
(0,0,50),
(0,0,50),(0,0,80),
(0,0,50),(0,0,60),(0,0,80),
(0,0,50),(0,0,60),(0,0,80),(0,0,30),
(0,0,50),(0,0,60),(0,0,80),(0,0,20),(0,0,30),
```

可以看出最后的顺序是50->60->80->20->30， 实际上效果就是单方向移动到最后一个位置，再复位进行扫描，再次沿同方向扫描。

![c-san算法示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/block/c-scan.png)

### make_request

```c
static void make_request(int major,int rw, struct buffer_head * bh)
```

该函数的作用是创建请求项并插入请求队列中。其调用关系如下所示：

```shell
├── ll_rw_block
  └── make_request
```

首先判断命令是否```READA```或者是```WRITEA```。```READA```代表预读取，```WRITEA```代表预写入。所以当命令是**预读取**或者是**预写入**，如果```bh```块被锁，那么就放弃，直接返回。如果```bh```块没有被锁，那么就当作普通的```READ```和```WRITE```。

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

如果命令不是读或者写，那么就是一个致命错误，直接通过```panic```抛出错误。对命令校验之后，就去锁定该数据块。如果命令是写操作，但是该数据块并没有脏数据，则没有必要去写块设备，就可以对```bh```块进行解锁。除此以外，如果命令是读操作，但是该```bh```块中的内容已经是最新的，也没有必要去读块设备，就可以对```bh```块进行解锁。

```c
if (rw!=READ && rw!=WRITE)
    panic("Bad block dev command, must be R/W/RA/WA");
lock_buffer(bh);
if ((rw == WRITE && !bh->b_dirt) || (rw == READ && bh->b_uptodate)) {
    unlock_buffer(bh);
    return;
}
```

下面需要从```request```数组中寻找一个位置来创建该请求。对于读请求而言，将会从数组的尾部开始搜索。对于写请求而言，将会从数组的2/3处开始搜索。 如果找到了位置，那么就开始进行创建，如果没有找到位置，就```sleep_on```进行等待。

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

当找到该位置时，就在该位置上进行构建请求。构建完之后，调用```add_request```插入到电梯队列中。

```c
/* fill up the request-info, and add it to the queue */
	req->dev = bh->b_dev;
	req->cmd = rw;
	req->errors=0;
	req->sector = bh->b_blocknr<<1; //起始扇区，块号转换成扇区(1块= 2扇区)
	req->nr_sectors = 2;
	req->buffer = bh->b_data;
	req->waiting = NULL;
	req->bh = bh;
	req->next = NULL;
	add_request(major+blk_dev,req);
```

### ll_rw_block

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

如果校验没有问题就调用```make_request```建立块设备读写请求。

```c
make_request(major,rw,bh);
```

### blk_dev_init

```c
void blk_dev_init(void)
```

该函数的作用是**初始化块设备**。

遍历```request```数组，对```request```数组中每一项的dev设置为-1， 对```next```指针设置为```NULL```。

```c
for (i=0 ; i<NR_REQUEST ; i++) {
    request[i].dev = -1;
    request[i].next = NULL;
}
```

### lock_buffer

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

### unlock_buffer

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