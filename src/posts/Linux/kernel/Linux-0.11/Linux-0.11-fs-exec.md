---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统exec.c详解

## 模块简介

## 函数详解

### create_tables
```c
static unsigned long * create_tables(char * p,int argc,int envc)
```
该函数的作用是建立参数和环境变量指针表。

create_table的作用就是建立指针表去指向copy_string拷贝的字符串。

![create_tables](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-fs/exec/create_table.png)

```c
	unsigned long *argv,*envp;
	unsigned long * sp;

	sp = (unsigned long *) (0xfffffffc & (unsigned long) p);
	sp -= envc+1;
	envp = sp;
	sp -= argc+1;
	argv = sp;
	put_fs_long((unsigned long)envp,--sp);
	put_fs_long((unsigned long)argv,--sp);
	put_fs_long((unsigned long)argc,--sp);
	while (argc-->0) {
		put_fs_long((unsigned long) p,argv++);
		while (get_fs_byte(p++)) /* nothing */ ;
	}
	put_fs_long(0,argv);
	while (envc-->0) {
		put_fs_long((unsigned long) p,envp++);
		while (get_fs_byte(p++)) /* nothing */ ;
	}
	put_fs_long(0,envp);
	return sp;
```

### count
```c
static int count(char ** argv)
```
该函数用于计算参数的个数。

argv数组的最后一项是NULL，以此作为循环终止的条件。

![count](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-fs/exec/count.png)


```c
	int i=0;
	char ** tmp;

	if ((tmp = argv))
		while (get_fs_long((unsigned long *) (tmp++)))
			i++;

	return i;
```

### copy_strings
```c
static unsigned long copy_strings(int argc,char ** argv,unsigned long *page,
		unsigned long p, int from_kmem)
```
该函数的作用是从用户拷贝命令行参数和环境字符串拷贝到内核空间。

在do_execve函数中定义了一个page数组```unsigned long page[MAX_ARG_PAGES]```，该数组定义在内核空间中，用于存储用户态传递过来的环境参数和命令行参数。初始时，程序定义了一个指向该空间末端(128k-4)处的空间偏移量p, 当随着环境参数和命令行参数的拷贝，p指针将向前进行移动， 如下图所示：

![copy_strings](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-fs/exec/copy_strings.png)

在函数的内部，考虑了参数不处于用户空间的场景，使用from_kmen，为了便于理解，可以默认from_kmen=0。
```c
 * from_kmem     argv *        argv **
 *    0          user space    user space
 *    1          kernel space  user space
 *    2          kernel space  kernel space
```

该函数在开始处，定义了一些参数，并获取处ds寄存器和fs寄存器的值。
```c
	char *tmp, *pag=NULL;
	int len, offset = 0;
	unsigned long old_fs, new_fs;

	if (!p)
		return 0;	/* bullet-proofing */
	new_fs = get_ds();
	old_fs = get_fs();
	if (from_kmem==2)
		set_fs(new_fs);
```

接下来,因此传入的参数的数量argc个，因此对其进行遍历，依次将其拷贝到page数组中。
```c
	while (argc-- > 0) {
		if (from_kmem == 1)
			set_fs(new_fs);
		if (!(tmp = (char *)get_fs_long(((unsigned long *)argv)+argc)))
			panic("argc is wrong");
		if (from_kmem == 1)
			set_fs(old_fs);
		len=0;		/* remember zero-padding */
		do {
			len++;
		} while (get_fs_byte(tmp++));//将tmp指向字符串的末端
		if (p-len < 0) {	/* this shouldn't happen - 128kB */
			set_fs(old_fs);
			return 0;
		}
		while (len) {//逐字节拷贝
			--p; --tmp; --len;
			if (--offset < 0) {
				offset = p % PAGE_SIZE;
				if (from_kmem==2)
					set_fs(old_fs);
				if (!(pag = (char *) page[p/PAGE_SIZE]) &&
				    !(pag = (char *) (page[p/PAGE_SIZE] =
				      get_free_page()))) 
					return 0;
				if (from_kmem==2)
					set_fs(new_fs);

			}
			*(pag + offset) = get_fs_byte(tmp);
		}
	}
	if (from_kmem==2)
		set_fs(old_fs);
	return p;
```

