---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统read_write.c详解

## sys_read
```c
int sys_read(unsigned int fd,char * buf,int count)
```
该函数是read函数的系统调用函数， 主要作用是实现各种类型的读的方法。

其实现原理是通过fd找到对应的inode节点， 然后根据inode节点的属性去调用对应的read方法， 包括read_pipe，rw_char,block_read,file_read。

这里首先对参数进行校验。如果fd大于进程对于fd的限制值NR_OPEN（20）， 会返回错误。除此以外， 如果需要读取的字符数量小于0或者fd对应的文件指针为空， 也都会返回错误。

如果count数量为0， 则直接返回0。
```c
struct file * file;
struct m_inode * inode;

if (fd>=NR_OPEN || count<0 || !(file=current->filp[fd]))
    return -EINVAL;
if (!count)
    return 0;
```

接下来就是通过if语句判断inode的属性去调用对应的read方法， 如果是管道文件， 就调用read_pipe，如果是字符型文件，就调用rw_char进行读取， 如果是块设备文件，就调用block_read， 如果是目录文件或者常规文件， 就调用file_read。

```c
inode = file->f_inode;
if (inode->i_pipe)
    return (file->f_mode&1)?read_pipe(inode,buf,count):-EIO;
if (S_ISCHR(inode->i_mode))
    return rw_char(READ,inode->i_zone[0],buf,count,&file->f_pos);
if (S_ISBLK(inode->i_mode))
    return block_read(inode->i_zone[0],&file->f_pos,buf,count);
if (S_ISDIR(inode->i_mode) || S_ISREG(inode->i_mode)) {
    if (count+file->f_pos > inode->i_size)
        count = inode->i_size - file->f_pos;
    if (count<=0)
        return 0;
    return file_read(inode,file,buf,count);
```
## sys_write
```c
int sys_write(unsigned int fd,char * buf,int count)
```
该函数的作用与sys_read是有相似之处的，其实现原理是通过fd找到对应的inode节点， 然后根据inode节点的属性去调用对应的write方法， 包括write_pipe，rw_char,block_write,file_write。


接下来就是通过if语句判断inode的属性去调用对应的write方法， 如果是管道文件， 就调用write_pipe，如果是字符型文件，就调用rw_char进行读取， 如果是块设备文件，就调用block_write， 如果是目录文件或者常规文件， 就调用file_write。
```c
if (inode->i_pipe)
    return (file->f_mode&2)?write_pipe(inode,buf,count):-EIO;
if (S_ISCHR(inode->i_mode))
    return rw_char(WRITE,inode->i_zone[0],buf,count,&file->f_pos);
if (S_ISBLK(inode->i_mode))
    return block_write(inode->i_zone[0],&file->f_pos,buf,count);
if (S_ISREG(inode->i_mode))
    return file_write(inode,file,buf,count);
```