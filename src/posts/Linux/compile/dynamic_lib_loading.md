---
category: 
- Linux
- ELF文件
- 动态库
---

# 动态链接库的加载(翻译)

## 什么是动态库

library（函数库）是一个包含编译后的代码和数据的文件。 library大多情况下是非常有用的，因为它们可以让编译过程更加的快速，因为你不必每次编译所有依赖的文件，这使得我们可以进行模块化开发。静态库可以被链接到一个已经编译好的可执行文件中或者其他库中，在编译之后，静态库中的内容就被嵌入到了可执行文件或者其他库当中。动态库则是可执行文件在**运行时刻**才被加载的，这意味着这样的过程将会更加的复杂。

## 搭建demo

为了更好的探索动态链接库，我们使用一个例子贯穿整文。 我们以三个源文件开始。

**main.cpp** 是可执行文件的入口。 这个文件中不会包含太多的内容，仅仅调用了一个random库中的方法。

```cpp
#include "random.h"

int main() {
    return get_random_number();
}
```

random库只定义了一个函数，random.h的内容如下所示：

```cpp
int get_random_number();
```

get_random_number的实现在random.cpp文件中定义：

```cpp
#include "random.h"

int get_random_number(void) {
    return 4;
}
```

## 编译动态库

在创建动态库之前，首先创建.o文件，称之为对象文件。

```shell
clang++ -o random.o -c random.cpp
```

上面的命令的参数含义如下：

- -o random.o： 定义输出文件的名字
- -c： 仅仅编译，不做链接
- random.cpp: 选择输入的文件名

接下来将.o文件生成动态库：

```shell
clang++ -shared -o librandom.so -c random.o
```

**-shared**指定了生成的库的类型是动态库。注意，我们将动态库的名称是libramdom.so。这个名字并不能随意取，需要按照```lib<name>.so```格式来命名，这个名称后续在链接的时候会用到。


## 编译可执行文件使用动态库

首先为main.cpp创建目标文件main.o

```shell
clang++ -o main.o -c main.cpp
```

这个步骤和之前创建random.o是一样的。 现在尝试创建可执行文件。

```shell
clang++ -o main main.o
main.o: In function `main':
main.cpp:(.text+0x10): undefined reference to `get_random_number()'
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

我们需要告诉clang去链接librandom.so，使用下面的语句操作：

```shell
$ clang++ -o main main.o -lrandom
/usr/bin/ld: cannot find -lrandom
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

> 我们告诉编译器去使用librandom.so。 既然是运行时才会加载，为什么编译的时候就需要指定呢？

这是因为我们需要确保动态库中包含了可执行文件所需要的所有符号。 另请注意，我们指定 random 作为库的名称，而不是 librandom.so。还记得关于库文件命名的约定吗？这就是它的用处。

上面的输出提示我们找不到random库，原因是我们没有指定动态库的路径。我们可以使用```-L```参数。 注意到这个这个参数仅仅制定了编译时动态库的路径，并不是指定了运行时的加载路径。 指定当前路径作为动态库的搜索路径，如下所示：

```shell
$ clang++ -o main main.o -lrandom -L.
```

太棒了，我们成功的编译出了可执行文件。

下面让我们运行它。

```shell
$ ./main
./main: error while loading shared libraries: librandom.so: cannot open shared object file: No such file or directory 
```

这个问题是我们的依赖无法被找到。它甚至会在我们的应用程序运行第一行代码之前发生，因为动态库是在可执行文件中的符号之前加载的。

由此，引出了几个问题：
- main 如何知道它依赖于 librandom.so？
- main 在哪里寻找 librandom.so ？
- 我们如何告诉 main 在这个目录中查找 librandom.so ？

为了回答这些问题，我们必须更深入地了解这些文件的结构。

## ELF - 可执行和可链接格式

动态库和可执行文件格式称为ELF（可执行和可链接格式）。如果您查看维基百科文章，您会发现它一团糟，因此我们不会详细介绍所有内容。总之，ELF 文件包含：

