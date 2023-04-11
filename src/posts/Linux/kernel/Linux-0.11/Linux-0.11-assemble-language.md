
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

## mov(x)

movb:复制8位数据(1个字节)

movw:复制16位数据(2个字节)

movl:复制32位数据(4个字节)



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
    SI = SI + 1 , DI = DI + 1 ；
else if DF = 1 
    SI = SI - 1 , DI = DI - 1 ;

movw: 
if DF = 0:
    SI = SI + 2 , DI = DI + 2 ；
else if DF = 1:
    SI = SI - 2 , DI = DI - 2 ;


## TEST
**功能**: 执行BIT与BIT之间的**逻辑与**运算

TEST可以判断测试位是否为0。



## JE JZ
JE和JZ的功能是相同的。

如果标志位ZF=1， 则进行跳转

如果标志位ZF=0， 则不进行跳转

## JNE JNZ
JNE和JNZ的作用是相同的。

如果标志位ZF=0， 则进行跳转

如果标志位ZF=1， 则不进行跳转