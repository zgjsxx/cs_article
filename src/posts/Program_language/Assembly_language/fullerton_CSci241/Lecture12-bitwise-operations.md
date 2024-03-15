---
category: 
- 汇编语言
---

# 第十二讲：按位运算

## 按位运算

位运算在汇编语言中很重要。我们已经学习了```xor```（异或），这里我们将学习其他操作```or```、```and```、```not```、```andn```（与非），以及**移位**和**旋转**操作。除了这些在 C/C++ 也有的位运算之外，汇编语言还支持 C/C++ 语言没有的一些位运算。```test```操作是按位进行比较的运算符，在条件跳转时可能会用它来构建跳转的状态位。

### AND，OR，NOT，AND-NOT位运算

```x86asm
not  dest         ; dest = ~dest
and  dest, src    ; dest = dest & src
or   dest, src    ; dest = dest | src
andn dest, src    ; dest = dest & ~src
xor  dest, src    ; dest = dest ^ src
```

上面的指令通常的限制如下：
- 两个操作数必须具有相同的大小，```dest```和```src```不能都在内存中，并且只有源操作数(```src```)可以是立即数。
- ```not``` 可以与寄存器或内存位置一起使用。

这些操作的真值表如下所示：
- 如果 a 为 0，则 ~a 为 1；如果 a 为 1，则 ~a 为 0：
  |a| ~a|
  |--|--|
  |0|1|
  |1|0|
- 只有当a和b都为1时a和b才为1，否则为0。
  |a| b| a & b|
  |--|--|--|
  |0|0|0|
  |1|0|0|
  |0|1|0|
  |1|1|1|
- 如果 a 或 b 为 1，则 a | b 为 1；只有当 a 或 b 均为 0 时，a | b 才为 0。
  |a|b| a or b| 
  |--|--|--|
  |0|0|0|
  |1|0|1|
  |0|1|1|
  |1|1|1|

- ```a&~b```，只有当a = 1且b = 0时， 结果才为1。
  |a|b| a & ~b| 
  |--|--|--|
  |0|0|0|
  |1|0|1|
  |0|1|0|
  |1|1|0|

- ```a^b```，当a和b有一个值为1时，结果为1。
  |a|b| a ^ b| 
  |--|--|--|
  |0|0|0|
  |1|0|1|
  |0|1|1|
  |1|1|0|


真值表反应的是单个比特位运算的计算方法。当应用于二进制数字，则将每个比特位执行相应的运算。例如：

```shell
   01101101
 & 11101110
------------ 
   01101100
```

### 设置/取消比特位， 翻转比特位

对一个比特位的常见操作有三种:
- 设置比特位(设置值为1)
- 取消比特位(设置值为0)
- 翻转比特位(原值为0，设置为1，原值为1，设置为0)

这些操作的第一个步骤是构造一个位掩码，我们希望操作的位的值为 1，其他位置的值为 0。

```x86asm
bitmask:   EQU   10000000b    ; Manipulate bit 7
```

如果位置不是恒定的，那么我们可以使用移位（见下文）来动态构造掩码。

要设置一个位，同时保持所有其他位不变，我们使用```or```。 ```x or 0 == x```，因此掩码中未设置的位将保持不变，但 ```x or 1 == 1```，因此掩码中已设置的位将被强制为 1。

```x86asm
or  rax, bitmask 
```

为了取消比特位，我们需要一个按位运算 OP，它满足 ```x OP 0 == x``` 和 ```x OP 1 == 0```。查看上面的真值表，我们发现与非运算就是我们想要的。

```x86asm
andn rax, bitmask
```

为了翻转一个比特位，我们需要一个操作 ```OP```，其中 ```x OP 0 == x``` 但 ```x OP 1 == ~x```。同样，从表中我们可以看到 ```xor``` 就是我们想要的：

```x868asm
xor rax, bitmask
```

如果需要一次性操作多个比特位，则需要一个设置了多个位的掩码，这样就可以一次性设置/清除/翻转多个位。

## 符号位的延伸

上面，汇编器负责将位掩码的值扩展为 64 位（```rax``` 的大小），以便大小匹配。实际上，位运算可以用在长度小于目标的立即数与目标数上。我们可以通过为立即数掩码显式指定大小来强制执行此行为：

```x86asm
mov rax, 0
or  rax, byte bitmask ; What bit(s) does this set?
```

当立即数的值（显式）小于目标值时，将符号扩展为目标值的大小。

现在我们想将其扩展到 16 位。如果我们简单地添加 0，那么我们有

```shell
0000000011111111b = 127 (!)
```

