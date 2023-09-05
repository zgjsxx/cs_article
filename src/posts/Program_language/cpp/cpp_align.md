---
category: 
- C++
---

# c++中的对齐问题

## 需要对齐的原因

尽管内存是以字节为单位，但是大部分处理器并不是按字节块来存取内存的.它一般会以双字节,四字节,8字节,16字节甚至32字节为单位来存取内存，我们将上述这些存取单位称为内存存取粒度.

现在考虑4字节存取粒度的处理器取int类型变量（32位系统），该处理器只能从地址为4的倍数的内存开始读取数据。

假如没有内存对齐机制，数据可以任意存放，现在一个int变量存放在从地址1开始的联系四个字节地址中，该处理器去取数据时，要先从0地址开始读取第一个4字节块,剔除不想要的字节（0地址）,然后从地址4开始读取下一个4字节块,同样剔除不要的数据（5，6，7地址）,最后留下的两块数据合并放入寄存器.这需要做很多工作.


![bg1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/cpp_align/bg1.png)

## 对齐的规则

**有效对齐值**：是 ```#pragma pack(n)```和结构体中最长数据类型长度中较小的那个。有效对齐值也叫**对齐单位**。

注意：
```#pragma pack(n)```中的n可以取(1 , 2 , 4 , 8 , 16)中的任意一值。


2）规则：

- 结构体变量的首地址是有效对齐值（对齐单位）的整数倍。

- 结构体第一个成员的偏移量（offset）为0，以后每个成员相对于结构体首地址的 offset 都是该成员大小与有效对齐值中较小那个的整数倍，如有需要编译器会在成员之间加上填充字节。

- 结构体的总大小为有效对齐值的整数倍，如有需要编译器会在最末一个成员之后加上填充字节。

- 结构体内类型相同的连续元素将在连续的空间内，和数组一样。

运用上面的规则，下面通过实际的例子进行计算。

例1：

```cpp
#include <iostream>

struct MyStruct {
    char c;
    int i;
    short s;
};

int main()
{
    MyStruct obj;
    std::cout << "start addr of obj = " << (void*)&obj << std::endl;
    std::cout << "offset of c = "  << offsetof(MyStruct,c) << std::endl;
    std::cout << "offset of i = " << offsetof(MyStruct,i) << std::endl;
    std::cout << "offset of s = " << offsetof(MyStruct,s) << std::endl;
    std::cout << "sizeof MyStruct = " << sizeof(MyStruct);
}
```

执行结果如下：

```cpp
start of obj = 0x7fff2e8d1e94
offset of c = 0
offset of i = 4
offset of s = 8
sizeof MyStruct = 12
```

结构中最长的数据类型是int，长度也为4。因此结构体的有效对齐值是4。

对于c变量而言，没有悬念，将排在0偏移地址处。

对于变量i，类型为int，长度为4，int和有效对齐值的最小值为4，因此i需要排布在4的整数倍上，因此第一个符合要求的偏移量就是4。

对于变量s，类型为short，长度为2，short和有效对齐值二者中的最小值为2，第一个符合要求的地址为8。

到目前为止，使用的空间大小是10，而结构体大小需要满足有效对齐值的整数倍，因此需要2个填充，因此结构体最终大小是12。

![MyStruct分布](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/cpp_align/example1.png)


例2：

```cpp
#include <iostream>
#pragma pack(2)
struct MyStruct {
    char c;
    int i;
    short s;
};

int main()
{
    MyStruct obj;
    std::cout << "start addr of obj = " << (void*)&obj << std::endl;
    std::cout << "offset of c = "  << offsetof(MyStruct,c) << std::endl;
    std::cout << "offset of i = " << offsetof(MyStruct,i) << std::endl;
    std::cout << "offset of s = " << offsetof(MyStruct,s) << std::endl;
    std::cout << "sizeof MyStruct = " << sizeof(MyStruct);
}
```

执行结果如下：

```cpp
start addr of obj = 0x7fff488e3418
offset of c = 0
offset of i = 2
offset of s = 6
sizeof MyStruct = 8
```

首先```#pragma pack```设置的对齐值是2，结构中最长的数据类型是int，长度也为4。因此结构体的有效对齐值是2。

