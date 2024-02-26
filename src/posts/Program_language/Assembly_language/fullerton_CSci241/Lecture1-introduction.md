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

| 行 | 解释 |
|-- |--|
|section .data|```data```节，包含初始化的常量和变量|
|msg: db "Hello, world!", 10|```msg```定义了一个指向"Hello,world!"字符串的标签，它将被逐字复制到我们的汇编程序中。```db```代表"define byte"，即定义字节，最后的```10```，在ascii表中代表LF(\n)。注意用汇编的 db 伪指令定义字符串，不会自动添加"\0"，这个要和C/C++相区别| 
|MSGLEN: equ $-msg|```equ```定义了一个常量叫做MSGLEN， 这个常量代表的是msg的长度， ```$```代表当前的位置|
|section .text|```text```节定义了程序的实际执行的代码|
|global _start|我们将_start标签声明为全局，以便在程序之外可见（以便操作系统可以找到它可以启动我们的程序）|
|_start|这将 _start 声明为指向程序中当前位置的标签|
|mov rax, 1|这会将值 1 加载到寄存器 rax 中，该寄存器存储系统调用代码。 1 是"写入文件"的系统调用代码|
|mov rdi, 1|将 1 存储到寄存器 rdi 中。这是系统调用 write 的第一个参数，它是文件描述符（1 是标准输出）|
|mov rsi, msg|将 msg、地址存储到 rsi 中, 这是第二个参数，表示要写的消息|
|mov rdx, MSGLEN|将 MSGLEN 存储到 rdx 中。这是第三个参数，即要写入的长度（以字节为单位）|
|syscall|调用rax中存储的值所代表的系统调用，打印字符|
|mov rax, 60|60 是"退出进程"的系统调用代码|
|mov rdi, 0|第一个参数，0，退出代码(成功)|
|syscall|执行系统调用|

注意: 对于汇编语言而言，默认的后缀是```.s```。

对于Intel 语法而言， mov指令的结构如下所示：

```shell
mov dest, src
```

即mov后先跟着目的对象，再接着是源对象。将其理解为```dest = src```是可以的。

## 程序的节(sections)

内存中正在运行的程序，其内存空间分为许多不同的"部分"。尽管所有部分都是同一地址空间的一部分，但它们在概念上用于不同的用途，并且操作系统可能对其应用不同的权限。例如，操作系统通常将```.text```部分（可执行机器代码所在的位置）设置为只读，因为自修改代码（通常）要么是错误，要么是漏洞利用。

一个进程的内存布局通常如下所示：

```shell

--------------------
Stack (grows down)
…
Heap (grows up)
---------------------
.data section (global variables)
---------------------
.text section
---------------------
```

栈向下增长这一点很重要， 这代表压栈操作会使得栈顶指针减少。

除了用于存放全局变量的```.data```节之外，还有一块是```.bss```节，其用于存放未经过初始化的全局数据。```.data```和```.bss```的区别在于当程序运行时，操作系统会将```.data```中的数据从磁盘中拷贝到内存中。而```.bss```节中由于存放的是未经过初始化的数据，因此操作系统不需要复制任何内容，只需要预留好对应的空间即可。

通过定义更多常量，可以使上面的程序更容易阅读，例如：

```x86asm
section .data

SYS_write       equ     1
SYS_stdout      equ     1
SYS_exit        equ     60
EXIT_SUCCESS    equ     0
```

```equ```定义了一个汇编时的常量，当程序运行的时候，这些常量不会在内存中占据任何的空间。 这有点类似与```C/C++```语言中的```equ```。

使用它们时，我们只需通过名称来引用它们：

```x86asm
mov     rax,  SYS_exit 
mov     rdi,  EXIT_SUCCESS
syscall
```

db将字节序列直接存储到可执行文件中， 例如下面的代码：

```x86asm
msg  db  "Hello, world!", 10
```

其实际上做了两件事情：
- "Hello，world！"连同后面的10一同被写入了可执行文件中。
- ```msg```定义了一个标签，该标签指向了字节序的开始的地址。注意我们并不是将字符串的存入了msg中，而是将字符串的地址存入了msg中。

因为我们使用系统调用风格，所以我们的字符串不以终止 NUL (0) 字符结尾。(上面的字符串以 10 结尾，即换行的 ASCII 字符；这就是在 C/C++ 中使用 \n 字符转义时得到的结果。) 我们必须知道要传递给 SYS_write 系统调用的字符串的长度。我们可以简单地手动计算字节数，但如果我们更改字符串，这就会中断。

如前所述，汇编器将字符串 msg 放入生成的可执行文件中的某个地址。事实上，我们的汇编源文件中的所有内容都有一些地址，它将最终出现在生成的可执行文件中。即使像 ```MSGLEN``` 这样理论上占用 0 空间的东西也有输出文件中“当前位置”的一些概念。```$``` 获取当前位置的地址。```$-msg``` 从当前地址减去地址msg，得到msg 指向的字符串的长度。请注意，这只有效，因为我们在定义 msg 之后立即定义了 MSGLEN；如果中间有任何其他定义占用了文件中的空间，则计算出的长度将是错误的。

（这也表明 equ 定义可以在其值中使用有限的算术；计算是在汇编时完成的，而不是在运行时完成的。）

在我们所有的程序中，我们首先是 .data 部分，然后是 .text 部分，但这只是一个约定。您可以更改各部分的顺序，甚至可以将它们交错排列，您的程序仍然可以运行。

