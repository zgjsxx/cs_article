---
category: 
- 汇编语言
---

# 第十六讲： 结构体和结构体对齐；信号

C/C++结构体(```struct```)实际上只不过是按照一定的排列方式存储在内存中的多个数据。如果我们想要与使用结构体的C/C++程序进行交互，我们需要了解如何在汇编语言中构造出等效的内容。

一个简单的结构体的例子如下所示：

```cpp
struct thing { 
    double a;  // 8 bytes
    char   b;  // 1 byte
    int    c;  // 4 bytes
    char*  d;  // 8 bytes    
};
```

如果我们简单地将该结构中地每个元素占用地大小相加，我们得到 21 个字节。但是，如果编译此结构，然后 ```cout << sizeof(thing) C++``` 将报告其大小为 24 字节。额外的 3 个字节是从哪里来的？答案与结构布局有关，特别是对齐和结构体打包。请记住，如果内存访问与 2 的某些幂的倍数（通常为 32 或 64）对齐，CPU 可以更快地执行内存访问。为了实现优化的移动，结构构件通常是对齐的，而不是尽可能紧密地排列在一起。这会导致一些额外的空间，以填充字节的形式添加到每个结构中。

如果我们创建 thing 的一个实例，然后检查其成员的地址，我们可以推断出该结构的每个元素在这 24 个字节内的位置：

```c
thing x;

struct thing { 
    double a;  // &x.a == &x
    char   b;  // &x.b == &x + 8
    int    c;  // &x.c == &x + 12
    char*  d;  // &x.d == &x + 16
};
```

- 首先，结构本身的地址只是其第一个成员的地址
- b 位于 a 之后 8 个字节
- c 不是位于 b 之后 1 个字节，而是位于 b 之后 4 个字节。char b 已扩展为 4 个字节（或者更确切地说，1 个字节后跟 3 个不可见的填充字节），以便将所有结构成员对齐到 4 字节的倍数。
- d 位于 c 之后 4 个字节，本身宽度为 8 个字节。

在 C++ 中，这也适用，但仅适用于结构和类的子集：那些 POD 类型 — “纯数据类”。 POD 类型是一种：
- 没有用户提供的默认构造函数（即使用编译器生成的默认构造函数)
- 没有用户提供的复制构造函数
- 没有用户提供的析构函数
- 仅具有公共数据成员（所有这些成员也必须是 POD）
- 没有引用类型数据成员
- 没有虚函数，也没有虚拟基类。
  
请注意，这确实允许 POD 类型具有（非虚拟）方法并使用继承。 POD 类型在 C++ 和 C 之间完全兼容，并且在小心谨慎的情况下还可以与汇编完全兼容。

与往常一样，Sys V C ABI 定义了如何在内存中打包/对齐结构的元素。对齐规则实际上是根据数据类型指定的，并不特定于结构（即，内存中的每个 int 都应该对齐到 4 字节的倍数，而不仅仅是结构中的整数）。总结如下：

- 将数据值与其大小的倍数（以字节为单位）对齐。在较小的数据成员之后添加填充字节，以便后续成员正确对齐。
- 整个结构在存储在内存中时，应与其任何成员的最大对齐方式对齐。例如，```thing```将与 64 位地址对齐（始终从其开始），因为它的最大成员是双精度型，这需要 64 位对齐。
- 整个结构应在末尾进行填充，使其大小是其对齐方式的倍数。 （如果你对齐正确，这就会自然发生。

## 汇编语言中的结构

我们可以通过在内存中排列事物以符合结构布局来“构建”一个结构体。例如，要在堆栈上构建事物结构的实例，我们可以这样做

```x86asm
sub rsp, 24     ; Make room for the struct 
mov [rsp + 24], a
mov [rsp + 16], b
mov [rsp + 12], c
mov [rsp + 8],  d
```

然后该结构体的地址为rsp+24。这显然是繁琐且容易出错的。更好的选择是使用 Yasm 的宏来构建结构、struc 和 endstruc。为了在装配中反映上述结构，我们使用:

```x86asm
struc thing
    a:      resq    1
    b:      resb    1
            resb    3 ; 3 Padding bytes
    c:      resd    1  
    d:      resq    1
endstruc
```

（```resb、w、d、q``` 指令分别保留一定数量的字节、字、双字或 q 字。）


这通过 equ 隐式定义了六个常量：

- thing 被定义为 0，作为整个结构的地址相对于开头的偏移量。
- 类似地，a被定义为0。
- b 定义为 8
- c 定义为 12
- d 定义为 16
- thing_size 定义为 24

