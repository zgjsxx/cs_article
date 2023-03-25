---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 memory.c详解

memory.c负责内存分页机制的管理。

## 概述

在Linux-0.11中，内存区域划分如下图所示：

![memory-area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/mem-area.png)


在Linux-0.11内核中，所有进程都使用一个页目录表，而每个进程都有自己的页表。

页目录表和页表的格式如下所示：

![memory-area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/page_frame.png)

图中页表项的第0位P代表**存在位**，该位表示这个页表项是否可以用于地址转换，P=1代表该项可用， 当目录表项或者第二级表项的P=0时，代表该项是无效的，不能用于地址转换。

当P=0时， 处理器会发出缺页异常的信号， 缺页中断的异常处理程序就可以将所请求的页面加入到物理内存中。

## 函数分析

### get_free_page
```c
unsigned long get_free_page(void)
```
该函数的作用是获取一个空闲页面，从内存的高地址向低地址开始搜索。 该函数仅是在mem_map寻找为0的位置，还没有建立线性地址和物理地址的映射关系。映射关系是在get_empty_page中调用put_page建立的，在下面的函数中会提到。

该函数使用的是c语言内嵌汇编的方式实现，输入参数为 $1: ax = 0，$2: LOW_MEM, $3: cx = PAGING_PAGES, $4 edi = mem_map+PAGING_PAGES-1

这里将edi的值指向了mem_map数组的尾,如下图所示：

![get_free_page](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/get_free_page.png)

查找的过程就是从mem_map的尾部向前搜寻为0的值，0值代表物理内存是空闲的。

### free_page
```c
void free_page(unsigned long addr);
```
该函数的作用就是释放某个物理地址对应的内存页。 这里的入参addr指的是物理地址。

该函数首先对地址addr进行校验， 如果addr小于LOW_MEM，就会直接返回。如果addr大于HIGH_MEMORY，将会抛出一个内核错误。
```c
if (addr < LOW_MEM) return;
if (addr >= HIGH_MEMORY)
    panic("trying to free nonexistent page");
```

接下来就根据addr计算出在mem_map中的下标，并将该地址的使用次数减去1。如果该地址的使用次数为0，却尝试去释放，那么也会抛出内核错误。
```c
addr -= LOW_MEM;
addr >>= 12;
if (mem_map[addr]--) return;
mem_map[addr]=0;
panic("trying to free free page");
```

### free_page_tables
```c
int free_page_tables(unsigned long from,unsigned long size)
```
该函数用于释放起始位置为from，长度为size的**线性地址**所对应的**物理地址**。

入参中的from代表的是线性地址。

首先检查参数合法性，检查from参数，其值是否是 4MB、8MB、12MB、16MB，即4M的倍数。一个页表项可以管理4M的内存，因此这里检查from是否是4M的倍数。

同时还检查其是否是 0，如果是0则出错，说明试图释放内核和缓冲所在空间。

```c
unsigned long *pg_table;
unsigned long * dir, nr;

if (from & 0x3fffff)
    panic("free_page_tables called with wrong alignment");
if (!from)
    panic("Trying to free up swapper memory space");
```

接下来计算大小为size的内存空间占据多少个页目录项。

一个页目录项可以管理4M的内存，因此移位```c>>22```可以计算size占用多少个4M，而其中加上0x3fffff是采用了进1法计算占用空间。

例如```size =  4M + 1byte(0x400001)```，

那么```(size + 0x3fffff) >> 22 = (0x400001 + 0x3fffff) >> 22  = 2```。

```c
size = (size + 0x3fffff) >> 22;
```

接下来的代码用于计算from所在的页目录项的地址。

其中，(from>>20) & 0xffc 等同于 (from >> 22) << 2
```c
dir = (unsigned long *) ((from>>20) & 0xffc); /* _pg_dir = 0 */
```

得到页目录项的起始地址dir和占据的页目录项个数size后，就开始遍历，依次进行释放。
```c
for ( ; size-->0 ; dir++) {//遍历dir
    if (!(1 & *dir))//判断存在位是否为0
        continue;
    pg_table = (unsigned long *) (0xfffff000 & *dir);//取出页表的地址
    for (nr=0 ; nr<1024 ; nr++) {
        if (1 & *pg_table)//判断存在位是否为1
            free_page(0xfffff000 & *pg_table);//释放该页表对应的内存
        *pg_table = 0;
        pg_table++;
    }
    free_page(0xfffff000 & *dir);
    *dir = 0;
}
```
整个过程如下图所示：