- ELF头
- 文件数据，包含
  - 程序头表 (a list of segmemt headers)
  - 节头表 (a list of section headers)
  - 数据 (由段表和节表指向)

ELF头中指出了程序头表中段的大小和数量，也指出了节头表中节的大小和数量。每个这样的表都由固定大小的条目组成。条目中包含了头部和指定数据的指针组成。一个段会包含多个节。

实际上，根据当前上下文，相同的数据被引用为段的一部分或部分。链接时使用节，执行时使用段。

![段表和节表](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/compile/dynamic_lib_loading/elf.gif)

段(segment)和节(section)的关联如下图所示：

![段表和节表的区别](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/compile/dynamic_lib_loading/section_segment.png)

我们可以使用readelf工具去查看elf文件的内容，例如main的内容如下所示：

```shell
$ readelf -h main
ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00 
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  ABI Version:                       0
  Type:                              EXEC (Executable file)
  Machine:                           Advanced Micro Devices X86-64
  Version:                           0x1
  Entry point address:               0x4005e0
  Start of program headers:          64 (bytes into file)
  Start of section headers:          4584 (bytes into file)
  Flags:                             0x0
  Size of this header:               64 (bytes)
  Size of program headers:           56 (bytes)
  Number of program headers:         9
  Size of section headers:           64 (bytes)
  Number of section headers:         30
  Section header string table index: 27
```

我们看到main的类型是EXEC，代表其是一个可执行文件。main有9个程序头表(段表)和30个节表。

接下来查看**段表**和**节表**。

```shell
$ readelf -l main

Elf file type is EXEC (Executable file)
Entry point 0x4005e0
There are 9 program headers, starting at offset 64

Program Headers:
  Type           Offset             VirtAddr           PhysAddr
                 FileSiz            MemSiz              Flags  Align
  PHDR           0x0000000000000040 0x0000000000400040 0x0000000000400040
                 0x00000000000001f8 0x00000000000001f8  R E    8
  INTERP         0x0000000000000238 0x0000000000400238 0x0000000000400238
                 0x000000000000001c 0x000000000000001c  R      1
      [Requesting program interpreter: /lib64/ld-linux-x86-64.so.2]
  LOAD           0x0000000000000000 0x0000000000400000 0x0000000000400000
                 0x000000000000089c 0x000000000000089c  R E    200000
  LOAD           0x0000000000000dd0 0x0000000000600dd0 0x0000000000600dd0
                 0x0000000000000270 0x0000000000000278  RW     200000
  DYNAMIC        0x0000000000000de8 0x0000000000600de8 0x0000000000600de8
                 0x0000000000000210 0x0000000000000210  RW     8
  NOTE           0x0000000000000254 0x0000000000400254 0x0000000000400254
                 0x0000000000000044 0x0000000000000044  R      4
  GNU_EH_FRAME   0x0000000000000774 0x0000000000400774 0x0000000000400774
                 0x0000000000000034 0x0000000000000034  R      4
  GNU_STACK      0x0000000000000000 0x0000000000000000 0x0000000000000000
                 0x0000000000000000 0x0000000000000000  RW     10
  GNU_RELRO      0x0000000000000dd0 0x0000000000600dd0 0x0000000000600dd0
                 0x0000000000000230 0x0000000000000230  R      1

 Section to Segment mapping:
  Segment Sections...
   00     
   01     .interp 
   02     .interp .note.ABI-tag .note.gnu.build-id .gnu.hash .dynsym .dynstr .gnu.version .gnu.version_r .rela.dyn .rela.plt .init .plt .text .fini .rodata .eh_frame_hdr .eh_frame 
   03     .init_array .fini_array .jcr .dynamic .got .got.plt .data .bss 
   04     .dynamic 
   05     .note.ABI-tag .note.gnu.build-id 
   06     .eh_frame_hdr 
   07     
   08     .init_array .fini_array .jcr .dynamic .got 
```

