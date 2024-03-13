---
category: 
- 汇编语言
---

# 第十九讲： 宏定义

就像 C/C++ 一样，YASM 有一个预处理器，它在实际进行汇编之前对汇编程序的文本进行操作。因为它在汇编时运行，所以它实际上可以是比汇编本身更丰富的“语言”。另一方面，因为它在汇编时运行，所以它不能引用任何运行时信息（寄存器或内存的内容）。基于文本的宏定义语言实际上在计算机科学中相当常见，因此值得深入了解至少一种（如果您还没有研究过 C/C++ 预处理器）。

## 错误

我们可以使用 ```%error``` 宏停止汇编并打印消息：

```x86asm
%error Something went wrong.
```

## 包含文件

就像在 C/C++ 中一样，我们可以在当前 ```.s``` 文件中包含另一个文件的内容：

```x86asm
%include "file.s"
```

将直接包含 ```file.s``` 的内容。

请注意，有一种不同的机制可将二进制文件嵌入到汇编文件中：

```x86asm
data:     incbin "file.data"
```

将二进制文件```file.dat```的内容包含到可执行文件中，标记为```data```。

## 单行宏

从本质上讲，宏预处理器的工作原理是用一些其他文本替换一些文本。例如:

```x86asm
%define accumulator     rax
```

表示每当看到```accumulator```时，都应该将其替换为文本 ```rax```。因此，我们现在可以写类似的东西:

```x86asm
add accumulator, 10   ; Equivalent to    add rax, 10
```

宏可以重新定义，我们可以做:

```x86asm
%define accumulator rax
```

然后做:

```x86asm
%define accumulator rcx
```

```accumulator```将扩展到最新定义的内容。

我们可以用另一个宏来定义一个宏

```x86asm
%define increment   inc accumulator
```

现在，当我们写:

```x86asm
increment
```

这将首先扩展为 ```inc accumulator```，然后扩展为 ```inc rax```。请注意，```accumulator```的扩展不会在我们```%define increment```时发生，而是在我们使用```increment```时发生。这意味着在定义其他宏期间，宏扩展会暂时停止。如果稍后重新定义```accumulator```（如上所述），则```accumulator```将使用最新的定义，而不是定义时的定义。

另一方面，有时我们希望在定义时扩展定义，而不是等到使用时才扩展。如果使用 ```%xdefine``` 定义宏，则定义将在定义点立即展开。通过重新定义宏可以看出差异：

```x86asm
%define a  1
%define b  a
%xdefine c a        ; Equivalent to %define x 1
...
%define a 2
mov rax, b          ; Expands to mov rax, 2
mov rcx, c          ; Expands to mov rax, 1
```

如果定义一个宏来扩展自身，例如 ```%define x x```，使用它不会使汇编器进入无限循环。当我们稍后看到函数式宏时，这意味着递归是不可能的。请注意，这对于 ```%xdefine``` 宏来说不是问题。

通过使用 %undef 可以取消定义宏（因此使用其名称是错误的）：

```x86asm
%undef accumulator

...
mov rbx, accumulator 
```

第二行将假设累加器是一个标签，如果没有这样定义，则给出错误。

## 函数式宏

单行宏可以有参数

```x86asm
%define increment(r)    inc r
```

要使用它，我们必须提供参数，无论何时使用 r，该参数都将被拼接到扩展中：

```x86asm
increment(rax)              ; expands to inc rax
increment(qword [var])      ; expands to inc qword [var]
```

多个参数之间用逗号分隔：

```x86asm
%define swap(a,b)       xchg a, b
...
swap(rax, rdi)          ; Expands to xchg rax, rdi
```

YASM允许“宏重载”；多个宏具有相同的名称和不同数量的参数，具有不同的定义。

## 区分大小写

宏默认区分大小写：```%define foo 1``` 将扩展 ```foo```，但不扩展 ```Foo``` 或 ```FOO```。有些汇编器不区分大小写，因此为了兼容性，YASM 有 ```%idefine``` 和 ```%xidefine``` 定义不区分大小写的宏。

## 连接宏扩展

有时我们需要通过一些宏扩展来形成单个字符串。例如，如果我们写：

```x86asm
%define reg(b) r b

reg(ax)         ; Expands to r ax, which is *not* a register!
```

```a %+ b``` 连接左右两侧的文本，“吃掉”其周围的任何空格。 ```reg``` 的正确定义是:

```x86asm
%define reg(b) r %+ b

reg(ax)        ; Expands to rax
```

## 算术扩展宏

假设我们要定义一个包含一个数值的宏，然后能够递增它。我们可以尝试这样的事情：

```x86asm
%xdefine v 0
...
%xdefine v v+1      ; Now v expands to 0+1
```

