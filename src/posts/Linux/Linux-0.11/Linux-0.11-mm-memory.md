

# Linux-0.11 memory.c详解

## 概述
内存区域划分

![memory-area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/mem-area.png)


在Linux-0.11内核中，所有进程都使用一个页目录表，而每个进程都有自己的页表。

页目录表和页表的格式

![memory-area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/page_frame.png)

图中页表项的第0位P代表**存在位**，该位表示这个页表项是否可以用于地址转换，P=1代表该项可用， 当目录表项或者第二级表项的P=0时，代表该项是无效的，不能用于地址转换。

当P=0时， 处理器会发出缺页异常的信号， 缺页中断的异常处理程序就可以将所请求的页面加入到物理内存中。

## 函数分析

### get_free_page
```c
unsigned long get_free_page(void)
```
**作用**: 获取一个空闲页面， 从内存的高地址向低地址开始搜索

%1: ax = 0    %2 LOW_MEM     %3: cx = PAGING_PAGES   %4 edi = mem_map+PAGING_PAGES-1

将edi的值指向了mem_map数组的尾,如下图所示：

![get_free_page](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/get_free_page.png)

然后从mem_map的尾部向前搜寻为0的项目，这样就可以找到空闲的物理内存。


### free_page
```c
void free_page(unsigned long addr);
```
该函数的作用就是释放某个地址所在的内存页。

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

```c
unsigned long *pg_table;
unsigned long * dir, nr;

if (from & 0x3fffff)
    panic("free_page_tables called with wrong alignment");
if (!from)
    panic("Trying to free up swapper memory space");
```

这里是计算大小为size的内存空间占据多少个页目录项。一个页目录项可以管理4M的内存，因此移位```c>>22```可以计算size占用多少个4M，
而其中加上0x3fffff是采用了进1法计算占用空间。

例如size =  4M + 1byte(0x400001)，

那么(size + 0x3fffff) >> 22 = (0x400001 + 0x3fffff) >> 22  = 2

```c
size = (size + 0x3fffff) >> 22;
```

下面的代码用于计算from所在的页目录项的地址。

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
        if (1 & *pg_table)//判断存在位为0
            free_page(0xfffff000 & *pg_table);//释放该页表对应的内存
        *pg_table = 0;
        pg_table++;
    }
    free_page(0xfffff000 & *dir);
    *dir = 0;
}
```

### copy_page_tables
```c
int copy_page_tables(unsigned long from,unsigned long to,long size)
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

### put_page
```c
unsigned long put_page(unsigned long page,unsigned long address)
```

### do_wp_page
```c
void do_wp_page(unsigned long error_code,unsigned long address)
```


### un_wp_page
```c
void un_wp_page(unsigned long * table_entry)
```
**作用**: 取消写保护异常，用于页异常中断过程中写保护异常的处理(写时复制)



### do_no_page 
```c
void do_no_page(unsigned long error_code,unsigned long address)
```
**作用**: 执行缺页处理

