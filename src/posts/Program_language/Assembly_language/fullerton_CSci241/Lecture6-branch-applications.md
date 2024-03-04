---
category: 
- 汇编语言
---

# 第六讲：分支、条件、应用


## 回顾 

汇编中任何类型的非顺序控制流（仅从一个指令移动到下一个指令）都涉及使用多个条件和/或无条件跳转指令之一进行分支。这意味着 if-else 结构、switch-case 和任何类型的循环都需要使用跳转来实现。


## 无条件跳转

```x86asm
jmp target
```

这里的```target:```就是在```.text```节中的一个标签。这会使得CPU不会执行```jmp```指令的下一条指令，而是跳转到标签处执行：

通常，我会使用本地标签（以 . 开头的标签）作为函数内部的标签。

在CPU内部，```jmp```指令只是修改```rip```寄存器，其中包含下一条要执行的指令的地址。通常，rip由CPU自动更新，以指向下面的指令。


## 计算跳转

可以跳转到寄存器而不是标签的目标。这可以用于这样的事情：

```x86asm
mov rax, target
...
jmp rax
```

您甚至可以在 .data 部分构建一组目标，然后跳转到其中一个：

```x86asm
section .data

jmp_tbl:    qword   _start.label0, _start.label1, ...

section .text
_start:

    ...
    mov rax, qword [jmp_tbl + 1]
    jmp rax
```

稍后我们将使用“跳转表”技术来实现一种 switch-case。