同样，我们看到我们有9个段。它们的类型是LOAD, DYNAMIC，NOTE等。我们还可以看到每个节属于哪个段。 操作系统加载elf文件时，只会加载类型时LOAD的段。

最后我们看下节表：

```shell
$ readelf -S main
There are 30 section headers, starting at offset 0x11e8:

Section Headers:
  [Nr] Name              Type             Address           Offset
       Size              EntSize          Flags  Link  Info  Align
  [ 0]                   NULL             0000000000000000  00000000
       0000000000000000  0000000000000000           0     0     0
  [ 1] .interp           PROGBITS         0000000000400238  00000238
       000000000000001c  0000000000000000   A       0     0     1
  [ 2] .note.ABI-tag     NOTE             0000000000400254  00000254
       0000000000000020  0000000000000000   A       0     0     4

  [..]

  [21] .dynamic          DYNAMIC          0000000000600de8  00000de8
       0000000000000210  0000000000000010  WA       6     0     8

  [..]

  [28] .symtab           SYMTAB           0000000000000000  00001968
       0000000000000618  0000000000000018          29    45     8
  [29] .strtab           STRTAB           0000000000000000  00001f80
       000000000000023d  0000000000000000           0     0     1
Key to Flags:
  W (write), A (alloc), X (execute), M (merge), S (strings), l (large)
  I (info), L (link order), G (group), T (TLS), E (exclude), x (unknown)
  O (extra OS processing required) o (OS specific), p (processor specific)
```

为了简洁起见，我修剪了这一点。我们看到列出的 30 个部分具有不同的名称（例如 .note.ABI-tag）和类型（例如 SYMTAB)。

你现在可能很困惑。别担心——它不会出现在测试中。我解释这一点是因为我们对此文件的特定部分感兴趣：在其程序头表中，ELF 文件可以具有（尤其是动态库必须具有）描述 PT_DYNAMIC 类型段的段头。该段拥有一个名为```.dynamic ```的节，其中包含了解动态依赖关系的有用信息。

## 直接依赖

我们可以使用 readelf 实用程序来进一步探索可执行文件的 .dynamic 部分2。特别是，此部分包含 ELF 文件的所有动态依赖项。我们只指定 librandom.so 作为依赖项，因此我们希望只列出一个依赖项：

```shell
$ readelf -d main | grep NEEDED
 0x0000000000000001 (NEEDED)             Shared library: [librandom.so]
 0x0000000000000001 (NEEDED)             Shared library: [libstdc++.so.6]
 0x0000000000000001 (NEEDED)             Shared library: [libm.so.6]
 0x0000000000000001 (NEEDED)             Shared library: [libgcc_s.so.1]
 0x0000000000000001 (NEEDED)             Shared library: [libc.so.6]
```

我们可以看到我们指定的 librandom.so，但我们还获得了四个我们没有预料到的额外依赖项。这些依赖项似乎出现在所有已编译的动态库中。这些是什么？

- libstdc++：标准 C++ 库。
- libm：包含基本数学函数的库。
- libgcc_s：GCC（GNU 编译器集合）运行时库。
- libc：C 库：定义"系统调用"和其他基本设施（例如 open、malloc、printf、exit 等）的库。

现在我们知道编译好的可执行文件```main``` 知道它依赖于 librandom.so。那么为什么 main 在运行时找不到 librandom.so 呢？

## 运行时搜索路径

ldd 是一个允许我们查看递归动态库依赖关系的工具。这意味着我们可以看到工件在运行时所需的所有动态库的完整列表。它还允许我们查看这些依赖项所在的位置。让我们在 main 上运行它，看看会发生什么：

```shell
$ ldd main
	linux-vdso.so.1 =>  (0x00007fff889bd000)
	librandom.so => not found
	libstdc++.so.6 => /usr/lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f07c55c5000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f07c52bf000)
	libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f07c50a9000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f07c4ce4000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f07c58c9000)
```

