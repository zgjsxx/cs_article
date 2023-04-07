---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 文件系统namei.c详解

## 模块简介

## 函数详解

### permission
```c
static int permission(struct m_inode * inode,int mask)
```


### match
```c
static int match(int len,const char * name,struct dir_entry * de)
```
该函数用于比较name的和de->name的前len个字符是否相等。(注意name处于用户空间)

首先对参数进行校验。如果目录项指针de为空， 或者de中的inode节点指针为空，或者长度len大于文件名的最大长度，则直接返回0。

接下来是对目录项中文件名的长度进行校验，如果其长度大于len，则```de->name[len]```的值不为NULL。在这种情况下，直接返回0。

```c
register int same ;

if (!de || !de->inode || len > NAME_LEN)
	return 0;
if (len < NAME_LEN && de->name[len])
	return 0;
```

下面通过一段汇编实现字符串指定长度的比较。

其中，esi指向name，edi指向de->name, ecx的值为len， 将eax的值赋值给same。
```c
__asm__("cld\n\t"//清方向位
	"fs ; repe ; cmpsb\n\t"//用户空间 执行循环比较 while(ecx--) esi++ == edi++
	"setz %%al"//如果结果一样，则设置al = 1
	:"=a" (same)
	:"0" (0),"S" ((long) name),"D" ((long) de->name),"c" (len)
	);
return same;
```

其中，下面这行汇编较难理解，
```c
fs ; repe ; cmpsb
```

cmpsb指令用于比较ds:esi和es:edi指向的一个字节的内容。 而加上了前缀repe之后，就代表重复执行cmpsb指令，直到ecx等于0，或者ds:esi和es:edi的值不等。 但是由于name在用户空间，因此还需要加上fs前缀，使得被操作数修改为fs:esi。

### find_entry
```c
static struct buffer_head * find_entry(struct m_inode ** dir,
	const char * name, int namelen, struct dir_entry ** res_dir)
```
假设现在有一个路径/home/work/test.txt，dir指向的是/home，name指向的是work/test.txt，namelen=4， 那么该函数将会找到/home/work对应的dir_entry,dir_entry中包含了inode号和目录名字。


刚开始定义了一些参数，并对一些参数的有效性进行了校验。 如果定义了宏NO_TRUNCATE， 如果长度超长，就直接返回NULL。如果没有定义该宏， 长度超长，则进行截断。
```c
	int entries;
	int block,i;
	struct buffer_head * bh;
	struct dir_entry * de;
	struct super_block * sb;

#ifdef NO_TRUNCATE
	if (namelen > NAME_LEN)
		return NULL;
#else
	if (namelen > NAME_LEN)
		namelen = NAME_LEN;
#endif
```

接下来取出当前的目录中有多少个目录项。
```c
entries = (*dir)->i_size / (sizeof (struct dir_entry));
*res_dir = NULL;
if (!namelen)
	return NULL;
```

接下来对一些特别的场景进行处理。

首先，假设一个进程的根目录是```/home/work```,但是目前访问的地址是```/home/work/..```, 这种情况是不被允许的，因此这里会将```/home/work/..```处理成```/home/work/.```。

另外，如果该目录的i节点号等于1，说明是文件系统的根inode节点。则取出文件系统的超级块，查看该文件系统被安装到了哪个inode节点上，如果该节点是存在的，那么会将(*dir)指向安装的inode节点。

```c
/* check for '..', as we might have to do some "magic" for it */
	if (namelen==2 && get_fs_byte(name)=='.' && get_fs_byte(name+1)=='.') {
/* '..' in a pseudo-root results in a faked '.' (just change namelen) */
		if ((*dir) == current->root)
			namelen=1;
		else if ((*dir)->i_num == ROOT_INO) {
/* '..' over a mount-point results in 'dir' being exchanged for the mounted
   directory-inode. NOTE! We set mounted, so that we can iput the new dir */
			sb=get_super((*dir)->i_dev);
			if (sb->s_imount) {
				iput(*dir);
				(*dir)=sb->s_imount;
				(*dir)->i_count++;
			}
		}
	}
```


接着取出dir对应的inode节点对应的数据块的内容(dir目录下的文件)。
```c
if (!(block = (*dir)->i_zone[0]))
	return NULL;
if (!(bh = bread((*dir)->i_dev,block)))
	return NULL;
i = 0;
de = (struct dir_entry *) bh->b_data;
```