## 调用操作系统的系统调用

调用系统调用的过程如下：
- 将rax设置为要执行的系统调用的编号。例如SYS_exit的系统调用编号为60， 而SYS_write的系统调用编号为1。你可以在[这里](http://blog.rchapman.org/posts/Linux_System_Call_Table_for_x86_64/)找到所有系统调用的编号。
- 将rdi，rsi，rdx，r10,r8,r9 设置为系统调用函数的第一个、第二个、第三个参数。往后以此类推。
- 执行系统调用```syscall``指令。

请注意，步骤 (1) 和 (2) 可以按任何顺序发生，但在执行系统调用之前必须正确设置所有寄存器值。如果系统调用返回一个值（SYS_write 和 SYS_exit 都没有），则系统调用返回后该值将位于 rax 中。

## 列出文件(Listing files)

yasm 的 -l noop.lst 参数是可选的；它指示 YASM 生成一个列表文件，这是我们逐行编写的汇编指令及其十六进制操作码的列表。以下是上述程序的列表文件：

```x86asm
     1                                 %line 1+1 hello_bare.s
     2                                 
     3                                 
     4                                 
     5                                 
     6                                 
     7                                 [section .data]
     8                                 
     9 00000000 48656C6C6F2C20776F-    msg db "Hello, world!", 10
    10 00000000 726C64210A         
    11                                 MSGLEN equ $-msg
    12                                 
    13                                 [section .text]
    14                                 
    15                                 
    16                                 
    17                                 [global _start]
    18                                 _start:
    19                                 
    20 00000000 48C7C001000000          mov rax, 1
    21 00000007 48C7C701000000          mov rdi, 1
    22 0000000E 48C7C6[00000000]        mov rsi, msg
    23 00000015 48BA0E000000000000-     mov rdx, MSGLEN
    24 00000015 00                 
    25 0000001F 0F05                    syscall
    26                                 
    27                                 
    28 00000021 48C7C03C000000          mov rax, 60
    29 00000028 48C7C700000000          mov rdi, 0
    30 0000002F 0F05                    syscall
```

第一列是原始行号，第二列是汇编程序中相对于当前节的地址（从 00000000 开始），第三列是操作码，第四列是我们的原始程序。

## 汇编和链接

```asm``` 脚本负责在所有输入文件上运行汇编程序，然后将它们链接在一起。 它还能正确检测您是否将 _start 或 main 定义为程序的入口点，并在后一种情况下与 C 标准库链接。

如果你想进行手动汇编，则需要执行的命令如下所示：

```x86asm
yasm -g dwarf2 -f elf64 filename.s -l filename.lst
```

- -g 参数给出了调试信息使用的格式，以便 GDB（参见下一节）可以读取它。
- -f 参数表示输出 x86-64 格式的目标文件。 
- -l参数表示输出列表文件。

要将一个（或多个）汇编的目标文件链接到一起成为可执行文件，有两种选择：

- 如果您没有使用任何 C 标准库函数，并且程序的入口点名为 _start，则使用 ld：

  ```shell
  ld -g -o exe_name object.o files.o ...
  ```
- 如果您使用的是 C 标准库中的函数，并且入口点名为 main，则使用 gcc：

  ```shell
   gcc -o exe_name object.o files.o ...
  ```

这与用于链接 C 程序的目标文件的命令行相同。 （事实上​​，它可以用来链接由 C 和汇编语言混合组成的程序！）

（asm 脚本检查是否有任何文件定义了 main；如果定义了 main，则假定您要使用 C 标准库函数。）

## 调试汇编程序

GDB 理解汇编；我们可以通过以下方式在 GDB 中运行我们的程序

```shell
gdb ./hello
```

我们可以通过以下方式在程序的_start处中断：

```shell
break _start
run
```

然后使用 n(ext) 命令逐行执行程序。寄存器的值可以按名称打印，前缀为 $，例如

```shell
print $rax
```

或更改它们：

```shell
set $rax = 0
```

您还可以使用```info registers```一次打印所有寄存器。

请注意，当我使用 GDB 时，我使用一个名为```GDB dashboard```的插件，它显示每一步的寄存器内容。

GDB 将默认使用 ```AT&T``` 语法进行汇编。您可以通过输入命令将其切换为 ```Intel语法```。

```shell
set disassembly-flavor intel
```

您可以将此命令放入 ```~/.gdbinit``` 中（在 GDB dashboard脚本开始之前，如果您正在使用该脚本），以使其适用于所有 GDB 会话


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

这里没有太多有用的东西。因为它依赖了很多标准库提供的很多方法的实现(目前我们还没有对它们进行连接)。目前对于调用```printf```的地方，只是用了占位符进行替代。

```shell
gcc -o hello hello.o
```

然后使用```objdump -d -M intel hello```，我们将会得到更多的汇编内容。标准库在运行 ```main()``` 之前做了很多设置，并且可执行文件包含所有这些代码。另一方面，它确实让我们看到了最终的 main 是什么样子的：

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

在这里，空调用已经被替换为过程调用的puts的实现。请注意，main 是一个过程；它是从（标准库提供的）_start 调用的，并且必须在完成后返回到它，因此它以 ret 指令结束。正如我们将看到的，前两条指令也是每个过程开始的标准“序言”的一部分。您可以查看反汇编的其余部分并找到库提供的 _start 过程以及 put 的定义。