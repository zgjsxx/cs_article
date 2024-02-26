---
category: 
- 汇编语言
---

# 第三讲：数字表示

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

我们可以进行汇编和连接。

```shell
asm hello.s
```

或者可以进行手动编译连接：
```shell
yasm -g dwarf2 -f elf64 hello.s -l hello.lst
ld -g -o hello hello.o
```

## 操作数

每条汇编指令都有许多"操作数"。最大的指令有三个操作数，大多数有两个或一个，有些（如系统调用）没有。每个操作数可以是以下内容之一（有一些限制，具体取决于具体指令）。

- register的名字，例如```rax```。
- 一个常量，例如 60 或 msg。
- 内存直接查找。
- 内存间接查找。```[rax]```给出了内存中存储在rax寄存器中的存储的地址处的值。
