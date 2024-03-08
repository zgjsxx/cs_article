---
category: 
- 汇编语言
---


# 第五讲：分支、条件、循环

汇编语言没有专用的循环结构（如 ```for```、```do```、```while``` 等）。它只有
- 分支(跳转)：跳转到程序中的新位置。
- 比较： 比较两个操作数，然后适当地设置标志寄存器。只有一条比较指令，它执行所有可能的比较（等于、小于、等于零等）
- 条件分支：通常执行分支或继续执行下一条指令，具体取决于其中一个标志的状态（之前通过比较操作设置）。
- 条件移动：是否执行移动取决于标志之一的状态。

后面会学习到函数调用和返回，它只是上述几种类型的特殊形式。

**汇编语言程序的结构**

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

## 跳转

跳转通过```jmp```指令从而跳转到新位置来工作。```jmp```指令会通过修改```rip```从而加载指定位置的代码进行执行。我们只需要提供要跳转的目标就可以实现跳转：

```x86asm
jmp target
```

**跳转标签**

跳转的目标必须是一个标签。标签由标识符后跟冒号组成：

```x86asm
Target:
    ...
```

除此以外，还有一种标签是**本地标签**。**本地标签**是名称以**句号**开头的标签。**本地标签**的全名需要添加靠的最近的非本地标签的名称。例如:

```x86asm
my_function:
  ...
  .begin_loop:    ; Full name: my_function.begin_loop
```

这允许我们拥有具有相同名称的多个标签，只要它们位于不同的函数/代码块中。

标签只是一个地址，即下一条指令的地址（或数据，如果在 ```.data``` 部分中使用）。

**跳转**

要跳转到一个标签，请使用 ```jmp``` 指令：

```x86asm
jmp target
```

请注意，标签的值只是它在程序中的地址。

```x86asm
mov rax, Target 
jmp rax
```

可以在寄存器中存储标签， 跳转到寄存器等。这有时称为**计算跳转**。例如，我们可以将一组标签存储在数组中（在 ```.data``` 部分），然后使用数组索引来确定要跳转到哪个标签。稍后将使用该技术来实现 ```switch-case``` 结构。


## 比较

### ```cmp```指令

有两种比较指令，其中 ```cmp``` 是最为直接的比较， 它需要两个操作数，并且两个操作数的大小必须相同。第一个操作数不能是立即数，但第二个操作数可以。 其中一个操作数可以位于内存中，但不能同时位于内存中。

```x86asm
cmp op1, op2
```

```cmp```指令会在内部执行 ```op1 - op2``` ，并且丢弃结果，但会更新标志寄存器。例如，如果 ```op1 - op2 == 0```，则零标志 ZF 将被设置，因此置零标志告诉我们原始操作数是相等的。类似地，如果 ```op1 > op2```，减法会设置进位标志。

### 条件

可以使用标志的各种组合来确定 ```sub a, b``` 的两个操作数之间的关系：

- 如果 ```a == b``` 则结果将为 0，这将设置 ```ZF = 1```。因此我们可以通过查看零标志来检测相等性。 
- 如果 ```a != b```, 那么结果将是非零的，因此 ```ZF == 0```。
- 如果 ```a > b```, 无符号， 那么结果是非零的, 并且不需要额外的进位/借位，因此 ZF == 0 且 CF == 0。
- 如果 ```a >= b```, a和b都是无符号整数，那么不需要额外的进位/借位（结果可能为零也可能不是），因此 ```CF == 0```。
- 如果 ```a < b```，a和b都是无符号整数，与```a >= b```相反，因此 CF == 1（需要额外借位）。
- 如果，```a <= b```，a和b都是无符号整数，与```a > b```相反，因此 ```ZF == 1``` 或 ```CF == 1``。
- 如果 ```a > b```，a和b都是有符号整数，那么事情就更有趣了：我们知道结果不会为 0，因此 ```ZF == 0```，但结果的其余部分取决于溢出标志和符号标志：
  - 如果```a```和```b```具有相同的符号，则```OF == 0```（不可能溢出）。如果 ```a > b``` 且两者均为正，则结果将为正 (```SF == 0```)。如果两者均为负数，则结果也将为正数（例如，-2 > -10、-2 - -10 = +8）。所以在这种情况下我们有 ```SF == OF```。
  - 如果 a 和 b 的符号不同，则可能发生溢出。如果 a > -b 那么我们正在做 a - -b = a + b：
  * 如果a + b没有溢出，则符号为正，所以SF == OF == 0
  * 如果 a + b 确实溢出，则符号为负，但 OF == 1，所以我们有 OF == SF == 1
  不管怎样，我们再次得到 ```SF == OF```。
  因此，```a > b``` 有符号的最终条件是 ```ZF == 0 且 SF == OF```。
- 如果 ```a >= b```，有符号，那么我们只需忽略零标志：```SF == OF```。
- ```a < b`` 与```a >= b```相反 ，因此 ```SF != OF```。 
- ```a <= b``` 与```a > b``` 相反，因此 ```ZF == 1``` 或 ```SF != OF```。

