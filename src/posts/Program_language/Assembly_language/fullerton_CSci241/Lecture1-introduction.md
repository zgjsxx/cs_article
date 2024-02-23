---
category: 
- 汇编语言
---

# 第一讲：计算机的组织架构和汇编语言


https://staffwww.fullcoll.edu/aclifton/cs241/lecture-introduction.html

## 汇编语言

汇编语言和C/C++语言的区别是什么？

- 汇编语言是底层语言，更接近于CPU本身可以理解的内容。CPU可以理解的是纯粹的字节流(机器语言)。几乎不会有人愿意通过写原始的字节流进行编程。汇编语言处于机器语言的上层， 将CPU可以理解的操作码(Opcode)抽象成了人类可以理解的命令， 例如**add**,**mov**等等。这些名字被称之为**助记符**。

- 和C/C++语言相比，汇编语言的工具较少。没有所谓的"标准汇编语言库"。如果你想要写一个字符串处理的方法，你只能自己编写。

- 汇编语言不能移植到其他类型的CPU上(x86 vs ARM)或者其他类型的操作系统上(Windows vs Linux)， 甚至不能移植到其它类型的汇编语言(YASM vs MASM vs GAS)。

一般来说， 我们编译一个C/C++ 程序的流程如下所示：

```shell
                    compile                 link
C/C++ source code    -->      object code    -->    executable 
```

其中object code是指指令流， 这些指令将会被CPU直接运行。C/C++中的一条语句可能会编译成许多指令。即使是像下面这样简单的语句：

```cpp
x = y;
```

上面的语句可能需要在CPU级别执行大量的工作， 这取决于x和y在内存中的位置，它们是否有相同的类型等等。

因此，我们使用高级语言(C/C++)编写的"指令"的数量和CPU实际执行的指令的数量上存在很大的差异。

但是汇编语言所编写的指令和cpu实际执行的指令是一一对应的。汇编语言程序中的每一行代码都保证翻译成单个 CPU 指令。一方面，这意味着汇编语言可以让我们很好的掌握CPU正在执行的工作， 另一方面，我们在C/C++语言中很方便实现的特性实际上在CPU层面都不存在。实际上，在CPU层面上并没有所谓的for循环，if-else条件分支，变量声明等等。我们必须通过组合一些原始的操作来实现这些高级语言的特性。

由于汇编指令和CPU指令是一一对应的，因此每种类型的CPU都有自己对应的汇编语言。Intel CPU的汇编语言和ARM CPU(大多数智能手机使用ARM CPU)的汇编语言是完全不同的。并且与Arduino上使用的AVR CPU完全不同。与C/C++不同的是，汇编语言是无法做到移植性的。

即便我们使用同一种类型的CPU，也不能保证汇编器与操作系统之间的可移植性。与C/C++不同的是， C/C++由国际委员会决定C/C++的标准，然而汇编语言却不是这样。因此，按照YASM(汇编器)写出来的汇编代码可能无法在GAS/NASM或者微软的汇编器上运行。操作系统层面也会导致这样的不兼容性，因为没有"标准汇编库"。在一种操作系统下写出的汇编程序可能无法移植到其他操作系统下。Windows下使用汇编语言写出的程序移植到Linux下可能不能运行，不仅仅是因为汇编器不同，操作系统系统的接口不同也是一个重要原因。(Windows和Linux对于系统调用的定义不同)。

本课程使用的是YASM 汇编器， 基于64位的Intel CPU(X86-64)，在Linux系统下运行。

我们会使用GDB调试器去调试你的汇编程序。在C++中，你最初用于调试程序的工具可能是在出错的位置附近添加cout，但是将打印添加到汇编程序中就可能需要重写你需要打印的函数，甚至重新所有的程序。显示通过打印的方式调试程序在汇编语言的debug中是不可行的。所以我们在课程中也会熟悉GDB工具。

## 计算机组织架构

计算机组织架构是指计算机的内部结构。内存、CPU、I/O设备等如何连接在一起，如果配合起来工作。虽然我们主要关注我们实际使用的计算机的组织架构， 但是有时我们也会去和其他的计算机系统进行比较(MIPS， ARM等等)。当然，记住这些不同的系统的区别也很重要。

## 数字电路

CPU通过数字电路来实现，数字电路由逻辑门电路组成。这是比汇编语言更加底层的内容。我们会稍微了解一下数字电路，仅仅是为了感受CPU是如何进行工作的，但是课程的侧重点还是在汇编语言上。

