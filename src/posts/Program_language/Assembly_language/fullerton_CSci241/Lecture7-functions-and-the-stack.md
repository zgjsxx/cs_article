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

这相当于一个 ```while``` 循环，如果 ```BUFLEN``` 为 0，则循环根本不会运行。

## 计算 ```rax``` 的符号

如果 ```rax``` 为负，则将 ```rbx``` 设置为 -1；如果等于 0，则将 rbx 设置为 0；如果为正，则将 ```rbx``` 设置为 +1：

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

当```rax```在 0 到 9 之间 ，并且 ```rbx``` 在 0 到 15 之间时， 进入循环:

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

这等效于下面的C/C++代码：

```cpp
for(int rax = 0; rax < 10; ++rax) {
    for(int rbx = 0; rax < 16; ++rbx){
        // loop body
    }
}
```

## 示例：循环用户输入

我们想要编写一个程序，从用户处输入最多 256 个字节，然后将所有小写字母转为大写并打印出结果。在 C/C++ 中，其主循环如下所示：

```cpp
char buffer[256];
// Read input

unsigned rdi = 0;
while(rdi < 256) {
    if(buffer[rdi] >= 'a' && buffer[rdi] <= 'z')
        buffer[rdi] -= 32;

    ++rdi;
}

// print buffer
```


```X86asm
;;;;
;;;; sys_read.s
;;;; Read from stdin into a buffer.
;;;; 
section .bss

; Buffer of 256 bytes
BUFLEN:   equ           256
buf:      resb          BUFLEN

SYS_read:   equ         0
SYS_write:  equ         1
SYS_stdin:  equ         0
SYS_stdout: equ         1
SYS_exit:   equ         60

section .text

to_uppercase:

  ; rdi = addr of character
  cmp byte [rdi], 'a'
  jb .done

  cmp byte [rdi], 'z'
  ja .done

  sub byte [rdi], 32 ; Convert to upper-case

  .done:
  ret


global _start
_start:

  ; Read syscall
  mov rax, SYS_read
  mov rdi, SYS_stdin
  mov rsi, buf
  mov rdx, BUFLEN
  syscall

  mov rcx, rax          ; rax = number of bytes read
  mov rdi, buf          ; rdi = addr. of char to process
  .capitalize_loop:

    call to_uppercase

    inc rdi
    dec rcx
    jnz .capitalize_loop  ; No cmp; dec sets ZF for us 

  ; Write syscall
  mov rdx, rax          ; rax = number of bytes read
  mov rax, SYS_write
  mov rdi, SYS_stdout
  mov rsi, buf
  syscall

  ; Exit syscall
  mov rax, SYS_exit
  mov rdi, 0
  syscall
```

这引入了一个简单的函数 to_uppercase ，它处理将单个字符转换为大写。

## 条件移动

由于条件跳转的代价比较大，因此增加了条件移动以解决该问题。条件移动只是一个 ```mov```，它检查标志寄存器，并且仅在根据条件设置了标志时才执行 ```mov```。条件代码与条件跳转相同：

|操作|描述|标志|
|--|--|--|
|```cmove```|如果```op1 == op2```则进行移动|```ZF = 1```|
|```cmovne```|如果```op1 != op2```则进行移动|```ZF = 0```|
|```cmovl```|如果```op1 < op2```则进行移动, 有符号|```SF != OF```|
|```cmovle```|如果```op1 <= op2```则进行移动， 有符号|```ZF == 1 or SF != OF```|
|```cmovg```|如果```op1 > op2```则进行移动， 有符号|```ZF == 0 and SF == OF```|

## 线性搜索

为了回顾循环和分支，我们将构建一个线性搜索函数。该函数将从头到尾循环遍历数组，搜索特定值。如果找到该值，它将返回该值在数组中的索引；如果不存在，则返回 -1（= 0xffffff…无符号）。

在 C/C++ 中这将是: 

```cpp
unsigned linear_search(char* buffer, unsigned length, char target) {
    unsigned i = 0;
    while(i != length) {
        if(buffer[i] == target)
            return i;

        ++i;
    }

    return -1;
}
```

在汇编中，我们将完成从随机数据文件加载数组的步骤，以便引入一些新的系统调用。我们将使用的现有系统调用是：

- read (0) – 从文件描述符中读取特定数量的字节
- exit (60) – 结束进程

我们将使用的新系统调用是:

- open (2) – 打开文件。此系统调用的参数是（以 null 结尾的）文件名、文件访问模式（只读、只写或读写）以及文件创建模式（除非创建新文件，否则将忽略该模式）。 open 返回 rax 中的文件描述符，如果出错则返回 -1。

- close (3) – 关闭打开的文件描述符。参数是文件描述符（来自打开）。

```.data``` 部分如下所示：