我们看到librandom.so在列表中出现了，但是状态是未找到。我们还可以看到有两个额外的库（vdso 和 ld-linux-x86-64）。它们是间接依赖关系。

更重要的是，我们看到 ldd 报告了库的位置。例如```libstdc++.so.6```，ldd 报告其位置为 ```/usr/lib/x86_64-linux-gnu/libstdc++.so.6```。它是怎么知道的？

我们的依赖项中的每个动态库都会按顺序在以下位置进行搜索：

- 可执行文件的 rpath 中列出的目录。
- LD_LIBRARY_PATH 环境变量中的目录，其中包含以冒号分隔的目录列表（例如，/path/to/libdir:/another/path）
- 可执行文件 runpath 所指定的目录。
- 文件 /etc/ld.so.conf 中的目录列表。该文件可以包含其他文件，但它基本上是一个目录列表 - 每行一个。
- 默认系统库 - 通常为 /lib 和 /usr/lib （如果使用 -z nodefaultlib 编译则跳过）。

## 修复我们的可执行文件

好吧。我们验证了 librandom.so 是列出的依赖项，但找不到它。我们知道在哪里搜索依赖项。我们将再次使用 ldd 确保我们的目录实际上不在搜索路径上。

```shell
$ LD_DEBUG=libs ldd main
      [..]

      3650:	find library=librandom.so [0]; searching
      3650:	 search cache=/etc/ld.so.cache
      3650:	 search path=/lib/x86_64-linux-gnu/tls/x86_64:/lib/x86_64-linux-gnu/tls:/lib/x86_64-linux-gnu/x86_64:/lib/x86_64-linux-gnu:/usr/lib/x86_64-linux-gnu/tls/x86_64:/usr/lib/x86_64-linux-gnu/tls:/usr/lib/x86_64-linux-gnu/x86_64:/usr/lib/x86_64-linux-gnu:/lib/tls/x86_64:/lib/tls:/lib/x86_64:/lib:/usr/lib/tls/x86_64:/usr/lib/tls:/usr/lib/x86_64:/usr/lib		(system search path)
      3650:	  trying file=/lib/x86_64-linux-gnu/tls/x86_64/librandom.so
      3650:	  trying file=/lib/x86_64-linux-gnu/tls/librandom.so
      3650:	  trying file=/lib/x86_64-linux-gnu/x86_64/librandom.so
      3650:	  trying file=/lib/x86_64-linux-gnu/librandom.so
      3650:	  trying file=/usr/lib/x86_64-linux-gnu/tls/x86_64/librandom.so
      3650:	  trying file=/usr/lib/x86_64-linux-gnu/tls/librandom.so
      3650:	  trying file=/usr/lib/x86_64-linux-gnu/x86_64/librandom.so
      3650:	  trying file=/usr/lib/x86_64-linux-gnu/librandom.so
      3650:	  trying file=/lib/tls/x86_64/librandom.so
      3650:	  trying file=/lib/tls/librandom.so
      3650:	  trying file=/lib/x86_64/librandom.so
      3650:	  trying file=/lib/librandom.so
      3650:	  trying file=/usr/lib/tls/x86_64/librandom.so
      3650:	  trying file=/usr/lib/tls/librandom.so
      3650:	  trying file=/usr/lib/x86_64/librandom.so
      3650:	  trying file=/usr/lib/librandom.so

      [..]
```

我修剪了输出，因为它非常的喋喋不休。难怪我们的动态库librandom.so找不到,因为其​​所在的目录不在搜索路径中！解决这个问题最特别的方法是使用 ```LD_LIBRARY_PATH```：

```shell
$ LD_LIBRARY_PATH=. ./main
```

它可以工作，但不太方便。我们不想每次运行程序时都指定 lib 目录。更好的方法是将我们的依赖项放入文件中。

rpath和runpath可以帮助我们。

## rpath和runpath

**rpath** 和 **runpath** 是我们的运行时搜索路径"清单"中最复杂的项目。可执行文件或动态库的 **rpath** 和 **runpath** 是**.dynamic**节中的可选内容。它们都是要搜索的目录列表。

