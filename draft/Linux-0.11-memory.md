

# Linux-0.11 memory.c详解

## 内存区域划分
![memory-area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/Linux-0.11-memory/mem-area.png)


在Linux-0.11内核中，所有进程都使用一个页目录表，而每个进程都有自己的页表。


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

