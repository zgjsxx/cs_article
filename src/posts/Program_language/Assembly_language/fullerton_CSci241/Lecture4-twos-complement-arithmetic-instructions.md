
---
category: 
- 汇编语言
---

# 第四讲：算术运算和简单函数

## 回顾

### 寄存器

上一讲中，我们学习了我们可用的所有的通用寄存器：```rax```，```rbx```，```rcx```，```rdx```，```rdi```，```rsi```，```rbp```，```rsp```，```r8```至```r15```。

我们看到了如何以完整的 64 位 (qword) 宽度或低位双字、低位字或低位字节来访问其中的每一个：

![common_register](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture3/common_register.png)

我们看到许多指令（包括 ```mov``` 和 ```xor```）在对寄存器的低位双字部分进行操作时，会隐式地将高位双字清零，并且我们研究了一些保留高位双字的策略。

我们查看了标志寄存器 ```rflags```，它用于存储有关各种操作结果的信息。对我们来说最重要的标志是:

- CF – 进位标志，如果无符号运算的结果产生额外的进位/借位则设置
- OF – 溢出标志，如果有符号运算的结果太大/太小而无法存储，则设置
- ZF – 零标志，如果结果的所有位均为 0，则设置该标志。
- SF – 符号标志，如果结果的高位被置位则置位

我们看到 ```mov``` 指令是我们在寄存器、内存和立即（常量）值之间移动数据的基本工具。我们还看到了 ```xchg``` 指令，它交换操作数，使我们不必使用寄存器作为临时变量。

## 负数

前面描述的所有算术运算符都假设输入值为正。那么如果输入有负数该如何处理？一般来说， 有四种处理办法：
- 符号位(源码)： 在十进制中，我们用```-```符号表示负数， 那么为什么不用一个位来表示这个数字是负数呢？其实，数字的最高位就是用来做这个事情。例如 00000011b 是 3，但 10000011b 是 -3。虽然这个办法对我们来说很容易理解，但是在实现时确有几个缺点：
  - 现在0有两种表示，一个是正数0，一个是负数0。
  - 值的算术更加复杂，因为我们必须检查两个值的符号位。如果我们忘记并执行无符号运算，结果将是无意义的。
  - CPU 必须根据符号位的值在执行加法运算和执行减法运算之间切换。也就是说，CPU 无法将自己设置为执行加法/减法，直到它也知道正在操作的值。
  浮点值使用符号位，部分原因是它们希望同时具有正零和负零。
- 偏置表示法(biasd)。这表示所有值（不仅仅是负值）都叠加一个固定量。所以0不是0，而是0+127（=01111111b）什么的。 3是3+127=10000010b，-3是-3+127=01111100b。请注意，高位用作一种"正号位"；如果已设置，则该数字为正数（大于 0）。
  - 加法和减法（在某种程度上）正常工作，只是我们必须在执行正常运算后​​“消除”值的偏差。例如，添加 3 和 -3 得出：

    ```shell
        10000010
    +  01111100
    ─────────────
        11111110 = 127 (254-127) 
    ```
    我们必须再次从结果中减去127，因为添加了两个127的“副本”，所以最终的结果实际上是
    ```shell
     11111110
  -  01111111
 ─────────────
     01111111 = 0 (127-127)
    ```
  - 正数看起来很奇怪。零看起来很奇怪。
  - 检测非负数 (≥ 0) 很棘手。

- 反码(Ones-complement)：这将负值表示为相应数字的二进制逆（翻转所有位）。所以 3 是 00000011b，而 -3 是 11111100b。请注意，我们可以通过检查高位来确定数字是否为负数。如果已设置，则该数字为负数。但高位不是符号位。我们不能通过简单地翻转高位来使负数变为正数，我们必须翻转所有位。
  如果我们执行+3和-3的二进制加法，我们会得到:
    ```shell
        00000011
    +   11111100
    ─────────────
        11111111 = -0
    ```
  与符号位表示一样，0 有两种表示形式，正数（如 00000000b）和负数（如 11111111b）。然而，我们可以使用普通的二进制加法来添加有符号数，并且当解释为补码数时，结果将是正确的。
  减法有点困难：

    ```shell    
       111111  
        00000011   = 3
     -  00000100   = 4
    ─────────────
        11111110 =  -1 
    ```
    当借用的 1 到达最左边时，它会“环绕”并从答案的低位借用。这称为末端借用。当这种情况发生时，我们必须做出调整。