请注意，这些是文件全局常量，这意味着名称 a、thing 等不能用于同一文件中其他任何位置的标签或其他常量。如果这是一个问题，您可以使用本地标签 .a、.b 等作为成员名称。

我们还可以使用alignb来请求后续数据的特定对齐方式，而不是手动添加填充字节。 alignb n 将 0 个字节添加到当前节，直到当前地址 $ 是 n 的倍数，因此我们将在元素之前添加alignb指令：

```x86asm
struc thing
            alignb  8   ; Does nothing, already aligned
    a:      resq    1
            alignb  1   ; Does nothing, already aligned
    b:      resb    1
            alignb  4   ; Advance to multiple of 4
    c:      resd    1 
            alignb  8   ; Advance to multiple of 8 
    d:      resq    1
endstruc
```

请注意，第一个、第二个和第四个alignb根本不添加任何填充，因为成员d已经自然对齐到8的倍数。添加额外的alignb是安全的，因为除非需要，否则它们不会插入任何填充。

alignb 用 0 填充未使用的空间。

要实例化 .data 部分中的结构，请使用 istruc、at 和 iend：

my_thing:   istruc thing
    at a,   dq      0.0     ; a = 0.0
    at b,   db      '!'     ; b = '!'
    at c,   dd      -12     ; c = -12
    at d,   dq      0       ; d = nullptr
iend

at 宏前进到结构内的正确偏移量。 istruc 中的字段必须按照与原始结构中完全相同的顺序给出。

请注意，istuc/iend 只能用于在 .data 部分中声明实例，即作为全局变量。要在堆栈上创建实例，我们首先要保留正确的空间量：

```x86asm
add rsp, thing_size
```

然后相对于 ```rsp``` 填充它:

```x86asm
mov qword [rsp - thing_size + a], 0.0
mov byte  [rsp - thing_size + b], '!'
mov dword [rsp - thing_size + c], -12
mov qword [rsp - thing_size + d], 0
```


Stack offset	Member	Value
rsp - 24	a	0.0
rsp - 16	b	‘!’
(rsp - 15) to (rsp - 13)	padding bytes	
rsp - 12	c	-12
rsp - 8	d	0
rsp	top of stack	

## 函数调用规约(结构体)

像往常一样，作为指针传递的结构作为 64 位 qword 地址传递。直接按值传递结构怎么样：

```cpp
void f(thing x);
```

我们如何从汇编中调用 x ？要将结构体按值传递给函数，有许多不同的规则，主要取决于结构体及其成员的大小。基本主题是通过将结构“分解”为其成员并在寄存器中单独传递它们来传递结构，但小于 qword 的成员可以组合在单个寄存器中。

- 如果结构的大小（以字节为单位）≤ 8，则整个结构将打包到单个 64 位寄存器中并通过它。
- 如果结构的大小 > 16 字节并且第一个 qword 无法在 xmm 寄存器中传递，则将整个结构传递到堆栈上。 （这是传递结构的传统 32 位方式，从而确保 32 位和 64 位程序以相同的方式传递“经典”结构。）
- 如果结构的大小大于 64，或者其任何成员未正确对齐，则将其传递到堆栈上。
- 如果结构的大小 > 8 但 ≤ 64，那么我们检查该结构，就好像它是一个 qword 序列，通过查看进入其中的字段，根据正常参数对每个 qword 分别进行分类- 通过规则，然后使用最严格的要求。例如，如果 qword 中的一个字段可以在寄存器中传递，但另一个字段必须在堆栈上传递，则整个结构都会在堆栈上传递。



**例子**
```c
// Note: sizeof(structparm) == 16
struct structparm {
    int a, b;
    double d;
};

structparm s;
int e, f, g, h, i, j, k;
double m, n;

structparm func(int e, int f, 
                structparm s, 
                int g, int h, 
                double m, 
                double n, 
                int i, int j, int k);
```

如何为此函数调用设置寄存器和堆栈？

|GP registers|FP register| Stack|
|--|--|--|
|rdi：e <br> rsi: f <br> rdx: s.a, s.b <br> rcx: g <br> r8: h <br> r9: i| xmm0: s.d <br> xmm1: m <br> xmm2: n| 0：j <br> 8： k|

返回值将如何表示？

GP registers	FP registers	Stack
rax: ret.a, ret.b	xmm0: ret.d	None



原文连接：https://staffwww.fullcoll.edu/aclifton/cs241/lecture-structures.html