接下来便进行遍历所有的目录项的内容，比较de->name和name 相同的项。
```c
while (i < entries) {
	if ((char *)de >= BLOCK_SIZE+bh->b_data) {
		brelse(bh);
		bh = NULL;
		if (!(block = bmap(*dir,i/DIR_ENTRIES_PER_BLOCK)) ||
			!(bh = bread((*dir)->i_dev,block))) {
			i += DIR_ENTRIES_PER_BLOCK;
			continue;
		}
		de = (struct dir_entry *) bh->b_data;
	}
	if (match(namelen,name,de)) {
		*res_dir = de;
		return bh;
	}
	de++;
	i++;
}
```

### add_entry
```c
static struct buffer_head * add_entry(struct m_inode * dir,
	const char * name, int namelen, struct dir_entry ** res_dir)
```



### get_dir
```c
static struct m_inode * get_dir(const char * pathname)
```
该函数的作用是搜寻最下层的目录的inode号。

例如pathname是/home/work/test.txt，那么get_dir将返回/home/work目录的inode。

```c
char c;
const char * thisname;
struct m_inode * inode;
struct buffer_head * bh;
int namelen,inr,idev;
struct dir_entry * de;

if (!current->root || !current->root->i_count)
	panic("No root inode");
if (!current->pwd || !current->pwd->i_count)
	panic("No cwd inode");
if ((c=get_fs_byte(pathname))=='/') {
	inode = current->root;
	pathname++;
} else if (c)
	inode = current->pwd;
else
	return NULL;	/* empty name is bad */
inode->i_count++;
while (1) {
	thisname = pathname;
	if (!S_ISDIR(inode->i_mode) || !permission(inode,MAY_EXEC)) {
		iput(inode);
		return NULL;
	}
	for(namelen=0;(c=get_fs_byte(pathname++))&&(c!='/');namelen++)
		/* nothing */ ;
	if (!c)
		return inode;
	if (!(bh = find_entry(&inode,thisname,namelen,&de))) {
		iput(inode);
		return NULL;
	}
	inr = de->inode;
	idev = inode->i_dev;
	brelse(bh);
	iput(inode);
	if (!(inode = iget(idev,inr)))
		return NULL;
}
```


### dir_namei
```c
static struct m_inode * dir_namei(const char * pathname,
	int * namelen, const char ** name)
```


```c
char c;
const char * basename;
struct m_inode * dir;

if (!(dir = get_dir(pathname)))
	return NULL;
basename = pathname;
while ((c=get_fs_byte(pathname++)))
	if (c=='/')
		basename=pathname;
*namelen = pathname-basename-1;
*name = basename;
return dir;
```
### namei
```c
struct m_inode * namei(const char * pathname)
```
根据路径名字获取文件的inode节点。

```c
const char * basename;
int inr,dev,namelen;
struct m_inode * dir;
struct buffer_head * bh;
struct dir_entry * de;

if (!(dir = dir_namei(pathname,&namelen,&basename)))
	return NULL;
if (!namelen)			/* special case: '/usr/' etc */
	return dir;
bh = find_entry(&dir,basename,namelen,&de);
if (!bh) {
	iput(dir);
	return NULL;
}
inr = de->inode;
dev = dir->i_dev;
brelse(bh);
iput(dir);
dir=iget(dev,inr);
if (dir) {
	dir->i_atime=CURRENT_TIME;
	dir->i_dirt=1;
}
return dir;
```
### open_namei
```c
int open_namei(const char * pathname, int flag, int mode,
	struct m_inode ** res_inode)
```
该函数作用是根据文件路径pathname打开一个文件，找到其inode。是open函数使用的namei函数。

```c
const char * basename;
int inr,dev,namelen;
struct m_inode * dir, *inode;
struct buffer_head * bh;
struct dir_entry * de;

if ((flag & O_TRUNC) && !(flag & O_ACCMODE))
	flag |= O_WRONLY;
mode &= 0777 & ~current->umask;
mode |= I_REGULAR;
```

```c
if (!(dir = dir_namei(pathname,&namelen,&basename)))
	return -ENOENT;
```
### sys_mknod
```c
int sys_mknod(const char * filename, int mode, int dev)
```

### sys_mkdir
```c
int sys_mkdir(const char * pathname, int mode)
```

### empty_dir
```c
static int empty_dir(struct m_inode * inode)
```

### sys_rmdir
```c
int sys_rmdir(const char * name)
```

### sys_unlink
```c
int sys_unlink(const char * name)
```

### sys_link
```c
int sys_link(const char * oldname, const char * newname)
```

## Q & A