### change_ldt
```c
static unsigned long change_ldt(unsigned long text_size,unsigned long * page)
```
该函数的作用是修改LDT中段基址和段限长度， 同时将参数和环境空间放置在数据段的末端。
```c
	unsigned long code_limit,data_limit,code_base,data_base;
	int i;

	code_limit = text_size+PAGE_SIZE -1;
	code_limit &= 0xFFFFF000;
	data_limit = 0x4000000;
	code_base = get_base(current->ldt[1]);
	data_base = code_base;
	set_base(current->ldt[1],code_base);
	set_limit(current->ldt[1],code_limit);
	set_base(current->ldt[2],data_base);
	set_limit(current->ldt[2],data_limit);
/* make sure fs points to the NEW data segment */
	__asm__("pushl $0x17\n\tpop %%fs"::);
	data_base += data_limit;
	for (i=MAX_ARG_PAGES-1 ; i>=0 ; i--) {
		data_base -= PAGE_SIZE;
		if (page[i])
			put_page(page[i],data_base);
	}
	return data_limit;
```

### do_execve
```c
int do_execve(unsigned long * eip,long tmp,char * filename,
	char ** argv, char ** envp)
```
该函数的作用是用于加载并执行其他的程序。通常会跟着fork之后调用。

第一部分是变量的定义，没啥好说的。
```c
	struct m_inode * inode;
	struct buffer_head * bh;
	struct exec ex;
	unsigned long page[MAX_ARG_PAGES];
	int i,argc,envc;
	int e_uid, e_gid;
	int retval;
	int sh_bang = 0;
	unsigned long p=PAGE_SIZE*MAX_ARG_PAGES-4;

```

下面这里是对变量的check。```eip[1]```实际上就是源程序的cs寄存器值。对于用户态的程序， TI字段为1，RPL=3，代码段的序号为1，因此cs寄存器的值为0x000f,因此如果```eip[1] & 0xffff```的值不是0x000f,也就意味着execve是从内核进程调用的，但是内核进程是不能被替换掉的，因此这里进行检查。

```
         |   段描述符索引           |TI | RPL |
0x0017 = |0 0 0 0 0 0 0 0 0 0 0 1 0| 1 | 1 1 |
0x000f = |0 0 0 0 0 0 0 0 0 0 0 0 1| 1 | 1 1 |
```

```c
	if ((0xffff & eip[1]) != 0x000f)
		panic("execve called from supervisor mode");
```

接下来根据文件的路径获取i节点。

```c
if (!(inode=namei(filename)))		/* get executables inode */
    return -ENOENT;
```

然后统计参数和环境变量的个数。
```c
argc = count(argv);
envc = count(envp);
```

如果inode不是常规文件，则返回错误。
```c
restart_interp:
	if (!S_ISREG(inode->i_mode)) {	/* must be regular file */
		retval = -EACCES;
		goto exec_error2;
	}
```

下面的代码用于判断进程是否有权限执行。
```c
	i = inode->i_mode;
	e_uid = (i & S_ISUID) ? inode->i_uid : current->euid;
	e_gid = (i & S_ISGID) ? inode->i_gid : current->egid;
	if (current->euid == inode->i_uid)
		i >>= 6;
	else if (current->egid == inode->i_gid)
		i >>= 3;
	if (!(i & 1) &&
	    !((inode->i_mode & 0111) && suser())) {
		retval = -ENOEXEC;
		goto exec_error2;
	}
```