这些条件代码中的每一个都将在稍后的条件跳转指令中使用。对于有符号比较，我们通常使用术语“小于”和“大于”；对于无符号比较，我们说“低于”和“高于”。

### ```cmps*```指令(内存与内存的比较)

```cmp``` 指令无法直接比较内存中的两个操作数。 但是```cmps*``` 系列指令可以比较内存中的两个操作数，第一个操作数位于 ```[rsi]```，第二个操作数位于 ```[rdi]```。

```cmps*```的指令如下所示：

|指令|描述|
|--|--|
|```cmpsb```|比较 ```byte [rsi]```和 ```byte [rdi]```|
|```cmpsw```|比较 ```word [rsi]```和 ```word [rdi]```|
|```cmpsd```|比较 ```dword [rsi]```和 ```dword [rdi]```|
|```cmpsq```|比较 ```qword [rsi]```和 ```qword [rdi]```|

```cmps*``` 指令不带任何操作数；他们总是使用 ```rsi``` 和 ```rdi```。


### ```test```指令

```cmp``` 执行减法并更新与 ```sub``` 相同的标志，而 ```test``` 执行二进制 AND 并仅更新 SF、ZF 和 PF 标志， CF 和 OF 标志被清除。这意味着```test```不能用于确定依赖于这些标志的任何条件（排序比较，例如大于、小于、高于、低于）或相等。因为它使用 AND 而不是减法，所以```test```的用途更加有限：

- 判断寄存器是否等于0：

```x86asm
 test reg, reg
 jz target          ; or je target, jump if ZF == 1
```

如果一个数和自身相与，结果还是自身。因此结果等于0的唯一可能是 ```reg = 0```。 ```JE```和```JZ```仅在```ZF == 1```时跳跃。

- ```test reg, reg ```还可用于确定寄存器的符号：如果 ```SF == 1``` 则 reg 为负数。因此，我们可以做：

```x86asm
test reg, reg
js target
```

如果 ```reg < 0```，则跳转到目标。（如果 reg 无符号，则在设置高位时将跳转。）

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

### 其他指令

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

|操作|描述|
|--|--|
|```jc```	| 当 ```CF == 1```时跳转|
|```jnc```|	当 ```CF == 0```时跳转|
|```jz``` |	当 ```ZF == 1```时跳转|
|```jnz```|	当 ```ZF == 0```时跳转|
|```jo``` |	当 ```OF == 1```时跳转|
|```jno```|	当 ```OF == 0```时跳转|
|```js``` |	当 ```SF == 1```时跳转|
|```jns```| 当 ```SF == 0```时跳转|
|```jz``` |	当 ```ZF == 1```时跳转|
|```jnz```| 当 ```ZF == 0```时跳转|
|```jp``` |	当 ```PF == 1```时跳转|
|```jpo```| 当 ```PF == 0```时跳转 |
|```jpe```| 当 ```PF == 1```时跳转|
|```jnp```| 当 ```PF == 0```时跳转|



|机器码|指令|描述|
|--|--|--|
|7B cb| JNP| Jump short if not parity (PF=0).|
|7A cb|	JP | Jump short if parity (PF=1).|
|7A cb|	JPE| Jump short if parity even (PF=1).|
|7B cb|	JPO| Jump short if parity odd (PF=0).|


例如，假设我们要实现以下代码:

```cpp
if(rcx == 0)
    rax = rbx;
```

使用条件和条件分支，我们可以这样做:

```x86asm
cmp rcx, 0
jne NotZero
mov rax, rbx
NotZero:
```
## 跳转目标

