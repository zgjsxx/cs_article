---
category: 
- 计算机架构
tag:
- 计算机架构
---

- [时序逻辑电路回顾](#时序逻辑电路回顾)
  - [D锁存器(D-Latch)](#d锁存器d-latch)
  - [D触发器(D-Flip-Flop)](#d触发器d-flip-flop)
  - [寄存器](#寄存器)
  - [移位寄存器](#移位寄存器)
  - [计数器](#计数器)
  - [摩尔状态机](#摩尔状态机)
  - [米利状态机](#米利状态机)
  - [内存](#内存)


# 时序逻辑电路回顾

## D锁存器(D-Latch)

## D触发器(D-Flip-Flop)

## 寄存器

前面我们提到的触发器可以用于保存数据，但是其只能在一个时钟周期内保持住数据，当下一个时钟周期到来时，新的数据就会写入进去。

寄存器可以由一个触发器和一个2-1的多路选择器(Mux)构成。写使能引脚(WE)是2-1 Mux的选择输入端。当```WE = 1```时，将来自IN端口的新数据传输到触发器输入端口。当```WE = 0```时，任何尝试向寄存器写入新数据的操作都会被屏蔽，寄存器将保持旧值。

下图展示的就是一个单比特的寄存器的电路图。

![register](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/register.png)

## 移位寄存器

## 计数器

## 摩尔状态机

## 米利状态机

## 内存