![free_page_tables](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/free_page_tables.png)

### copy_page_tables
```c
int copy_page_tables(unsigned long from,unsigned long to,long size)
```
该函数的作用是进行页表的复制。

这里首先定义了一些参数，并校验了from和to是否是4M的倍数。
```c
unsigned long * from_page_table;
unsigned long * to_page_table;
unsigned long this_page;
unsigned long * from_dir, * to_dir;
unsigned long nr;

if ((from&0x3fffff) || (to&0x3fffff))
    panic("copy_page_tables called with wrong alignment");
```

下面的代码是不是很熟悉？ 在上面的free_page_tables中就有提到过，其作用是取出from和to所在的页目录项的起始地址。
```c
from_dir = (unsigned long *) ((from>>20) & 0xffc); /* _pg_dir = 0 */
to_dir = (unsigned long *) ((to>>20) & 0xffc);
```

这里是计算大小为size的内存空间占据多少个页目录项。
```c
size = ((unsigned) (size+0x3fffff)) >> 22;
```

接下来就是遍历from所在的页目录项， 依次拷贝其页表项内容。

```c
for( ; size-->0 ; from_dir++,to_dir++) {
    if (1 & *to_dir)//如果目的页目录表存在位为0， 则代表目的页目录表已经存在，这将是致命的错误
        panic("copy_page_tables: already exist");
    if (!(1 & *from_dir))//如果源页目录表存在位为0， 则代表该页目录表可以不用复制
        continue;
		from_page_table = (unsigned long *) (0xfffff000 & *from_dir);//取出源地址的页表起始的位置
		if (!(to_page_table = (unsigned long *) get_free_page()))//申请一个4k内存页面，作为目的地址的页表
			return -1;	/* Out of memory, see freeing */
```

下面这里依次拷贝页表中的每一项。

```c
for ( ; nr-- > 0 ; from_page_table++,to_page_table++) {
    this_page = *from_page_table;
    if (!(1 & this_page))
        continue;
    this_page &= ~2;
    *to_page_table = this_page;
    if (this_page > LOW_MEM) {
        *from_page_table = this_page;
        this_page -= LOW_MEM;
        this_page >>= 12;
        mem_map[this_page]++;
    }
}
```
整个拷贝过程如下图所示:

![copy_page_tables_process](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/copy_page_tables1.png)

拷贝结束后的结果如下图所示，实现了from和to对应的线性地址指向了相同的物理地址
![copy_page_tables_result](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/copy_page_tables2.png)

### put_page
```c
unsigned long put_page(unsigned long page,unsigned long address)
```
该函数的作用是将**物理内存页**映射到**线性地址**中。

程序的开始是对一些边界值做一些校验。如果低于LOW_MEM或者高于HIGH_MEMORY， 则打印告警信息。

```c
unsigned long tmp, *page_table;

/* NOTE !!! This uses the fact that _pg_dir=0 */

if (page < LOW_MEM || page >= HIGH_MEMORY)
    printk("Trying to put page %p at %p\n",page,address);
if (mem_map[(page-LOW_MEM)>>12] != 1)
    printk("mem_map disagrees with %p at %p\n",page,address);
```

首先取出addr所在的页目录表，这里再看到复杂的移位和与操作就不再陌生了，在上面的函数中已经多次见到。
```c
page_table = (unsigned long *) ((address>>20) & 0xffc);
```

如果页目录项的存在位为1， 也页表已经存在， 那么取出页表的地址。 如果存在为0， 即页表不存在，那么就新建页表，让页目录表指向该页表。
```c
if ((*page_table)&1)
    page_table = (unsigned long *) (0xfffff000 & *page_table);
else {
    if (!(tmp=get_free_page()))
        return 0;
    *page_table = tmp|7;
    page_table = (unsigned long *) tmp;
}
```

