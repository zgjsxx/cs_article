---
category: 
- 汇编语言
---


# 第五讲：分支、条件、循环、函数

## 算术运算

```x86asm
add dest, src       ; dest += src
sub dest, src       ; dest -= src
```

```add```和```sub```在两个相同大小的操作数之间执行加法和减法。在内部，```sub``` 也是使用加法实现，只是将第二个操作数执行取反再加1的操作。

## 标记

```add```和```sub``` 会设置/取消设置 OF、SF、ZF、AF、CF 和 PF 标志：

- 对于有符号运算，OF 标志指示发生了上溢/下溢。如果结果的符号位不正确，则设置该位，因为正确的结果对于目标来说太大/太小而无法保存。例如，有符号 127+127 将产生溢出。 （无符号 127+127 = 254 仍然可以容纳在无符号字节中，因此不会设置进位标志。）
  结果的正确符号很容易确定：如果两个输入均为正，则结果应为正；如果两者均为负数，则结果应为负数。如果一个为正，另一个为负，那么结果的正确符号就更难确定，但在这种情况下事实证明这并不重要。正值和负值相加不可能溢出。减法的处理方式类似，只是第二个操作数的符号被翻转（即，a - b 被视为 a + (-b)）。
  如果输入无符号，则 OF 标志仍会设置/取消设置，但其值毫无意义。
- 对于无符号运算，CF 标志表示末尾"剩余"了额外的进位/借位。这表明操作结果太大/太小而无法容纳目的地。例如，255+127 对于一个字节来说太大，并且会设置进位标志。它不会设置溢出标志，因为 255 无符号 = -1 有符号，而 127-1 = 126 适合有符号字节。
  请注意，在无符号减法 a - b 之后，如果设置了进位标志(CF)，则表示 b > a。
- 如果结果为 0（全零位），则设置 ZF 标志。
- SF 标志设置为符号位的副本（对于有符号运算，如果结果为负则设置）。对于无符号运算，它只是结果高位的副本。
- 如果结果的低字节中设置的(=1)位的数量是奇数，则PF标志被设置。奇偶校验标志是历史产物，使用不多，部分原因是它不给出整个结果的奇偶校验，只给出它的最低字节。
- 我们将忽略 AF 标志，因为它仅在 BCD 算术上下文中有意义。

请注意，所有标志都会在所有操作中设置/清除，但某些标志仅对有符号/无符号操作有意义。加/减指令不知道您是否正在执行有符号或无符号的操作，因此您需要确保检查正在执行的操作类型的正确标志。

```shell
 111  11
   10110011   = 179 (unsigned)   = -77 (signed)
 + 01100110   = 102 (unsigned)   = 102 (signed)
────────────
1  00011001   =  25 (unsigned)   = 25  (signed)
```

- 解释为有符号值时，一个输入为负，另一个输入为正，因此结果的符号保证是正确的。```OF= 0```。
- 解释为无符号，加法产生一个额外的进位，```CF = 1```。
- 结果不为 0，因此 ZF = 0。
- 结果中低字节为1的位数为奇数，因此 PF = 1
- 高位未置位（结果为正），因此 SF = 0。

## 递增和递减

```x86asm
inc dest    ; 类似于C/C++中的++dest
dec dest    ; 类似于C/C++中的--dest
```

```inc``` 和 ```dec``` 递增/递减其单个操作数，该操作数可以是寄存器或内存位置。 ```inc``` 和 ```dec``` 不会像 ```add r, 1``` 或 ```sub r, 1``` 指令那样修改进位标志。标志 OF、SF、ZF、AF 和 PF 按预期设置/清除。当用于有符号值时，行为仍然是正确的（增加负值使其更接近 0，减少负值使其更负）。

## 大于 64 位的加法/减法

我们拥有的最大寄存器是 64 位 (qword)。如果我们想对 128 位操作数（表示为 ```rdx:rax```）执行加法/减法怎么办？让我们考虑一下，如果我们本机可以执行的唯一加法是字节大小的，那么我们将如何执行字大小的加法：

