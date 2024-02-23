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