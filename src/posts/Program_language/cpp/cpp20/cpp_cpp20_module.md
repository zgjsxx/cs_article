---
category: 
- C++
tag:
- C++
---

# c++20 module的理解

在c++20之前，在一个模块中(.cpp)想要获取别的模块的声明， 就需要使用```#include```去包含其他模块的头文件。 c++20引入了module关键字，使得c++拥有了类似于java和python的包管理机制，本文就来讲解一下module这个语法糖。

## include头文件与module方式的对比

```#include```头文件有下面这些负面影响：

- 低效：头文件的本职工作是提供前置声明，而提供前置声明的方式采用了文本拷贝，文本拷贝过程不带有语法分析，会一股脑将需要的、不需要的声明全部拷贝到源文件中。
- 传递性：最底层的头文件中宏、变量等实体的可见性，可以通过中间头文件“透传”给最上层的头文件，这种透传会带来很多麻烦。
- 降低编译速度：加入 a.h 被三个模块包含，则 a 会被展开三次、编译三次。
- 顺序相关：程序的行为受头文件的包含顺影响，也受是否包含某一个头文件影响，在 C++ 中尤为严重（重载）。
- 不确定性：同一个头文件在不同的源文件中可能表现出不同的行为，导致这些不同的原因，可能源自源文件（比如该源文件包含的其他头文件、该源文件中定义的宏等），也可能源自编译选项。


而module模块机制则有以下一些优势：

- 无需重复编译：一个模块的所有接口文件、实现文件，作为一个翻译单元，一次编译后生成 pcm，之后遇到 Import 该模块的代码，编译器会从 pcm 中寻找函数声明等信息，该特性会极大加快 C++ 代码的编译速度。
- 隔离性更好：模块内 Import 的内容，不会泄漏到模块外部，除非显式使用 export Import 声明。
- 顺序无关：Import 多个模块，无需关心这些模块间的顺序。
- 减少冗余与不一致：小的模块可以直接在单个 cppm 文件中完成实体的导出、定义，但大的模块依然会把声明、实现拆分到不同文件。
- 子模块、Module Partition 等机制让大模块、超大模块的组织方式更加灵活。
- 全局模块段、Module Map 制使得 Module 与老旧的头文件交互成为可能。

## c++20 module 的 Helloworld

下面的例子是所有程序员都爱写的helloworld。

```cpp
//g++ -std=c++20 -fmodules-ts -xc++-system-header iostream
//g++ main.cpp -o main -std=c++20 -fmodules-ts
import <iostream>;

int main()
{
    std::cout << "Hello, World" << std::endl;
}
```

但是想跑通这个helloworld并不简单，系统库iostream的module并不会自动生成，而需要我们使用生成。

可以使用下面的命令生成iostream的module：

```shell
g++ -std=c++20 -fmodules-ts -xc++-system-header iostream
```

这个操作会在当前目录下生成一个gcm.cache目录，其目录结构如下所示：

```shell
$ tree gcm.cache/
gcm.cache/
└── usr
    └── include
        └── c++
            └── 11
                └── iostream.gcm

4 directories, 1 file
```

其次，在编译main.cpp 时需要添加-fmodules-ts的flag，即使用下面的编译语句：

```cpp
g++ main.cpp -o main -std=c++20 -fmodules-ts
```

经过这样的操作之后，可以成功的编译，并打印Hello, World。


## c++20 module管理

为了支持module， c++20 引入了三个关键字export/import/module。下面一一解读。

### export关键字

**export关键字**用于声明一个module名和标记内容的导出性。

```cpp
export(optional) module module-name module-partition (optional) attr (optional) ;	(1)	
export declaration	(2)	
export { declaration-seq (optional) } (3)
```

语句1声明了一个模块的名字，标记当前是一个Module单元。

语句2和语句3声明内容是可以导出的，即外部可以见的。

例如下面的例子：

```cpp
export module A; // （1）declares the primary module interface unit for named module 'A' 
 
// hello() will be visible by translations units importing 'A'
export char const* hello() { return "hello"; } （2）
 
// world() will NOT be visible.
char const* world() { return "world"; } （3）
 
// Both one() and zero() will be visible.
export  //(4)
{
    int one()  { return 1; }
    int zero() { return 0; }
}
 
// Exporting namespaces also works: hi::english() and hi::french() will be visible.
export namespace hi //(5)
{
    char const* english() { return "Hi!"; }
    char const* french()  { return "Salut!"; }
}
```

语句1声明了一个模块的名字，关于module前面加不加export的区别，将在module关键字中讲解。

语句2声明hello函数是可以导出的。

语句3没有export，代表其是不可以导出的。

语句4同时导出了两个函数。

语句5导出了整个namespace。


### import关键字

**import关键字**用于导入一个module。

```cpp
export(optional) import module-name attr (optional) ;		
```

如果导入的模块仅仅希望在当前编译单元可见，则不要加上export， 否则需要加上export。

在下面的例子，在A.cpp中，声明了module A，在moduleA中，hello函数是可以导出的。

在B.cpp文件中，声明了module B，在module B中，导入了module A，并使得moduleA中的内容对外可见，也声明world函数是可以导出的。

在main.cpp中，import了B模块，因为B模块中的world是可以导出的，同时由于B模块引入的A模块时使用了export，因此main方法可以调用hello和world方法。

