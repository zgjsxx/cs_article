---
category: 
- 汇编语言
---

- [第十六讲： 结构体和结构体对齐；信号](#第十六讲-结构体和结构体对齐信号)
  - [汇编语言中的结构体](#汇编语言中的结构体)
  - [信号处理](#信号处理)
    - [信号](#信号)
    - [捕捉信号](#捕捉信号)
  - [附录](#附录)

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

如果我们简单地将该结构中的每个元素占用大小相加，我们得到的总大小是21个字节。但是，如果编译此结构，然后 ```cout << sizeof(thing)``` , 将打印出其大小为24字节。那么额外的3个字节是从哪里来的？

答案与结构体的布局有关，特别是结构体对齐和结构体打包。如果访问的地址是2的幂的倍数（通常为 32 或 64），CPU 可以更快地执行内存访问。为了使得内存的操作速度更快，结构体通常是对齐的，而不是紧密地排列在一起。这会导致使用一些额外的空间，以填充字节的形式添加到每个结构体中。

如果我们创建```thing```的一个实例，然后检查其成员的地址，我们可以推断出该结构的每个元素在这24个字节内的位置：

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
- ```b``` 位于 ```a``` 之后 8 个字节
- ```c``` 不是位于 ```b``` 之后 1 个字节，而是位于 ```b``` 之后 4 个字节。```char b``` 已扩展为 4 个字节（或者更确切地说，1 个字节后跟 3 个不可见的填充字节），以便将所有结构成员对齐到 4 字节的倍数。
- ```d``` 位于 ```c``` 之后 4 个字节，本身宽度为 8 个字节。

在 C++ 中，这也适用，但仅适用于部分```struct```和```class```，即```POD```类型(纯数据类)。 ```POD```类型有如下的特征：
- 没有用户提供的默认构造函数（即使用编译器生成的默认构造函数)
- 没有用户提供的复制构造函数
- 没有用户提供的析构函数
- 仅具有公共数据成员（所有这些成员也必须是 POD）
- 没有引用类型数据成员
- 没有虚函数，也没有虚拟基类。
  
```POD```类型允许具有非虚的函数，也可以使用继承。 ```POD```类型在 C++/C 之间完全兼容，并且在小心谨慎的情况下还可以与汇编完全兼容。

与往常一样，Sys V C ABI 定义了如何在内存中打包/对齐结构的元素。对齐规则实际上是根据数据类型指定的，并不特定于结构（即，内存中的每个 int 都应该对齐到 4 字节的倍数，而不仅仅是结构中的整数）。总结如下：

- 将数据值与其大小的倍数（以字节为单位）对齐。在较小的数据成员之后添加填充字节，以便后续成员正确对齐。
- 整个结构在存储在内存中时，应与其任何成员的最大对齐方式对齐。例如，```thing```将与 64 位地址对齐（始终从其开始），因为它的最大成员是双精度型，这需要 64 位对齐。
- 整个结构应在末尾进行填充，使其大小是其对齐方式的倍数。 （如果你对齐正确，这就会自然发生。

## 汇编语言中的结构体

在汇编语言中，我们可以按照结构体在内存中的排列规则来构建一个结构体。例如，如果要在栈上构建一个结构体的实例，我们可以这样做:

```x86asm
sub rsp, 24     ; 为实例对象创建空间
mov [rsp + 24], a
mov [rsp + 16], b
mov [rsp + 12], c
mov [rsp + 8],  d
```

该结构体的起始地址为```rsp + 24```。

这样构建结构体的实例显示很繁琐且容易出错。更好的选择是使用 ```yasm``` 的宏来构建结构体。

Yasm提供了```struc``` 和 ```endstruc```宏，使用这两个宏构建实例，我们可以这样做:

```x86asm
struc thing
    a:      resq    1
    b:      resb    1
            resb    3 ; 3个填充字节
    c:      resd    1  
    d:      resq    1
endstruc
```

```res[b|w|d|q]``` 指令分别保留一定数量的字节、字、双字或四字。

这通过 ```equ``` 隐式定义了六个常量：

- thing 被定义为 0，作为整个结构的地址相对于开头的偏移量。
- ```a```被定义为0。
- ```b``` 定义为 8
- ```c``` 定义为 12
- ```d``` 定义为 16
- thing结构的大小定义为 24

需要注意的是这些是全局常量，这意味着名称 ```a```、```thing``` 等不能用于同一文件中其他任何位置的标签或其他常量。您可以使用本地标签 ```.a```、```.b``` 等作为成员名称来避免该问题。

我们还可以使用```alignb```来要求后续数据的特定对齐方式，而不是手动添加填充字节。 ```alignb n``` 将 0 字节添加到当前节，直到当前地址 $ 是 n 的倍数，因此我们将在元素之前添加alignb指令：

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

第一个、第二个和第四个alignb根本不添加任何填充，因为成员d已经自然对齐到8的倍数。添加额外的alignb是安全的，因为除非需要，否则它们不会插入任何填充。

alignb 用 0 填充未使用的空间。

要实例化 ```.data``` 部分中的结构，请使用 ```istruc```、```at``` 和 ```iend```：

```x86asm
my_thing:   istruc thing
    at a,   dq      0.0     ; a = 0.0
    at b,   db      '!'     ; b = '!'
    at c,   dd      -12     ; c = -12
    at d,   dq      0       ; d = nullptr
iend
```

```at``` 宏前进到结构内的正确偏移量。 ```istruc``` 中的字段必须按照与原始结构中完全相同的顺序给出。

请注意，```istuc```/```iend``` 只能用于在 ```.data``` 部分中声明实例，即作为全局变量。要在栈上创建实例，我们首先要保留正确的空间量：

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


|Stack offset|	Member	|Value|
|--|--|--|
|rsp - 24|	a	|0.0|
|rsp - 16 |	b	|'!'|
|(rsp - 15) to (rsp - 13)|	padding bytes||	
|rsp - 12	|c|	|-12|
|rsp - 8	|d|	0|
|rsp|	top of stack| |	


## 信号处理

如果我们在程序中除以0，那么程序会因为浮点异常而崩溃。为了避免这种情况，我们需要在程序中安装信号处理函数，以捕获除零错误产生的```sigfpe```信号。我们需要使用```sigaction```函数。

尝试从 ```sigfpe``` 恢复通常非常危险。

### 信号

信号是基于Unix的操作系统与其上运行的进程进行通信的方式之一。信号可以分为那些可以被我们的进程捕获的信号和那些不可捕获的信号。

|信号|是否可以捕获|默认的行为|
|--|--|--|
|SIGINT(ctrl+C)|是|终止进程|
|SIGKILL|否|终止进程|
|SIGTERM|是|终止进程|
|SIGSGEV|是|终止进程|
|SIGFPE(除0)|是|终止进程|
|SIGHUP|是|终止进程|
|SIGWINCH|是|不做任何事情|

信号异步地发送到一个进程，这意味着，信号处理程序可以在任何地方触发。

信号处理程序的典型行为是设置一些全局变量，然后返回。如果是一些致命信号，唯一真正的选择是清理然后退出。

### 捕捉信号

要捕获信号，我们可以使用以下两种机制之一：

```c
#include <stdio.h>
#include <signal.h>

int window_resized = 0;

void my_handler(int sig) {
    window_resized = 1;
}

int main() {
    if(signal(SIGWINCH, my_handler) == SIG_ERR) {
        return 1; // Handler could not be attached
    }

    // Wait for window resizes
    while(1) { 
        if(window_resized) {
            printf("Window resized!\n");
            window_resized = 0;
        }
    }

    return 0;
}
```

信号函数有两个参数：一个信号常量和一个指向处理函数的指针。每个处理函数都应该具有原型 ```void handler(int sig)```，其中参数将是捕获的信号的序号。

信号函数的行为未完全指定，特别是在处理程序执行时捕获到信号时。因此，首选第二种方法，它使用 ```sigaction``` 结构和函数：

```c
#include <stdio.h>
#include <signal.h>

int window_resized = 0;

void my_handler(int sig) {
    window_resized = 1;
}

int main() {
    struct sigaction act;
    act.sa_handler = my_handler;    // Handler function
    sigemptyset(&act.sa_mask);      // Signals to block while running handler
    act.sa_flags = SA_RESTART;      // Flags

    if(sigaction(SIGWINCH, &act, NULL) != 0) {
        return 1; // Could not register handler
    }

    // Wait for window resizes
    while(1) { 
        if(window_resized) {
            printf("Window resized!\n");
            window_resized = 0;
        }
    }

    return 0;
}
```
```signal.h``` 中定义的 ```sigaction``` 结构如下所示：

```c
struct sigaction
{
    handler_t sa_handler;           // Function pointer (8 bytes) 
    unsigned long int sa_mask[16];  // Signal mask      (16*8 = 128 bytes)
    int sa_flags;                   // Flags            (4 bytes)

    // ... Other members
};
```

整个结构的大小为 152 字节。

与此对应的装汇编语言的结构定义为：

```x86asm
struc sigaction_t
    sa_handler:     resq 1
    sa_mask:        resq 16
    sa_flags:       resd 1
                    resb 12 ; Padding/other members
endstruc
```

幸运的是，这里的结构体使用指针传递，因此我们不必考虑的结构体传递规则。我们可以分配该结构的全局实例并传递它的地址。

```x86asm
section .data

SIGWINCH:       equ         28
SA_RESTART:     equ         268435456
msg:            db          "Window resized!\n", 0

window_resized: dq          0

action: istruc sigaction_t
    at sa_handler,  dq              my_handler
    at sa_mask,     times 16 dq     0
    at sa_flags,    dd              SA_RESTART
                    times 12 db     0 
iend
```

```my_handler```必须是带有单个int参数的C兼容函数：

```x86asm
my_handler:
    push rbp
    mov rbp, rsp

    mov qword [window_resized], 1

    pop rbp
    ret
```

最复杂的部分是```main```，因为它必须设置信号处理程序，然后循环等待信号：

```x86asm
extern sigaction
extern printf

main:
    push rbp
    mov rbp, rsp

    ; Install signal handler
    mov rdi, SIGWINCH
    mov rsi, action
    call sigaction

    cmp rax, 0
    je .continue

    ; Couldn't register handler, return 1
    mov rax, 1
    pop rbp
    ret

    ; Loop forever
.continue:

    cmp qword [window_resized], 1
    jne .continue

    mov rdi, msg
    call printf
    mov qword [window_resized], 0
    jmp .continue

    pop rbp
    mov rax, 0
    ret
```

## 附录

原文连接：https://staffwww.fullcoll.edu/aclifton/cs241/lecture-structures.html