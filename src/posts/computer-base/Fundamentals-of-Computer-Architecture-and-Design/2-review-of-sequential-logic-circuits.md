---
category: 
- 计算机架构
tag:
- 计算机架构
---

- [计算机基本架构-时序逻辑电路回顾](#计算机基本架构-时序逻辑电路回顾)
  - [D锁存器(D-Latch)](#d锁存器d-latch)
  - [D触发器(D-Flip-Flop)](#d触发器d-flip-flop)
  - [寄存器](#寄存器)
  - [移位寄存器](#移位寄存器)
  - [计数器](#计数器)
  - [摩尔状态机](#摩尔状态机)
  - [米利状态机](#米利状态机)
  - [内存](#内存)


# 计算机基本架构-时序逻辑电路回顾

## D锁存器(D-Latch)

## D触发器(D-Flip-Flop)

## 寄存器

前面我们提到的触发器可以用于保存数据，但是其只能在一个时钟周期内保持住数据，当下一个时钟周期到来时，新的数据就会写入进去。

寄存器可以由一个触发器和一个2-1的多路选择器(Mux)构成。写使能引脚(WE)是2-1 Mux的选择输入端。当```WE = 1```时，将来自IN端口的新数据传输到触发器输入端口。当```WE = 0```时，任何尝试向寄存器写入新数据的操作都会被屏蔽，寄存器将保持旧值。

下图展示的就是一个单比特的寄存器的电路图。

![one-bit-register](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/one-bit-register.png)

下图展示的是一个寄存器的时序图，描述了一位寄存器的操作。当WE输入为0时， IN端口的输入数据被屏蔽。在第二个时钟周期的中间，当WE输入变为1, 新数据被允许通过 2-1 MUX并在第三个时钟周期开始时更新寄存器的内容。在第三个时钟周期结束之前，WE输入转换为逻辑0，并导致寄存器输出OUT在第四个时钟周期期间保持为逻辑1。

![one-bit-register-timing-diagram](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/one-bit-register-timing-diagram.png)

从单比特寄存器推导出更复杂的寄存器是容易的。下图显示的是一个32比特的寄存器。32比特的寄存器拥有公共的时钟(clock)和写使能输入(WE)。因此，如果WE（写使能）输入为逻辑1，那么在时钟上升沿，输入端的32位数据将会被写入寄存器。

![32-bit-register](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/32-bit-register.png)


## 移位寄存器

移位寄存器是普通寄存器的特定版本，它可以根据设计需求专门用于向右或向左移动数据。

下图显示了一个四位移位寄存器的电路原理图，它在每个时钟上升沿将串行数据从IN端口向左移动。

![4-bit-shift-register](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/4-bit-shift-register.png)

下图是4bit的移位寄存器的时序图，在第一个周期中， SHIFT=0。因此，在这个周期内，IN端的变化不会影响寄存器的输出。SHIFT输入在第二个周期中间转换为逻辑1时，，它允许IN=1在第三个时钟周期时传递到OUT的低位```OUT[0]```。从第二个周期到第十三个周期，SHIFT保持在逻辑1，因此，在每个时钟的上升沿，IN节点的任何变化都会直接传递到```OUT[0]```节点。其他输出，例如```OUT[1]```， ```OUT[2]```, ```OUT[3]```则会有一个时钟周期的延迟，因为在移位寄存器中，较低位的输出连接到较高位的输入。

![timing-of-shift-register](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/timing-of-shift-register.png)

## 计数器

计数器是一种特殊形式的寄存器，在设计上会在每个时钟上升沿进行递增（或递减）。

下图是一个典型的32位递增计数器，它有两个控制输入，```COUNT```和```LOAD```。当```COUNT = 1```，```LOAD = 0```时，选择3-1多路复用器的C端口，使计数器在时钟的上升沿递增计数。而当```COUNT = 0，LOAD = 1```时，选择L端口，在```IN[31:0]```端加载新数据。一旦加载完成，计数器输出```OUT[31:0]```在每个时钟的上升沿递增1，直到所有输出位都变为逻辑1。下一次递增会自动将计数器输出重置为逻辑0。当```LOAD = COUNT = 0```时，计数器选择3-1多路复用器的I端口。在这种组合下，它既不加载新数据也不递增计数，而是暂停，输出旧的值。

![counter](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/counter.png)

下图是计数器的时序图。在第一个时钟边沿之前，LOAD输入为逻辑1，此刻将会把输入IN中的数字存入计数器之中。因此在第一个时钟的上升沿时，```OUT[31：0]=3```。此后```LOAD=0```，```COUNT=1```，这个状态下计数器将进行向上递增的过程。在第二个时钟上升沿到来时，```3+1=4```通过3-1MUX的C端口传递并抵达触发器的输入端，使得```OUT[31:0] = 4```。在三个时钟周期到来时，计数器执行相同的过程，增加1。随后```COUNT```的值转换为逻辑0，3-1MUX的I端口被激活，此时会阻止任何新的数据写入计数器。因此计数器在随后的几个周期中保持```OUT[31:0]=5```。

![timing-of-counter](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/timing-of-counter.png)

## 摩尔状态机

## 米利状态机

## 内存