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
检查进程操作文件inode的权限。

|mask的值|含义|
|---|--|
|mask = 4|检查进程是否有权限读该inode|
|mask = 2|检查进程是否有权限写该inode|
|mask = 1|检查进程是否有权限执行该inode|
|mask = 5|检查进程是否有权限读和执行该inode|
|mask = 3|检查进程是否有权限写和执行该inode|
|mask = 6|检查进程是否有权限读和写该inode|
|mask = 7|检查进程是否有权限读写和执行该inode|

```c
	int mode = inode->i_mode;

/* special case: not even root can read/write a deleted file */
	if (inode->i_dev && !inode->i_nlinks)
		return 0;
	else if (current->euid==inode->i_uid)
		mode >>= 6;
	else if (current->egid==inode->i_gid)
		mode >>= 3;
	if (((mode & mask & 0007) == mask) || suser())//访问权限和掩码相同，或者是超级用户
		return 1;
	return 0;
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
假设现在有一个路径/home/work/test.txt，dir指向的是/home，name指向的是work/test.txt，namelen=4， 那么该函数将会找到/home/work对应的dir_entry(dir_entry中包含了inode号和目录名字)。


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
该函数用于向指定的目录添加一个目录项。

```c
	int block,i;
	struct buffer_head * bh;
	struct dir_entry * de;

	*res_dir = NULL;
#ifdef NO_TRUNCATE
	if (namelen > NAME_LEN)
		return NULL;
#else
	if (namelen > NAME_LEN)
		namelen = NAME_LEN;
#endif
	if (!namelen)
		return NULL;
	if (!(block = dir->i_zone[0]))
		return NULL;
	if (!(bh = bread(dir->i_dev,block)))
		return NULL;
	i = 0;
	de = (struct dir_entry *) bh->b_data;
	while (1) {
		if ((char *)de >= BLOCK_SIZE+bh->b_data) {
			brelse(bh);
			bh = NULL;
			block = create_block(dir,i/DIR_ENTRIES_PER_BLOCK);
			if (!block)
				return NULL;
			if (!(bh = bread(dir->i_dev,block))) {
				i += DIR_ENTRIES_PER_BLOCK;
				continue;
			}
			de = (struct dir_entry *) bh->b_data;
		}
		if (i*sizeof(struct dir_entry) >= dir->i_size) {
			de->inode=0;
			dir->i_size = (i+1)*sizeof(struct dir_entry);
			dir->i_dirt = 1;
			dir->i_ctime = CURRENT_TIME;
		}
		if (!de->inode) {
			dir->i_mtime = CURRENT_TIME;
			for (i=0; i < NAME_LEN ; i++)
				de->name[i]=(i<namelen)?get_fs_byte(name+i):0;
			bh->b_dirt = 1;
			*res_dir = de;
			return bh;
		}
		de++;
		i++;
	}
	brelse(bh);
	return NULL;
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
该函数的作用是返回指定路径(pathname)所在目录的i节点， 并返回其上层目录的名称。


例如：pathname = /home/work/test.txt， dir_namei将返回目录```/home/work```的i节点，同时设置name = "test.txt", namelen = 8。


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
该函数的作用是创建一个设备特殊文件或者普通文件节点。

```c
	const char * basename;
	int namelen;
	struct m_inode * dir, * inode;
	struct buffer_head * bh;
	struct dir_entry * de;
	
	if (!suser())//如果不是超级用户，返回出错
		return -EPERM;
	if (!(dir = dir_namei(filename,&namelen,&basename)))
		return -ENOENT;
	if (!namelen) {
		iput(dir);
		return -ENOENT;
	}
	if (!permission(dir,MAY_WRITE)) {//检查权限
		iput(dir);
		return -EPERM;
	}
	bh = find_entry(&dir,basename,namelen,&de);//检查是否已经存在
	if (bh) {
		brelse(bh);
		iput(dir);
		return -EEXIST;
	}
	inode = new_inode(dir->i_dev);//否则创建一个i节点
	if (!inode) {
		iput(dir);
		return -ENOSPC;
	}
	inode->i_mode = mode;
	if (S_ISBLK(mode) || S_ISCHR(mode))
		inode->i_zone[0] = dev;  //i_zone存放设备号
	inode->i_mtime = inode->i_atime = CURRENT_TIME;
	inode->i_dirt = 1;
	bh = add_entry(dir,basename,namelen,&de);//添加到目录下
	if (!bh) {
		iput(dir);
		inode->i_nlinks=0;
		iput(inode);
		return -ENOSPC;
	}
	de->inode = inode->i_num;
	bh->b_dirt = 1;
	iput(dir);
	iput(inode);
	brelse(bh);
	return 0;
```

### sys_mkdir
```c
int sys_mkdir(const char * pathname, int mode)
```
该函数的作用是用于创建一个目录。

