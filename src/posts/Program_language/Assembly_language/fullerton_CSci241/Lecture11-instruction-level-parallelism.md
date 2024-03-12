---
category: 
- 汇编语言
---

# 第十一讲：指令级并行, SIMD 和流水线

如果 ```xmm``` 寄存器是 128 位宽，但浮点值是 32 或 64 位宽，那么剩下的位是什么？答案是，更多的浮点值！每个 ```xmm``` 寄存器都可以被视为打包到单个寄存器中的 4 个单精度或 2 个双精度浮点值的数组。 所有上述操作仅对寄存器中的“低”值进行操作（以数组表示法，```xmm[0]```）.他们通常只是复制其余元素不变。

```x86asm
addps xmm0, xmm1
; 等同于:
;   xmm0[0] += xmm1[0]
;   xmm0[1] += xmm1[1]
;   xmm0[2] += xmm1[2]
;   xmm0[3] += xmm1[3]
; 但是是同时运行的
```

这与只执行一次加法的普通 ```addss``` 指令占用相同的 CPU 时间。 （第一个 s 代表“标量”，而 p 代表“打包”。）

这种并行性称为**单指令-多数据** (**S**ingle-**I**nstruction, **M**ultiple-**D**ata), 简称SIMD。我们发出一条指令，但它并行应用于多个操作数。

需要记住的一件事是，因为这些操作与正常的“解包”浮点操作花费相同的时间，所以即使我们只有一个浮点值要操作，我们也可以使用它们， 只是忽略所有其他结果。有些“打包”操作没有解包的单元素等价物，但即使在非并行代码中，您也应该随意使用它们。

另一件需要注意的事情是，许多压缩操作需要整数操作数，或者直接对其操作数的位进行操作。一般来说，这些指令对浮点操作数没有意义，除了一种情况：操作符号位。在单精度和双精度浮点值中，符号位始终是最高位。因此，我们可以使用打包的按位 AND/OR/XOR 运算来操作浮点数的符号，而无需求助于乘以 -1 之类的技巧:

```x86asm
; This sets up xmm1 so that only the high bit is set
cmpeqd xmm1, xmm1   ; xmm1 == xmm1? True, sets all bits to 1
pslld  xmm1, 31

xorps xmm0, xmm1 ; xmm0 = -xmm0
orps  xmm0, xmm1 ; xmm0 = -abs(xmm0)
pandn xmm0, xmm1 ; xmm0 = abs(xmm0)
```

- ```cmpeqd``` 比较源和目标中的双字元素是否相等；如果比较为真，则每个元素设置为全 1；如果比较为假，则设置为全 0。因此，这将 xmm1 设置为全 1。
- ```pslld``` 对每个元素执行左移。将每个元素向左移动 31 位，实际上会移动 31 个 0，在最高位位置（符号位的位置）留下 1。
- ```xorps``` 对每对元素的位执行异或运算。由于 xmm1 中仅设置了符号位，因此这实际上翻转了 xmm0 的符号位。
- orps 对每对元素的位执行 OR 运算，将 xmm0 的符号位设置为 1。
- pandn 对这些位执行 AND-NOT 运算，首先对 xmm1 取反（这样除了符号位为 0 之外，它都是 1），然后与 xmm0 进行 AND 运算，清除符号位，同时保持其他位不变。

这种东西也可以用来直接在寄存器中“生成”浮点常量，而不是从内存中加载它。


## 压缩算术运算

最容易理解的压缩 (SIMD) 运算是算术运算；这些进行算术运算（+、-、*、/）并应用

**"垂直"与"水平"操作**

我们可以将打包操作视为“垂直”：我们有很多值，并且我们希望对它们应用相同的操作

```shell
xmm0[0]    xmm0[1]    xmm0[2]    xmm0[3]
   +          +          +          +   
   =          =          =          =
xmm1[0]    xmm1[1]    xmm1[2]    xmm1[3]
```

这与对序列元素求和等操作不同，我们可以将其视为“水平”：

```shell
a + b + c + d
```

在垂直运算中，没有任何加法依赖于任何其他加法，因此我们可以在一次加法的时间内同时完成所有这些操作。在水平操作中，无论我们如何分解，某些加法都必须等待另一个加法的结果。我们能做的最好的就是

```shell
(a + b) + (c + d)
```

但即使我们可以与 ```c + d``` 同时执行 ```a + b```，外部加法也必须等到这两个操作都完成。横向操作有数据依赖。操作的一部分必须等待另一部分。