普通的```jmp```指令可以跳转到任意地址。条件跳转存储的是跳转目标距离当前指令的偏移量。偏移量是有符号 8 位或 32 位数值。在汇编语言中，我们编写一个标签，汇编器会计算相应的偏移量，写入指令中。

## 条件跳转到计算目标

通过无条件跳转，可以很容易地跳转到寄存器定义的目标：

```x86asm
target:
...
mov rax, target
jmp rax
```

因为rax寄存器的值就是要跳转到的地址。由于条件跳转不使用绝对地址，而是使用当前地址的偏移量，因此计算条件跳转需要更多技巧。

最简单的方法是使条件跳转到固定目标，其中目标是到计算地址的普通跳转:

```x86asm
jcc my_jmp_target

  ⋮

my_jmp_target:  jmp rax
```

此方法比理想慢一些，因为它涉及两次跳跃。更快的方法是计算最终的 jcc 指令和各个跳转目标之间的距离，然后将这些距离存储到某个寄存器中。由于这些距离在组装时是固定的，因此在运行时计算它们的效率很低。一般的策略是给条件跳转指令本身加上标签，这样我们就可以访问它的地址：

```x86asm
target1:

  ⋮
                mov rax, computed_jump - target1  ; Pick target to jump to
computed_jump:  jcc rax                           ; Jump 

  ⋮

target2:
```

```mov``` 当然是条件结构的一部分，它要么：

```x86asm
mov rax, computed_jump - target1
```

或者

```x86asm
mov rax, computed_jump - target2
```

取决于某些条件。我们还可以存储一个compated_jump - target1、compated_jump - target2等偏移量的数组，然后对其进行索引.