```x86asm
     111111←   1111
   00101101 11001101
 + 00010010 10101011 
─────────────────────
   01000000 01111000  
```

添加低字节会产生一个额外的进位 (CF = 1)，然后我们用它来开始添加高字节。我们实际上需要两种加法：

- 低字节加法，不以进位开头（忽略CF）

- 高字节加法，使用CF开始加法。

这就是我们执行大于qword加法的方式，还有另一种加法操作，add-with-carry，```adc```它使用进位标志CF的状态作为第一位加法的输入。

```x86asm
adc dest, src       ; dest = dest + src + CF
```

对于减法，有 sbb，subtract-with-borrow。

因此，要将双 qword rdx:rax 添加到 rcx:rbx，我们会这样做

```x86asm
add rax, rbx 
adc rdx, rcx
```

减法的类似物是 sbb，即借位减法。

试了下[128bit加法](https://godbolt.org/z/xvreb39Kf)，对应的汇编中的确使用了```adc```指令进行128bit的加法。 

## 乘法和除法

乘法和除法比加法/减法更复杂。我们稍后将更详细地介绍它们，但现在：

- 两个 n 位值相乘的结果最多可达 2n 位。因此，当将两个 qword 值相乘时，我们需要在某个地方存储双四字结果。
- 除法有相反的问题，我们可能想要将双 qword 值除以 qword 除数。
- 有符号乘法与无符号乘法不同，除法也类似。每个都使用不同的指令。
- 如您所料，乘法指令以双操作数形式 (dest *= src) 存在，但也以单操作数形式存在，其中 rax 寄存器隐式用作操作的目标，甚至是三操作数形式，相当于dest = src * 立即数。除法指令仅采用单个操作数，并且始终将其结果存储到 rax 和 rdx 的组合中。

为了存储双 qword（128 位）结果，我们使用 rax 和 rdx 的组合：rax 存储低 qword，而 rdx 存储高 qword。我们将此组合写为 rdx:rax。 （使用类似的符号，我们可以说 ax = ah:al。）较小的乘法不需要此扩展。

无符号/有符号乘法指令分别为 ```mul``` 和 ```imul```

|指令|描述|
|--|--|
|```mul rm```|rdx:rax *= rm, unsigned|
|imul rm	|rdx:rax *= rm, signed|
|imul r, rm |	r *= rm, signed|
|imul r, rm, imm	|  r = rm * imm, signed|

如果结果的符号不正确，则 CF 和 OF 标志会一起设置/清除。如果乘法结果不适合目标，则结果将被截断（丢弃高位）。其他标志中的值未定义。

除法只有一个操作数形式，其中操作数包含除数；目的地（也是股息）位于 rdx:rax 中。 div/idiv 的结果既是 rax 中的向下舍入结果，也是 rdx 中的余数（即模或 %）。与 C++ 不同，在 C++ 中，我们用 / 表示整数除法，用 % 表示整数模，而在汇编中，一条指令就给出了两个结果。

|指令|描述|
|--|--|
|div rm|rax = rdx:rax / rm and rdx = rdx:rax % rm, unsigned|
|idiv rm|rax = rdx:rax / rm and rdx = rdx:rax % rm, signed|

除法溢出不是通过设置进位标志来指示的，而是通过除法错误异常 #DE 来指示的，该异常作为信号 SIGFPE 发送到我们的进程

目前，这会立即使我们的程序崩溃，但稍后我们将看到如何编写信号处理程序以更优雅的方式处理它。 （当然，我们也可以通过在执行除法之前检查操作数来避免溢出。）

## 函数 分支 和 条件指令

- 分支（也称为跳转、goto 语句等）跳转到程序中的新位置
- 比较比较两个操作数，然后适当地设置标志寄存器。只有一条比较指令，它执行所有可能的比较（等于、小于、等于零等）
- 条件分支通常执行分支或继续执行下一条指令，具体取决于其中一个标志的状态（之前通过比较操作设置）。
- 条件移动是否执行移动取决于标志之一的状态。

函数调用和返回只是操作堆栈的分支的特殊形式。

## 汇编语言程序的结构

我们说过，汇编语言与 C/C++ 等语言的区别在于，汇编语言中的每一条“语句”（指令）都对应于一个 CPU 操作。相比之下，在C/C++中，单个语句在编译期间可能会生成许多操作。这意味着汇编不能像 C/C++ 那样有“条件语句”或“循环语句”；在 C/C++ 中，这些是复合语句，即其中包含其他语句的语句。这必然意味着 if-else 或 while 循环会生成多个 CPU 操作。因此，在汇编语言中，循环和条件的工作方式非常不同。

归根结底，汇编语言程序只是一系列指令。不同函数之间，或者循环或 if-else 的"主体"与编写它的函数的其余部分之间没有真正的划分。该程序只是一大堆指令，因此我们有责任对其强加一些结构。通常的编程语言结构——函数、条件、循环——是我们必须自己构建的东西。

汇编语言程序中的每条指令都有一个地址，即程序最终运行时它在内存中的最终位置。添加标签告诉汇编器这个地址（标签后面的指令的地址）很重要，重要到需要保存并命名。因此，当我们写:

```x86asm
_start:
  ...
```

```_start``` 的"值"是紧随其后的第一条指令的地址。对于本地标签（名称以 . 开头的标签）也是如此。

汇编语言程序中的正常控制流程很简单：每条指令都按从第一个到最后一个的顺序执行。 CPU 始终知道程序中“下一条”指令：它是紧接在该指令之后的指令。

汇编语言支持的唯一一种其他控制流是跳转到某个地址（由 CPU 通过更改指令指针寄存器 rip 的值来实现），而不是按照从头到尾的顺序运行指令。我们所有现有的流程控制结构（if-else、switch-case、while、do-while）都必须转换为这种原始概念，即在程序中向前跳过某些指令，或在程序中向后跳过，以便程序中的某些地址多次送入 CPU 执行指令。

## 分支

分支通过跳转到新位置来工作。因为指令指针寄存器指向后面的寄存器，所以这不仅仅是改变rip的问题。它涉及将CPU重定向到新地址并将地址后的指令立即加载到rip中。幸运的是，这一切都是在幕后完成的。我们只提供跳转到的地址，通常以地址的形式。

### 标签

跳转的目标必须是标签。标签由标识符后跟冒号组成：

```x86asm
Target:
    ...
```

本地标签是名称以句号开头的标签。本地标签的全名是本地标签名称中最新添加的非本地标签。例如:

```x86asm
my_function:
  ...
  .begin_loop:    ; Full name: my_function.begin_loop
```

这允许我们拥有具有相同“名称”的多个标签，只要它们位于不同的函数/代码块中。

标签只是一个地址，即下一条指令的地址（或数据，如果在 .data 部分中使用）。

## 跳转

要跳转到一个标签，请使用 ```jmp``` 指令：

```x86asm
jmp target
```

请注意，标签的值只是它在程序中的地址。因此，可以在寄存器中存储标签、跳转到寄存器等。

```x86asm
mov rax, Target 
jmp rax
```

这有时称为**计算跳转**。例如，我们可以将一组标签存储在数组中（在 ```.data``` 部分），然后使用数组索引来确定要跳转到哪个标签。稍后将使用该技术来实现 ```switch-case``` 结构。


## 比较

有两个比较指令，其中 cmp 是第一个也是最直接的；它需要两个操作数，并且两个操作数的大小必须相同。第一个操作数不能是立即数，但第二个操作数可以是。其中一个操作数可以位于内存中，但不能同时位于内存中。

```x86asm
cmp op1, op2
```

比较指令在内部执行 op1 - op2 减法，丢弃结果，但相应地更新标志寄存器。例如，如果 op1 - op2 == 0，则零标志 ZF 将被设置；但如果 op1 - op2 == 0 则 op1 == op2，因此置零标志告诉我们原始操作数是相等的。类似地，如果 op1 > op2，减法会设置进位标志。




### 条件

可以使用标志的各种组合来确定 ```sub a, b``` 的两个操作数之间的关系：

- 如果 ```a == b``` 则结果将为 0，这将设置 ZF = 1。因此我们可以通过查看零标志来检测相等性。 （ZF == 1 的条件代码是 e 或 z。）
- 如果 ```a != b```, 那么结果将是非零的，因此 ZF == 0。（条件代码：```ne``` 或 ```nz```。）
- 如果 ```a > b```, 无符号， 那么结果是非零的, 并且不需要额外的进位/借位，因此 ZF == 0 且 CF == 0。
- 如果 ```a >= b```, 无符号，那么不需要额外的进位/借位（结果可能为零也可能不是），因此 CF == 0。（条件代码：ae, nc）
- 如果 ```a < b```，无符号，那么这只是 a >= b 的否定，因此 CF == 1（需要额外借位）。 （条件代码：b、c）
- 如果，a <= b，无符号，是 a > b 的否定，因此 ZF == 1 或 CF == 1。（条件代码：be）
- 如果 ```a > b```，有符号，那么事情就更有趣了：我们知道结果不会为 0，因此 ZF == 0，但结果的其余部分取决于溢出标志和符号标志：
  - 如果a和b具有相同的符号，则```OF == 0```（不可能溢出）。如果 a > b 且两者均为正，则结果将为正 (SF == 0)。如果两者均为负数，则结果也将为正数（例如，-2 > -10、-2 - -10 = +8）。所以在这种情况下我们有 SF == OF。
  - 如果 a 和 b 的符号不同，则可能发生溢出。如果 a > -b 那么我们正在做 a - -b = a + b：
  * 如果a + b没有溢出，则符号为正，所以SF == OF == 0
  * 如果 a + b 确实溢出，则符号为负，但 OF == 1，所以我们有 OF == SF == 1

  不管怎样，我们再次得到 SF == OF。
  因此，a > b 有符号的最终条件是 ZF == 0 且 SF == OF。 （条件代码：g）
- 如果 a >= b，有符号，那么我们只需忽略零标志：SF == OF。 （条件代码：ge）
- a < b 是 a >= b 的否定，因此 SF != OF。 （条件代码：l）
- a <= b 是 a > b 的否定，因此 ZF == 1 或 SF != OF。 （条件代码：le）

这些条件代码中的每一个都将在稍后的条件跳转指令中使用。对于有符号比较，我们通常使用术语“小于”和“大于”；对于无符号比较，我们说“低于”和“高于”。


### 内存与内存的比较

```cmp``` 指令无法比较内存中的两个操作数。 但是```cmps*``` 系列指令可以比较内存中的两个操作数，第一个操作数位于 ```[rsi]```，第二个操作数位于 ```[rdi]```。

```cmps*```的指令如下所示：

|指令|描述|
|--|--|
|```cmpsb```|比较 ```byte [rsi]```和 ```byte [rdi]```|
|```cmpsw```|比较 ```word [rsi]```和 ```word [rdi]```|
|```cmpsd```|比较 ```dword [rsi]```和 ```dword [rdi]```|
|```cmpsq```|比较 ```qword [rsi]```和 ```qword [rdi]```|

```cmps*``` 指令不带任何操作数；他们总是使用 ```rsi``` 和 ```rdi```。

## ```test```指令

```cmp``` 指令的指令是 ```test```。```cmp``` 执行减法并更新与 ```sub``` 相同的标志，而 ```test``` 执行二进制 AND 并仅更新 SF、ZF 和 PF 标志。CF 和 OF 标志被清除。这意味着测试不能用于确定依赖于这些标志的任何条件（排序比较，例如大于、小于、高于、低于）或相等。因为它使用 AND 而不是减法，所以```test```的用途更加有限：

- 如果寄存器等于0：

```x86asm
 test reg, reg
 jz target          ; or je target, jump if ZF == 1
```

如果一个数和自身相与，结果还是自身。因此结果等于0的唯一可能是 ```reg = 0```。 ```JE```和```JZ```仅在ZF == 1时跳跃。

- ```test reg, reg ```还可用于确定寄存器的符号：如果 SF == 1 则 reg 为负数。因此，我们可以做：

```x86asm
test reg, reg
js target
```

如果 reg < 0，则跳转到目标。（如果 reg 无符号，则在设置高位时将跳转。）

- 类似地，如果 reg <= 0，测试 reg、reg 和 jle 将跳转，尽管要弄清楚为什么这样做需要做一些工作：
  - 如果 ZF == 1 或 SF != OF，则 jle 跳转
  - 测试总是设置 OF = 0，所以这实际上是 ZF == 1 或 SF == 1
  - ZF == 1 是上面用于 reg == 0 的条件
  - SF == 1 是上面用于 reg < 0 的条件
  - 所以 ZF == 1 或 SF == 1 相当于 reg <= 0
  当然，只有当 reg 是有符号值时这才有意义

- test reg, 00000010b 可用于测试寄存器中是否设置了特定位（或位组合）。如果 AND 的结果为 0，则该位未被设置，且 ZF == 1；如果该位被设置，则 ZF == 0。所以我们可以这样做
  ```x86asm
  test reg, 00000010b
  jnz target              ; jump if bit 2 is set
  ```
  这可能是```test```的最主要的用途。

test 的操作数受到一些限制：

- 第二个操作数必须是寄存器或立即数，而不是内存位置。

- 第一个操作数可以是寄存器或内存

- 两者尺寸必须相同

测试指令不会修改两个操作数；仅更改标志寄存器

## 其他指令

请记住，许多其他指令都会设置标志寄存器。

## 条件分支的指令

条件分支指令检查标志寄存器并跳转到目标或不跳转到目标。这些通常称为 jcc，其中 cc 是条件代码：

|操作|描述|标志位的状态|
|```je```|当```op1 == op2```时跳转| ```ZF == 1```|
|```jne```|当```op1 != op2```时跳转| ```ZF == 0```|
|```jl```|当```op1 < op2```时跳转， 针对有符号的数据比较|```SF != OF```|
|```jle```|当```op1 <= op2```时跳转， 针对有符号的数据比较|```ZF ==1 or SF != OF```|
|```jg```|当```op1 > op2```时进行跳转， 针对有符号的数据比较|```ZF == 0 && SF ==OF```|
|```jge```|当```op1 >= op2```时进行跳转， 针对有符号的数据比较|```SF ==OF```|
|```jb```|当```op1 < op2```时进行跳转， 针对无符号的数据比较|```CF == 1```|
|```jbe```|当```op1 <= op2```时进行跳转， 针对无符号的数据比较|```CF == 1 or ZF == 1```|
|```ja```|当```op1 > op2```时进行跳转， 针对无符号的数据比较|```CF ==0 && ZF == 0```|
|```jae```|当```op1 >= op2```时进行跳转， 针对无符号的数据比较|```CF == 0```|

对于无符号数据的比较，"a"是"above"的缩写， "b"是"below"的缩写。 对于有符号的比较， "g"是"greater"的缩写， "l"是"less"的缩写。"e"是"equal"的缩写。

对于那些因 C/C++ 没有否定比较（!<, !>=）而烦恼的人，会很高兴知道汇编将 ```jnl```（不小于）作为 ```jge``` 的同义词。


下面是一些上述符号的同义词

|操作|描述|
|```jna```|当```op1 <= op2```时进行跳转， 针对无符号的数据比较|
|```jnae```|当```op1 < op2```时进行跳转， 针对无符号的数据比较|
|```jnb```|当```op1 >= op2```时进行跳转， 针对无符号的数据比较|
|```jnbe```|当```op1 > op2```时进行跳转， 针对无符号的数据比较|
|```jng```|当```op1 <= op2```时进行跳转， 针对有符号的数据比较|
|```jnge```|当```op1 < op2```时进行跳转， 针对有符号的数据比较|
|```jnl```|当```op1 >= op2```时进行跳转， 针对有符号的数据比较|
|```jnle```|当```op1 > op2```时进行跳转， 针对有符号的数据比较|

这些只是上述指令的别名（例如，```jna``` 是 ```jbe``` 的别名）。

有一组跳转通过检查 ```rcx``` 寄存器来模拟循环操作：

|操作|描述|
|--|--|
|jcxz|	Jump if cx == 0|
|jecxz|	Jump if ecx == 0|
|jrcxz|	Jump if rcx == 0|

请注意，如果 rcx 等于 0，则这些跳转，而如果 rcx 不等于 0，则循环跳转。

最后，有一组直接引用标志名称的半冗余条件

Operation	Description
jc	Jump if CF == 1
jnc	Jump if CF == 0
jz	Jump if ZF == 1
jnz	Jump if ZF == 0
jo	Jump if OF == 1
jno	Jump if OF == 0
js	Jump if SF == 1
jns	Jump if SF == 0
jz	Jump if ZF == 1
jnz	Jump if ZF == 0
jp	Jump if PF == 1
jpo	Jump if PF == 1 (jump if parity odd)
jpe	Jump if PF == 0 (jump if parity even)


## 转换 C/C++ 结构

### if-else 链

经典的 C/C++ if-else 结构如下所示：

```c
if(condition1) {
  ... // body1
}
else if(condition2) {
  ... // body2
}
...
else {
  ... // else body
}
```

在汇编中没有直接的语句。我们需要使用比较，条件跳转和无条件跳转来重建其行为。

- 每一个if语句都需要```cmp```或者```test```指令（如果if表达式比较复杂，不是简单的数值比较，那么可能需要多个```cmp```或者```test```）。如果条件为假则进行条件跳转。跳转目标是链中的下一个 if。
- 每个 if 的主体在最后的 else 结束后以无条件跳转到标签结束。
- else 的主体不需要跳转，因为它直接“跳转”到下面的代码。

```x86asm
cmp ...
jncc .elseif1 
  ; body 1

  jmp end_else

.elseif1:
cmp ...
jncc .elseif2
  ; body2

  jmp end_else

... ; other else-if comparisons and bodies

.else: 

  ; else body

.end_else:

...
```

（当然，您应该尝试使用更具描述性的标签名称！）


## 嵌套的 if-else

嵌套的 if-else，例如:

```cpp
if(rax == rbx) {
  if(rbx < rcx) {
    ...
  }
}
```

正如我们所见，可以翻译成:

```x86asm
cmp rax, rbx      ; Or whatever you need for the outer condition
jne .end          ; Note: jump if NOT equal
cmp rbx, rcx      
jge .end

...               ; Actual body 

.end
...               ; Rest of program
```

我们依次测试每个条件，如果不满足条件，则跳转到嵌套 if 主体之后的标签。因此，j**指令中的所有条件都被否定。

## do-while循环

我们已经看到，循环指令用于实现一种 do-while 循环，只要您想使用递减的 rcx 作为循环变量，当 rcx == 0 时循环结束。通过条件跳转，我们可以构建一个更通用的 do-while 循环：

```x86asm
.do                 ; do {

  ...               ;   Loop body

  cmp rax, rbx      
  je .do            ; } while(rax == rbx);
```


## while 循环

实现 while 循环需要在循环开始时测试循环条件，如果失败则可能跳到循环末尾。
因此，我们需要在循环的开头（以便我们可以执行循环）和循环的结尾都有一个标签：

```x86asm
.while:         ; while(rax != rbx) {
  cmp rax, rbx
  je .end_whle

  ...           ;   Loop body

  jmp .while
.end_while:     ; }
```

for 循环只是一种特殊的 while 循环，例如

```
for(rax = 0; rax < 100; ++rax) {
  ...
}
```

将会编译为：

```
  xor rax, rax      ; rax = 0
.for:     
  cmp rax, 100
  jge .end_for

  ...               ; Loop body

  inc rax
  jmp .for
.end_for:
```

## break和continue

break 相当于跳转到循环结束后的位置。 continue 相当于跳转到循环开头的位置。常见的模式是

```x86asm
if(condition)
  break; // Or continue
```

可以通过条件跳转到结尾/开头来完成；无需模拟整个 if 结构。