这是可行的，因为汇编器将在预处理器完成后执行算术 0+1 并计算出正确的值，但它很麻烦。经过很多几次增量后，我们才可以将 v 扩展到更大的数字 。

我们可以使用 ```%assign``` 来代替这样做。 ```%assign``` 的工作方式与 ```%xdefine``` 类似，只不过它评估其定义中的任何算术。所以我们可以使用：

```x86asm
%assign v 0
%assign v v+1       ; Now v expands to 1
```

因此，v 的展开总是类似于数字的东西，而不是像 0+1 这样的字符串。

## 字符串处理

YASM 的预处理器具有一些处理字符串文字的功能：“...”或“...”。您可以提取字符串文字的长度（字符数）：

```x86asm
%strlen len "String"
```

这```%assign```将 len设置为6。请注意，以下内容将不起作用：

```x86asm
string:     db  "String"

%strlen len string
```

因为 string 不是字符串，而是指向内存中字符串第一个字符的标签（地址）。另一方面，我们可以定义一个扩展为字符串文字的宏，然后询问其长度：

```x86asm
%define string "String"
%strlen len string
```

同样，您可以在字符串文字中添加“下标”来添加额外的单个字符：

```x86asm
%substr c "String" 2        ; Defines c to be 'r'
```

下标以 1 开头，而不是 0，因此最后一个字符的位置等于字符串的 %strlen。(TODO 这里描述前后不一致)

## 多行宏

更复杂的宏将需要多行定义。这是通过使用 ```%macro``` 和 ```%endmacro``` 来完成的：

```x86asm
%macro swap 2
    mov r11, %1
    mov %1, %2
    mov %2, r11
%endmacro
```

与单行宏不同，多行宏只知道参数的数量（上面的 2 个），而不知道它们的名称。参数的名称始终为 ```%1```、```%2``` 等。

要调用多行宏，请使用其名称，后跟其参数（不在括号中）

```x86asm
swap rax, rcx
; Expands into 
;   mov r11, rax
;   mov rax, rbx
;   mov rbx, r11
```

与单行宏一样，多行宏可以在参数数量上超载。您甚至可以定义与指令同名的多行宏：

```x86asm
%macro push 2
    push %1
    push %2
%endmacro
...
push rax            ; Normal push instruction
push rax, rbx       ; Expands to the above
```

汇编器会发出警告，但上面的代码工作得很好

## 其余参数

您可以创建一个多行宏，它接受任意数量的参数。例如，

```x86asm
%macro print 1+
  section .data
    %%string:   db      %1
    %%strlen:   equ     $-%%string

  section .text
    mov rax, 1
    mov rdi, 1
    mov rsi, %%string
    mov rdx, %%strlen
    syscall
%endmacro
```

在这里，我们暂时切换到 ```.data``` 部分以添加新的字符串常量，然后切换回 ```.text``` 并展开到打印它的系统调用。我们可以像这样使用它:

```x86asm
print "Hello world!", 10
```

并且无论给出多少个参数，它们都会被放在```%1```中。

请注意，我们不能再使用 2、3 等参数来重载 ```print```。这给定的定义有效地定义了从 1 到无穷大的所有参数计数的 ```print``` 的不同版本。

## 默认参数

我们可以支持一个范围，并为任何省略的参数提供默认值：

```x86asm
%macro swap 2-3 r11
    mov %3, %1
    mov %1, %2
    mov %2, %3
%endmacro
```

这里的```2-3```表示swap接受2-3个参数。如果提供两个参数，则r11则默认作为第三个参数。

如果我们将其用作交换 ```rax```、```rbx```，则 ```%3``` 会扩展为默认值 ```r11```。另一方面，如果我们提供第三个参数，例如 ```swap rax、rbx、r15```，则提供的第三个参数```r15```将用于 ```%3```。

如果我们创建一个具有 3-5 个参数的宏，那么我们必须提供 5-3 = 2 个默认值，这些默认值将成为参数 ```%4``` 和 ```%5``` 的默认值。如果省略默认值，则默认值将不扩展为任何内容。

默认参数可以与其余参数组合；你可以写 3-5+，这意味着 3 或更多，但任何超过 5 的都进入 ```%5```。

您可以通过写入 ```3-*```（三到无穷大）来指定无限的最大参数数量。当然，您无法为所有这些编写默认值。它和 + 之间的区别在于 + 将所有剩余参数分组为一个参数，同时这使得它们都可以单独访问。 ```%0```表示的是提供的实际参数的数量。

## 旋转参数列表

