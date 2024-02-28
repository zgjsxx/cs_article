

## 函数调用规约

回顾一下，当我们调用一个函数时，我们必须选择一些寄存器用于参数，至少一个用于返回值，一些寄存器用于调用者保存（可供函数临时使用），一些寄存器用于被调用者已保存。我们对这些函数的选择是为了与标准 Unix C ABI 调用约定保持一致，因此，通过更多的工作，我们的函数将与 C 标准库兼容。、


调用函数的一般流程是这样的
```x86asm
...
    push r10        ; Push any caller-saved registers in use
    call func   
    pop r10         ; Restore after return
```

类似地，在函数中，我们有一个保存所有被调用者保存的寄存器的序言，以及一个恢复它们的序言

```x86asm
func:
    push r12        ; Push any callee-saved registers in use
    ...
    pop r12         ; Restore them before return
    ret
```