```x86asm
section .data

TARGET:         equ     126

filename:       db      "random.dat", 0         ; Filenames are nul-terminated

; 1M buffer to load the file
BUFLEN:         equ     1024*1024
buffer:         times BUFLEN    db 0

;; Syscalls
SYS_open:       equ     2
SYS_close:      equ     3
SYS_read:       equ     0
SYS_exit:       equ     60

;; File access mode
O_RDONLY:       equ     0
```

（文件 random.dat 存在于服务器上的 /usr/local/class/cs241/random.dat 中。它包含 1MB 的随机数据。）

我们程序的主要步骤是：

- 打开文件 random.dat
- 如果文件打开成功，则从文件中读取 1MB 到缓冲区
- 关闭文件
- 对 TARGET 进行线性搜索
- 退出进程，以4返回的索引作为退出码

步骤 1 只是将参数传递给 ```open``` 系统调用：

```x86asm
 mov rax, SYS_open
    mov rdi, filename   ; nul-terminated filename
    mov rsi, O_RDONLY   ; access mode: read only
    mov rdx, 0          ; mode: ignored if file already exists
    syscall
```

步骤2：如果文件无法打开，rax将为-1，因此我们检查这一点，如果是这种情况则退出：

```x86asm
  ; Check return value: -1 indicates error
    cmp rax, -1
    jne .read_file
    ; Otherwise file did not open correctly.
    ; Exit with status code 1
    mov rdi, 1
    jmp .exit

.read_file:
```

```.exit``` 是 ```_start``` 函数末尾的一个标签，它调用 ```exit``` 系统调用：

```.read_file```: 标签标记步骤 2 第二部分的开始：

```x86asm
.read_file:
    ; File is open, rax = FD
    ; Read the entire file into the buffer.
    mov rdi, rax        ; rdi = FD
    mov rax, SYS_read
    mov rsi, buffer
    mov rdx, BUFLEN
    syscall
```

```rax``` 包含 ```open``` 返回的文件描述符，但 ```read``` 期望 FD 位于 ```rdi``` 中，系统调用位于 ```rax``` 中，因此我们必须稍微调整一下。

第 3 步：读取文件后，我们可以将其关闭

```x86asm
    mov rax, SYS_close
    ; rdi still contains FD
    syscall
```

（rdi 在步骤 2 中设置为文件描述符，并且系统调用保证保留 rdi，因此我们不需要像使用 rcx 那样将其保存到不同的寄存器。）

对于第 4 步，我们设置 Linear_search 函数的参数，然后调用它：

```x86asm
    mov rdi, buffer
    mov rsi, BUFLEN
    mov dl, TARGET
    call linear_search
```

最后，我们将 Linear_search 的返回值（在 rax 中）移至程序的退出代码（在 rdi 中）并调用 SYS_exit：
```x86asm
    mov rdi, rax    ; Return value is exit code
.exit:
    mov rax, SYS_exit
    syscall
```

请注意，如果我们由于文件未打开而跳转到 .exit，则 rdi 将在步骤 2 开始时设置为 1。

剩下的就是编写 Linear_search 函数：

```x86asm
linear_search:
    ; rdi = address of array
    ; rsi = length of array
    ; dl = target to search for
    ; Returns: rax = index of target, or -1 (0xffff...) if not found

    ... ; Function body

    ret
```

作为参考，我们正在翻译的 C/C++ 代码是:

```x86asm
    unsigned i = 0;
    while(i != length) {
        if(buffer[i] == target)
            return i;

        ++i;
    }

    return -1;
```

我们有一个 while 循环，因此我们将循环计数器（在 rax 中，因为这最终将成为我们的返回值）初始化为 0，然后检查条件:

```X86asm
    mov rax, 0

.while:
    cmp rax, rsi
    jne .not_found

    ...

.not_found:
    mov rax, -1
    ret
```

.not_found 标签和以下代码对应于 while 循环结束后返回 -1。在循环内，我们需要将目标（在 dl 中）与当前数组元素进行比较。虽然我们可能会麻烦地将 rax 添加到 rdi 来获取当前元素的地址，但我们会简化该过程，只需将 rdi 与 rax 一起递增，因此 rdi 始终指向当前数组元素。因此，我们有

```x86asm
        cmp dl, byte [rdi]
        jne .continue       ; Not equal: next iteration
        ret                 ; Equal, return current rax
```

where .continue：标记 while 循环的尾端，我们在其中递增索引（和地址）并跳转到循环的开头：

```x86asm
    .continue:
        inc rax
        inc rdi
        jmp .while
```

整个函数如下所示:

```x86asm
linear_search:
    ; rdi = address of array
    ; rsi = length of array
    ; dl = target to search for
    ; Returns: rax = index of target, or -1 (0xffff...) if not found

    mov rax, 0

    .while:
        cmp rax, rsi
        je .not_found

        cmp dl, byte [rdi]
        jne .continue       ; Not equal: next iteration
        ret                 ; Equal, return current rax

    .continue:
        inc rax
        inc rdi
        jmp .while
    .not_found:
    mov rax, -1
    ret
```