执行到这里说明进程有权限运行程序，接着便是去磁盘中读取程序的第一个数据块。
```c
if (!(bh = bread(inode->i_dev,inode->i_zone[0]))) {
    retval = -EACCES;
    goto exec_error2;
}
ex = *((struct exec *) bh->b_data);	/* read exec-header */
```

下面这里便是判断文件是否是一个脚本文件。
```c
if ((bh->b_data[0] == '#') && (bh->b_data[1] == '!') && (!sh_bang)) {
```

此时bh块中的数据内容已经被拷贝到了ex结构体中，因此可以释放bh块。

接下来因为Linux-0.11只支持ZMAGIC格式可执行文件，因此如果格式不等于ZMAGIC将直接返回错误。

此外，如果可执行文件太大或者文件缺失不全，那么也不能运行。首先如果程序的代码段+数据段+bss段的长度超过了50M，则返回错误。 其次如果执行文件的长度小于（代码段+数据段+符号表长度+执行头)的长度，也会返回错误。
```c
brelse(bh);
if (N_MAGIC(ex) != ZMAGIC || ex.a_trsize || ex.a_drsize ||
    ex.a_text+ex.a_data+ex.a_bss>0x3000000 ||
    inode->i_size < ex.a_text+ex.a_data+ex.a_syms+N_TXTOFF(ex)) {
    retval = -ENOEXEC;
    goto exec_error2;
}
```

如果执行文件代码开始处没有位于1024字节边界处，则也不能执行。
```c
if (N_TXTOFF(ex) != BLOCK_SIZE) {
    printk("%s: N_TXTOFF != BLOCK_SIZE. See a.out.h.", filename);
    retval = -ENOEXEC;
    goto exec_error2;
}
```

如果sh_bang标志没有设置，则复制指定个数的命令行参数和环境字符串到参数和环境空间。如果sh_bang为true，代表是运行的脚本程序，此时命令行参数和环境字符串已经进行了复制。
```c
	if (!sh_bang) {
		p = copy_strings(envc,envp,page,p,0);//拷贝环境字符串
		p = copy_strings(argc,argv,page,p,0);//拷贝命令行参数
		if (!p) {
			retval = -ENOMEM;
			goto exec_error2;
		}
	}
```

这里放回进程原来所需要执行的程序的i节点，并让进程executable指向新执行文件的i节点。然后复位原进程的所有信号处理句柄。再根据执行时关闭文件句柄close_on_exec位图标志，关闭指定的打开文件，并复位该标志。
```c
if (current->executable)
    iput(current->executable);
current->executable = inode;
for (i=0 ; i<32 ; i++)
    current->sigaction[i].sa_handler = NULL;
for (i=0 ; i<NR_OPEN ; i++)
    if ((current->close_on_exec>>i)&1)
        sys_close(i);
current->close_on_exec = 0;
```

```c
free_page_tables(get_base(current->ldt[1]),get_limit(0x0f));
free_page_tables(get_base(current->ldt[2]),get_limit(0x17));
if (last_task_used_math == current)
    last_task_used_math = NULL;
current->used_math = 0;
```

```c
p += change_ldt(ex.a_text,page)-MAX_ARG_PAGES*PAGE_SIZE;
p = (unsigned long) create_tables((char *)p,argc,envc);
```

接下来重新设置进程个字段的值。例如brk=a_text+a_data+a_bss
```c
current->brk = ex.a_bss +
    (current->end_data = ex.a_data +
    (current->end_code = ex.a_text));
current->start_stack = p & 0xfffff000;
current->euid = e_uid;
current->egid = e_gid;
```

如果执行文件的代码段加上数据段长度不在页面的边界上，则将剩余部分置为0。
```c
i = ex.a_text+ex.a_data;
while (i&0xfff)
    put_fs_byte(0,(char *) (i++));
eip[0] = ex.a_entry;		/* eip, magic happens :-) */
eip[3] = p;			/* stack pointer */
return 0;
```


## Q & A