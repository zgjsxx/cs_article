---
category: 
- 编译原理
- Linux
- ELF文件
---

# Linux中的SO-NAME与动态库的版本

由于动态库有着诸多优点，其在程序中的运用非常广泛。现代的系统中一般存在大量的动态库。如何组织管理好这些动态库是一个非常重要的问题。Linux系统对于共享库的管理有一套很成熟的体系，这对于开发者而言进行程序的维护升级带来了方便。本文将对于Linux系统对于动态库的管理体系进行介绍。

# 共享库的兼容性问题

对于一个库而言，开发者会不停地更新共享库的版本，修复一些问题，增加库的功能以及对性能的改进等等。由于共享库的特性，应用程序的共享库和应用程序本身可以独立开发和更新。例如Hello_World程序依赖于一个动态库libhello.so。当libhello.so的开发者开发出新的版本后，理论上只需要使用新的libhello.so去替换旧的版本就可以。

但是现实中确远比这个复杂的多。因为动态库的改动可能包含增加/删除/修改三种类型。因此动态库的更新总体可以划分为两大类：

- 兼容更新。 动态库的更新只是在前一个版本的基础上增加了一些内容。原有的接口都保持不变。
- 不兼容更新。动态库修改了原有的接口或者删除了一些接口，使用该库的接口的程序可能不能正常运行。

这里的兼容性是指ABI（application binary interface）层面, 即二进制接口层面的兼容性。

对于一个c程序而言，兼容性可以被更加细分为下表中的内容：

|更改类型|兼容性|
|--|--|
|往动态库libhello.so中添加一个导出符号hello2|兼容|
|删除动态库libfoo.so中的原有导出符号hello|不兼容|
|将libhello.so给一个导出方法添加了一个参数， 例如从hello(int a)变成了hello(int a, int b)|不兼容|
|删除了一个导出函数的一个参数， 例如从hello(int a， int b)变成了hello(int a)|不兼容|
|修改了一个结构体的类型(长度，内容，成员类型)， 而该接口体在导出函数的接口定义上或者全局变量上，例如hello(struct World)接口， 给World结构体添加了一个新的成员|不兼容|
|修改一个导出函数中的内部bug，优化性能等等，但是没有修改接口定义，功能，行为等等|兼容|
|修改一个导出函数中的内部bug，优化性能等等，同时修改了接口定义，功能，行为等等|不兼容|

对于c++而言， ABI的兼容性问题更为严重一些。C++在语法上支持一些高级特性，例如模板、多重继承等。这些特性对于ABI的兼容性而言简直是一种灾难。

# 动态库的版本

因为动态库存在着兼容性问题，一种解决版本就是引入版本号以对动态库进行管理。

Linux中经典的动态库的命名规则如下所示：

libname.so.x.y.z

最前面使用lib，中间是库的名字和后缀".so",最后面跟着的是三个数字组成的版本号。"x"代表主版本号， "y"代表次版本号， "z"表示发布版本号。三个版本号的含义不一样。

**主版本号**表示库的重大升级，不同主版本号的库之间是不兼容的。依赖于旧的主版本号的程序需要改动相应的部分，并且重新编译，才可以使用新的共享库中运行。

**次版本号**表示库的增量升级，即增加一些新的接口符号，且保持原来的符号不变。

**发布版本号**表示库的一些错误、性能的改进等，并不添加任何新的接口，也不对接口进行修改。

# SO_NAME

从动态库版本的定义可以得知，不同的主版本号之间的动态库是完全不兼容的，而主版本号相同的动态库之间是可以做到兼容的。

那么对于一个应用程序来讲，只要不被连接到其他主版本号的动态库，就是没有问题的。例如Hello_World程序记录了libhello.so.2的版本信息，那么其运行时就不会被链接到libhello.so.1或者libhello.so.3。

SO_NAME便是这样的一个机制。SO_NAME就是去掉次版本号和发布版本号，只保留主版本号的一个版本信息。例如libhello.so.3.81.1，其SO_NAME就是libhello.so.3。并且Linux会为每个动态库所在的目录创建一个跟"SO-NAME"相同名字并指向动态库的软链接。这个软连接会指向目录中主版本号相同， 次版本号和发布版本号最新的动态库。

例如目录中有libhello.so.2.56.1 和libhello.so.2.61.1, 两个动态库， 那么libhello.so.2将会指向libhello.so.2.61.1。


# SO_NAME的实践

创建一个目录，构建如下的一些文件：

```shell
[root@localhost test1]# tree
.
├── hello.c
├── hello.h
├── main.c
```

hello.h内容如下所示：