- 补码(Twos-complement)：将负数的值按位取反再加1。8位数字的的补码可以被定义为${2}^{8}-n$。 所以 3 是 00000011b 而 -3 是 11111101b。请注意，高位仍可用于检测负值。你可以认为补码是反码加上1。
  - 所有的算术运算符都正常工作，无需传入值的符号。我们可以进行正常的加法，无论其中一个或两个输入是否为负，结果都会"有意义"。例如:
    ```
       1111111
       00000011
    +  11111101
    ─────────────
       00000000 
    ```
  - 所有算术运算都正常工作，无需知道传入值的符号。我们可以进行正常的加法，无论其中一个或两个输入是否为负，结果都会“有意义”。例如。
    ```shell
        1111111
        00000011
    +  11111101
    ─────────────
        00000000 
    ```
  - 0 只有一种表示形式，而不是两种，而且就是 0b。
  - 表示的值的范围（通过字节）为 -128 到 +127。
  - 这里不需要在二进制补码中进行结束借用/进位。

    x86-x64系统(以及许多其他系统)使用二进制补码，因为它不需要任何额外的电路来表示或操作负数。你只需进行“正常”的二进制加法，结果就是正确的。

(这里原文中的介绍相对比较笼统，细节可以参考维基百科，[原码](https://zh.wikipedia.org/wiki/%E5%8E%9F%E7%A0%81)， [反码](https://zh.wikipedia.org/wiki/%E4%B8%80%E8%A3%9C%E6%95%B8)，[补码](https://zh.wikipedia.org/wiki/%E4%BA%8C%E8%A3%9C%E6%95%B8)。

乘法是一种非常昂贵的运算，我们通常不会费心尝试在数字表示“内部”进行它。相反，我们只是将两个操作数都设为正数，然后相乘，然后根据需要对结果取负。

另一个例子：
```shell
   11  1
   01110110  = 118
 + 11100101  = -27
────────────
   01011011  = 91
```

一个数(正数或者负数)进行取反：
- 翻转每个比特
- 加1

无论输入值是正值还是负值，这都有效。例如:

```shell
11100101  = -27
00011010        (flip all bits)
00011011  =  27 (add 1)
```

```shell
00011011  =  27 
11100100        (flip all bits)
11100101  = -27 (add 1)
```
### 数据尺寸的延展

假设我们有一个8位的数字，我们希望将其存储到16位的空间中。如果这个数字是无符号的，那么这很容易。直接将数字复制到低8位，然后用0填充到高8位。但是如果该值是有符号的（二进制补码）怎么办? 在这种情况下，为了获取等效的值，我们需要对扩展后的数字添加符号位，将原本的数字中的高位填充扩充后的数字的高位。如果高位原来为1，则高8位必须全部为1，否则应为0。

许多可以“混合”不同字长值的算术运算有两种形式：“零扩展”（用 0 填充）的无符号形式和符号扩展（复制高位）的有符号形式。

### 内存中的表示

对于单字节值，使用上述表示法。然而，对于多字节值，有几个选项。考虑 16 位值。当我们将其放入内存地址 a 时，可以通过两种方式完成：

- 我们可以将低字节（8 位）放入地址 a，将高字节放入 a+1。这称为小端字节序，因为低字节在前。

- 我们可以将低字节放入地址a+1，将高字节放入a。这称为大端字节序，因为高字节在前。

如果大尾数法看起来很疯狂，请考虑一下这就是从左到右写入 16 位值的方式，假设内存地址向右增加：

```shell
high byte	low byte

addr	    addr + 1
```

Intel系统使用Little-endian，因此我们不需要担心big-endian。 Big-endian 由一些微控制器 (AVR32) 和一些 big-iron 处理器使用。如果您正在编写文件格式（或网络协议），那么您必须定义“标准”字节顺序，并且必须确保在必要时在软件中完成正确的翻译。但对于我们来说，如果要访问内存中一个16位值的高字节，可以在地址+1处找到。

### 访问内存

在 64 位模式下，所有地址都是64位的，因此必须使用完整寄存器（```rax```、```rbx``` 等）来存储地址。正如我们所见，```.data``` 部分中用于定义字符串的标签实际上是该字符串的地址，因此我们可以将字符串 ```my_text``` 的地址加载到 ```rax``` 中：

```x86asm
mov rax, my_text 
```

您可以将这种用法中的 ```rax``` 视为指针类型变量，保存某个变量的地址。

我们可以通过将内存地址放在方括号中来执行**解引用**操作：

```x86asm
mov al, byte [my_text]
```

这里并不严格要求带上字节限定符，但带上它是一个很好的做法。

下面展示一个容易犯错误的例子:

```x86asm
mov rax, [my_text] ; Read one *qword* from my_text
```

它读取的不是一个字节而是八个字节（qword）。

当你增加字节限定符,而不修改寄存器时进行汇编将会报错。因为**限定符**和**寄存器的大小**不匹配。

```x86asm
mov rax, byte [my_text] ; Read one byte from my_text
```

下面是一个完整的例子：

```x86asm
section .data

msg:    db      "Hello, world!"
MSGLEN: equ     $-msg

section .text

global _start
_start:
    mov rax, byte [newline]
    mov     rax,    60              ; Syscall code in rax
    mov     rdi,    0               ; First parameter in rdi
    syscall                         ; End process
    ; Normal exit syscall...
```

进行编译：

```shell
yasm -g dwarf2 -f elf64 hello.s -l hello.lst
```

报错内容如下所示：

```shell
error: invalid size for operand 2
```

这里特别要注意```mov```要求源操作数和目的操作数大小相等。如果操作数的大小不相等，就需要使用```movzx```。

实际上，当我们正在处理一个字符串时，大概率我们会想要迭代它，而不仅仅是访问第一个字节。将地址 ```my_text``` 放入寄存器然后"解引用"会更有用：

```x86asm
mov rsi, my_text
mov al, byte [rsi]
```

然后我们可以通过 ```inc rsi``` 来增加 ```rsi```的值从而访问字符串中的下一个字节。因为 ```my_text``` 是立即数，所以我们不能递增它。 （同样，```[rsi]``` 上的字节限定符不是必需的，因为它可以从 ```al``` 的大小推断出来。）

## 简单的循环

因为做任何有趣的事情都需要循环，所以我们将介绍```loop```指令。```loop```采用单个操作数，一个要跳转到的标签（在内部，循环存储标签地址相对于当前指令地址的偏移量）。```loop```的操作是执行以下步骤：

- 对```rcx```进行递减
- 如果```rcx != 0```,跳转到标签处。
- 如果```rcx == 0```，则往下继续执行。

因此，基本循环的结构如下所示：

```x86asm
    mov rcx, init       ; Initialize rcx > 0

.start_loop:

    ; ... Perform loop operation using rcx

    loop .start_loop

    ; ... Continue after end of loop
```

这大致相当于 C/C++ 风格的 ```do-while``` 循环：

```cpp
rcx = init;
do {

    // ... Perform loop operation

    --rcx;
} while(rcx != 0);
```

请注意，因为 ```rcx``` 是允许系统调用会修改的寄存器之一，所以如果您在循环内执行任何系统调用，则需要在调用之前保存 ```rcx````，然后在调用之后恢复它。

作为一个演示，我们可以修改"Hello, world"程序来反向打印"Hello, world!"，从末尾到开头一次打印一个字符。（我们仍然会使用 ```write``` 系统调用，我们只是告诉它打印单个字符而不是整个字符串。）

首先我们先考虑如何在C/C++语言中实现。下面时最基本的"Hello, world!"程序。

```cpp
int main()
{
    char* msg = "Hello, world!";
    const int MSGLEN = 13; 

    cout.write(msg,MSGLEN); // equiv. to write syscall
}
```

要一次写入一个字符，我们需要一个从字符串末尾开始的循环，一次向后写入一个字符，如下所示：

```cpp
int main()
{
    char* msg = "Hello, world!";
    const int MSGLEN = 13;

    int c = MSGLEN;
    do {

        char* addr = msg + c - 1;
        cout.write(addr,1);

        --c;
    } while(c != 0);
}
```

我特意以镜像循环指令执行的方式编写 do-while 循环，以便更容易转换为汇编。

我们原始的HelloWorld程序是这样的：

```x86asm
section .data

msg:            db      10, "Hello, world!"
MSGLEN:          equ     $-msg

section .text

;; Program code goes here

global _start
_start:
    mov     rax,    1               ; Syscall code in rax
    mov     rdi,    1               ; 1st arg, file desc. to write to
    mov     rsi,    msg             ; 2nd arg, addr. of message
    mov     rdx,    MSGLEN          ; 3rd arg, num. of chars to print
    syscall

    ;; Terminate process
    mov     rax,    60              ; Syscall code in rax
    mov     rdi,    0               ; First parameter in rdi
    syscall                         ; End process
```

我已从文本中删除了尾随的 10 (\n)，并将其移至开头，因此它仍会在“末尾”打印。

第一个系统调用将在循环内，因此我们可以添加：

```x86asm
section .data

msg:            db      10, "Hello, world!"
MSGLEN:          equ     $-msg

section .text

;; Program code goes here

global _start
_start:
    mov     rdi,    1               ; 1st arg, file desc. to write to
    mov     rdx,    1               ; 3rd arg, num. of chars to print
.begin_loop
    mov     rax,    1               ; Syscall code in rax
    mov     rsi,    msg             ; 2nd arg, addr. of message

    ；other code
    
    syscall
    loop .begin_loop

    ;; Terminate process
    mov     rax,    60              ; Syscall code in rax
    mov     rdi,    0               ; First parameter in rdi
    syscall                         ; End process
```

请注意，系统调用保留了 ```rdi``` 和 ```rdx```，因此我们可以在循环外设置它们。然而，```rax```用于返回值，因此我们应该每次循环时都设置它，而```rsi```是字符串开头的地址，它会随着我们在字符串中移动而改变。

我们需要将 ```rcx``` 初始化为字符串的长度：

然后我们将 ```rsi```（要写入的地址）设置为 ```rcx + msg - 1```

```x86asm
mov rsi, rcx
add rsi, msg-1
```

（```add a、b``` 执行加法，```a += b``` 和 ```dec a``` 减量 ```--a```。两者都受到通常的限制：没有内存到内存的操作、两个操作数大小相同等。因为 ```msg``` 是常量，```msg-1``` 在汇编时执行。）

最后，请注意，```rcx``` 是允许系统调用会修改的寄存器之一（```r11``` 是另一个），因此我们必须在系统调用之前将其保存到另一个安全的寄存器中，然后在系统调用之后恢复它：

```x86asm
mov r15, rcx
syscall
mov rcx, r15
```

最终形成的代码如下：

```x86asm
section .data
msg:            db      10, "Hello, world!"
MSGLEN:          equ     $-msg

section .text
global _start
_start:
    mov     rdi,    1               ; 1st arg, file desc. to write to
    mov     rdx,    1               ; 3rd arg, num. of chars to print
    mov rcx, MSGLEN                 ; loop counter = MSGLEN
.begin_loop
    ; Print 1 char at [msg + rcx - 1]
    mov     rax,    1               ; Syscall code in rax
    mov rsi, rcx                    ; rsi = addr to print
    add rsi, msg
    dec rsi                         ;[msg + rcx - 1]

    mov r15, rcx                    ; Save rcx before syscall
    syscall
    mov rcx, r15                    ; Restore rcx

    loop .begin_loop

    ;; Terminate process
    mov     rax,    60              ; Syscall code in rax
    mov     rdi,    0               ; First parameter in rdi
    syscall                         ; End process
```

```shell
yasm -g dwarf2 -f elf64 hello2.s -l hello2.lst
ld -g -o hello2 hello2.o
```

执行结果如下：

```
./hello
!dlrow ,olleH
```

## 本地标签

当编写函数内部存在的循环或其他标签时，通过以句号开头将它们编写为本地标签非常有用。本地标签实际上是以最近的非本地标签命名的，因此 ```.begin_loop``` 的全名实际上是 ```_start.begin_loop```。标签通常每个文件只能定义一次，因此如果没有本地标签，我们编写的其他函数就无法使用标签 ```begin_loop```。


## 负的```rcx```

如果您好奇，让我们考虑一下如果 ```rcx``` 为负并且我们将其递减会发生什么。例如，如果 ```rcx = 11111111 (= -1)```，并且我们递减：

```shell
   11111111
 - 00000001
────────────
   11111110  = -2
```

换句话说，结果正是您所期望的（但与循环一起使用时不是特别有用）。

## ```loop```的变化

循环指令有两种变体，用于测试零标志 (ZF) 以及 rcx 的值：

- ```loope```: 循环相等, 递减 ```rcx```，如果 ```rcx != 0``` 且 ```ZF == 1``` 则循环

- ```loopne```: 循环不等于；递减 ```rcx```，如果 ```rcx != 0``` 且 ```ZF == 0``` 则循环

零标志与（不）等式的概念相关，因为如果我们执行减法：

```x86asm
sub a, b
```

并且 ```a == b```，则将设置零标志，否则将取消设置。

## 包含文件

与 C/C++ 一样，```yasm``` 有一种简单的机制将一个 ```.s``` 文件的内容包含到另一个文件中：

```x86asm
%include "source.s"
```

将 ```source.s``` 的内容复制到当前的汇编文件中。例如，我们可以开始集中许多系统调用定义，包括一个包含文件：

```x86asm
;;;
;;; sysdefs.s
;;;
[section .data]

SYS_write   equ     1
SYS_exit    equ     60

SYS_stdin   equ     0
SYS_stdout  equ     1
...

__SECT__
```

```[section .data]``` 和 ```__SECT__``` 的东西很“神奇”，可以暂时切换到数据部分，然后切换回我们之前所在的任何部分。

## 简单的函数

正如我们稍后将看到的，从汇编调用 C 函数，或者使我们的汇编函数可从 C/C++ 调用，需要一些额外的步骤来正确设置堆栈。然而，只要我们纯粹停留在"汇编领域"，我们就不需要担心额外的复杂性；我们基本上可以让函数按照我们喜欢的方式工作。唯一的要求是我们能够从函数返回并回到原来的位置。

处理函数的两条指令是call和ret。两者都在内部使用堆栈：

- call 接受一个地址（.text 部分中的标签）并执行两个步骤：将 rip（指令指针）压入堆栈，然后跳转到给定的地址。请记住，rip 指向要执行的下一条指令，因此压入堆栈的值实际上是函数的返回地址，即函数返回时应恢复执行的地址。

- ret 弹出栈顶元素并跳转到该元素。 rip 自动更新为以下指令。

它们协同工作如下（地址只是虚构的）：

|地址|指令|地址|指令|
|--|--|--|--|
|_start:||my_func:||
|0x100|call my_func|0x200|mov eax, ...|
|0x108|mov rbx,rax|0x208|...|
||...|0x280|...|

当 ```my_func``` 执行时，堆栈包含 0x108，即返回地址。当执行 ret 时，该地址将从堆栈中弹出，我们从该点恢复执行。（稍后，我们会看到这意味着如果您将堆栈用于其他任何用途，则必须确保在返回之前已弹出所有内容，因此此时堆栈上唯一的内容就是退货地址。）

尽管我们可以使用任何我们喜欢的"调用约定"，但在传递参数和返回结果方面，您应该尝试坚持最终成为调用函数的约定：

- 将前六个参数传递到寄存器 rdi、rsi、rdx、rcx、r8 和 r9 中。请注意，这与系统调用约定（rcx 而不是 r10）略有不同。
- 以 rax 格式返回结果

作为示例，让我们编写一个函数来打印字符串（以地址和长度形式给出）并在末尾添加换行符。这将结束对我们一直在使用的 write 系统调用的调用。


```x86asm
section .data

newline:    db      10

section .text

write_ln:

    ; rdi = address
    ; rsi = length

    mov rax, 1
    mov rdx, rsi
    mov rsi, rdi
    mov rdi, 1
    syscall

    mov rax, 1
    mov rdi, 1
    mov rsi, newline
    mov rdx, 1
    syscall

    ret
```



```x86asm
section .data

msg:    db      "Hello, world!"
MSGLEN: equ     $-msg

section .text

    mov rdi, msg
    mov rsi, MSGLEN
    call write_ln

    ; Normal exit syscall...
```

```shell
sys_write:

    ; rdi = address
    ; rsi = length

    mov rax, 1 
    mov rdx, rsi
    mov rsi, rdi
    mov rdi, 1
    syscall

    ret
```


### 函数指针

传递给 call 的地址可以是寄存器，而不仅仅是标签：

```x86asm
mov r11, my_function
call r11
```

这相当于通过函数指针调用函数。



## 附录

原文中存在错误，原文中的write_ln是这样的，rdi表示的是字符串的地址，但是这里已经被立即数1进行了覆盖。并且rsi存放的内容也被rdi覆盖。

```x86asm
    mov rax, 1 
    mov rdi, 1
    mov rsi, rdi
    mov rdx, rsi
```

因此需要调整顺序：

```x86asm
    mov rax, 1
    mov rdx, rsi
    mov rsi, rdi
    mov rdi, 1
```



## 附录 

原文链接： https://staffwww.fullcoll.edu/aclifton/cs241/lecture-arithmetic-functions.html