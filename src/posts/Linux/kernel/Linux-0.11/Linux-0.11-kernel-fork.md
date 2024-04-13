---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录fork.c详解

## 模块简介

fork.c中主要实现内核对于创建新的进程的行为。其中```copy_process```是其最核心的函数。

## 函数详解

### copy_process
```c
int copy_process(int nr,long ebp,long edi,long esi,long gs,long none,
		long ebx,long ecx,long edx,
		long fs,long es,long ds,
		long eip,long cs,long eflags,long esp,long ss)
```

该函数的作用是从old进程中复制出一个new进程。 该函数在```system_call.s```中的```sys_fork```函数中执行。调用关系如下所示：

```shell
├── sys_fork
  └── copy_process
```

```copy_process```从```INT 0x80```中断触发```system_call```系统调用，进而调用```sys_fork```。此时内核栈的状态如下所示：

![内核栈的状态](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/system_call_stack.png)

这与```copy_process```的入参是一致的。

该函数首先在内存中分配了一个空闲页用于存储进程的PCB(process control block)，即```task_struct```结构。并将该PCB放入了PCB的数组中。

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

```last_pid```是由```find_empty_process```方法进行设置的，```find_empty_process```位于```sys_fork```的第一句。

```cutime/cstime```用于在```sys_waitpid```方法中父进程统计子进程的运行时间。

下面一段是设置PCB中有关TSS寄存器的值。下面也通过注释进行详解。

首先设置了内核栈的栈：

![内核栈示意图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/kernel_stack.png)

```c
p->tss.back_link = 0;
p->tss.esp0 = PAGE_SIZE + (long) p;//进程的内核栈栈顶指针
p->tss.ss0 = 0x10;//内核栈的段选择符
```

接下来是设置```tss```寄存器关于其他cpu寄存器的值。

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

下面这里，设置```tss```中```ldt```的值。

```c
    p->tss.ldt = _LDT(nr);
    p->tss.trace_bitmap = 0x80000000;
```

GDT表中每一项是8个字节，每个进程拥有一个```TSS```和```LDT```，因此每个进程占用字节是16字节， 因此序号为n的进程的LDT在GDT表中的偏移量就是```n*16 + 5*8```

```c
#define _LDT(n) ((((unsigned long) n)<<4)+(FIRST_LDT_ENTRY<<3))
```

如对上述知识遗忘，可以通过下面这张图进行温故。

![LDT.png](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/fork/LDT.png)

如果当前任务使用了协处理器，就保存其上下文。汇编指令```clts```用于清除控制寄存器```CRO```中的任务已交换(TS)标志。每当发生任务切换，CPU都会设置该标志。该标志用于管理数学协处理器：如果该标志置位，那么每个ESC指令都会被捕获(异常7)。如果协处理器存在标志MP也同时置位的话，那么WAIT指令也会捕获。因此，如果任务切换发生在一个ESC指令开始执行之后，则协处理器中的内容就可能需要在执行新的ESC指令之前保存起来。捕获处理句柄会保存协处理器的内容并复位TS标志。指令```fnsave```用于把协处理器的所有状态保存到目的操作数指定的内存区域中。

```c
	if (last_task_used_math == current)
		__asm__("clts ; fnsave %0"::"m" (p->tss.i387));
```

下面这里进程内存的拷贝， 实际上确定进行进程新的线性地址， 并进行页表的拷贝。详见本文中```copy_mem```的讲解。

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

这里设置GDT表中```tss```和```ldt```描述符的内容。

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

首先获取当前进程的段信息：

- 使用 ```get_limit``` 函数获取当前进程的代码段和数据段的段限长（即每个段的大小限制，以字节为单位）。
- 使用 ```get_base``` 函数获取当前进程的代码段和数据段在线性地址空间中的基地址。

接下来检查代码段和数据段的一致性：