```h
#ifndef _TEST_H_
#define _TEST_H_
void hello();
#endif
```

hello.c内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
void hello()
{
    printf("this is a lib for HelloWorld\n");
}
```

main.c的内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
int main()
{
	hello();	
	return 0;
}
```

编译上述模块，生成动态库。

```shell
gcc -fPIC -o hello.o -c hello.c
gcc -shared -Wl,-soname,libhello.so.0 -o libhello.so.0.0.0 hello.o
```

使用readelf命令查看出此时libhello.so.0.0.0已经被打上了SONANE。

```shell
[root@localhost test1]# readelf -d libhello.so.0.0.0 |grep SONAME
 0x000000000000000e (SONAME)             Library soname: [libhello.so.0]
```

链接时，使用使用-l去加载一个动态库，例如-lxxx 将会去寻找名叫libxxx.so的动态库。

于是我们创建一个链接，使得libhello.so指向libhello.so.0。

```shell
ln -s libhello.so.0.0.0  libhello.so.0
ln -s libhello.so.0 libhello.so
```

接下来，编译和链接main方法。

```shell
gcc -c -o main.o main.c
gcc -L. -o main main.o -lhello
```

这样之后，main程序中的NEEDED中就包含了动态库libhello.so的SO-NAME libhello.so.0。

```shell
[root@localhost test1]# readelf -d main |grep NEEDED
 0x0000000000000001 (NEEDED)             Shared library: [libhello.so.0]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
```

这就保证了main在运行会会去加载soname是libhello.so.0的动态库。

不过这个时候， main是无法被执行的。因为运行时，系统不知道要去哪里寻找libhello.so.0。

```shell
[root@localhost test1]# ./main
./main: error while loading shared libraries: libhello.so.0: cannot open shared object file: No such file or directory
[root@localhost test1]# ldd main
        linux-vdso.so.1 (0x00007ffff5764000)
        libhello.so.0 => not found
        libc.so.6 => /lib64/libc.so.6 (0x00007fd00fa00000)
        /lib64/ld-linux-x86-64.so.2 (0x00007fd00fcb3000)
```

如果想要系统可以找到libhello.so.0， 有下面几个方法。

- LD_LIBRARY_PATH
```shell
export LD_LIBRARY_PATH=/home/xx/hellopath:$LD_LIBRARY_PATH
```
这里/home/xx/hellopath是共享库的路径。虽然改变LD_LIBRARY_PATH能达到目的，但是不推荐使用，因为这是一个全局的变量，其他应用程序可能受此影响，导致各种库的覆盖问题。如果要清楚这个全局变量，使用命令unset LD_LIBRARY_PATH。

- rpath

在编译应用程序时，利用rpath指定加载路径。 gcc -L. -Wl,-rpath=/home/xx/hellopath -o main main.o -lhello 这样，虽然避免了各种路径找不到的问题，但是也失去了灵活性。因为库的路径被定死了。

- 改变ld.so.conf

将路径添加到此文件，然后使用ldconfig更新加载程序的cache。 可以使用命令ldconfig -p查看当前所有库的soname->real name的对应关系信息

最后说一下，应用程序在编译链接和运行加载时，库的搜索路径的先后顺序。

**编译链接时，查找顺序**
- /usr/local/lib
- /usr/lib
- 用-L指定的路径，按命令行里面的顺序依次查找

**运行加载时的顺序**：
- 可执行程序指定的的DT_RPATH
- LD_LIBRARY_PATH. 但是如果使用了setuid/setgid，由于安全因素，此路径将被忽略.
- 可执行程序指定的的DT_RUNPATH. 但是如果使用了setuid/setgid，由于安全因素，此路径将被忽略
- /etc/ld/so/cache. 如果链接时指定了'-z nodeflib'，此路径将被忽略.
- /lib. 如果链接时指定了'-z nodeflib'，此路径将被忽略
- /usr/lib. 如果链接时指定了'-z nodeflib'，此路径将被忽略


LD_DEBUG这个环境通常用来调试。例如，查看整个装载过程：

```shell
$ LD_DEBUG=files ./main
```
或者查看依赖的库的查找过程：
```shell
$ LD_DEBUG=libs ./main
      3557:	find library=libtest.so [0]; searching
      3557:	 search cache=/etc/ld.so.cache
      3557:	  trying file=/usr/local/lib/libtest.so
```
另外还可以显示符号的查找过程：

```shell
$ LD_DEBUG=symbols ./main
```


修改接口内部的内容，不增加接口

```shell
[root@localhost test1]# tree
.
├── hello.c
├── hello.h
├── main.c
```

hello.h内容如下所示：

