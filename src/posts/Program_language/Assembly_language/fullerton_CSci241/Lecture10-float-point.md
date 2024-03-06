---
category: 
- 汇编语言
---

# 第十讲：浮点数

由于历史原因，x86-64 有两个独立的浮点系统，它们之间的功能有一些重叠，但也有一些不同的功能。这两个系统是：

- 旧的 x87 协处理器指令集
- 较新的 XMM 矢量处理指令

无论哪种方式，浮点运算都使用一组完全不同的寄存器以及一组完全不同的操作。浮点值以二进制表示，其方式与有符号或无符号值完全不同。

## 浮点数的表示方法

我们可以使用三种浮点大小/表示形式，分别是 ```float```（32 位）、```double```（64 位）和 ```long double```（80 位，存储为 128 位，有 48 个未使用的填充位）。表示形式相似，唯一的区别是专用于数字每个部分的位数。实际的浮点格式（哪位执行什么操作）由名为 IEEE-754 的国际标准定义。

IEEE-754 浮点格式将小数值表示为三个字段的组合：
- 符号位 s，如果值为负则设置
- 指数 s，表示为（有偏差的）有符号二进制值。该值存储为实际指数加上固定偏差值 b。对于 32 位浮点值，偏差为 127。这意味着指数 0 在内部存储为 01111111b，-1 为 01111110b，1 为 10000000b，依此类推。
- 小数部分称为尾数 m，通常在 [1,2) 范围内（即 ≥ 1 但 < 2）。在标准化浮点值中，小数部分向左移动，因此第一个设置位被移出，因为该值的左侧几乎总是有一个隐式 1 位。（移动尾数需要增加/减少指数以保持相同的值。）

0 作为特殊情况处理。

使用这些字段的浮点数的值为

$$(-1s)(1 + m){2}^{e-b} $$

例如，浮点数 0.75 在二进制中是

```shell
0.110000000
```

指数为 ${2}^{0}$。然而，IEEE-754 要求我们将尾数向左移动，直到周期左侧的位被设置：

```shell
1.10000000 (mantissa, = 1.5)
```

要恢复其十进制值：

- 找到尾数的十进制值 (0.5) 并加上 1.0。 （= 1.5）。
- 将尾数的十进制值乘以 2 指数
- 如果符号位为 1，则将十进制值乘以 -1。

## 二进制的表示

32位的浮点数的格式如下所示, 有1位是符号位， 有8位是指数位，有23位是尾数。

<style type="text/css">

.tablestyle
  {
    border-collapse:separate;
    border:1px solid black;
  }

 .tdstyle 
  {
  border:1px solid black;
  }

 .thstyle 
  {
  border:1px solid black;
  }

</style>

<table class="tablestyle">
    <tr>
        <th colspan="1"  class="thstyle">s</th><th colspan="8" class="thstyle">exponent</th><th colspan="23" class="thstyle">mantissa</th>
    </tr>
    <tr>
        <th class="thstyle">31</th><th class="thstyle">30</th><th class="thstyle">29</th><th class="thstyle">28</th><th class="thstyle">27</th><th class="thstyle">26</th><th class="thstyle">25</th><th class="thstyle">24</th><th class="thstyle">23</th><th class="thstyle">22</th><th class="thstyle">21</th><th class="thstyle">20</th><th class="thstyle">19</th><th class="thstyle">18</th><th class="thstyle">17</th><th class="thstyle">16</th><th class="thstyle">15</th><th class="thstyle">14</th><th class="thstyle">13</th><th class="thstyle">12</th><th class="thstyle">11</th><th class="thstyle">10</th><th class="thstyle">9</th><th class="thstyle">8</th><th class="thstyle">7</th><th class="thstyle">6</th><th class="thstyle">5</th><th class="thstyle">4</th><th class="thstyle">3</th><th class="thstyle">2</th><th class="thstyle">1</th><th class="thstyle">0</th>
    </tr>
</table>

指数位是进行了+127的偏移， 因此 指数 0 将存储为 ```127 (= 01111111b)```。这使得指数的范围是-127 到 + 128。