- 首先，检查当前进程的代码段基地址和数据段基地址是否相同。在Linux-0.11内核中，这个版本不支持代码和数据段分离。
- 接着，检查数据段的限长是否大于或等于代码段的限长。这是因为数据段应该至少与代码段一样大，否则可能会导致访问越界。

```c
    code_limit=get_limit(0x0f);//根据代码段选择符获取代码段的长度
    data_limit=get_limit(0x17);//根据数据段选择符获取数据段的长度
    old_code_base = get_base(current->ldt[1]);//获取代码段的起始位置
    old_data_base = get_base(current->ldt[2]);//获取数据段的起始位置
    if (old_data_base != old_code_base)  //两个段起始位置相等
        panic("We don't support separate I&D");
    if (data_limit < code_limit)
        panic("Bad data_limit");
```

接下来设置新进程的段信息：

为了创建新进程，需要设置新进程的代码段和数据段的基地址。这里将新进程的基地址设置为任务号乘以64MB（以16进制表示的0x4000000）。
将新进程的代码段和数据段的基地址设置到新进程的局部描述符表（LDT）中，以便新进程能够访问正确的内存位置。

```c
    //确立新进程的代码段地址， Linux-0.11的线性地址是按照64M划分的，所以进程号nr的线性地址的起始位置是nr* 0x4000000
    new_data_base = new_code_base = nr * 0x4000000;
    p->start_code = new_code_base;  // 设置该位置到PCB中
    set_base(p->ldt[1],new_code_base); //设置代码段的地址
    set_base(p->ldt[2],new_data_base); //设置数据段的地址
```

接下来调用``` copy_page_tables ```函数将当前进程的页表复制到新进程中。页表是操作系统用于管理虚拟内存和物理内存之间映射关系的数据结构。
这样做会导致新进程与父进程共享相同的物理内存页面（copy-on-write），从而节省内存并提高效率。

```c
    if (copy_page_tables(old_data_base,new_data_base,data_limit)) {
        printk("free_page_tables: from copy_mem\n");
        free_page_tables(new_data_base,data_limit);
        return -ENOMEM;
    }
```

```copy_page_tables```在```memory.c```中定义,函数定义如下所示：


```c
int copy_page_tables(unsigned long from,unsigned long to,long size)
```

这里只需要了解一下该方法的入参， ```from```代表是线性地址上的原地址，```to```代表是线性地址上的目的地址，```size```代表要复制的长度。详细的复制过程会在```memory.c```中讲解。

### verify_area

```c
void verify_area(void * addr,int size)
```

该函数用于在进程空间进行写操作时进行地址验证的函数。在verify_area方法中可能会产生**写时复制**。

```addr```是指在进程线性地址中相对于起始位置的偏移量， ```size```指的是大小。

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

```write_verify```函数详解可以参考memory.c文件的讲解。

### find_empty_process

```c
int find_empty_process(void)
```

该函数的作用是在全局的task数组中找到一个空闲的项，并返回其下标。其在```system_call.s```中的```sys_fork```函数中被调用。

首先是寻找一个pid值，如果```last_pid```增1后超出进程号的整数表示范围，则```last_pid```会小于0。如果```last_pid+1<0```，则重新从1开始使用pid号。

由于last_pid的数值有可能从头开始进行递增，需要在任务数组中搜索刚设置的pid号是否已经被任何任务使用。如果已经被使用，则跳转到函数开始出重新获得一个pid号。

```c
repeat:
    if ((++last_pid)<0) last_pid=1;
    for(i=0 ; i<NR_TASKS ; i++)
        if (task[i] && task[i]->pid == last_pid) goto repeat;
```

接着寻找空闲进程槽位，在任务数组中寻找一个空闲项，即一个没有被使用的进程槽位。如果找到了空闲项，则返回该项的索引号。如果所有的进程槽位都被占用了，返回错误码 ```-EAGAIN```。

```c
for(i=1 ; i<NR_TASKS ; i++)
    if (!task[i])
        return i;
return -EAGAIN;
```