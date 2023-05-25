---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# c++中的extern "C"

在一些c语言的library库中，我们经常可以还看下面这样的结构

```h
#ifndef __TEST_H
#define __TEST_H

#ifdef _cplusplus
extern "C" {
#endif

/*...*/

#ifdef _cplusplus
}
#endif
#endif
```

```#ifndef __TEST_H```这样的宏定义应该是非常常见了，其作用是为了避免重复包含。

往下看,如果定义了_cplusplus宏，则添加```extern "C"```的标记，那么这个标记的作用是什么呢？

```cpp
#ifdef _cplusplus
extern "C" {
#endif
```

这里首先给出答案，这是为了c/c++程序可以相互调用。下面就看看```extern "C"```是如何做到的。我们分两个场景，第一个场景就是c语言写的库，c和c++程序去调用。第二个场景就是c++写的库，c和c++程序去调用。


## c写的库给c/c++调用

我们看第一个例子，在这个例子中，我们使用c语言构建了一个add函数，并提供了其头文件。我们要将该实现提供给c和c++的程序调用。

下面是该例子的目录结构。

```shell
.
├── add.c
├── add.h
├── main_c.c
├── main_cpp.cpp
└── makefile
```

add.h

```h
#ifndef C_EXAMPLE_H
#define C_EXAMPLE_H

#ifdef __cplusplus
extern "C"{
#endif

extern int add(int x,int y);

#ifdef __cplusplus
}
#endif

#endif

```

add.c

```cpp
#include "add.h"
int add( int x, int y )
{
    return x + y;
}
```

main_cpp.cpp

```cpp
#include "add.h"

int main()
{
   add(2,3);
   return 0;
}

```

main_c.c
```cpp
#include "add.h"

int main()
{
   add(2,3);
   return 0;
}

```

makefile

```makefile
all:main_cpp main_c

main_cpp: main_cpp.o add.o
        $(CXX)  -o $@ $^

main_c: main_c.o add.o
        $(CC) -o $@ $^

main.o: main_cpp.cpp
        $(CXX) -c -o $@ $<

add.o: add.c
        $(CC)  -c -o $@ $<

clean:
        rm -f *.o main_cpp main_c
```

使用```make```命令对上述模块进行构建。如果没有任何错误，那么恭喜你，add.o成功的被c和c++程序使用了。

我们知道c和c++编译器编译出来的符号名称是不同的，用c++的方式去寻找c语言的符号是无法寻找到的。```extern "C"```为何可以做到？

我们使用```readelf -s add.o```查看add.o的符号，可以看到add函数的名称就是add，这个就是典型c编译器编译出来的名字。

```shell
Symbol table '.symtab' contains 9 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
     0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND
     1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS add.c
     2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1
     3: 0000000000000000     0 SECTION LOCAL  DEFAULT    2
     4: 0000000000000000     0 SECTION LOCAL  DEFAULT    3
     5: 0000000000000000     0 SECTION LOCAL  DEFAULT    5
     6: 0000000000000000     0 SECTION LOCAL  DEFAULT    6
     7: 0000000000000000     0 SECTION LOCAL  DEFAULT    4
     8: 0000000000000000    20 FUNC    GLOBAL DEFAULT    1 add
```

我们再次查看```readelf -s main_cpp.o | grep add```去查看一下main_cpp中的符号表:
```cpp
   72: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS add.c
   90: 0000000000400570    20 FUNC    GLOBAL DEFAULT   11 add
```
可以看到main_cpp中的符号表的名字也是add，因此main_cpp成功的找到了add函数。

但是我们知道c++的编译器在生成符号时，通常都会带上符号的参数类型（因为c++支持重载），例如下面的c++程序，编译之后，我们使用readelf查看符号表。

```cpp
int add( int x, int y )
{
    return x + y;
}

int main()
{
   add(2,3);
   return 0;
}
```

其输出的结果如下所示：

```shell
86: 0000000000400556    20 FUNC    GLOBAL DEFAULT   11 _Z3addii
```

可以看到add生成符号是_Z3addii。

看到这里，聪明的你已经大概知道```extern "C"```的作用了，就是修改了符号表的生成方式，将c++符号的生成方式换成了c的生成方式。

c库中生成的符号是c编译器的符号， 因此c语言可以直接链接。而c++程序需要使用```extern "C"```让编译器使用c的符号命名方式去进行链接，这样才能找到对应的符号。


## c++写的库给c/c++调用

下面这个例子，我们使用c++语言构建了一个add函数，并提供了其头文件。我们要将该实现提供给c和c++的程序调用。

```shell
.
├── add.cpp
├── add.h
├── main_c.c
├── main_cpp.cpp
└── makefile
```

add.h

```h
#ifndef C_EXAMPLE_H
#define C_EXAMPLE_H

#ifdef __cplusplus
extern "C"{
#endif

extern int add(int x,int y);

#ifdef __cplusplus
}
#endif

#endif

```

add.cpp

```cpp
#include "add.h"
int add( int x, int y )
{
    return x + y;
}
```

main_cpp.cpp

```cpp
#include "add.h"

int main()
{
   add(2,3);
   return 0;
}

```

main_c.c
```cpp
#include "add.h"

int main()
{
   add(2,3);
   return 0;
}

```

makefile

```makefile
all:main_cpp main_c

main_cpp: main_cpp.o add.o
        $(CXX)  -o $@ $^

main_c: main_c.o add.o
        $(CC) -o $@ $^

main.o: main_cpp.cpp
        $(CXX) -c -o $@ $<

add.o: add.cpp
        $(CXX)  -c -o $@ $<

clean:
        rm -f *.o main_cpp main_c
```

其实这种场景和第一种场景是基本一致的。现在我们的库add.o是使用c++编译器生成的。

我们使用readelf查看其内容，可以看到其内容和之前c语言生成的库，add函数的符号是一样的。因此我们此时编译时使用了```extern "C"```,也就是说使用c语言的符号构建方式进行编译。


```shell
Symbol table '.symtab' contains 9 entries:
   Num:    Value          Size Type    Bind   Vis      Ndx Name
     0: 0000000000000000     0 NOTYPE  LOCAL  DEFAULT  UND
     1: 0000000000000000     0 FILE    LOCAL  DEFAULT  ABS add.c
     2: 0000000000000000     0 SECTION LOCAL  DEFAULT    1
     3: 0000000000000000     0 SECTION LOCAL  DEFAULT    2
     4: 0000000000000000     0 SECTION LOCAL  DEFAULT    3
     5: 0000000000000000     0 SECTION LOCAL  DEFAULT    5
     6: 0000000000000000     0 SECTION LOCAL  DEFAULT    6
     7: 0000000000000000     0 SECTION LOCAL  DEFAULT    4
     8: 0000000000000000    20 FUNC    GLOBAL DEFAULT    1 add
```

接下来链接的过程就和第一个场景一样了。

在本场景中，使用c++编写了一个包含add函数的模块，对其编译时，使用了c语言的符号构建方式。因此其符号表和c语言的库是相同的。最终链接时，由于加上了```extern "C"```， 链接过程也将使用c语言的方式去寻找符号。