复杂性理论家已经计算出了如果允许无限量的并行性，我们可以预期的加速程度。例如，如果我们有一个可以同时执行无限次加法的 CPU，那么我们可以在恒定时间内执行任意大小的垂直加法，O(1)。但水平添加由于其数据依赖性，仍然会需要一些等待。事实上，即使具有无限并行性，水平、数据相关的操作最多也可以以对数、O(logn) 的方式完成。无论我们有多少并行性，我们永远无法将它们降低到 O(1)。

```x86asm
haddps dest, src        ; add dest[0] = src[0]+src[1], dest[1] = src[2]+src[3]
haddpd dest, src
```

请注意，为了对所有四个元素求和，我们需要执行两个 haddps 指令。 hadd 和 hsub 是唯一支持的两个水平操作；所有其他打包操作都是垂直的。


### 移动打包数据

我们用于浮点的 ```movss```/```movsd``` 指令也可用于打包数据, 源数据的低位元素被复制到目标，而目标的其余元素保持不变。```movss```仅仅复制低32bit数据，```movsd```复制低64bit数据。

最简单的打包 mov 指令是 ```movups```/```movupd```。这会将 128 位数据从内存移动到 xmm 寄存器，从 xmm 寄存器移动到内存，或者从一个 xmm 寄存器移动到另一个 xmm 寄存器。数据被解释为四个单精度浮点数或两个双精度浮点数。```u``` 代表未对齐；当移入或移出内存时，这些指令不要求目标与 16 字节的倍数对齐。

```x86asm
movups dest, src
movupd dest, src
```

如果您知道内存数据与 16 字节的倍数对齐，则对齐移动会更快：
```x86asm
movaps dest, src
movapd dest, src
```

如果您尝试在未对齐的地址上使用对齐的 ```movap```，您的程序将会崩溃。

如果需要将单个值加载到 xmm 寄存器的所有元素中，可以使用 vbroadcast：

```x86asm
vbroadcastss dest, mem ; load dword from [mem] into all elements of dest
vbroadcastsd dest, mem ; load qword from [mem] into both elements of dest
```

### 在寄存器内移动

有许多指令可用于移动寄存器内的打包值。例如，movsldup 指令将源寄存器的偶数元素复制到目标寄存器的偶数和奇数元素中，并复制它们。那是，

```shell
movsldup xmm0, xmm1
```

等价于：

```shell
xmm0[0] = xmm0[1] = xmm1[0]
xmm0[2] = xmm0[3] = xmm1[2]
```

movshdup 执行相同的操作，但使用源的奇数元素。

### 压缩算术

所有正常的浮点运算都有压缩变体：

```x86asm
addps dest, src
addpd dest, src
subps dest, src
subpd dest, src
mulps dest, src
mulpd dest, src
divps dest, src
divpd dest, src
```

### 打包转换

所有 cvt 指令都包含等效指令。当与整数进行转换时，它们不是转换为通用寄存器，而是转换为 xmm 寄存器


### 打包比较

打包比较的工作方式与普通比较完全不同。因为相同的操作必须应用于 xmm 寄存器的所有元素，所以将比较结果写入标志寄存器（哪个结果？）是没有用的，即使有，我们将如何使用这些结果，因为（取决于比较）我们可能需要对寄存器的不同元素执行不同的操作？

打包比较将布尔（0 或 1）结果生成到另一个 xmm 寄存器中。然后，这些结果可以用作掩码，以避免操作特定元素，或相乘，将某些元素归零等。这扩展了条件移动范例，其中我们有一系列始终执行的指令，但部分指令有条件地激活/停用，取决于数据值。

```x86asm
cmpeqps  dest, src           ; ==
cmpltps  dest, src           ; <
cmpleps  dest, src           ; <=
cmpneps  dest, src           ; != 
cmpnltps dest, src           ; >=
cmpnleps dest, src           ; >
cmpordps dest, src           ; True if neither operand is NaN
```

如果比较结果为真，则将dest对应的元素设置为全1，否则设置为全0。

（所有这些实际上只是 cmpss 指令的别名，其第三个操作数具有不同的值。）

### 打包等价于浮点操作

|操作|描述|
|--|--|
|```maxps dest, src```|```dest = max(dest, src)```|
|```minps dest, src```|```	dest = min(dest, src)```|
|```sqrtps dest, src```|```dest = sqrt(src)```|
|```rcpps dest, src```|```dest = 1/src```|
|```rsqrtps dest, src```|```dest = 1 / sqrt(src)```|
|```roundps dest, src, mode```||
|```dpps```||



