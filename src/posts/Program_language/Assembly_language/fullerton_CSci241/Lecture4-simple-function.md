
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