```c
	const char * basename;
	int namelen;
	struct m_inode * dir, * inode;
	struct buffer_head * bh, *dir_block;
	struct dir_entry * de;

	if (!suser())  //如果不是超级用户，则返回权限问题。
		return -EPERM;
	if (!(dir = dir_namei(pathname,&namelen,&basename)))//获取该路径所在目录的i节点
		return -ENOENT;
	if (!namelen) {
		iput(dir);
		return -ENOENT;
	}
	if (!permission(dir,MAY_WRITE)) {//如果对该目录没有写权限
		iput(dir);
		return -EPERM;
	}
	bh = find_entry(&dir,basename,namelen,&de);//从该目录中
	if (bh) {
		brelse(bh);
		iput(dir);
		return -EEXIST;
	}
	inode = new_inode(dir->i_dev);//创建一个新的i节点
	if (!inode) {
		iput(dir);
		return -ENOSPC;
	}
	inode->i_size = 32;
	inode->i_dirt = 1;
	inode->i_mtime = inode->i_atime = CURRENT_TIME;
	if (!(inode->i_zone[0]=new_block(inode->i_dev))) {
		iput(dir);
		inode->i_nlinks--;
		iput(inode);
		return -ENOSPC;
	}
	inode->i_dirt = 1;
	if (!(dir_block=bread(inode->i_dev,inode->i_zone[0]))) {
		iput(dir);
		free_block(inode->i_dev,inode->i_zone[0]);
		inode->i_nlinks--;
		iput(inode);
		return -ERROR;
	}
	de = (struct dir_entry *) dir_block->b_data;
	de->inode=inode->i_num;
	strcpy(de->name,".");
	de++;
	de->inode = dir->i_num;
	strcpy(de->name,"..");
	inode->i_nlinks = 2;
	dir_block->b_dirt = 1;
	brelse(dir_block);
	inode->i_mode = I_DIRECTORY | (mode & 0777 & ~current->umask);
	inode->i_dirt = 1;
	bh = add_entry(dir,basename,namelen,&de);
	if (!bh) {
		iput(dir);
		free_block(inode->i_dev,inode->i_zone[0]);
		inode->i_nlinks=0;
		iput(inode);
		return -ENOSPC;
	}
	de->inode = inode->i_num;
	bh->b_dirt = 1;
	dir->i_nlinks++;
	dir->i_dirt = 1;
	iput(dir);
	iput(inode);
	brelse(bh);
	return 0;
```

### empty_dir
```c
static int empty_dir(struct m_inode * inode)
```
该函数的作用是检查指定的目录是否为空。

```c
	int nr,block;
	int len;
	struct buffer_head * bh;
	struct dir_entry * de;

	len = inode->i_size / sizeof (struct dir_entry);
	if (len<2 || !inode->i_zone[0] ||
	    !(bh=bread(inode->i_dev,inode->i_zone[0]))) {   //如果当前目录的目录项小于两个， 获取i_zone[0]为空
	    	printk("warning - bad directory on dev %04x\n",inode->i_dev);
		return 0;
	}
	de = (struct dir_entry *) bh->b_data;
	if (de[0].inode != inode->i_num || !de[1].inode || 
	    strcmp(".",de[0].name) || strcmp("..",de[1].name)) { //检查目录项是否是.或者..
	    	printk("warning - bad directory on dev %04x\n",inode->i_dev);
		return 0;
	}
	nr = 2;
	de += 2;
	while (nr<len) {
		if ((void *) de >= (void *) (bh->b_data+BLOCK_SIZE)) { //循环检测剩下所有的目录项的指向的i节点值是否会等于0
			brelse(bh);
			block=bmap(inode,nr/DIR_ENTRIES_PER_BLOCK);
			if (!block) {
				nr += DIR_ENTRIES_PER_BLOCK;
				continue;
			}
			if (!(bh=bread(inode->i_dev,block)))
				return 0;
			de = (struct dir_entry *) bh->b_data;
		}
		if (de->inode) {
			brelse(bh);
			return 0;
		}
		de++;
		nr++;
	}
	brelse(bh);
	return 1;
```

### sys_rmdir
```c
int sys_rmdir(const char * name)
```
该函数的作用是用于删除目录。
```c
	const char * basename;
	int namelen;
	struct m_inode * dir, * inode;
	struct buffer_head * bh;
	struct dir_entry * de;

	if (!suser())
		return -EPERM;
	if (!(dir = dir_namei(name,&namelen,&basename)))
		return -ENOENT;
	if (!namelen) {
		iput(dir);
		return -ENOENT;
	}
	if (!permission(dir,MAY_WRITE)) {
		iput(dir);
		return -EPERM;
	}
	bh = find_entry(&dir,basename,namelen,&de);
	if (!bh) {
		iput(dir);
		return -ENOENT;
	}
	if (!(inode = iget(dir->i_dev, de->inode))) {
		iput(dir);
		brelse(bh);
		return -EPERM;
	}
	if ((dir->i_mode & S_ISVTX) && current->euid &&
	    inode->i_uid != current->euid) {
		iput(dir);
		iput(inode);
		brelse(bh);
		return -EPERM;
	}
	if (inode->i_dev != dir->i_dev || inode->i_count>1) {
		iput(dir);
		iput(inode);
		brelse(bh);
		return -EPERM;
	}
	if (inode == dir) {	/* we may not delete ".", but "../dir" is ok */
		iput(inode);
		iput(dir);
		brelse(bh);
		return -EPERM;
	}
	if (!S_ISDIR(inode->i_mode)) {
		iput(inode);
		iput(dir);
		brelse(bh);
		return -ENOTDIR;
	}
	if (!empty_dir(inode)) {
		iput(inode);
		iput(dir);
		brelse(bh);
		return -ENOTEMPTY;
	}
	if (inode->i_nlinks != 2)
		printk("empty directory has nlink!=2 (%d)",inode->i_nlinks);
	de->inode = 0;
	bh->b_dirt = 1;
	brelse(bh);
	inode->i_nlinks=0;
	inode->i_dirt=1;
	dir->i_nlinks--;
	dir->i_ctime = dir->i_mtime = CURRENT_TIME;
	dir->i_dirt=1;
	iput(dir);
	iput(inode);
	return 0;
```

