---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统pipe.c详解

## 模块简介

在Linux-0.11中提供了**管道这种进程间通讯**的方式。本程序包含了管道文件读写操作函数read_pipe()和write_pipe()。

## 函数详解

### read_pipe
```c
int read_pipe(struct m_inode * inode, char * buf, int count)
```
该函数是读管道的方法。

![pipe](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-fs/pipe/pipe.png)

函数的最初定义了一些参数，其中chars为需要复制的字符数，size的作用有两个，在下面的代码中会根据代码介绍，read参数代表已经读取的字符数。
```c
int chars, size, read = 0;
```

因为管道的大小最大只有4k，因此当count的值大于4K时，就涉及到多次读，因此通过一个大的循环，当count值大于0，便循环执行下面的操作。如果管道中的数据长度为0，那么就唤醒等待该管道inode的进程（通常是写pipe的进程）。如果目前没有写管道的进程，意味着当前pipe不可能读到数据，则将当前进程加入到等待该inode的队列中。
```c
while (count>0) {
    while (!(size=PIPE_SIZE(*inode))) {
        wake_up(&inode->i_wait);
        if (inode->i_count != 2) /* are there any writers? */
            return read;
        sleep_on(&inode->i_wait);
    }
```

进入到这里，意味着管道有数据可读。令chars的值等于管道尾指针到缓冲区末端的字节数。 如果其大于count值，那么令其等于count。如果chars大于管道中含有数据的长度size， 则令chars等于size。接下来令剩下待读的字符数减去chars，令已经读取的字符数read加上chars。
```c
chars = PAGE_SIZE-PIPE_TAIL(*inode);
if (chars > count)
    chars = count;
if (chars > size)
    chars = size;
count -= chars;
read += chars;
```

接下来将size指向原来尾指针的位置，将尾指针向前移动chars，如果超过4k，则返回头重新开始。最后调用put_fs_byte将管道中的数据复制到用户缓冲区中。
```c
size = PIPE_TAIL(*inode);
PIPE_TAIL(*inode) += chars;
PIPE_TAIL(*inode) &= (PAGE_SIZE-1);
while (chars-->0)
    put_fs_byte(((char *)inode->i_size)[size++],buf++);
```

最后，本次读管道操作结束，唤醒等待该管道的进程。
```c
wake_up(&inode->i_wait);
return read;
```

### write_pipe
```c
int write_pipe(struct m_inode * inode, char * buf, int count)
```
该函数是管道的写操作函数。

函数的开始定义了一些参数，其中chars是要写入管道的数量，size有多个作用，written是已经写入的字符数量。
```c
int chars, size, written = 0;
```

因为管道的大小最大只有4k，因此当count的值大于4K时，就涉及到多次写，因此通过一个大的循环，当count值大于0，便循环执行下面的操作。如果当前管道已经满，那么便唤醒等待该pipe inode的进程（读进程）。如果当前的inode节点没有其他的读进程，则发送SIGPIPE信号到进程。否则的话，则将当前进程加入sleep队列，直到pipe inode可写。
```c
while (count>0) {
    while (!(size=(PAGE_SIZE-1)-PIPE_SIZE(*inode))) {
        wake_up(&inode->i_wait);
        if (inode->i_count != 2) { /* no readers */
            current->signal |= (1<<(SIGPIPE-1));
            return written?written:-1;
        }
        sleep_on(&inode->i_wait);
    }
```

程序执行到这里，代表该管道当前有空间可写。首先获取管道头到缓冲区末端的字节数chars。如果chars大小大于count，则令chars等于count。接下来如果chars大于size值，则令chars等于size。接下来令count值减去chars值，令已写数据written加上chars值。
```c
chars = PAGE_SIZE-PIPE_HEAD(*inode);
if (chars > count)
    chars = count;
if (chars > size)
    chars = size;
count -= chars;
written += chars;
```

最后将size指向头节点，将PIPE_HEAD向前推进chars个字符。最后调用get_fs_byte，从buf拷贝数据到pipe缓冲区中。
```c
size = PIPE_HEAD(*inode);
PIPE_HEAD(*inode) += chars;
PIPE_HEAD(*inode) &= (PAGE_SIZE-1);
while (chars-->0)
    ((char *)inode->i_size)[size++]=get_fs_byte(buf++);
```

最后唤醒等待该pipe的进程，并返回已写入的字节数。
```c
    wake_up(&inode->i_wait);
    return written;
```

### sys_pipe
```c
int sys_pipe(unsigned long * fildes)
```
该函数是创建管道pipe函数的系统调用。

入参fildes是管道的文件描述符，(fildes+0)是读端，(fildes+1)是写端。

程序的开始，定义了一系列变量。其中，inode用于获取管道类型的inode。f数组用于从文件表中找到两个空位。fd数组是管道的读端和写端。 i和j用于遍历。

```c
    struct m_inode * inode;
    struct file * f[2];
    int fd[2];
    int i,j;
```

接下来要做的就是从全局文件表file_table中找到两个空位。如果找不到两个空位，就返回-1。
```c
    j=0;
    for(i=0;j<2 && i<NR_FILE;i++)
        if (!file_table[i].f_count)
            (f[j++]=i+file_table)->f_count++;
    if (j==1)
        f[0]->f_count=0;
    if (j<2)
        return -1;
```

接下来从进程的文件表中获取两个空位，用于填充文件描述符数组```fd[2]```。同样，如果没有两个空位，则返回-1。

```c
    j=0;
    for(i=0;j<2 && i<NR_OPEN;i++)
        if (!current->filp[i]) {
            current->filp[ fd[j]=i ] = f[j];
            j++;
        }
    if (j==1)
        current->filp[fd[0]]=NULL;
    if (j<2) {
        f[0]->f_count=f[1]->f_count=0;
        return -1;
    }
```

接下来便是获取一个空的inode节点用作管道读写的inode。如果没有空的inode节点，则返回-1。
```c
    if (!(inode=get_pipe_inode())) {
        current->filp[fd[0]] =
            current->filp[fd[1]] = NULL;
        f[0]->f_count = f[1]->f_count = 0;
        return -1;
    }
```

如果管道inode节点申请成功，则对两个文件结构进行初始化。并通过put_fs_long将文件描述符拷贝到入参fildes中。

```c
    f[0]->f_inode = f[1]->f_inode = inode;
    f[0]->f_pos = f[1]->f_pos = 0;
    f[0]->f_mode = 1;		/* read */
    f[1]->f_mode = 2;		/* write */
    put_fs_long(fd[0],0+fildes);
    put_fs_long(fd[1],1+fildes);
```

## Q & A