查询了[intel指令集](https://www.intel.cn/content/www/cn/zh/content-details/782158/intel-64-and-ia-32-architectures-software-developer-s-manual-combined-volumes-1-2a-2b-2c-2d-3a-3b-3c-3d-and-4.html) volume 2中关于jcc的部分，jcc后面不可以带register，因此课程中这里讲解的似乎不太正确。

### 复合条件

我们如何检查复合条件，例如 ```rbx >= 10 和 rbx < 100```，并在复合条件为真时执行跳转？

- 一种方法是执行多步跳转
  ```x86asm
  cmp rbx, 10
  jge .step1
  jmp .else

  .rax_ge_0:
  cmp rbx, 100
  jnge .else

      ; rbx >= 0 and rbx < 100

  .else:

      ; condition failed.
  ```
除最后一个条件外，每个条件都需要自己的 cmp 和条件跳转。 （因为 cmp 在进行比较之前重置标志，所以您无法“组合”多个比较。）

这实际上相当于转换
```cpp
 if(rbx >= 10 and rbx <= 100) {
  ...
 }
```

into

```cpp
 if(rbx >= 10) {
     if(rbx <= 100) {
      ...
     }
 }
```

- set** 检查特定条件标志（或标志组合）并将（字节）寄存器/内存设置为 1 或 0。然后可以使用正常和/或/非按位操作以及 z、nz 条件将它们组合起来可用于检查假/真。例如。，


```x86asm
 cmp rbx, 10
 setge al
 cmp rbx, 100
 setl  ah
 and al, ah      ; Sets the zero flag if al && ah == 0
 jz .outside

    ; Inside

 .outside:
```
set** 支持与条件跳转相同的一组条件代码

A range check like the above example actually has a simple version using subtraction:

 sub rbx, 10
 cmp rbx, 100 - 10
 jae .outside
    ; Inside the range

 .outside:
    ; Outside the range 
This works because if rbx < 10 the subtraction will wrap around to a value, so values < 10 and values >= 100 will jump to .outside. This works assuming that rbx is unsigned.

### 跳转优化

条件跳转很昂贵！ （无条件跳转比正常的顺序控制流更昂贵，但不如条件跳转那么昂贵。）处理器在检查标志寄存器之前不知道将采用什么指令，这意味着它执行的许多优化必须被延迟。
优化跳转的最佳方法是尽量减少它们的使用：尝试尽可能保持控制流的顺序。除此之外，尝试

- 保持条件跳转较短，在 +-127 字节内

- 尝试安排条件跳转，使条件通常为假或通常为真，而不是频繁交替。处理器将尝试进行分支预测，存储少量跳转所做的选择，但如果条件跳转的选择基本一致（即，如果“预测”在大多数情况下是正确的），则此功能效果最佳。
  例如，在循环中，循环条件大多数时候为 true，只有在最后才为 false。处理器将学习这种行为并“猜测”循环将重复，因此大多数循环跳转都会很快。只有最后的跳转（跳出循环）才会很慢，因为这就是预测失败的地方。
- 通过使用条件移动（见下文）或 setcc 指令完全避免条件分支



有时，在 C/C++ 中，我们依赖 bool → int 的隐式转换来避免编写 if/else。例如，要计算数组中负值的数量，我们可以这样做：

```cpp
int c = 0;
for(int* p = arr; p < arr + size)
   c += (*p < 0);
``` 
This works because bool true converts to 1 (thus becoming c += 1) and false converts to 0 (becoming c += 0). This code is actually faster than the equivalent code:

int c = 0;
for(int* p = arr; p < arr + size)
   if(*p > 0)
      ++c;
because evaluating a conditional branch is slower for the CPU. To implement the above version, we can use the SETcc instruction, which sets a given (byte) register to 1 if the condition code cc is satisfied, or 0 if it is not. E.g., to increment rax only when rbx > 0 we could do

mov rcx, 0

cmp rbx, 0
seta cl      ; Set cl = 1 if rbx > 0
add rax, rcx


## 转换 C/C++ 结构

### if-else 链

经典的 C/C++ ```if-else``` 结构如下所示：

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

在汇编中没有直接```if-else```的语句。我们需要使用**比较**，**条件跳转**和**无条件跳转**来构建。

- 每一个```if```语句都需要```cmp```或者```test```指令（如果if表达式比较复杂，不是简单的数值比较，那么可能需要多个```cmp```或者```test```）。如果条件为假则进行条件跳转。跳转目标是链中的下一个 if。
- 每个 if 的主体在最后的 else 结束后以无条件跳转到标签结束。
- else 的主体不需要跳转，因为它直接跳转到下面的代码。

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

当然，您应该尝试使用更具描述性的标签名称！


### 嵌套的 ```if-else```

嵌套的 if-else，例如:

```cpp
if(rax == rbx) {
  if(rbx < rcx) {
    ...
  }
}
```

上述的代码可以翻译成下面的汇编代码:

```x86asm
cmp rax, rbx      ; Or whatever you need for the outer condition
jne .end          ; Note: jump if NOT equal
cmp rbx, rcx      
jge .end

...               ; Actual body 

.end
...               ; Rest of program
```

我们依次测试每个条件，如果不满足条件，则跳转到嵌套 ```if``` 主体之后的标签。

### ```do-while```循环

在之前，我们已经学习过使用```loop```指令实现 ```do-while``` 循环的方式，只要您使用 ```rcx``` 作为循环变量，在循环中进行递减，当 ```rcx == 0``` 时循环结束。

通过条件跳转，我们可以构建一个更通用的 ```do-while``` 循环,在循坏开始时需要设置一个标签， 在循环结束时测试循环条件。

```x86asm
.do                 ; do {

  ...               ;   Loop body

  cmp rax, rbx      
  je .do            ; } while(rax == rbx);
```


### ```while``` 循环

实现 while 循环需要在循环开始时测试循环条件，如果失败则可能跳到循环末尾。

因此，我们需要在循环的开头和循环的结尾都有一个标签。(循环开头的标签用于满足循环条件时进入循环， 循环结尾的标签用于循环条件不成立时跳出循环):

```x86asm
.while:         ; while(rax != rbx) {
  cmp rax, rbx
  je .end_whle

  ...           ;   Loop body

  jmp .while
.end_while:     ; }
```

```for``` 循环只是一种特殊的 ```while``` 循环，例如

```cpp
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

### ```break```和```continue```

```break``` 等价于跳转到循环结束后的位置。 ```continue``` 等价于跳转到循环开头的位置。常见的模式是:

```x86asm
if(condition)
  break; // Or continue
```

这可以通过条件跳转到循环结尾/开头来完成；无需模拟整个 ```if``` 结构。

## 附录

### 课程资源

原文链接：https://staffwww.fullcoll.edu/aclifton/cs241/lecture-branching-comparisons.html



http://ics.p.lodz.pl/~dpuchala/LowLevelProgr/

https://www.felixcloutier.com/x86/

https://www.felixcloutier.com/x86/jcc

https://www.felixcloutier.com/x86/jmp