rpath 和 runpath 之间的唯一区别是它们的搜索顺序。具体来说，它们的区别是和 LD_LIBRARY_PATH 的关系， rpath 在 LD_LIBRARY_PATH 之前搜索，而 runpath 在之后搜索。LD_LIBRARY_PATH的改变不会影响rpath的搜索，而会影响 runpath，如果LD_LIBRARY_PATH包含了动态库，则直接去LD_LIBRARY_PATH的目录中加载，而不会继续去runpath的目录中寻找。

让我们将 rpath 添加到可执行文件中，看看是否可以让它工作：

```shell
$ clang++ -o main main.o -lrandom -L. -Wl,-rpath,.
```

-Wl 标志将以下以逗号分隔的标志传递给链接器。在本例中，我们传递 ```-rpath .```， 要设置```runpath```，我们还必须传递 ```--enable-new-dtags```。 让我们检查一下结果：

```shell
$ readelf main -d | grep path
 0x000000000000000f (RPATH)              Library rpath: [.]

$ ./main
```

可执行文件运行，但这添加了 .到 rpath，即当前工作目录。这意味着它无法在不同的目录中工作：

```shell
$ cd /tmp
$ ~/code/shared_lib_demo/main
/home/nurdok/code/shared_lib_demo/main: error while loading shared libraries: librandom.so: cannot open shared object file: No such file or directory
```

我们有几种方法来解决这个问题。最简单的方法是将 librandom 复制到我们搜索路径中的目录（例如 /lib）。显然，我们要做的更复杂的方法是指定相对于可执行文件的 rpath。

## $ORIGIN

rpath 和 runpath 中的路径可以是绝对路径（例如，```/path/to/my/libs/```），相对于当前工作目录（例如，.），但它们也可以是相对于可执行文件的路径。这是通过在 rpath 定义中使用 ```$ORIGIN``` 变量来实现的：

```shell
$ clang++ -o main main.o -lrandom -L. -Wl,-rpath,"\$ORIGIN" 
```

请注意，我们需要转义美元符号（或使用单引号），以便我们的 shell 不会尝试扩展它。结果是 main 在每个目录中工作并正确找到 librandom.so：

```shell
$ ./main
$ cd /tmp
$ ~/code/shared_lib_demo/main
```

让我们使用我们的工具包来确保：

```shell
$ readelf main -d | grep path
 0x000000000000000f (RPATH)              Library rpath: [$ORIGIN]

$ ldd main
	linux-vdso.so.1 =>  (0x00007ffe13dfe000)
	librandom.so => /home/nurdok/code/shared_lib_demo/./librandom.so (0x00007fbd0ce06000)
	[..]
```

## 运行时搜索路径：安全性

如果您曾经从命令行更改过 Linux 用户密码，则可能使用过 passwd 实用程序：

```shell
$ passwd
Changing password for nurdok.
(current) UNIX password: 
Enter new UNIX password: 
Retype new UNIX password: 
passwd: password updated successfully
```

密码哈希值存储在 ```/etc/shadow``` 中，该文件受 root 保护。那么，您可能会问，您的非 root 用户如何更改该文件？

答案是 passwd 程序设置了 setuid 位，您可以使用 ls 看到：

```shell
$ ls -l `which passwd`
-rwsr-xr-x 1 root root 39104 2009-12-06 05:35 /usr/bin/passwd
#  ^--- This means that the "setuid" bit is set for user execution.
```

它是 s（该行的第四个字符）。所有设置了此权限位的程序都作为该程序的所有者运行。在此示例中，用户是 root（该行的第三个单词）。

这与动态库有什么关系？”你问。我们将通过一个例子来了解。

现在，我们将在 main 旁边的 libs 目录中添加 librandom，并将 $ORIGIN/libs 添加到 main 的 rpath 中：