## 术语回顾

**字节**(Byte)：可以单独寻址的计算机内存的最小单位。对于我们来说，一个Byte等于8个bit。但是需要了解的是并不是所有的系统都是这样的。有一些奇怪的系统，一个byte是10个bit或者7个bit。

每个byte中的每个bit的位置从右到左编号为0到7：

```shell
Bit value	0	0	1	0	1	1	0	1
Bit pos.	7	6	5	4	3	2	1	0
```

**字**(word)： 两个字节(16 bits)。
将一个字视作2个字节时，我们将第一个字节(占据低8位的字节)称之为"低字节"， 将第二个字节称之为"高字节"。

![word](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/word.png)

类似的，如果我们对一个字节中的bit的位置进行编号，则低字节的bit将编号为0-7，而高字节中的bit将编号为8-15。

这个规则可以推广到双字(dword)的低位字和高位字、四字(qword)的低位和高位双字等等。类似的，在一个字节中，比特0代表低位， 比特7代表高位。

**双字**(double-words/dword): 4个bytes(32个bits)

**四字**(Quad-word/qword): 8个bytes(64个bits)。(这个quad可以用quadra kill四杀来辅助记忆)

依次类推还有，双四字(double-quad-words)，16bytes， 四四字("quad-quad-words")， 32 bytes， 等等。但是这些很少见，不常用。

**KB**：kilo-bytes(千字节)， 这里的"kilo"指的是二进制的千， ${2}^{10} = 1024$字节。K后面跟着的大写的B代表我们的单位是字节，如果是小写的b则代表是比特。

**Kb**：kilo-bit(千比特)。这个使用的不太多。但是基于bit的度量在通讯中使用很多。例如带宽通常以兆比特为单位进行测量。

**MB**：Mega-byte(兆字节)， ${2}^{20} = {1024}^{2} = 1048576$字节。这个数量级大约是100万字节。

**GB**： Gigabytes(千兆字节)， ${2}^{30} = {1024}^{3} = 1073741824$字节。这个数量级大约是10亿字节。

以此类推还有TB、PB等等。

二进制的百万(million 1048576)和十进制的百万(1000000)的区别就解释了磁盘标签上的容量的和系统中实际显示的容量的区别。操作系统使用二进制的度量方式，而标签上印刷的是十进制的度量方式。所以区别磁盘标签上的500GB在你的操作系统中显示的容量将会是下面的数值：
```shell
     500,000,000,000
    ——————————————— = 465 GB
     1,073,741,824
```

## 数制

**十进制**(Decimal)：十进制以10为基数，这是我们经常使用的。数字范围是0-9。

**二进制**(Binary)： 二进制的数字范围是0-1。

**八进制**（Octal）：八进制的数字范围是0-7。(通常八进制的使用相对较少)

**十六进制**(Hexadecimal)：十六进制的数字范围是0-9，a(10), b(11), c(12), d(13), e(14), f(15)。

接下来我们将回顾二进制和十六进制算术。

注意，这些数制，没有那种一定比其他的类型更好或更正确。

```shell
   21   ==   10101b   ==   0x15   ==   025
decimal      binary        hex.       octal
```

在计算机系统的内部，计算机使用二进制存储内容。但是这个通常对于上层语言(包括汇编语言)而言，并不感知。 我们可以很容易的加减二进制的数字或者其他进制的数字。所以大多数时候，计算机底层使用二进制并不会太影响我们编程。

C/C++ 和汇编都允许我们在上述任何数字系统的源代码中编写数字，只需使用不同的格式：

|符号| 数制|
|--|--|
|21|十进制|
|10101b|二进制，以b结尾|
|0x15|十六进制,以0x开头|
|025|八进制，以0开头|

注意，b、0x等不是数字本身的一部分，它们仅仅用来区分不同的进制。编译器/汇编器负责将对应的数字转换为计算机使用的内部格式。

例如，在下面的例子中，你可以这样做:

```cpp
int x = 21;

if(x == 0x15) { 
    ⋮
}
```

上面的if语句中的语句总是为true。

类似地，当我们打印一个数字（通过 cout 或 printf）时，它通常打印为十进制，但通过各种标志我们可以要求十六进制。运行时库负责将内部表示形式转换回十进制/十六进制。在本学期晚些时候，我们将有一个手动打印数字的作业（因为汇编语言没有标准库来为我们做这件事！）

## 数字电路