### sys_unlink
```c
int sys_unlink(const char * name)
```
该函数的作用是用于删除文件的一个链接。

```c
	const char * basename;
	int namelen;
	struct m_inode * dir, * inode;
	struct buffer_head * bh;
	struct dir_entry * de;

	if (!(dir = dir_namei(name,&namelen,&basename)))//获取文件所在目录的i节点
		return -ENOENT;
	if (!namelen) {//如果文件名长度为0
		iput(dir);
		return -ENOENT;
	}
	if (!permission(dir,MAY_WRITE)) {//检查是否有目录的写权限
		iput(dir);
		return -EPERM;
	}
	bh = find_entry(&dir,basename,namelen,&de);//查找该文件的dir_entry
	if (!bh) {
		iput(dir);
		return -ENOENT;
	}
	if (!(inode = iget(dir->i_dev, de->inode))) {//获取该文件的i节点
		iput(dir);
		brelse(bh);
		return -ENOENT;
	}
	if ((dir->i_mode & S_ISVTX) && !suser() &&
	    current->euid != inode->i_uid &&
	    current->euid != dir->i_uid) {//检查用户权限
		iput(dir);
		iput(inode);
		brelse(bh);
		return -EPERM;
	}
	if (S_ISDIR(inode->i_mode)) {//检查是否是目录
		iput(inode);
		iput(dir);
		brelse(bh);
		return -EPERM;
	}
	if (!inode->i_nlinks) {
		printk("Deleting nonexistent file (%04x:%d), %d\n",
			inode->i_dev,inode->i_num,inode->i_nlinks);
		inode->i_nlinks=1;
	}
	de->inode = 0;//将dir_entry指向的inode设置为0
	bh->b_dirt = 1;
	brelse(bh);
	inode->i_nlinks--;//将i节点中的i_nlinks减1
	inode->i_dirt = 1;
	inode->i_ctime = CURRENT_TIME;
	iput(inode);
	iput(dir);
	return 0;
```


### sys_link
```c
int sys_link(const char * oldname, const char * newname)
```
该函数的作用是为一个已经存在文件设置一个硬链接。

```c
	struct dir_entry * de;
	struct m_inode * oldinode, * dir;
	struct buffer_head * bh;
	const char * basename;
	int namelen;

	oldinode=namei(oldname);//获取已经存在的文件的i节点
	if (!oldinode)//源文件的i节点不存在，则返回错误
		return -ENOENT;
	if (S_ISDIR(oldinode->i_mode)) {//如果源文件的是一个目录，则放回该i节点，返回错误
		iput(oldinode);
		return -EPERM;
	}
	dir = dir_namei(newname,&namelen,&basename);//获取新路径所在目录的i节点
	if (!dir) { //如果新路径所在的目录不存哎，则返回错误
		iput(oldinode);
		return -EACCES;
	}
	if (!namelen) {
		iput(oldinode);
		iput(dir);
		return -EPERM;
	}
	if (dir->i_dev != oldinode->i_dev) {//硬链接不能跨越文件系统，因为每个文件系统的都有各自的i节点序号
		iput(dir);
		iput(oldinode);
		return -EXDEV;
	}
	if (!permission(dir,MAY_WRITE)) {//检查是否对新的目录具有写权限
		iput(dir);
		iput(oldinode);
		return -EACCES;
	}
	bh = find_entry(&dir,basename,namelen,&de);//检查新的路径是否已经存在，如果已经存在则也不能进行创建
	if (bh) {
		brelse(bh);
		iput(dir);
		iput(oldinode);
		return -EEXIST;
	}
	bh = add_entry(dir,basename,namelen,&de);//在该目录下创建一个新的entry，entry的名字是basename
	if (!bh) {
		iput(dir);
		iput(oldinode);
		return -ENOSPC;
	}
	de->inode = oldinode->i_num;//将该entry指向源文件所在的i节点
	bh->b_dirt = 1;//设置该目录i节点上存在脏数据
	brelse(bh);
	iput(dir);
	oldinode->i_nlinks++;//将旧的i节点的硬链接数+1
	oldinode->i_ctime = CURRENT_TIME;
	oldinode->i_dirt = 1;
	iput(oldinode);
	return 0;
```


## Q & A