```shell
$ ls
libs  main
$ ls libs
librandom.so
$ readelf -d main | grep path
 0x000000000000000f (RPATH)              Library rpath: [$ORIGIN/libs]
```

如果我们运行 main，它会按预期工作。让我们打开主可执行文件的 setuid 位并使其以 root 身份运行

```shell
$ sudo chown root main
$ sudo chmod a+s main
$ ./main
./main: error while loading shared libraries: librandom.so: cannot open shared object file: No such file or directory
```

好吧，rpath 不起作用。让我们尝试设置 LD_LIBRARY_PATH。

```shell
$ LD_LIBRARY_PATH=./libs ./main
./main: error while loading shared libraries: librandom.so: cannot open shared object file: No such file or directory
```

这里发生了什么？


出于安全原因，当使用提升的权限（例如 setuid、setgid、特殊功能等）运行可执行文件时，搜索路径列表与正常情况不同：LD_LIBRARY_PATH 被忽略，以及 rpath 或 runpath 中包含```$ORIGIN```的路径。

原因是使用这些搜索路径允许利用提升权限的可执行文件以 root 身份运行。有关此漏洞的详细信息可以在[此处](https://marc.info/?l=full-disclosure&m=128739684614072&w=2)找到。基本上，它允许您使提升的权限可执行文件加载您自己的库，该库将以 root（或其他用户）身份运行。以 root 身份运行您自己的代码几乎可以让您完全控制您正在使用的机器。

如果您的可执行文件需要具有提升的权限，则需要在绝对路径中指定依赖项，或将它们放置在默认位置（例如 /lib）。

这里需要注意的一个重要行为是，对于此类应用程序，ldd 当着我们的面撒谎：

```shell
% ldd main
	linux-vdso.so.1 =>  (0x00007ffc2afd2000)
	librandom.so => /home/nurdok/code/shared_lib_demo/libs/librandom.so (0x00007f1f666ca000)
	libstdc++.so.6 => /usr/lib/x86_64-linux-gnu/libstdc++.so.6 (0x00007f1f663c6000)
	libm.so.6 => /lib/x86_64-linux-gnu/libm.so.6 (0x00007f1f660c0000)
	libgcc_s.so.1 => /lib/x86_64-linux-gnu/libgcc_s.so.1 (0x00007f1f65eaa000)
	libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f1f65ae5000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f1f668cc000)
```

ldd 不关心 setuid，它在搜索我们的依赖项时会扩展``` $ORIGIN```。在调试 setuid 应用程序的依赖项时，这可能是一个相当大的陷阱。

## 调试备忘录

如果您在运行可执行文件时遇到此错误：

```shell
$ ./main
./main: error while loading shared libraries: librandom.so: cannot open shared object file: No such file or directory 
```

您可以尝试执行以下操作：

- 找出 ```ldd <executable>``` 缺少哪些依赖项。
- 如果您无法识别它们，可以通过运行 ```readelf -d <executable> |grep NEEDED``` 检查它们是否是直接依赖项。
- 确保依赖项确实存在。也许您忘记编译它们或将它们移动到 libs 目录？
- 用 ```LD_DEBUG=libs ldd <executable>``` 找出在何处搜索依赖项。
- 如果需要将目录添加到搜索中：
  - 将目录添加到 LD_LIBRARY_PATH 环境变量中。
  - 使用rpath或者runpath：通过传递 ```-Wl,-rpath,<dir>```（对于 rpath）或 ```-Wl,--enable-new-dtags,-rpath,<dir>``` 将目录添加到可执行文件或动态库的 rpath 或 runpath （对于运行路径）。使用 ```$ORIGIN``` 作为相对于可执行文件的路径。
- 如果 ldd 显示没有缺少任何依赖项，请查看您的应用程序是否具有提升的权限。如果是这样，ldd可能会撒谎。请参阅上面的安全问题。

如果您仍然无法弄清楚 - 您需要再次阅读整篇文章:

# 参考文章

https://amir.rachum.com/shared-libraries/