CPU 由一组复杂的数字电路实现。数字电路是由逻辑门构建的（逻辑门又是使用晶体管构建的）。在数字电路设计中，在数字电路设计中，我们展示逻辑信号（开/关值）如何从输入流经逻辑门到输出。如果有电流流过逻辑信号，则逻辑信号为高（开）；如果没有电流（或电流非常小），则逻辑信号为低（关）。

逻辑门的基本类型有：

- 非门(NOT)：单输入、单输出门，反转其输入。如果输入为高电平，则输出为低电平，反之亦然。
  ![NOT-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NOT-gate.png)

  非(NOT) 在 C/C++ 中运算符是```~```。这个符号是按位非，与逻辑非(```!```)不同。

- 与门(AND)：双输入、单输出门：当且仅当两个输入均为高电平时，输出为高电平，否则为低电平。
  
  ![AND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/AND-gate.png)

  AND 的 C/C++ 运算符是 &（这是按位与，与 && 逻辑与 不同）。

- 或门(OR)：双输入、单输出门：如果其中一个或两个输入都为高电平，则输出为高电平，否则（如果两个输入均为低电平）输出为低电平。

  ![OR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/OR-gate.png)

  C/C++ 中与运算符是 | （这又是按位或，不同于逻辑或 ||）

- 异或门(XOR)：双输入，单输出门。如果其中一个输入为高电平但不是两个输入都是高电平，则输出为高电平。否则，当两个输入都为高电平或者两个输入都是低电平，则输出为低电平。实际上，如果输入不同(一高一低)，则输出为高，如果输入相同，则输出为低。

  ![XOR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/XOR-gate.png)

  C/C++中代表异或的运算符是```^```（这个是按位异或， 没有逻辑上的异或)。 注意```^```不是求幂运算符，C/C++中没有求幂的运算符。

- 与非门(NAND)：输出端带有非门的与门。也就是说，如果两个输入都为高电平，则输出为低电平，否则为高电平。

  ![NAND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NAND-gate.png)

  C/C++没有直接的与非运算符。可以使用```&```和```~```组合起来起到相同的效果。

- 或非(NOR)：在或门的输出端带有一个非门。如果两个输入均为低电平，则输出为高电平，否则为低电平。

  ![NOR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NOR-gate.png)

  C/C++没有直接的或非运算符。可以使用```|```和```~```组合起来起到相同的效果。

- 同或(XNOR)：输出端带有非门的异或门。如果两个输入相同（均为低电平或均为高电平），则输出为高电平，否则为低电平。
  
  ![XNOR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/XNOR-gate.png)

  C/C++没有直接的同或运算符。可以使用```^```和```~```组合起来起到相同的效果。

你可能会熟悉前三种逻辑门。有几点需要注意：

- 与门(AND)和或门(OR)可以扩展为超过2个输入端，n输入的与门，当它的所有的n个输入端都是高电平时，则该与门输出高电平，否则为低电平。同样，一个n输入端的或门，只要有一个输入端是高电平，则该或门将输出高电平。如果所有的输入都是低电平，则该或门输出低电平。

下图说明了如何构建 3 输入与门：

![3-input-AND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/3-input-AND-gate.png)

问题：如果异或门以相同的配置排列，所得的 3 输入、1 输出电路会起什么作用？

