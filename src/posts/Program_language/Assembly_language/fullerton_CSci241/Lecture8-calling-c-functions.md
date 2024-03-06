---
category: 
- 汇编语言
---

# 第八讲 ： 栈的结构 c函数调用规约

## 函数调用规约

回顾一下，当我们调用一个函数时，我们必须选择一些寄存器用于参数，至少一个用于返回值，一些寄存器用于调用者保存(caller-saved), 可供函数临时使用，一些寄存器用于被调用者已保存(callee-saved)。我们对这些函数的选择是为了与标准 Unix C ABI 调用约定保持一致，因此，通过更多的工作，我们的函数将与 C 标准库兼容。、

|寄存器|使用|
|--|--|
|```rax```|用于函数返回值|
|```rbx```|callee-preserved|
|```rcx```|函数第四个参数|
|```rdx```|函数第三个参数|
|```rsi```|函数第二个参数|
|```rdi```|函数第一个参数|
|```rbp```|callee-preserved|
|```rsp```|栈顶指针|
|```r8```|函数第五个参数|
|```r9```|函数第六个参数|
|```r10```|临时变量(caller-preserved)|
|```r11```|临时变量(caller-preserved)|
|```r12-r15```|	Callee-preserved|

需要注意的是，所以的函数返回值和函数的入参都算作caller-preserved寄存器。例如，如果您的函数正在使用 ```rcx``` 并且您想要调用函数，则必须保留 ```rcx```，即使该函数不使用它作为参数。

调用函数的一般流程是这样的：

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

正如我们将看到的，使我们的函数与 C 兼容将需要对函数前导码/序言进行一些更改才能正确设置堆栈。

## 栈操作

要手动向栈添加和删除元素，我们使用```push```和```pop```操作：

- ```push op```：将操作数 ```op``` 压入堆栈。这个操作将```rsp```减少```op```的大小， 然后执行 ```mov [rsp] op```。```op``` 不能是 64 位立即数，但可以是更小的立即数（8、16 或 32 位）。请注意，您不能推送字节大小的寄存器或内存操作数，但可以推送字节大小的立即数。

- ```pop op```: 将栈顶值弹出到 ```op``` 中。即，执行 ```mov op [rsp]```，然后将 ```rsp``` 增加 ```op``` 的大小。```op``` 显然不能是立即数，并且必须是一个字或更大的。

请注意，在 x86-64 中，堆栈从内存的末尾开始并向后增长，因此入栈会减少```rsp```，出栈会增加 ```rsp```。因此，为了向下查看堆栈，我们将访问 ```rsp``` + 一段距离。

请注意，您可以在不使用这些指令的情况下随意修改堆栈。例如，如果您希望将前 8 个字节从堆栈中弹出，但不关心它们的值，您可以简单地执行以下操作

```x86asm
add rsp, 8
```

该命令会将 ```rsp``` 增长 8。

事实上，栈从进程地址空间的末尾开始并向后增长，这意味着如果您在任何时候查看 rsp，它可能会很大（大约 TB 级）。这并不意味着您的进程实际上可以使用那么多内存；而是意味着您的进程实际上可以使用那么多内存。正如我们稍后将看到的，系统有一种方法不分配未使用的内存部分。

## 汇编中的排序

为了回顾一下，我们将开发几个 133 种算法到它们的汇编等价物中。这是我们正在处理的序言：

```x86asm
section .data

; Load 1M of random data from random.dat

data:           incbin                  "random.dat"
DATLEN:         equ                     $-data

section .text
global _start
_start:
...
```

我们不需要麻烦地使用 ```open/read``` 系统调用，而是直接将随机数据编译到可执行文件中。

## 检查排序情况

我们将实现一个排序算法，但我们需要一种方法来检查它是否正常工作。

因此，我们将编写一个函数 ```is_sorted```，如果输入数组已排序，它将把 ```rax``` 设置为 1，如果没有排序，则将设置 ```rax``` 为 0。它将接收数组的地址（```rdi```）和长度（```rsi```）。我们将认为该数组由带符号的 qword（每个数组条目 8 个字节）组成。


在 C/C++ 中，我们可以用类似的方法检查这样的数组:

```cpp
bool is_sorted(long* arr, size_t length) {
    size_t i = 0; 
    while(i < length-1) {
        if(arr[i] > arr[i+1])
            return false;

        ++i;
    }

    return true;
}
```

