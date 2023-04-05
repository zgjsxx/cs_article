---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统super.c详解

## 模块简介
该模块给应用层提供了获取文件状态信息的接口stat和fstat。 stat是使用文件名进行获取， fstat是使用文件描述符进行获取。
## 函数详解

### cp_stat
```c
static void cp_stat(struct m_inode * inode, struct stat * statbuf)
```
该函数的作用是将inode中的文件信息拷贝到stat结构体中。

首先定义了一些参数， tmp用于从inode中获取文件信息，i用于后续遍历。
```c
struct stat tmp;
int i;
```

该函数首先对入参statbuf对应的内存地址进行校验，检查是否可以写，如果不能写，则进行写时复制。
```c
verify_area(statbuf,sizeof (* statbuf));
```

接下来就是将inode中的相关信息拷贝到tmp对象中。
```c
tmp.st_dev = inode->i_dev;//获取文件所在的设备号
tmp.st_ino = inode->i_num;//获取文件的i节点号
tmp.st_mode = inode->i_mode;//获取文件的属性
tmp.st_nlink = inode->i_nlinks;//获取文件的连接数
tmp.st_uid = inode->i_uid;//获取文件的用户id
tmp.st_gid = inode->i_gid;//获取文件的组id
tmp.st_rdev = inode->i_zone[0];//如果inode是设备类型，i_zone[0]代表设备号
tmp.st_size = inode->i_size;//文件字节长度
tmp.st_atime = inode->i_atime;//文件最后的访问时间
tmp.st_mtime = inode->i_mtime;//文件最后的修改时间
tmp.st_ctime = inode->i_ctime;//i节点最后的修改时间
```

最后，由于statbuf在用户态，而tmp在内核态，因此需要调用put_fs_byte实现从内核态向用户态拷贝数据。
```c
for (i=0 ; i<sizeof (tmp) ; i++)
    put_fs_byte(((char *) &tmp)[i],&((char *) statbuf)[i]);
```

### sys_stat
```c
int sys_stat(char * filename, struct stat * statbuf)
```
该函数是stat的系统调用，用于获取文件状态信息。

首先定义了inode指针，用于后续根据用户名查找inode。
```c
struct m_inode * inode;
```
下面调用namei函数(fs/namei.c)根据文件名获取inode节点，如果没有找到，则返回-ENOENT，代表**No such file or directory**。如果找到了，则调用cp_stat将数据拷贝到statbuf中，最后使用iput将inode的引用计数减去1。
```c
if (!(inode=namei(filename)))
    return -ENOENT;
cp_stat(inode,statbuf);

iput(inode);
return 0;
```

### sys_fstat
```c
int sys_fstat(unsigned int fd, struct stat * statbuf)
```
该函数时fstat的系统调用函数。其根据文件描述符fd查找文件状态信息。

首先定义了file指针f，和inode指针。

```c
struct file * f;
struct m_inode * inode;
```

下面对fd进行校验， 如果大于最大值，则返回-EBADF。接着根据fd的值，从进程PCB中的文件数组中查找出对应的inode号。如果查找不到，也同样返回-EBADF。 如果查找到了inode，则调用cp_stat将文件状态信息拷贝到statbuf中。

```c
if (fd >= NR_OPEN || !(f=current->filp[fd]) || !(inode=f->f_inode))
    return -EBADF;
cp_stat(inode,statbuf);
return 0;
```


## Q & A
### stat和fstat使用上有什么区别？

stat和fstat使用上的区别在于，stat是从文件名出发得到的文件属性信息，因此实现不需要先打开文件；而fstat函数则从文件描述符出发得到文件属性信息，所以使用fstat函数之前需要先打开文件得到文件描述符。