```cpp
/////// A.cpp (primary module interface unit of 'A')
export module A;
 
export char const* hello() { return "hello"; }
 
/////// B.cpp (primary module interface unit of 'B')
export module B;
 
export import A;//A is visible for other compile unit
 
export char const* world() { return "world"; }
 
/////// main.cpp (not a module unit)
#include <iostream>
import B;
 
int main()
{
    std::cout << hello() << ' ' << world() << '\n';
}
```


### module关键字

```module```用于声明一个模块，其前方也可以带上```export```。下面将具体讲解module的用法。

**module可以用于声明一个模块**

```export module```代表纯接口或者是接口和实现在一起， 单独只有module代表纯实现。可以通过下面的例子去理解二者的区别：

- module接口和实现单元在一起：

```cpp
//Hello.cpp
export module Hello;
export const char* hello(){
    return "hello";
}
```

```cpp
//main.cpp
//g++ -fmodules-ts -std=c++20 Hello.cpp  main.cpp
import Hello;
int main(){
    hello();
}
```

- module接口声明单元和接口实现单元分开：

```cpp
//Hello.cpp
export module Hello;
export const char* hello();
```

注意Hello_Impl.cpp中的hello是不能添加export的，```export```只出现在有```export module```的接口声明单元中，而下面的是接口实现单元。

```cpp
//Hello_Impl.cpp
module Hello;
const char* hello(){
    return "hello";
}
```

```cpp
//g++ -fmodules-ts -std=c++20 Hello.cpp Hello_Impl.cpp  main.cpp
import Hello;
int main(){
    hello();
}
```

**module可以用于声明全局模块片段(global module fragement)**

```module；```语句之后可以跟一些预处理指令，例如```#include```，```#define```等。 

其存在的原因可以通过下面的例子说明：

对于第一种采用```#include```方式的头文件包括，尽管_UNICODE宏可以改变头文件windows.h中的条件编译，但该头文中的所有的可导出符号(exportable symbol)都会附加到相应导入模块(importing module)空间(既具有模块链接(module linkage))。

而对于第二种采用import指令的头文件单元导入方式，```_UNICODE```宏不能影响头文件windows.h的条件编译。

```cpp
// legency include preprocessor directive
#define _UNICODE
#include <windows.h>
```

```cpp
// `header-unit import` preprocessor directive
#define _UNICODE
import <windows.h>;
```

下面是一个完整的例子，```module;```和```export module A```之间的内容就是global module fragement。

```cpp
/////// A.cpp (primary module interface unit of 'A')
module;
 
// Defining _POSIX_C_SOURCE adds functions to standard headers,
// according to the POSIX standard.
#define _POSIX_C_SOURCE 200809L
#include <stdlib.h>
 
export module A;
 
import <ctime>;
 
// Only for demonstration (bad source of randomness).
// Use C++ <random> instead.
export double weak_random()
{
    std::timespec ts;
    std::timespec_get(&ts, TIME_UTC); // from <ctime>
 
    // Provided in <stdlib.h> according to the POSIX standard.
    srand48(ts.tv_nsec);
 
    // drand48() returns a random number between 0 and 1.
    return drand48();
}
 
/////// main.cpp (not a module unit)
import <iostream>;
import A;
 
int main()
{
    std::cout << "Random value between 0 and 1: " << weak_random() << '\n';
}
```

**module 分区**

module可以定义分区，例如定义一个```module A```， 再定义一个```module A:B```和```module A:C```，```A:C```和```A:B```同隶属于```module A```。

```cpp
///////  A.cpp   
export module A;     // primary module interface unit
 
export import :B;    // Hello() is visible when importing 'A'.
import :C;           // WorldImpl() is now visible only for 'A.cpp'.
// export import :C; // ERROR: Cannot export a module implementation unit.
 
// World() is visible by any translation unit importing 'A'.
export char const* World()
{
    return WorldImpl();
}
```

```cpp
/////// A-B.cpp 
export module A:B; // partition module interface unit
 
// Hello() is visible by any translation unit importing 'A'.
export char const* Hello() { return "Hello"; }
```

```cpp
/////// A-C.cpp 
module A:C; // partition module implementation unit
 
// WorldImpl() is visible by any module unit of 'A' importing ':C'.
char const* WorldImpl() { return "World"; }
```

```cpp
/////// main.cpp 
// g++ -fmodules-ts -std=c++20 A-B.cpp A-C.cpp A.cpp main.cpp
import A;
import <iostream>;
 
int main()
{
    std::cout << Hello() << ' ' << World() << '\n';
    // WorldImpl(); // ERROR: WorldImpl() is not visible.
}
```

**module : private**

从gcc的官方说明中得知，该点还没有被实现，https://gcc.gnu.org/onlinedocs/gcc/C_002b_002b-Modules.html。
> Private Module Fragment
> The Private Module Fragment is recognized, but an error is emitted.


## 总结
- c++20中开始支持module机制，新增加了module/import/export三个关键字，类似于java和python语言的包管理机制，旨在取缔头文件包含方式。目前主流的编译器并没有完全支持module中的所有内容，对于新项目而言可以尝试使用，老项目想要使用将带来一些额外的工作量。