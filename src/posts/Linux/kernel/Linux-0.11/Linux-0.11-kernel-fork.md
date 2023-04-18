---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录fork.c详解

## 模块简介

fork.c中主要实现内核对于创建新的进程的行为。其中copy_process是其最核心的函数。

## 函数详解

### copy_process
```c
int copy_process(int nr,long ebp,long edi,long esi,long gs,long none,
		long ebx,long ecx,long edx,
		long fs,long es,long ds,
		long eip,long cs,long eflags,long esp,long ss)
```

该函数的作用是从old进程中复制出一个new进程。 该函数在system_call.s中的sys_fork函数中执行。

copy_process从INT 0x80中断触发system_call系统调用，进而调用sys_fork。此时内核栈的状态如下所示：

![内核栈的状态](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/system_call_stack.png)

这与copy_process的参数是一致的。


该函数首先在内存中分配了一个空闲页用于存储进程的PCB，即task_struct结构。并将该PCB放入了PCB的数组中。

最后将old进程的PCB内容先直接拷贝给new进程。

```c
p = (struct task_struct *) get_free_page();
if (!p)
    return -EAGAIN;
task[nr] = p;	
*p = *current;	
```
下面这段就是将继承来的PCB结构进行适当的修改，详细解释见注释。

```c
p->state = TASK_UNINTERRUPTIBLE;//设置进程状态为不可被中断
p->pid = last_pid;//last_pid为find_empty_process找到的没有被使用的pid值， 将其设置给新的进程
p->father = current->pid;//设置该进程的父进程
p->counter = p->priority;//设置该进程的时间片， 值等于其优先级的值。
p->alarm = 0; //alarm定时的时间
p->leader = 0;	//是否是进程组的leader
p->utime = p->stime = 0; //用户态运行时间和和核心态运行时间
p->cutime = p->cstime = 0;//子进程用户态运行时间和核心态运行时间。
p->start_time = jiffies;//进程的开始时间设置为系统的滴答数。
```

下面一段是设置PCB中有关TSS寄存器的值。下面也通过注释进行详解。

首先设置了内核栈的栈
![内核栈示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/kernel_stack.png)
```c
p->tss.back_link = 0;
p->tss.esp0 = PAGE_SIZE + (long) p;//进程的内核栈栈顶指针
p->tss.ss0 = 0x10;//内核栈的段选择符
```

接下来是设置tss寄存器关于其他cpu寄存器的值。

```c
p->tss.eip = eip;
p->tss.eflags = eflags;
p->tss.eax = 0;
p->tss.ecx = ecx;
p->tss.edx = edx;
p->tss.ebx = ebx;
p->tss.esp = esp;
p->tss.ebp = ebp;
p->tss.esi = esi;
p->tss.edi = edi;
p->tss.es = es & 0xffff;     //段寄存器取16位
p->tss.cs = cs & 0xffff;
p->tss.ss = ss & 0xffff;
p->tss.ds = ds & 0xffff;
p->tss.fs = fs & 0xffff;
p->tss.gs = gs & 0xffff;
```

下面这里，设置tss中ldt的值。

```c
p->tss.ldt = _LDT(nr);
p->tss.trace_bitmap = 0x80000000;
```

GDT表中每一项是8个字节，每个进程拥有一个TSS和LDT，因此每个进程占用字节是16字节， 因此序号为n的进程的LDT在GDT表中的偏移量就是```n*16 + 5*8```
```c
#define _LDT(n) ((((unsigned long) n)<<4)+(FIRST_LDT_ENTRY<<3))
```

如对上述知识遗忘，可以通过下面这张图进行温故。

![LDT.png](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/LDT.png)


下面这里进程内存的拷贝， 实际上确定进行进程新的线性地址， 并进行页表的拷贝。详见本文中copy_mem的讲解。
```c
if (copy_mem(nr,p)) {
    task[nr] = NULL;
    free_page((long) p);
    return -EAGAIN;
```


下面主要处理对进程打开的文件的引用计数增加1。
```c
for (i=0; i<NR_OPEN;i++)
    if ((f=p->filp[i]))
        f->f_count++;
if (current->pwd)
    current->pwd->i_count++;
if (current->root)
    current->root->i_count++;
if (current->executable)
    current->executable->i_count++;
```

这里设置GDT表中tss和ldt描述符的内容。
```c
set_tss_desc(gdt+(nr<<1)+FIRST_TSS_ENTRY,&(p->tss));
set_ldt_desc(gdt+(nr<<1)+FIRST_LDT_ENTRY,&(p->ldt));
p->state = TASK_RUNNING;	/* do this last, just in case */
```

### copy_mem
```c
int copy_mem(int nr,struct task_struct * p)
```
该函数的作用是复制进程的页表。

```c
code_limit=get_limit(0x0f);//根据代码段选择符获取代码段的长度
data_limit=get_limit(0x17);//根据数据段选择符获取数据段的长度
old_code_base = get_base(current->ldt[1]);//获取代码段的起始位置
old_data_base = get_base(current->ldt[2]);//获取数据段的起始位置
if (old_data_base != old_code_base)  //两个段起始位置相等
    panic("We don't support separate I&D");
if (data_limit < code_limit)
    panic("Bad data_limit");
//确立新进程的代码段地址， Linux-0.11的线性地址是按照64M划分的，所以进程号nr的线性地址的起始位置是nr* 0x4000000
new_data_base = new_code_base = nr * 0x4000000;
p->start_code = new_code_base;  // 设置该位置到PCB中
set_base(p->ldt[1],new_code_base); //设置代码段的地址
set_base(p->ldt[2],new_data_base); //设置数据段的地址
```

下面这段代码是将数据段所属的页表的进行。
```c
if (copy_page_tables(old_data_base,new_data_base,data_limit)) {
    printk("free_page_tables: from copy_mem\n");
    free_page_tables(new_data_base,data_limit);
    return -ENOMEM;
}
```
copy_page_tables在memory.c中定义。

### verify_area
```c
void verify_area(void * addr,int size)
```
该函数用于在进程空间进行写操作时进行地址验证的函数。

addr是指在进程线性地址中相对于起始位置的偏移量， size指的是大小。

由于检测判断是以4K页为单位进行操作的，因此程序需要找出addr所在页的起始地址，如下图所示。

![verify_area](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/verify_area.png)


下面这段代码就是去寻找addr所在的内存页的起始地址， 即start。
```c
unsigned long start;

start = (unsigned long) addr;
size += start & 0xfff; //size 加上页内偏移
start &= 0xfffff000; //start为逻辑地址的以4K为划分的起始地址
start += get_base(current->ldt[2]);//获取当前进程在线性地址中数据段的起始地址， 加起来就是该逻辑地址转化到了线性地址
```


下面进行写保护验证， 如果页面不可以写，则进行页面复制。
```c
while (size>0) {
    size -= 4096;
    write_verify(start);
    start += 4096;
}
```
write_verify函数详解可以参考memory.c文件的讲解。

### find_empty_process
```c
int find_empty_process(void)
```
该函数的作用是在全局的task数组中找到一个空闲的项，并返回其下标。其在system_call.s中的sys_fork函数中被调用。

首先是寻找一个pid值
```c
repeat:
    if ((++last_pid)<0) last_pid=1;
    for(i=0 ; i<NR_TASKS ; i++)
        if (task[i] && task[i]->pid == last_pid) goto repeat;
```

接着是去task数组中寻找可用的位置
```c
for(i=1 ; i<NR_TASKS ; i++)
    if (!task[i])
        return i;
```