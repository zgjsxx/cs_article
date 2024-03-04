---
category: 
- 汇编语言
---


# 第七讲  函数和栈

## 条件和循环的示例

```x86asm
section .data

buf:    db    "Hello, world!", 10
BUFLEN: equ   $-buf

section .text
...

  mov rax, buf

.begin_loop:
  cmp rax, buf + BUFLEN
  je .end_loop

    ... ; Process byte [rax]

  jmp .begin_loop
.end_loop:
...
```

这相当于一个 while 循环，如果 BUFLEN 为 0，则循环根本不会运行。

## 计算 rax 的符号

如果 rax 为负，则将 rbx 设置为 -1；如果等于 0，则将 rbx 设置为 0；如果为正，则将 rbx 设置为 +1：

```x86asm

  cmp rax, 0
  jl .negative
  jg .positive

.zero:              ; The zero label is never used, it's just for consistency
  xor rbx, rbx
  jmp .done

.negative:
  mov rbx, -1
  jmp .done

.positive
  mov rbx, +1
  jmp .done

.done:
  ...
```

## 嵌套循环

这会在 0 到 9 之间循环 rax，并在 0 到 15 之间循环 rbx（在其中）:

```x86asm
  xor rax, rax            ; rax = 0  
.outer_loop:
    xor rbx, rbx            ; rbx = 0
.inner_loop:
        
      ... ; Use rax, rbx, loop body

      inc rbx
      cmp rbx, 16
      jb .inner_loop

    inc rax
    cmp rax, 10
    jb .outer_loop

  ... ; Rest of the program
```