非顺序执行有以下三种情况：

- 如果 while 条件为假，我们跳转到最终的返回。
- 在循环结束时，我们（无条件）跳回到开头。
- 如果 if 条件为 false，则跳转到循环末尾的 i++。

在汇编中，我们有这样的东西:

```x86asm
is_sorted:

    ; rdi = address of array
    ; rsi = length (in bytes)
    ; Returns: rax = 1 if sorted

    sub rsi, 8          ; Last element
    mov rax, 0
.while:
        cmp rax, rsi
        je .done

        mov r8, qword [rax + rdi]
        mov r9, qword [rax + rdi + 8]
        cmp r8, r9
        jle .continue
        mov rax, 0        
        ret

    .continue:
        add rax, 8
        jmp .while

.done:
    mov rax, 1
    ret
```

我们使用内存操作数的扩展形式来简化数组查找。特别是，内存操作数可以由以下总和组成：

- 常量地址
- 最多两个寄存器，其中一个称为基址寄存器，另一个称为索引寄存器
- 索引寄存器可以乘以 1、2、4 或 8。

由于哪些寄存器可以作为基址和索引没有限制，所以实际上，其中一个寄存器可以相乘，而另一个则不能。

汇编代码和 C/C++ 代码之间有一个区别：汇编代码中的长度以字节数给出，而不是数组元素的数量。在汇编例程中，无论元素的实际大小如何，都以字节为单位给出长度是相当常见的。

## 插入排序

我们将实现插入排序。在 C++ 中，插入排序如下所示：

```c
void insertion_sort(long* arr, unsigned long size) {
    unsigned long i = 1, j;
    while(i < size) {
        j = i;
        while(j > 0) { 
            if(arr[j] >= arr[j-1])
                break;
            else
                std::swap(arr[j], arr[j-1]);

            --j;
        }

        ++i;
    }
}
```
（我使用 while 循环编写此代码，以便更容易转换为汇编语言；用 C/C++ 编写它的自然方法是使用 for 循环。）


在汇编中， while 循环具有以下结构:

```x86asm
.while:
    cmp ...
    jcc .end_while

        ...

    jmp .while
.end_while
```

为了与我们的函数调用约定保持一致，我们的函数将接收 rdi 中的数组地址和 rsi 中的大小（无符号）。

```x86asm
insertion_sort:
    ; rdi = addr of array
    ; rsi = length of array

    mov rax, 1          ; rax = outer loop index, unsigned

    .while_i:
        cmp rax, rsi
        je .done
        mov rbx, rax    ; rbx = inner loop index

        .while_j:
            cmp rbx, 0
            je .done_i

            mov r8, qword [rdi + 8*rbx]
            mov r9, qword [rdi + 8*rbx - 8]
            cmp r8,r9
            jge .done_i ; break

            ; swap
            mov qword [rdi + 8*rbx],     r9
            mov qword [rdi + 8*rbx - 8], r8

            dec rbx
            jmp .while_j

    .done_i:
        inc rax
        jmp .while_i

.done
    ret
```

## C 兼容函数

## 函数模板

以下是一个函数模板，该函数保留被调用者保存的寄存器并使用 rbp 指向其堆栈帧的开头：

```x86asm
;; func_name(arguments...)
;; What the function does
;; 
;; Arguments:
;;   arg1 -- rdi
;;   arg2 -- si
;;   ... etc
;;   arg7 -- qword, stack [rbp + 16]
;; 
;; Return value: eax
;;
global func_name
func_name:

    ;; Preamble
    push rbp     ; Save calling function's rbp
    mov rbp, rsp ; rbp points to our stack frame

    push r12     ; Push any callee-saved registers you use

    ; If you need space for stack-based local variables, you can reserve it with
    ;   sub rsp, amount

    ; Realign rsp to 16*rsp + 8

    ;; Function body
    ...          

    ;; Epilogue

    ; Remove any alignment added

    ; If you reserved any space for stack-based local variables, you should 
    ; restore it with
    ;   add rsp, amount    

    pop r12      ; Restore callee-saved registers
    pop rbp      ; Restore caller's rbp
    ret
```

## 附录

### 课程资源

原文链接：https://staffwww.fullcoll.edu/aclifton/cs241/lecture-stack-c-functions.html
