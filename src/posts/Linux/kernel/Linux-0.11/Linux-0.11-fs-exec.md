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

### count
```c
static int count(char ** argv)
```

### copy_strings
```c
static unsigned long copy_strings(int argc,char ** argv,unsigned long *page,
		unsigned long p, int from_kmem)
```

### change_ldt
```c
static unsigned long change_ldt(unsigned long text_size,unsigned long * page)
```

### do_execve
```c
int do_execve(unsigned long * eip,long tmp,char * filename,
	char ** argv, char ** envp)
```
根据文件的路径获取i节点。

         |   段描述符索引           |TI | RPL |
0x0017 = |0 0 0 0 0 0 0 0 0 0 0 1 0| 1 | 1 1 |
0x000f = |0 0 0 0 0 0 0 0 0 0 0 0 1| 1 | 1 1 |


```c
if (!(inode=namei(filename)))		/* get executables inode */
    return -ENOENT;
```

统计参数和环境变量的个数。
```c
argc = count(argv);
envc = count(envp);
```
## Q & A