```h
#ifndef _TEST_H_
#define _TEST_H_
void hello();
#endif
```

hello.c内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
void hello()
{
    printf("this is a lib for HelloWorld\n");
    printf("this is a lib for HelloWorld\n");
}
```

main.c的内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
int main()
{
	hello();	
	return 0;
}
```

```shell
gcc -fPIC -o hello.o -c hello.c
gcc -shared -Wl,-soname,libhello.so.0 -o libhello.so.0.0.1 hello.o
ldconfig
```

这个时候看到此时，在执行完ldconfig之后，libhello.so.0 自动指向了 libhello.so.0.0.1。

```shell
total 80
-rw-r--r-- 1 root root   147 Feb  7 15:44 hello.c
-rw-r--r-- 1 root root    55 Feb  7 14:52 hello.h
-rw-r--r-- 1 root root  1632 Feb  7 15:45 hello.o
lrwxrwxrwx 1 root root    13 Feb  7 15:29 libhello.so -> libhello.so.0
lrwxrwxrwx 1 root root    17 Feb  7 15:45 libhello.so.0 -> libhello.so.0.0.1
-rwxr-xr-x 1 root root 16304 Feb  7 15:28 libhello.so.0.0.0
-rwxr-xr-x 1 root root 16304 Feb  7 15:45 libhello.so.0.0.1
-rwxr-xr-x 1 root root 25840 Feb  7 15:33 main
-rw-r--r-- 1 root root    75 Feb  7 14:56 main.c
-rw-r--r-- 1 root root  1368 Feb  7 15:33 main.o
```


新增接口

```shell
[root@localhost test1]# tree
.
├── hello.c
├── hello.h
├── main.c
```

hello.h内容如下所示：

```h
#ifndef _TEST_H_
#define _TEST_H_
void hello();
void hello2();
#endif
```

hello.c内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
void hello()
{
    printf("this is a lib for HelloWorld\n");
    printf("this is a lib for HelloWorld\n");
}
void hello2()
{
    printf("this is a lib for HelloWorld\n");
    printf("this is a lib for HelloWorld\n");
}
```

main.c的内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
int main()
{
	hello();	
	return 0;
}
```

```shell
gcc -fPIC -o hello.o -c hello.c
gcc -shared -Wl,-soname,libhello.so.0 -o libhello.so.0.1.0 hello.o
ldconfig
```

这个时候看到此时，在执行完ldconfig之后，libhello.so.0 自动指向了 libhello.so.0.0.1。

```shell
[root@localhost test1]# ll
total 96
-rw-r--r-- 1 root root   257 Feb  7 15:54 hello.c
-rw-r--r-- 1 root root    70 Feb  7 15:54 hello.h
-rw-r--r-- 1 root root  1848 Feb  7 15:55 hello.o
lrwxrwxrwx 1 root root    13 Feb  7 15:29 libhello.so -> libhello.so.0
lrwxrwxrwx 1 root root    17 Feb  7 15:55 libhello.so.0 -> libhello.so.0.1.0
-rwxr-xr-x 1 root root 16304 Feb  7 15:28 libhello.so.0.0.0
-rwxr-xr-x 1 root root 16304 Feb  7 15:45 libhello.so.0.0.1
-rwxr-xr-x 1 root root 16336 Feb  7 15:55 libhello.so.0.1.0
-rwxr-xr-x 1 root root 25840 Feb  7 15:33 main
-rw-r--r-- 1 root root    75 Feb  7 14:56 main.c
-rw-r--r-- 1 root root  1368 Feb  7 15:33 main.o
```

修改原有接口的形参， ABI不兼容
```shell
[root@localhost test1]# tree
.
├── hello.c
├── hello.h
├── main.c
```

hello.h内容如下所示：

```h
#ifndef _TEST_H_
#define _TEST_H_
void hello(int i);
void hello2();
#endif
```

hello.c内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
void hello(int i)
{
    printf("this is a lib for HelloWorld\n");
    printf("this is a lib for HelloWorld\n");
}
void hello2()
{
    printf("this is a lib for HelloWorld\n");
    printf("this is a lib for HelloWorld\n");
}
```

main.c的内容如下所示：

```c
#include <stdio.h>
#include "hello.h"
int main()
{
	hello();	
	return 0;
}
```

```shell
gcc -c -o main.o main.c
gcc -L. -o main main.o -ltest
```


```shell
gcc -fPIC -o hello.o -c hello.c
gcc -shared -Wl,-soname,libhello.so.1 -o libhello.so.1.0.0 hello.o
ldconfig
```


https://lovewubo.github.io/shared_library