- 与非门和或非门具有通用性：所有其他门都可以仅由 NAND 或 NOR 构建。事实上，为了简化制造，仅使用 NAND 门构建电路是很常见的。

  例如，下面是一个相当于仅使用 NAND 门实现的 A OR B 的电路（您应该验证该电路是否为输入 A 和 B 的所有四种组合生成正确的输出）

  ![NAND-OR-gate.png](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NAND-OR-gate.png)

  您可以在[维基百科](https://en.wikipedia.org/wiki/Logic_gate#Universal_logic_gates)上找到有关如何将所有其他类型的逻辑门转换为 NAND 和 NOR 门的完整参考。作业 1 将要求您将使用 NOT、AND 和 OR 的电路转换为仅使用 NAND 门的电路。

电路真值表：

任何（无状态）m 输入、n 输出电路的行为也可以使用表格来说明，该表格显示每个输入组合如何映射到特定的输出集。因为每个输入可以是低 (0) 或高 (1)，所以该表将有 2m 行和 m + n 列。例如，上面显示的 3 输入 AND：

![3-input-AND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/3-input-AND-gate.png)


<table>
    <tr>
        <th colspan="3">Input</th><th>Output</th>
    </tr>
    <tr>
        <th>A</th><th>B</th><th>C</th><th>Q</th>
    </tr>
    <tr>
        <td>0</td><td>0</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>0</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>0</td><td>1</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>1</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>0</td><td>0</td><td>1</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>0</td><td>1</td><td>0</td>
    </tr>
    <tr>
        <td>0</td><td>1</td><td>1</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>1</td><td>1</td><td>1</td>
    </tr>
</table>

从表格中可以知道，仅当所有三个输入均为高电平 (1) 时，输出才为高电平 (1)。

## 硬件电路

如果您尝试在实际电子硬件中实现逻辑电路，您会遇到上面未提及的几个问题。

为了解决这个不可预测的时期，大多数数字电路都是同步的：他们使用时钟来控制何时执行计算。时钟是一个 0 输入、1 输出的逻辑器件，它输出一个信号，该信号以规则的时钟速率交替出现低、高、低、高……
通常，当时钟信号从低电平变为高电平（时钟信号的“上升沿”）时，电路的其余部分将执行其计算，但直到下一个时钟周期的上升沿才会读取计算的输出。

## 逻辑电路的问题

您可以尝试构建以下一些电路，以测试您对逻辑电路的理解：

这些问题有许多不同的可能解决方案。数字电路的进阶课程将教授优化电路设计的方法，以便最大限度地减少所使用的门的数量。

## 汇编语言的开始

这里我们将使用汇编语言去编写一个经典的程序： Hello World程序。我们可以使用两种广泛的风格来编写汇编(.asm 程序)。

- 我们可以通过调用操作系统的系统调用来与操作系统交互。由于缺少更好的名称，我们称之为**系统调用风格**(syscall-style)。这是最直接的方法，但是操作起来不太方便。如果我们使用这种方式，那么我们的汇编程序的入口程序就是_start，我们首先使用系统调用向标准输出打印一个字符串，使用另外一个系统调用退出。
  如果我们使用系统调用风格，我们的程序将是完全独立的：除了我们编写的内容之外，生成的可执行文件中不会有任何内容。

- 我们可以使用标准c库中的方法例如printf和exit。这称之为"C库风格"。这就需要我们自己去链接c语言库。这个方法显然要强大得多，因为它将c标准库中的所有资源都给了我们的程序。

  如果我们使用C库的风格，那么最终生成的可执行文件将不仅包括我们编写的代码，还包括标准库添加的很多的代码。


下面我们先使用第一种风格(系统调用风格)，这个方式上手更快一些。

```x86asm
;;; 
;;; hello.s
;;; Prints "Hello, world!"
;;;

section .data

msg:            db      "Hello, world!", 10
MSGLEN:         equ     $-msg

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

可以使用下面的命令进行汇编和链接：

```shell
asm hello.s
```

也可以手动进行：

```shell
yasm -g dwarf2 -f elf64 hello.s -l hello.lst
ld -g -o hello hello.o
```

然后执行像下面这样执行：

```shell
./hello
```

将打印出下面这样的内容:

```shell
Hello, world!
```

打印后会退出。

一步一步分解该程序，每行均包含以下形式：
```x86asm
label:       instruction       ; comment
```

所有这些内容都是可选的，因此只有几行是以label开头， 并且很多行没有注释。 Label后面的冒号(:)也是可选的，但是为了程序的清晰，最好写上。


## 反汇编现有的程序

您可以使用 objdump 反汇编已编译的可执行文件。

```cpp
#include <stdio.h>

int main() {
    printf("Hello, world!\n");
    return 0;
}
```

```shell
gcc -c hello.c
```

```shell
objdump -d -M intel hello.o
```

```shell

hello.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <main>:
   0:   55                      push   rbp
   1:   48 89 e5                mov    rbp,rsp
   4:   bf 00 00 00 00          mov    edi,0x0
   9:   e8 00 00 00 00          call   e <main+0xe>
   e:   b8 00 00 00 00          mov    eax,0x0
  13:   5d                      pop    rbp
  14:   c3                      ret  
```


```shell
gcc -o hello hello.o
```

```shell
0000000000400507 <main>:
  400507:   55                      push   rbp
  400508:   48 89 e5                mov    rbp,rsp
  40050b:   bf a4 05 40 00          mov    edi,0x4005a4
  400510:   e8 eb fe ff ff          call   400400 <puts@plt>
  400515:   b8 00 00 00 00          mov    eax,0x0
  40051a:   5d                      pop    rbp
  40051b:   c3                      ret    
  40051c:   0f 1f 40 00             nop    DWORD PTR [rax+0x0]
```