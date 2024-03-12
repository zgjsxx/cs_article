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


原文链接： https://staffwww.fullcoll.edu/aclifton/cs241/lecture-macros.html