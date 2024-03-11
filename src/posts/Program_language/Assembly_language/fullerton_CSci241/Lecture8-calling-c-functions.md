---
category: 
- 汇编语言
---

- [第八讲 ： 栈的结构 c函数调用规约](#第八讲--栈的结构-c函数调用规约)
  - [函数调用规约](#函数调用规约)
  - [栈操作](#栈操作)
  - [汇编中的排序](#汇编中的排序)
  - [检查排序情况](#检查排序情况)
  - [插入排序](#插入排序)
  - [二分查找](#二分查找)
  - [C 兼容函数](#c-兼容函数)
    - [```call```和```ret```](#call和ret)
    - [栈方向](#栈方向)
    - [栈对齐](#栈对齐)
    - [叶函数](#叶函数)
    - [传递参数](#传递参数)
    - [返回值](#返回值)
    - [栈帧](#栈帧)
  - [函数模板](#函数模板)
  - [附录](#附录)
    - [课程资源](#课程资源)


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

类似地，在函数中，我们会有保存所有call-preserved的寄存器，等函数执行完后再恢复它们。

```x86asm
func:
    push r12        ; Push any callee-saved registers in use
    ...
    pop r12         ; Restore them before return
    ret
```

正如我们将看到的，使我们的函数与 C 兼容将需要对函数前导码/序言进行一些更改才能正确设置栈。

## 栈操作

要手动向栈添加和删除元素，我们使用```push```和```pop```指令：

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

## 二分查找

实现二分搜索允许我们使用另一种条件操作：条件移动。条件跳转有点昂贵，因为 CPU 无法在跳转后预加载指令，直到它本身处理了条件跳转。条件移动是附加了条件代码的移动；仅当条件为真时才会发生移动。条件移动指令为 cmov**，其中 ** 是条件代码之一。

作为参考，C++ 中二分查找的实现是:

```cpp
unsigned long binary_search(long* arr, unsigned long len, long target) {
    unsigned long low = 0, high = len-1, mid;

    while(low < high) {
        mid = (high - low) / 2 + low;

        if(target < arr[mid])
            high = mid-1;
        else if(target == arr[mid])
            return mid;
        else
            low = mid+1;
    }

    if(arr[low] == target)
        return low;
    else
        return -1; // 0xffffffff... 
}
```

（通常我们会将条件写为 low <= high 并跳过最后的 if，但是，如果 low 和 high 都是无符号的，那么如果 high == 0 并且我们执行 high - 1，我们会得到 high = 0xfffff...，并且所以条件永远不会是假的。）

```x86asm
binary_search:

    ; rdi = address of array
    ; rsi = length of array
    ; dl = target to search for

    mov rax, 0          ; rax = low = 0
    mov rbx, rsi        ; rbx = high = len-1
    dec rbx;

.while:
    cmp rax, rbx
    jae .not_found      ; Stop if rax > rbx

    ; rcx = mid = (high - low)/2 + low
    mov rcx, rbx        ; rcx = high
    sub rcx, rax        ; rcx -= low
    shr rcx, 1          ; rcx /= 2
    add rcx, rax        ; rcx += low                        

    mov r14, rcx        ; r14 = mid+1
    inc r14
    mov r15, rcx        ; r15 = mid-1
    dec r15

    cmp rdx, qword [rdi + 8*rcx] ; compare target, arr[mid]
    cmovg rax, r14               ; target > arr [mid] ===> low = mid+1
    cmovl rbx, r15               ; target < arr [mid] ===> high = mid-1
    cmove rax, rcx               ; target == arr[mid] ===> rax = mid (index)
    je .return                   ; target == arr[mid] ===> return

    jmp .while
.not_found:
    cmp qword [rdi + 8*rax], rdx
    je .return

    mov rax, -1
.return:
    ret
```


代码部分

```x86asm
    mov r14, rcx        ; r14 = mid+1
    inc r14
    mov r15, rcx        ; r15 = mid-1
    dec r15
```

```x86asm
;;;;
;;;; sort_search.s
;;;; Sorting and searching in assembly.
;;;;
section .data

data:           incbin                  "random.dat"
DATLEN:         equ                     ($-data) / 8

sorted:         dq      1,9,2,8,3,7,4,6,5
SORTLEN:        equ     ($-sorted)/8

section .text

;;; _start
;;; Program entry point
global _start
_start:

    mov rdi, data
    mov rsi, DATLEN
    call insertion_sort

    mov rdi, data
    mov rsi, DATLEN
    mov rdx, 10000
    call linear_search
    mov r10, rax ; Save index

    mov rdi, data
    mov rsi, DATLEN
    mov rdx, 10000
    call binary_search

    mov r8, 0
    mov r9, 1
    cmp rax, r10
    cmove rdi, r8
    cmovne rdi, r9  

    ; Exit with sorted-ness in exit code    
    mov rax, 60
    syscall 

;;; is_sorted
;;; Returns true if an array is sorted.
;;;
;;; rdi = address
;;; rsi = length
;;; Returns: rax = 1 if sorted, 0 otherwise.
is_sorted:

    ; rdi = address of array
    ; rsi = length
    ; Returns: rax = 1 if sorted

    dec rsi
    mov rax, 0
.while:
        cmp rax, rsi
        je .done

        mov r8, qword [8*rax + rdi]
        mov r9, qword [8*rax + rdi + 8]
        cmp r8, r9
        jle .continue
        mov rax, 0        
        ret

    .continue:
        inc rax
        jmp .while

.done:
    mov rax, 1
    ret

;;; insertion_sort
;;; Sorts and array of qwords
;;; rdi = address
;;; rsi = length
;;; Returns nothing
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

;;; binary_search
;;; Does a binary search over an array for a target value
;;; rdi = address
;;; rsi = length
;;; rdx = target
;;; Returns: index of target or -1 (0xfffff...) if not found
binary_search:

    ; rdi = address of array
    ; rsi = length of array
    ; dl = target to search for

    mov rax, 0          ; rax = low = 0
    mov rbx, rsi        ; rbx = high = len-1
    dec rbx;

.while:
    cmp rax, rbx
    jae .not_found      ; Stop if rax > rbx

    ; rcx = mid = (high - low)/2 + low
    mov rcx, rbx        ; rcx = high
    sub rcx, rax        ; rcx -= low
    shr rcx, 1          ; rcx /= 2
    add rcx, rax        ; rcx += low                        

    mov r14, rcx        ; r14 = mid+1
    inc r14
    mov r15, rcx        ; r15 = mid-1
    dec r15

    cmp rdx, qword [rdi + 8*rcx] ; compare target, arr[mid]
    cmovg rax, r14               ; target > arr [mid] ===> low = mid+1
    cmovl rbx, r15               ; target < arr [mid] ===> high = mid-1
    cmove rax, rcx               ; target == arr[mid] ===> rax = mid (index)
    je .return                   ; target == arr[mid] ===> return

    jmp .while
.not_found:
    cmp qword [rdi + 8*rax], rdx
    je .return

    mov rax, -1
.return:
    ret

;;; linear_search
;;; Does a linear search in an array.
;;; rdi = address
;;; rsi = length
;;; rdx = target
;;; Returns rax = index of target or -1 (0xffff...) if not found
linear_search:
    ; rdi = address of array
    ; rsi = length of array
    ; dl = target to search for
    ; Returns: rax = index of target, or -1 (0xffff...) if not found

    mov rax, 0  ; Index

    .while:
        cmp rax, rsi
        je .not_found

        cmp rdx, qword [rdi + 8*rax]
        jne .continue       ; Not equal: next iteration
        ret                 ; Equal, return current rax

    .continue:
        inc rax        
        jmp .while
    .not_found:
    mov rax, -1
    ret
```
## C 兼容函数

正如我们所见，汇编中的函数的运行级别比 C 或 C++ 中的低得多。我们必须学习如何手动管理函数使用的栈空间。

### ```call```和```ret```

实现函数调用的基本指令是```call```和```ret```：
- ```call Func``` 将 IP 寄存器 ```rip``` 压入堆栈，然后跳转到标记 Func 处执行
- ```ret``` 将栈顶弹出到 ```rip``` 中，然后跳转到 ```rip```。因为 ```rip``` 总是指向下一条指令，所以这将立即跳转到将我们带入该函数的调用之后的指令。

在底层，栈记录了程序return之后跳转到那里执行。这使得我们可以在函数f中调用函数g，在函数g中调用函数h，当g和h返回时,由于栈上保留了返回地址，程序可以返回到函数f后继续执行。

这并不是栈的全部用途，所以我们还将栈用于：
- 临时存储我们想要保存并稍后恢复的寄存器值。
- 当函数的参数多于为此指定的六个寄存器所容纳的参数时，传递参数。
- 当返回值大于 ```rdx:rax``` 所能容纳的值时，使用栈作为返回值
- 局部变量，当局部变量多于可用寄存器时（或者当我们需要使用局部变量的地址时，由于寄存器没有地址，此时需要使用栈）。

### 栈方向

栈从程序内存空间的末尾开始，向下增长。因此，栈操作```push```和```pop```有以下效果:
- ```push x```：从```rsp```中减去x的大小（以字节为单位），然后```mov [rsp], x```。
- ```pop x```: ```mov x, [rsp]``` 然后将 x 的大小添加到 ```rsp``` 中。

重要的是要记住，压入/弹出操作数的大小会影响栈指针的移动方式。如果你压入一个word，```rsp```将减2。您可以```push```/```pop```寄存器、内存操作数或立即数，但最小大小是一个字的大小，您不能```push```/```pop```单个字节。

### 栈对齐

System-V x86-64 函数调用规范要求栈顶部（即 ```rsp``` 中的地址）始终与 16 字节的倍数对齐，并在任何调用指令之前加上 8 字节的偏移量。这意味着 ```rsp``` 的值必须始终可表示为:

$$rsp=16a+8$$

将```rsp```除以16余数是8。

余数是 8 的原因是调用本身将 8 个字节以返回地址的形式压入栈。只要我们不与系统的其余部分交互，我们就不必担心这一点，但一旦我们尝试编写 ```main``` 而不是 ```_start```，我们就需要遵循这些规则。

当系统调用我们的 main 函数时，它会以这种方式为我们设置栈，但随后它会立即push ```rip```，使其再次减少 8。因此，每个函数应该做的第一件事是重新对齐堆栈指针，或者通过：
- 从 rsp 中减去 8： ```sub rsp, 8```
- 将 rbp 压入堆栈（见下文）：```push rbp```

在返回之前，函数应该撤消这些操作，以便当 ```ret``` 弹出 ```rip``` 时，堆栈将再次正确对齐。

类似地，如果您将参数压入堆栈（请参阅下一节），则必须确保调用之前的最终 rsp 正确对齐，否则调用将出现段错误，因为编译器已在程序集中生成对齐移动的函数。

### 叶函数

"叶子函数"是指：
- 将其所有参数放入寄存器中
- 将其结果返回到寄存器中
- 不调用任何其他函数
- 不将任何内容压入堆栈

即，叶子函数不直接或间接使用堆栈。因此，叶子函数可以不对齐栈指针，也可以跳过设置 rbp（见下文）。这很好，因为叶子函数永远不会调用另一个函数或使用堆栈。



### 传递参数

传统上，参数是通过将参数压入堆栈来传递的，其顺序与传递参数的顺序相反。这会在调用函数时产生大量开销，因为函数必须访问内存才能读入其参数。x86-64 应用程序二进制接口（定义了函数调用约定和许多其他标准汇编级“接口”）对此进行了修改，以便：

- 前六个（非浮点）参数通过寄存器传递，特别是寄存器 ```rdi```、```rsi```、```rdx```、```rcx```、```r8``` 和 ```r9```。 
- 如果参数小于 64 位，那么它应该使用其各自寄存器的适当部分（例如，32 位的 ```edi```）。
- 前 8 个浮点参数通过浮点寄存器 ```xmm0``` 到 ```xmm7``` 传递。
- 任何剩余的参数都以相反的顺序压入堆栈。

大于 64 位的参数通常在堆栈上或在内存中作为地址传递。稍后我们将介绍传递/返回结构，但同时请参阅 System-V x86-64 ABI 以了解所有详细信息。

例如，假设我们有一个函数：

```c
int f(long x, float y, char* z);
```

该函数在调用/返回时使用的寄存器是：
- ```rdi```: 包含 ```x``` 的值（带符号的 qword）
- ```xmm0```: 包含```y```的值
- ```rsi```： 包含```z```的值
- ```eax```: 包含了返回值(dword)

请注意，由于任何基于栈的参数都是由调用函数压入的，因此它们将出现在栈上调用指令压入的 ```rip``` 值下方。如果您将被调用函数的栈帧（见下文）视为在推送的 ```rip``` 处开始，这可能会有些令人惊讶。栈帧首先包括函数需要保留（调用者保留）的任何寄存器，然后是任何基于堆栈的局部变量。

另请注意，因为函数在 rip 之前推送任何额外的参数，所以被调用的函数不可能将它们弹出。因此，如果你的函数将任何参数压入堆栈，它应该将它们弹出，或者在函数返回后适当地增加 rsp ，以便使堆栈保持相同的状态。

如上所述，在执行调用之前，栈指针必须对齐到 16 + 8 的倍数，因此，如果您正在调用具有任何基于栈的参数的函数，则应该将这些参数的总大小相加，然后，如果必要时，调整 rsp（通过减法）以使其对齐。

要求堆栈对齐的原因是它可以使用更有效的对齐移动指令。这些将值移入/移出向量寄存器 xmm0,1,...，但它们要求内存操作数的地址与 8 字节的倍数对齐。尝试从未对齐的地址进行对齐移动会触发段错误。 （例如，如果您在没有首先对齐堆栈指针的情况下调用 C 库函数，则您的程序将在调用点出现段错误。）

### 返回值

返回结果应放置在 ```rax``` 中，如果是浮点数，则应放置在 ```xmm0``` 中。从技术上讲，```rax``` 和 ```rdx``` 可用于返回两个值（C/C++ 中不支持）或单个 128 位值，如 ```rdx:rax```。

较大的返回值通常通过以下方式“返回”：将指向内存的指针作为隐式第一个参数传递（即，在 rdi 中，将列表中的所有剩余参数向下推），修改函数内的内存，然后在拉克斯。通常，调用函数会为其堆栈帧中的结构分配空间，但这对于被调用函数来说并不容易访问，因此需要指针参数。

### 栈帧

调用函数时创建的栈称为栈帧。栈帧中至少包括返回地址（即 ```ret``` 指令将跳转到的 ```rip```），但可能包括其他信息：
- 参数，如果超过 6 个
- 被调用者保存的寄存器的值
- 局部变量（如果寄存器太多而无法容纳）

许多小函数只需要返回地址即可；这些函数有一个固定大小的栈帧，大小刚好足以容纳地址（即 8 个字节）。

传统上，rbp（基指针）寄存器用于指向（某种程度上）函数栈帧的开头；它的值指向压入的返回地址上方的栈元素。如果我们想以这种方式使用 rbp，那么我们必须在函数调用中保留它，因此 rbp 指向的堆栈上的值实际上是调用函数的 rbp。因此，堆栈的布局如下:

|地址|内容|
|--|--|
||...|
||caller-saved registers...|
|rbp + n|...|
|rbp + 16|stack-based arguments|
|rbp + 8| ```rip```|
|rbp| 调用者的```rbp```|
|rbp - 8|callee saved regs |
|rbp-m|...|
|rsp|top of stack|
|...|red area|
|rsp-128 ||


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