从上面的步骤我们已经将页表的地址放在了page_table中，下面要做的就是从页表中建立线性地址和物理页的映射。

```(address>>12) & 0x3ff```的作用是取出中间的是个bit位，其代表在页表中的序号。

```c
page_table[(address>>12) & 0x3ff] = page | 7;
```

### un_wp_page
```c
void un_wp_page(unsigned long * table_entry)
```
该函数的作用是取消写保护异常，用于页异常中断过程中写保护异常的处理(写时复制)

入参table_entry指的是页表项的地址。 *table_entry解除引用得到映射的物理页帧。

```c
unsigned long old_page,new_page;

old_page = 0xfffff000 & *table_entry;
if (old_page >= LOW_MEM && mem_map[MAP_NR(old_page)]==1) {
    *table_entry |= 2;
    invalidate();
    return;
}
```

接下来申请一个新的内存页面用于复制。
```c
if (!(new_page=get_free_page()))
    oom();
```

接下来将页表项指向新页面，并进行内容的拷贝。
```c
*table_entry = new_page | 7;
invalidate();
copy_page(old_page,new_page);
```

写时复制的过程如下图所示：

![copy_page_tables_process](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/copy_on_write.png)

### do_wp_page
```c
void do_wp_page(unsigned long error_code,unsigned long address)
```
该函数的内部调用un_wp_page进行写保护异常的处理。

```((address>>10) & 0xffc)```是页表中的偏移量。

```(0xfffff000 & *((unsigned long *) ((address>>20) &0xffc)))```是页表的起始位置。

两者相加就可以找到线性地址address的页表项。

### write_verify
```c
void write_verify(unsigned long address)
```
该函数的作用就是在程序进行内存写操作的时候，判断是否可写，不可写则复制页面。

如果页目录项不存在，则直接返回。
```c
if (!( (page = *((unsigned long *) ((address>>20) & 0xffc)) )&1))
    return;
```

查找对应的页表项， 并检查存在位， 和写位， 如果不可写， 则进行写时复制。
```c
page &= 0xfffff000;
page += ((address>>10) & 0xffc);
if ((3 & *(unsigned long *) page) == 1)  /* non-writeable, present */
    un_wp_page((unsigned long *) page);
```

### get_empty_page
```c
void get_empty_page(unsigned long address)
```
该函数容易与get_free_page混淆。

get_empty_page内部调用get_free_page申请内存页，并调用put_page建立页表项到物理地址的映射。

代码相对简单， 就是先调用get_free_page申请物理内存，再调用put_page建立页表映射关系。
```c
unsigned long tmp;

if (!(tmp=get_free_page()) || !put_page(tmp,address)) {
    free_page(tmp);		/* 0 is ok - ignored */
    oom();
}
```
### try_to_share
```c
static int try_to_share(unsigned long address, struct task_struct * p)
```

这里的入参address指的是逻辑地址(偏移量)。

由于address是偏移量，因此在计算address对应的页目录地址时，需要加上进程的起始地址start_code。
```c
from_page = to_page = ((address>>20) & 0xffc);
from_page += ((p->start_code>>20) & 0xffc);
to_page += ((current->start_code>>20) & 0xffc);
```

如果from对应的页目录表的存在位为0，说明无法共享，直接返回。
```c
from = *(unsigned long *) from_page;
if (!(from & 1))
    return 0;
```

下面这里根据页目录表from_page计算得到了物理地址phys_addr。
```c
from &= 0xfffff000;
from_page = from + ((address>>10) & 0xffc);
phys_addr = *(unsigned long *) from_page;
```

接下来物理地址帧进行校验，校验其存在和脏位。
```c
if ((phys_addr & 0x41) != 0x01)
    return 0;
phys_addr &= 0xfffff000;
if (phys_addr >= HIGH_MEMORY || phys_addr < LOW_MEM)
    return 0;
```

让to_page的页表项指向相同的物理地址。
```c
*(unsigned long *) from_page &= ~2;
*(unsigned long *) to_page = *(unsigned long *) from_page;
```

将对应的物理页的使用次数增加1。
```c
phys_addr -= LOW_MEM;
phys_addr >>= 12;
mem_map[phys_addr]++;
```