对于c变量而言，没有悬念，将排在0偏移地址处。

对于变量i，类型为int，长度为4，int和有效对齐值的最小值为2，因此i需要排布在2的整数倍上，因此第一个符合要求的偏移量就是2。

对于变量s，类型为short，长度为2，short和有效对齐值二者中的最小值为2，第一个符合要求的地址为6。

到目前为止，使用的空间大小是8，已经满足结构体大小是有效对齐值的整数倍的要求。

![MyStruct分布2](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/cpp_align/example2.png)


```cpp
#include <iostream>
#pragma pack(1)
struct MyStruct {
    char c;
    int i;
    short s;
};

int main()
{
    MyStruct obj;
    std::cout << "start addr of obj = " << (void*)&obj << std::endl;
    std::cout << "offset of c = "  << offsetof(MyStruct,c) << std::endl;
    std::cout << "offset of i = " << offsetof(MyStruct,i) << std::endl;
    std::cout << "offset of s = " << offsetof(MyStruct,s) << std::endl;
    std::cout << "sizeof MyStruct = " << sizeof(MyStruct);
}
```

执行结果如下：

```cpp
start addr of obj = 0x7ffe96c067a9
offset of c = 0
offset of i = 1
offset of s = 5
sizeof MyStruct = 7
```

首先```#pragma pack```设置的对齐值是1，结构中最长的数据类型是int，长度也为4。因此结构体的有效对齐值是1。

对于c变量而言，没有悬念，将排在0偏移地址处。

对于变量i，类型为int，长度为4，int和有效对齐值的最小值为，因此i需要排布在2的整数倍上，因此第一个符合要求的偏移量就是1。

对于变量s，类型为short，长度为2，short和有效对齐值二者中的最小值为2，第一个符合要求的地址为5。

到目前为止，使用的空间大小是7，已经满足结构体大小是有效对齐值的整数倍的要求。

![MyStruct分布3](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/cpp_align/example3.png)


例4：

```cpp
#include <iostream>
#include <emmintrin.h>

struct MyStruct {
    char c;
    __m128i i;
};

int main()
{
    MyStruct obj;
    std::cout << "start addr of obj = " << (void*)&obj << std::endl;
    std::cout << "offset of c = "  << offsetof(MyStruct,c) << std::endl;
    std::cout << "offset of i = " << offsetof(MyStruct,i) << std::endl;
    std::cout << "sizeof MyStruct = " << sizeof(MyStruct);
}
```

执行结果如下：

```cpp
start addr of obj = 0x7fff9d47cd90
offset of c = 0
offset of i = 16
sizeof MyStruct = 32
```

首先，结构中最长的数据类型是__m128i，长度为16。因此结构体的有效对齐值是16。

对于c变量而言，没有悬念，将排在0偏移地址处。

对于变量i，类型为__m128i，长度为16，__m128i和有效对齐值的最小值为16，因此i需要排布在2的整数倍上，因此第一个符合要求的偏移量就是16。

![MyStruct分布4](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/cpp_align/example4.png)


例5：

```cpp
#include <iostream>
#include <emmintrin.h>

#pragma pack(8)
struct MyStruct {
    char c;
    __m128i i;
};

int main()
{
    MyStruct obj;
    std::cout << "start addr of obj = " << (void*)&obj << std::endl;
    std::cout << "offset of c = "  << offsetof(MyStruct,c) << std::endl;
    std::cout << "offset of i = " << offsetof(MyStruct,i) << std::endl;
    std::cout << "sizeof MyStruct = " << sizeof(MyStruct);
}
```

执行结果如下：

```cpp
start addr of obj = 0x7ffddbec2c40
offset of c = 0
offset of i = 8
sizeof MyStruct = 24
```

首先```#pragma pack```设置的对齐值是8，结构中最长的数据类型是__m128i，长度为16。因此结构体的有效对齐值是8。

对于c变量而言，没有悬念，将排在0偏移地址处。

对于变量i，类型为__m128i，长度为16，__m128i和有效对齐值的最小值为8，因此i需要排布在2的整数倍上，因此第一个符合要求的偏移量就是8。

![MyStruct分布5](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/cpp_align/example5.png)