---
category: 
- Linux
---

# Linux 最大可以打开多少文件描述符？

在日常开发中，对文件的操作可谓是再寻常不过的一件事情。那么你是否有这样一个疑问，我最多可以打开多少个文件呢？

在Linux系统中，当某个程序**打开文件**时，内核会返回相应的**文件描述符** (fd: file descriptors），也就是所谓的文件句柄，程序为了处理该文件必须引用此描述符。

**文件描述符**是大于等于0的整数，其可以标明每一个被进程所打开的文件和 socket。最前面的三个文件描述符（0，1，2）分别与标准输入（stdin），标准输出（stdout）和标准错误（stderr）对应，后面打开的文件依此类推对应 3、4…… 。

从文件描述符的描述中得知，其是按照每个进程来分配的。于是上面的问题"我最多可以打开多少个文件"就可以进一步细化为下面几个问题
- 一个进程最多可以打开多少个文件描述符
- 一个用户最多可以打开多少个文件描述符
- 一个系统最多可以打开多少个文件描述符

顺着这样的思路，下面就开始进行探索。

## 一个进程最多可以打开多少个文件描述符?

下面的代码是一个用于测试能最多可以打开多少文件描述符的方法。

```cpp
//g++ main.cpp -o main
#include <iostream>
#include <fcntl.h>
#include <errno.h>
#include <string.h>
#include <climits>
int main(){
    size_t MAX= UINT_MAX;
    for(int i = 0; i < MAX; ++i){
        int fd = open("./file.txt",O_RDWR);
        if(-1 == fd){
            fprintf(stderr,"open file %d  stderr, %s\n", i , strerror(errno));
            std::cin.get();
            exit(1);
        }
    }
}
```

使用```std::cin.get()```停在了程序退出前，目的是为了去```/proc```文件系统下查看最大的文件描述符。使用下面的shell命令就可以得到运行的程序所打开的最大的文件描述符。

```shell
ls /proc/<process id>/fd | sort -n | tail -n 1
1023
```

在我的测试环境中，上面的命令输出了1023。由于文件描述符是从0开始算起的，因此，实际上该进程最大打开了1024个文件描述符。

那么这个最大打开1024个文件的限制是在哪里的呢？

Linux **ulimit**命令用于控制shell程序的资源。 **ulimit**为shell内建指令，可用来控制shell执行程序的资源。

```ulimit -n```即可查看当前允许打开的最大的文件描述符数量。

尝试修改最大的文件描述符数量：

```shell
[root@localhost ~]# ulimit -n 10240
[root@localhost ~]# ulimit -n
10240
```

这样我们再次运行上面的程序进行测试：

```shell
[root@localhost ~]# ls /proc/44570/fd | sort -n | tail -n 1
10239
```

这个时候就发现系统可以打开的文件描述符数量已经达到了10239个。

上面我们通过```ulimit -n```成功的将当前进程可以打开的文件描述符提高到了10240个。 那么我们最多可以设置到多少呢？总不能可以无限制的修改下去把。

答案藏在Linux的**nr_open**文件中，**nr_open**用于限制**单个进程**可以分配的**最大文件描述符**，该限制对于系统上**所有用户下**的**所有进程**都生效，查看当时如下：

```shell
cat /proc/sys/fs/nr_open
1073741816
```

在我的系统中，如果设置了一个比nr_open更大的值将会抛出错误。

```shell
[root@localhost ~]# ulimit -n 10000000000
-bash: ulimit: open files: cannot modify limit: Operation not permitted
```

在上面的过程中，我们修改进程可以打开文件描述符的上限是使用**ulimit命令**，但是**ulimit命令**更改后只是在当前会话生效，当退出当前会话重新登录后又会回到默认值1024，要永久更改则需要修改文件 ```/etc/security/limit.conf```。

**limit.conf**中可以设置很多与用户限制相关的内容。

其格式如下所示：

```shell
#<domain>        <type>  <item>  <value>
```

- domain: 代表限制的对象，对哪些用户生效。其可以是一个用户名，也可以是一个用户组的名字，可以使用通配符*和%。
- type: 仅仅有两种， soft和hard。 soft的限制的值不能超过hard限制的值。
- item： 代表可以限制的内容, 可以有下面的一些选项可以设置
  - core - 显示coredump文件的大小 (单位KB)
  - data - 最大数据大小 (单位KB)
  - fsize - 最大文件大小 (单位KB)
  - memlock - 最大锁定内存地址空间 (单位KB)
  - nofile - 最大可以打开的文件描述符的数量
  - rss - 最大驻留集大小 (单位KB)
  - stack - 最大栈的大小 (KB)
  - cpu - 最多CPU占用时间，单位为MIN分钟
  - nproc - 最大可以打开的进程数量
  - as - 地址空间限制 (KB)   
  - maxlogins - 用户可以同时登录的最大数量
  - maxsyslogins - 系统最大允许的登录数量
  - priority - 运行用户进程的优先级
  - locks - 用户可以持有的文件锁的最大数量
  - sigpending - 最大挂起信号数
  - msgqueue - POSIX 消息队列使用的最大内存 (单位 bytes)
  - nice -  允许的最大优先级提高到值 [-20，19]
  - rtprio - 最大实时优先级
- value： 就是为item设置的具体的数值。

我们的需求是设置文件描述符的上限，因此item就是nofile。

加入下面的语句：

```shell
tom hard nofile 10240"
```

其含义是**tom用户**创建的**每个进程**的打开的最大的文件描述符数量不能超过硬限制**10240**。

这里顺便再提一下**soft**和**hard**的区别， 达到 soft 限制会在系统的日志（一般为```/var/log/messages```）里面记录一条告警日志，但不影响使用。达到hard的限制，有日志且会影响使用。

因此hard limit才是真正的限制。

从这样的实验中我们得出了结论：

一个进程可以打开的文件描述符 < hard limit < nr_open 

![process open fd](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/linux-max-file-fd/process-max-fd.png)

但是这里其实还有操作系统的资源的隐含限制，虽然你可以将进程的最大描述符设置的非常大，然而打开一个文件描述符是需要消耗一定的内存的，当文件描述打开非常多时，可能就会出现OOM的状况。 因此实际进程能打开的文件描述符可能还受**内存资源**的限制。

## 一个用户最多可以打开多少个文件描述符

实际上一个用户可以打开的最大文件描述符 = （用于打开的最大进程数） * （每个进程最大可以打开的文件描述符数量）

每个进程可以打开的文件描述符数量在第一个问题中已经得到了解决。

那么这个问题就变成了一个用户最多可以打开多少个进程。

其中```ulimit -u```就可以设置当前shell可以打开的进程数量。

如果需要永久更改，则还是通过更改limits.conf文件。

方案一: 修改```/etc/security/limits.conf```文件, 在文件最后添加下述内容:

```shell
*  soft      nproc      131072
*  hard      nproc      131072
```

方案二: 修改/etc/security/limits.d/90-nproc.conf文件, 在文件最后添加下述内容:

```shell
# 用户进程数的默认限制, 下面这个是对root外的其他用户限制max user processes, 要注释掉: 
# *          soft    nproc     1024
root       soft    nproc     131072
```

对max user processes的配置, Linux系统默认先读取/etc/security/limits.conf 中的信息, 如果```/etc/security/limits.d/```目录下还有配置文件的话, 也会依次遍历读取, 最终, ```/etc/security/limits.d/```中的配置会覆盖```/etc/security/limits.conf`````` 中的配置。

除上述限制以外，操作系统还有一个全局的限制，pid_max，用于设置操作系统可以打开的进程的总数量。

```shell
cat /proc/sys/kernel/pid_max
```

知道了这些限制之后，一个用户最多可以打开多少个文件描述符也迎刃而解了。

不过一个用户最多可以打开多少个文件描述符在实际开发中并不怎么需要去关注，更多的时候还是去关心一个进程最多可以打开多少文件描述符。

## 一个系统最多可以打开多少个文件描述符

操作系统对于文件描述符有一个全局的限制， 其定义在```/proc/sys/fs/file-max```中，例如在我的系统中，其值如下所示：

```shell
cat /proc/sys/fs/file-max
9223372036854775807
```

可以看到这个数值是非常大的，一般情况下都不会达到，因为达到该限制会有巨大的内存消耗。

## 总结
- 一个进程可以打开的文件描述符的数量小于hard limit，而hard limit的值要小于nr_open。但是实际能打开的文件描述符的最大数量还和系统资源有关。
- 一个用户可以打开的文件描述符数量等于一个进程可以打开的文件描述符的数量* 一个用户最大可以打开的进程数量。
- 一个系统可以打开的文件描述符数量即所有用户的所有进程打开的文件描述符总数量受file-max限制。