### share_page
```c
static int share_page(unsigned long address)
```
当发生缺页异常时，该函数将尝试从其他进程中共享内存页面。因为系统中可能会有多个进程执行相同的可执行文件。


首先进行一些边界判断，如果进程的executable inode为0，则返回。 如果executable inode的icount<2， 说明没有执行相同可执行文件的其他进程，直接返回。
```c
struct task_struct ** p;

if (!current->executable)
    return 0;
if (current->executable->i_count < 2)
    return 0;
```

接下来就是对系统中任务数组进行遍历， 查找与当前进程的executable inode相同的项目， 并调用try_to_share进行共享。
```c
for (p = &LAST_TASK ; p > &FIRST_TASK ; --p) {
    if (!*p)
        continue;
    if (current == *p)
        continue;
    if ((*p)->executable != current->executable)
        continue;
    if (try_to_share(address,*p))
        return 1;
}
```
### do_no_page 
```c
void do_no_page(unsigned long error_code,unsigned long address)
```
该函数的作用是执行**缺页处理**。

入参中的address是**线性地址**。

将线性地址减去进程在进程空间的首地址，即可得到逻辑地址(偏移量)。

```c
int nr[4];
unsigned long tmp;
unsigned long page;
int block,i;

address &= 0xfffff000;//取出address的页起始地址
tmp = address - current->start_code;//得到address的逻辑地址(偏移量)
```

```c
if (!current->executable || tmp >= current->end_data) {
    get_empty_page(address);
    return;
}
```

否则尝试共享页面。所谓共享页面就是去查看当前系统的其他进程里，是否加载了相同的页面到内存，如果有，则可以进行共享。
```c
if (share_page(tmp))
    return;
```

如果共享失败，那么则尝试申请一个物理内存页。如果申请失败，抛出out-of-memory，程序退出。
```c
if (!(page = get_free_page()))
    oom();
```

接下来的工作就是将磁盘中的内容读取到内存中。可执行文件的header会占用一个block，使用tmp/1024 + 1就可以得到tmp地址是该文件的第几个block块。 接下来使用bmap函数得到可执行文件的第block块数据位于磁盘上的位置。 接下来使用bread_page读取4k的内容到内存中。
```c
block = 1 + tmp/BLOCK_SIZE;
for (i=0 ; i<4 ; block++,i++)
    nr[i] = bmap(current->executable,block);
bread_page(page,current->executable->i_dev,nr);
i = tmp + 4096 - current->end_data;
tmp = page + 4096;
while (i-- > 0) {
    tmp--;
    *(char *)tmp = 0;
}
```

最后调用put_page在页表中建立映射关系。
```c
if (put_page(page,address))
    return;
```
### mem_init
```c
void mem_init(long start_mem, long end_mem)
```

```c
HIGH_MEMORY = end_mem;//16M
for (i=0 ; i<PAGING_PAGES ; i++)//15M内存包含多少个4K，即3840
    mem_map[i] = USED;  //将这些页面都标记为USED状态(100)
i = MAP_NR(start_mem);//计算start_mem在数组中的起始位置
end_mem -= start_mem;
end_mem >>= 12;//计算总共多少个页面
while (end_mem-->0)
    mem_map[i++]=0;//将这些页面标记为0，未使用。
```

### calc_mem
```c
void calc_mem(void)
```

该函数统计内存的空闲情况。

首先遍历物理内存使用数组mem_map，获取其中为0的项目的总数，即统计出有多少4k物理页面还没有使用。

```c
int i,j,k,free=0;
long * pg_tbl;

for(i=0 ; i<PAGING_PAGES ; i++)
    if (!mem_map[i]) free++;
printk("%d pages free (of %d)\n\r",free,PAGING_PAGES);
```

接下来进行遍历， 查看每个页目录项对应的页表占用了多少个物理内存页。
```c
for(i=2 ; i<1024 ; i++) {
    if (1&pg_dir[i]) {
        pg_tbl=(long *) (0xfffff000 & pg_dir[i]);
        for(j=k=0 ; j<1024 ; j++)
            if (pg_tbl[j]&1)
                k++;
        printk("Pg-dir[%d] uses %d pages\n",i,k);
    }
}
```