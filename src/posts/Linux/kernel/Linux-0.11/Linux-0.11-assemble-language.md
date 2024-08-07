---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11中的汇编](#linux-011中的汇编)
  - [内嵌汇编](#内嵌汇编)
  - [mov(x)](#movx)
  - [add](#add)
  - [sub](#sub)
  - [mul](#mul)
  - [div](#div)
  - [lea](#lea)
  - [lds](#lds)
  - [lss指令](#lss指令)
  - [lodsb/lodsw](#lodsblodsw)
  - [stosb/stosw](#stosbstosw)
  - [xorl](#xorl)
  - [AND](#and)
  - [std和cld](#std和cld)
  - [test](#test)
  - [jcc](#jcc)


# Linux-0.11中的汇编

## 内嵌汇编
基本的格式是：
```c
asm ( "statements" 
    : output_regs 
    : input_regs 
    : clobbered_regs
    );
```

其中符号"c"(count)指示要把count的值放入ecx寄存器

类似的还有：
a        eax
b        ebx
c        ecx
d        edx
S        esi
D        edi
I        常数值，(0 - 31)
q,r        动态分配的寄存器
g        eax,ebx,ecx,edx或内存变量
A        把eax和edx合成一个64位的寄存器(use long longs)

例1：

```c
int a=10, b;
asm ("movl %1, %%eax; 
	  movl %%eax, %0;"
	 :"=r"(b)        /* 输出操作数 */
	 :"r"(a)         /* 输入操作数 */
	 :"%eax"         /* clobbered寄存器 */
	 );   
```

其中，
- b作为输出操作数，在汇编指令中使用%0来引用。a作为输入操作数，在汇编指令中使用%1来引用。
- r用来约束操作数，告诉GCC可以使用任意寄存器来存储被约束的操作数。
- 对于输出操作数，双引号内的约束符还需要添加一个修饰符'='，这个等号用来表示被修饰的是输出操作数，并且是只写的。

对于寄存器，使用两个百分号'%'作为前缀（不是一个）；而对于普通操作数，则使用一个百分号'%'作为前缀。这样便于GCC区分解析寄存器和普通操作数。

最后一个参数%eax，用于通知GCC，寄存器eax将会在汇编指令中被使用和修改，让GCC不要使用该寄存器来存储任何值。

第1条指令，表示将输入操作数a传入寄存器eax。

第2条指令，表示将寄存器eax的值传入输出操作数b中。

## mov(x)

movb:复制8位数据(1个字节)

movw:复制16位数据(2个字节)

movl:复制32位数据(4个字节)

## add

ADD (Addition)：将源操作数的值加到目标操作数中，并将结果存储在目标操作数中。
示例：将两个寄存器的值相加并存储到目标寄存器中：

```x86asm
ADD eax, ebx   ; 将 ebx 寄存器的值加到 eax 寄存器中，并将结果存储在 eax 中
```

## sub

SUB (Subtraction)：从目标操作数中减去源操作数的值，并将结果存储在目标操作数中。
示例：从目标寄存器中减去一个立即数并将结果存储到目标寄存器中：

```x86asm
SUB ecx, 10   ; 从 ecx 寄存器中减去 10，并将结果存储在 ecx 中
```

## mul

MUL (Multiplication)：将目标操作数乘以源操作数的值，并将结果存储在目标操作数中。
示例：将一个寄存器的值乘以另一个寄存器的值并存储到目标寄存器中：

```x86asm
MUL edx   ; 将 edx 寄存器的值乘以 eax 寄存器中的值，并将结果存储在 edx:eax 中
```

## div

DIV (Division)：将目标操作数除以源操作数的值，并将商存储在目标操作数中。
示例：将目标寄存器中的值除以一个立即数并将商存储到目标寄存器中：

```x86asm
DIV ebx   ; 将 eax:edx 寄存器中的值除以 ebx 寄存器中的值，并将商存储在 eax 中，余数存储在 edx
```

## lea

lea = Load Effective Address, 即加载有效地址。

```LEA Rt, [Rs1+a*Rs2+b] =>  Rt = Rs1 + a*Rs2 + b```

## lds

```x86asm
lds dest, src
```

把 ```src``` 指向的地址，高位存放在```DS```中，低位存放在```dest```中。

比如当前DS=1000H, BX=0100H。

当前内存:

```x86asm
1000:0100 01
1000:0101 02
1000:0102 03
1000:0103 04
```

而有一条指令:```LDS BX,[BX]```
```[BX]```指向```1000:0100```,执行后BX存低位的内容,也就是```BX=0201```H,
而DS则存高位的内容,也就是```[BX+2]```的内容,```DS=0403H```

## lss指令

lss指令是SS装入指令，格式如下 ```lss add, %esp``` 把add指向的内容装入到```SS:ESP``中。 这里要注意，add是一个内存地址，lss指令会把add指向的内存地址的前四字节装入ESP寄存器，后两字节装入SS段寄存器，而不是把add这个值装入ESP寄存器。 如：内存0x1000地址的内容为0x0000F000,0x0010，则lss指令会把0x0000F000装入ESP，0x0010装入SS段寄存器。

## lodsb/lodsw

lodsb等同于

```x86asm
mov al, ds:[si]
inc si
```

lodsw等同于

```x86asm
mov ax, ds:[si]
add si, 2
```

## stosb/stosw

stosb等同于：

```x86asm
mov al, ds:[si]
inc si
```

stosw等同于：

```x86asm
mov ax, ds:[si]
add si, 2
```

## xorl

按位异或，值相同为0，值不同为1，如果源操作数和目标操作数相同，等同于清零。

```x86asm
xorl %eax %eax
```

## AND 

调用格式：

```x86asm
AND source destination
```

对两个操作数对应位之间进行按位逻辑与操作，并将操作存放在目标操作数之中。


例如bootsect.s， 将dx和0x0100进行按位与，并将值放入到dx中。

```x86asm
and	$0x0100, %dx
```

## std和cld

CLD： 设置DF=0

STD： 设置DF=1

movb:
if DF = 0:
    SI = SI + 1 , DI = DI + 1 ;
else if DF = 1 
    SI = SI - 1 , DI = DI - 1 ;

movw: 
if DF = 0:
    SI = SI + 2 , DI = DI + 2 ;
else if DF = 1:
    SI = SI - 2 , DI = DI - 2 ;


## test

**功能**: 执行BIT与BIT之间的**逻辑与**运算

TEST可以判断测试位是否为0。

## jcc 

JE JZ

JE和JZ的功能是相同的。

如果标志位ZF=1， 则进行跳转

如果标志位ZF=0， 则不进行跳转


JNE JNZ
JNE和JNZ的作用是相同的。

如果标志位ZF=0， 则进行跳转

如果标志位ZF=1， 则不进行跳转