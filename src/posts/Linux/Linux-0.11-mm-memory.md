

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