请记住，如果未设置高位，则该值为正！相反，我们将 11111111b 的最高位复制到我们添加的新位中：

```shell
1111111111111111b = -1
```

每当我们扩展一个有符号值时，我们都需要执行符号扩展。相反，如果我们扩展一个无符号值，那么我们一定不能执行符号扩展，因为它会给出错误的结果。为了扩展无符号值，我们执行零扩展，用零填充高位。

这两种转换的区别就是 ```movsx``` 和 ```movzx``` 操作的区别：

```x86asm
movsx dest, src      ; Sign-extend src into dest
movzx dest, src      ; Zero-extent src into dest
```

## 移位和旋转

在 C/C++ 中，我们有 ```<<``` 和 ```>>``` 运算符，它们执行**左移位**和**右移位**。它们通常用作乘/除2的便捷方式。要了解其原理，请考虑二进制值 3：

```shell
00000011    = 3
```

如果我们将位向左移动，则 1 值位变为 2，而 2 值位变为 4，得到

```shell
00000110    = 6
```

数字的低位会以0填充未占用的位置。左移一位乘以 2。左移 n 位乘以 ${2}^{n}$。

另外，将 6 右移一位得到 3，因此右移相当于除以 ${2}^{n}$（向下舍入）。在高位位置填充 0。

对于无符号值，移位的工作方式与上述完全相同。

当移动有符号值时，我们需要小心负值。例如，-6 = 11111010b。如果我们将其向右移动，同时用 0 填充高位，我们得到

```shell
01111101 = 125 (!)
```

当右移有符号值时，我们不想用零填充高位。相反，我们希望将现有的高位复制到其中，以便保留符号：

```shell
11111101 = -3
```

保留符号右移称为算术移位，而补零移位称为逻辑移位。大会两者都有。请注意，这种区别仅适用于右移；对于左移，我们总是用 0 填充低位。

对于移位操作的汇编指令如下所示：

```x86asm
shl dest, a    ; Logical shift left
sal dest, a    ; Arithmetical shift left
shr dest, a    ; Logical shift right
sar dest, a    ; Arithmetical shift right
```

虽然汇编有```shl```和```sal```指令，但它们执行相同的操作：左移，用0填充低位。操作数 a（要移位的位数）受到严格限制：它必须是 8 位立即数或 cl 寄存器（rcx 的低 8 位）。最大移位值为 63。

- 移位时，移走的高/低位被放入进位标志CF中。多位移位的行为就像按顺序执行多个 1 位移位一样。 （即，移出的最后一位将被放置在 CF 中。）
- 对于 1 位移位，如果符号已更改，则设置 OF 标志。

## 使用位移来构造掩码

我们可以使用移位指令来构造掩码，而不是直接硬编码创建掩码。例如，我们要构造掩码```00000000011001000b```。该掩码设置了第3位，第6位和第7位。为了创建这个，我们首先构建一个掩码，其中 0 位位置为 1，然后将其向上移动所需的量：

```x86asm
mov rax, 0  ; bitmask
mov rbx, 1

shl rbx, 3    ; Bit 3 of rbx is set 
or  rax, rbx  ; Bit 3 of rax is set
shl rbx, 3    ; Bit 6 of rbx is set
or  rax, rbx  ; Bits 3 and 6 of rax are set
shl rbx, 1    ; Bit 7 of rbx is set
or  rax, rbs  ; Bits 3, 6, and 7 are set
```


## 旋转

除了移位之外，汇编语言还能够向左或向右旋转位；将移位操作中被丢弃高/低位移动到另一端，以填充未占用的位位置。旋转没有直接的数学模拟，因此不如移位有用。

```shell
原数字：01101010

向左循环移动3位：01010011
```

```x86asm
ror  dest, a        ; Rotate dest a bits to the right    
rol  dest, a        ; Rotate dest a bits to the left
```

与位移位一样，数量 a 必须是立即数或 cl 寄存器，并且必须在 0 到 63 的范围内。 CF 标志设置为要从一端“移动”的最后一位的副本到另一个。

## ```test```指令

测试指令执行按位与，然后相应地设置 SF 和 ZF 标志。这可以与掩码一起使用来测试单个位（或一组位）是否打开：

```x86asm
test rax, 00010000b
jnz target              ; Jump if bit 4 is set in rax
```

它还可以用来测试一个值是否为0：

```x86asm
test rax, rax 
; If ZF == 1 then rax == 0
```

并测试一个值的符号：

```x86asm
test rax, rax
; If SF == 1 then rax < 0
```

测试特定位的更简单方法是使用 ```bt``` 指令：

```x86asm
bt a, b
```