假设宏采用三个参数：```%1```、```%2```、```%3```。我们可以通过发出宏``` %rotate 1``` 来旋转列表。旋转后，原来的第二个参数会在第一个位置，第三个参数会在第二个位置，而第一个参数会一直旋转到3。这在重复宏中最有用，因为它允许我们访问所有参数而无需数字索引。例如，以下是推送的一个版本，它接受任意数量的参数并推送所有参数：例如，以下是推送的一个版本，它接受任意数量的参数并推送所有参数：

```x86asm
%macro push 2-*
  %rep %0
    push %1
    %rotate 1
  %endrep
%endmacro

push rax, rbx, rcx, qword [var]
```
这里```%0```的值为4。

如果 n 为正数，```%rotate n``` 将参数列表向左旋转 n 个空格（朝向参数 %1）。如果n为负数，则向右旋转。

```%rep ... %endrep``` 稍后在[重复宏](https://staffwww.fullcoll.edu/aclifton/cs241/lecture-macros.html#repeating-macros)下讨论。

## 宏局部名称

如果多行宏可以扩展为代码，我们可能希望扩展为包含标签的代码（例如，扩展为循环）。然而，如果宏被多次扩展，这将会导致问题；那么我们就会对同一个标签有多个定义。为了解决这个问题，我们可以使用宏局部标签。宏局部标签是名称以 ```%%``` 开头的普通标签。例如，

```x86asm
%macro retz 0
    jnz     %%skip
    ret

  %%skip:
%endmacro
```

每次扩展宏时，都会为标签 ```%%skip``` 生成一个新的唯一名称，因此所有扩展都不会相互干扰。

宏本地名称实际上不必用作标签。例如，我们可以使用它作为单行宏名称来创建一种"局部变量"：

```x86asm
%macro testmacro 0
    %assign %%v 0
    mov rax, %%v
%endmacro
```

在这里，变量```%%v```每次宏展开时都会获得不同的名称。

## 串联多行参数

与需要特殊 ```%+``` 运算符来连接的单行参数不同，多行参数不需要这样的表示法：

```x86asm
%macro string_n 2
    string%1:   db  %2
%endmacro

string_n 7 "Hello"          ; Expands into string7: db "Hello"
```

如果我们想在参数后面连接一些文本，我们可以写 ```%{1}text```;这将扩展 ```%1```，然后在扩展后立即添加文本，中间没有空格。

## 条件码参数

YASM 对包含条件代码（```z```、```ge``` 等）的参数有特殊支持。如果 ```%1``` 扩展为条件代码，则 ```%-1``` 扩展为该代码的否定。例如，z 变为 nz，ge 变为 l，等等。类似地，```%+1``` 扩展为原始的、未更改的条件代码，只不过它强制参数实际上是条件代码，如果不是，则给出错误。

例如，上面的 ```retz``` 宏可以推广为允许任何条件代码（默认为 ```z```）的宏，方法是：

```x86asm
%macro retcc 0-1 z
    j%-1    %%skip
    ret

  %%skip:
%endmacro
```

## 条件宏

通常，我们希望根据某些（汇编时）参数包含源文本的某些部分，并在其余时间排除它或用其他文本替换它。这可以通过条件宏来完成。最基本的条件宏反映了熟悉的 if-else if-else 语句：

```x86asm
%if<condition>
    ...
%elif<condition>
    ...
%else
    ...
%endif
```

正如我们所期望的，0 个或超过 1 个 %elif-s 是允许的，最后的 %else 是可选的。请注意，条件立即出现在 %if/%elif 之后，中间没有空格。

## def – 检查单行宏的定义

我们可以使用 %ifdef 来检查给定的（单行）宏是否已经被定义。例如，

```x86asm
%ifdef DEBUG
    ... ; Debug build code
%else
    ... ; Production code
%endif
```

未定义可以使用条件 ```ndef``` 进行测试。

## 检查多行定义的宏

宏检查是否定义了多行宏：

```x86asm
%ifmacro push 2+

    ; Multi-arg push is defined

%endif
```

## 数值表达式

```%if expr``` 将检查数值表达式 expr，如果其值非零则继续。您可以在表达式中使用普通的比较运算符。请注意，相等是=（单个等于），不等是<>。

## ```idn``` – 文本比较

如果 t1 和 t2 扩展为相同的文本序列，则 ```%ifidn t1, t2```返回真。

```num、id、str``` – 检查令牌类型

- 如果 t 扩展为看起来像数字的内容，则 ```%ifnum t``` 成功。
- ```%ifid t``` 如果 t 扩展为看起来像标识符的东西（即标签或 equ），则成功
- 如果 t 扩展为看起来像字符串文字的内容，则 ```%ifstr t``` 成功。


## 重复宏

要重复某些文本一定次数，我们使用 ```%rep```：

```x86asm
%rep 10
    inc rax
%endrep
```

这将扩展为十个 ```inc rax``` 指令。 ```%rep``` 的参数可以是数值表达式。

```%assign``` 可以与 ```%rep``` 一起使用来创建循环变量：

```x86asm
%assign i 0
%rep 10
    mov qword [arr + i], i
    %assign i i+1
%endrep
```

这将地址 ```arr``` 处的 10-qword 数组初始化为 0, 1, 2, 3, … 9

我们可以使用 ```%exitrep``` 提前停止 ```%rep```：

```x86asm
section .data
data:

%assign i 1
%rep 100
    db i
    %assign i i*2
    %if i > 1024
        %exitrep
    %endif
%endrep
```

这将创建一个带有标签数据的数组，其初始化为 1, 2, 4, 8, ...。

## 上下文堆栈

上下文堆栈是一种允许诸如宏本地标签之类的机制（如果宏多次扩展，这些标签不会中断）， 但被多个宏定义共享。例如，目前，一个宏中定义的宏局部标签不能以任何方式被另一个宏引用；它是看不见的。这使得定义更高级的宏（通常需要多个定义）变得困难或不可能。

为了解决这个问题，YASM 维护了一个“上下文”堆栈。可以创建堆栈顶部上下文本地的标签。新的上下文可以使用 %push 推入堆栈顶部，并可以使用 %pop 删除。由于使用了堆栈，因此可以嵌套精美的宏而不会相互破坏。

## 上下文本地标签

要创建当前上下文本地的标签，我们编写 ```%$name```。这也可以用于 ```%define``` 或 ```%assign``` 一个宏，其名称是当前上下文的本地宏：

```x86asm
%define %$lm 5
%assign %$i 0
```

这可以防止变量干扰其他作用域。

请注意，当上下文被 ```%pop-ed``` 时，其所有本地标签/宏都是未定义的。

## 示例：块 IF 语句

假设我们想定义一个宏，它允许我们编写一个更自然的 if-like 结构：

```x86asm
IF rax, e, rcx
    ...
ENDIF
```

这扩展到类似的东西

```x86asm
cmp rax, rcx
jne .endif
    ...
.endif:
```

除了标签 ```.endif``` 应该为每个 IF-ENDIF 唯一生成之外。

我们需要定义两个%宏：

```x86asm
%macro IF 3
    %push if 
    cmp %1, %3
    j%-2 %$endif
%endmacro

%macro ENDIF 0
    %$endif:
    %pop
%endmacro
```

- 当我们调用 IF 宏时，它会将 if 上下文压入堆栈，让我们知道我们处于 if 内部。

- 它还执行比较，如果比较失败则跳转。

- ```ENDIF``` 宏创建作为 (2) 中跳转目标的标签，并从堆栈中删除 if 上下文（因为我们不再位于 if 内部）。

这个宏可以工作，但是如果我们使用没有匹配 IF 的 ENDIF，它会严重失败。我们可以使用 %ifctx 条件来检查堆栈顶部的上下文，如果不在 IF 内，则发出错误：

```x86asm
%macro ENDIF 0
    %ifctx if
        %$endif:
        %pop
    %else
        %error Expected IF before ENDIF
    %endif
%endmacro
```

我们可以使用类似的技术来定义用于迭代的 DO-WHILE 宏：

```x86asm
%macro DO 0
    %push do_while
    %$do
%endmacro

%macro WHILE 3
    %ifctx do_while
        cmp %1, %3
        j%-2 %$do
    %else
        %error Expected DO before WHILE
    %endif
%endmacro
```

这可以用作

```x86asm
mov rax, 0
DO
    mov qword [arr + rax], rax
    inc rax

WHILE rax, le, 100 
```

这些循环/if 甚至可以相互嵌套，只要它们使用不同的寄存器即可。

另一个例子：```PROC```/```ENDPROC```在微软汇编器中用于标记函数的开始/结束：

```x86asm
PROC myfunction
    ... Stuff

ENDPROC
```

在 MASM 中，需要这些来使函数内部的标签成为函数的本地标签； YASM不需要这个，因为我们有本地标签，但我们仍然可以定义它们以实现兼容性。我们甚至可以添加一些错误检查，这样没有 PROC 的 ENDPROC 或嵌套 PROC 就是一个汇编时错误:

```x86asm
%macro PROC 1
    %ifnctx proc
        %push proc
        %{1}:
    %else
        %error Found PROC without preceding closing ENDPROC
    %endif
%endmacro

%macro ENDPROC 0
    %ifctx proc
        %pop 
    %else
        %error Found ENDPROC without preceding PROC
    %endif
%endmacro
```

原文链接： https://staffwww.fullcoll.edu/aclifton/cs241/lecture-macros.html

yasm 介绍文档： https://www.tortall.net/projects/yasm/manual/html/manual.html#nasm-macro-context-local