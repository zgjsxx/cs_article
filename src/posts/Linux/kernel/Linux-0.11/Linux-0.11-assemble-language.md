
# Linux-0.11中的汇编

## movx

movb:复制8位数据(1个字节)

movw:复制16位数据(2个字节)

movl:复制32位数据(4个字节)

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