```bt``` 将 a 中第 b 位的值复制到进位标志 CF 中。因此，如果 a 中设置了位 b，则 CF == 1，否则等于 0。a 可以是寄存器或内存，b 可以是寄存器或立即数。因此，测试 ```rax``` 的第 4 位的另一种方法是

```x86asm
bt rax, 4
jc target
```

位测试指令有多种变体，它们不仅将位复制到 CF，还同时设置、取消设置（“重置”）和翻转（补码）该位：

## 搜索位

有时我们需要扫描一个值并找到已设置的低端或高端的第一位。例如，在

00111000

第一个最低位组位于位置 3，而第一个最高位位于位置 5。指令 bsf（“位扫描正向”）和 bsr（“位扫描反向”）为我们提供了以下信息：

bsf 目标、源

bsr 目标、源

它们扫描源（寄存器/内存）并将位位置写入目标（寄存器）。

最后，还有许多奇数位指令，它们在翻转其他位等的同时搜索位。这些是 blsi、bzhi、blsr、blsmask、bextr 和其他一些。如果您对他们所做的事情感兴趣，请查找他们。

## 应用：伪随机数生成

纯粹通过算法在计算机上生成真正的随机数是不可能的。算法是一系列步骤，因此如果您完全重复这些步骤，您将得到相同的结果。相反，我们寻求“伪随机性”，即一系列看似随机的值，如果您忽略我们可以通过重新运行算法来重复它们的事实。有多种生成伪随机数的算法。其中大多数都维持某种内部状态，从一个数字持续到下一个数字。生成的数字源自状态，通常仅由状态的高 n 位组成，但有时使用更多复杂的变换。

最古老和最简单的是线性同余发生器，其基本形式:

```shell
state = (state * A + B) % m
```

其中 A 和 B 是必须仔细选择的常数。现代生成器经常利用按位运算，因为这允许状态中的位进行更多混合。 Java 8 中使用的 SplitMix 生成器使用 64 位状态以及右移和 XOR，在 C/C++ 中如下所示：

```c
static uint64_t x = ... ; // Seed/state

uint64_t next() {
    uint64_t z = (x += 0x9e3779b97f4a7c15);
    z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9;
    z = (z ^ (z >> 27)) * 0x94d049bb133111eb;

    return z ^ (z >> 31); 
}
```
[源码](http://xoshiro.di.unimi.it/splitmix64.c)

请注意，返回的值不是内部状态 x，而是它的变体 z。状态 x 的前进非常简单，增加一个常数。

为了在汇编中实现这一点，我们将状态存储在内存中，然后编写一个函数来推进它并返回下一个随机值。

```x86asm
section .data

state:      dq      137546  ; Seed value

section .text

next:
    push rbp
    mov rbp, rsp

    ; Constants
    mov r8,  0xbf58476d1ce4e5b9
    mov r9,  0x94d049bb133111eb
    mov r10, 0x9e3779b97f4a7c15 

    ; Update state
    add qword [state], r10
    mov rax, qword [state]

    ; z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9
    mov rbx, rax
    shr rbx, 30
    xor rax, rbx
    mul r8

    ; z = (z ^ (z >> 27)) * 0x94d049bb133111eb
    mov rbx, rax
    shr rbx, 27
    xor rax, rbx
    mul r9

    ; return z ^ (z >> 31)
    mov rbx, rax
    shr rbx, 31
    xor rax, rbx

    pop rbp
    ret
```
我们可以通过编写一个 ```main``` 来测试这一点，该 ```main``` 打印出生成的随机字节（注意：不是随机数，而是原始字节值），然后将它们提供给 PractRand 测试套件。这是该程序的其余部分：

```x86asm
section .data

state:      dq      137546  ; Seed value

buffer:     dq      0            

section .text

global _start
_start:

    push rbp
    mov rbp, rsp

.loop:

    call next
    mov [buffer], rax

    mov rax, 1          ; Write syscall
    mov rdi, 1          ; Stdout
    mov rsi, buffer     ; Address 
    mov rdx, 8          ; Length
    syscall

    jmp .loop

    pop rbp

    mov rax, 60
    mov rdi, 0
    syscall

next: 
    ... ; Remainder of next function
```

然后使用下面的命令进行测试：

```shell
./splitmix | RNG_测试标准输入
```

这基本上让 splitmix 永远运行，不断地吐出随机数据，由 RNG_test 消耗。 RNG_test 对收到的数据运行一系列统计测试，并针对越来越大的数据块报告任何问题。

## 附录

原文连接：https://staffwww.fullcoll.edu/aclifton/cs241/lecture-bitwise-operations.html