请注意，符号位位于高位，这意味着我们可以相对轻松地执行一些浮点操作。例如，要将浮点值转换为其绝对值（符号 = 0），只需将其与 0111…11 进行按位与即可。类似地，要确定浮点值是否为负，只需执行加载符号标志的操作。(例如，```tst rax、rax```）

## 尾数

尾数以二进制小数形式存储；最左端有一个隐含的 1 和小数点。因此:

```shell
10000000000000000000000b
```

实际上以十进制表示:

$$1 × {2}_{0} + 1 × {2}_{-1} + 0 × {2}_{-2} + ... = 1.5 $$

```1.``` 不与值一起存储，它是隐式的。

就像以二进制存储整数值时一样，我们将位乘以 2 的递增幂，然后将它们相加，这里我们将位乘以 2 的负幂和递减幂，然后将它们相加。

## 指数

指数有效地允许我们将尾数中的位向左或向右“移动”，同时将（隐式）小数点保持在同一位置。例如，要表示值 1.0，我们将使用尾数：

```shell
0.1000000000000000000000b = 0.5 (1.5 really)
```

但其指数为 10000000b = 1（无偏），

```1.5 * 21 = 3.0``` 或 ```11.0000...b．```

## 64位的表示方法

64 位和 80 位表示使用相同的基本原理，只是指数和尾数字段的大小不同：

|Size|	C/C++ type|	Exponent size| Mantissa size|
|--|--|--|--|
|32-bit|	float	|8 bits	|23 bits|
|64-bit|	double	|11	bits  |52bits |

80 位 ```long double```表示略有不同：它使用15位指数，63位尾数，并且m的最高位中的隐含1实际上被存储，作为指数和尾数之间的位。该位称为整数位，它允许 0 具有更自然的表示形式，即全 0 的尾数（在 IEEE-754 格式中，表示尾数 1.0）。

IEEE-754 标准也定义了 128 位和 256 位浮点表示形式，但我们不用关心它们。

## XMM 浮点指令

CPU 上的现代浮点单元及其专用寄存器与向量 (SIMD) 单元（以及旧的 x87 单元）共享资源。事实上，大多数现代浮点实际上是矢量化浮点代码。正如我们将要做的那样，真正的代码很少一次只对一个值进行操作。

### 寄存器

有 16 个浮点寄存器，名为 ```xmm0```到 ```xmm15```。这些寄存器的大小实际上均为 128 位，但我们将仅使用 32 位或 64 位部分，这对应于我们正在使用的浮点大小。一般来说，后缀 s 用于表示单精度（float），而后缀 d 用于表示双精度（double）。

```xmm0``` 到 ```xmm7``` 用于传递浮点参数。 ```xmm8-15``` 是临时（调用者保存的）寄存器。


### 移动浮点值

```x86asm
movss dest, src         ; Move floats
movsd dest, src         ; Move doubles
```

两个专用的 mov 指令用于移动浮点值。像往常一样，两个操作数必须具有相同的大小，并且大小必须与指令匹配。目标和源可以是内存或（xmm）寄存器，但不能同时是内存。与普通的 ```mov``` 指令不同，源不能是立即数。要将常量浮点值加载到寄存器中，它必须已经存在于内存中。请注意，寄存器操作数必须是浮点寄存器。

### 在 ```.data``` 中存储浮点值

使用```dd```（双字）存储32位浮点值，使用```dq```（四字）存储64位值。例如：

```x86asm
section .data

pi:     dq      3.14159
```

### 浮点转换

存在用于在 32 位和 64 位格式之间进行转换以及将整数转换为浮点值的指令，反之亦然。

|指令|描述|
|```cvtss2sd dest, src```|将 32 位浮点数转换为 64 位浮点数 src 可以是内存、浮点寄存器或通用寄存器|
|```cvtsd2ss dest, src```|将 64 位浮点数转换为 32 位浮点数|
|```cvtss2si dest, src```|将 32 位浮点数转换为 32 位有符号整数 dest 可以是浮点寄存器或通用寄存器|
|```cvtsd2si dest, src	```|将 64 位浮点数转换为 32 位整数|
|```cvtsi2ss dest, src```|将 32 位有符号整数转换为 32 位浮点数|
|```cvtsi2ss dest, src```|将 32 位有符号整数转换为 64 位浮点数|

**算术**

```x86asm
addss dest, src         ; dest += src (float)
addsd dest, src         ; dest += src (double)
subss dest, src         ; dest -= src (float)
subsd dest, src         ; dest -= src (double)
mulss dest, src         ; dest *= src (float)
mulsd dest, src         ; dest *= src (double)
divss dest, src         ; dest /= src (float)
divsd dest, src         ; dest /= src (double)
```

所有这些的三操作数版本都带有 v 前缀：

```x86asm
vaddss dest, src1, src2  ; dest = src1 + src2
vaddsd dest, src1, src2  ; dest = src1 + src2
vsubss dest, src1, src2  ; dest = src1 + src2
vsubsd dest, src1, src2  ; dest = src1 + src2
vmulss dest, src1, src2  ; dest = src1 + src2
vmulsd dest, src1, src2  ; dest = src1 + src2
vdivss dest, src1, src2  ; dest = src1 + src2
vdivsd dest, src1, src2  ; dest = src1 + src2
```

```dest```和```src```操作数必须是xmm寄存器； ```src2``` 可以是寄存器或内存。所有操作数的大小必须相同。

提供了许多更高级的数学运算作为说明：

|指令|描述|
|--|--|
|```sqrtss dest, src```<br /> ```sqrtsd dest, src```|```dest = sqrt(src)``` 开根号|
|```rcpss dest, src```|```dest = 1/src```|
|```rsqrtss dest, src```|```dest = 1/sqrt(src)```|
|```maxss dest, src```<br /> ```maxsd dest, src```|dest =maximum of dest, src|
|```minss dest, src```<br /> ```minsd dest, src```|dest =minimum of dest, src|
|```roundss dest, src, mode```|Round src into dest using mode <br />mode = 0 ties go to even<br />mode = 1 round down<br />mode = 2 round up<br />mode = 3 round toward 0|

## 附录

浮点数工具： https://baseconvert.com/ieee-754-floating-point

浮点数： https://polarisxu.studygolang.com/posts/basic/diagram-float-point/
