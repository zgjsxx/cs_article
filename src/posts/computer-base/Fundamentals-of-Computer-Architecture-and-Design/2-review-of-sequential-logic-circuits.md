---
category: 
- 计算机架构
tag:
- 计算机架构
---

- [计算机基本架构-时序逻辑电路回顾](#计算机基本架构-时序逻辑电路回顾)
  - [D锁存器(D-Latch)](#d锁存器d-latch)
  - [D触发器(D-Flip-Flop)](#d触发器d-flip-flop)
  - [时序违规](#时序违规)
  - [寄存器](#寄存器)
  - [移位寄存器](#移位寄存器)
  - [计数器](#计数器)
  - [摩尔状态机(Moore machine)](#摩尔状态机moore-machine)
  - [米利状态机](#米利状态机)
  - [内存](#内存)


# 计算机基本架构-时序逻辑电路回顾

## D锁存器(D-Latch)

D锁存器(D-Latch)是逻辑设计中最基本的存储元件。它具有数据输入D、时钟输入clock和数据输出Q，如下图所示，它包含一个三态反相器作为输入级，后面连接着两个背靠背的反相器，构成了一个环形配置，用于存储数据。

连接到三态反相器使能输入端的时钟信号可以设置为高电平使能或低电平使能。在下图中，输入的变化通过存储元件传输，并在时钟的低电平期间成为输出。相反，在时钟的高电平期间，输入的变化被屏蔽，不会传输到输出端。一旦数据存储在背靠背的反相器环路中，它就变得稳定，并且直到在输入引入不同的数据之前都不会改变。锁存器的输出级缓冲器用于驱动多个逻辑门输入。

![D-锁存器的电路原理图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/D-Latch-circuit.png)

D锁存器的操作下图所示。在时钟的低电平期间，三态反相器被使能。新数据通过三态反相器传输，覆盖了背靠背反相器阶段的旧数据，并到达输出。当时钟切换到高相位时，输入输出数据传输停止，因为三态缓冲器被禁用并阻止任何新数据传输。因此，如果需要在锁存器中保留某些数据，需要在时钟上升沿之前的某个时间存储。这个时间间隔称为建立时间tS，大致等于通过三态反相器和存储元件中反相器的延迟之和。在时钟的高相位，存储在锁存器中的数据不再改变，如下图所示。

![D锁存器的操作](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/2-2.png)


## D触发器(D-Flip-Flop)

D触发器是逻辑设计中另一个重要元件，可以用于保存数据。和D锁存器类似，D触发器也有一个输入端D，一个时钟输入端，一个数据输出端Q。如下图所示。下图还展示了一个D触发器的经典电路示意图，其中包含串联的两个锁存器。第一个锁存器具有低电平有效的时钟输入，成为主锁存器(master)。第二个锁存器具有高电平有效的时钟输入，称为从锁存器(slave)。主锁存器在时钟低电平的阶段接收新数据，并在时钟的高电平阶段将这些数据传输给从锁存器。

![D触发器的操作](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/D-flip-flop-circuit.png)

下图显示了触发器的时序特性，建立时间${t}_{S}$是指有效数据在时钟上升沿之前到达并稳定在主锁存器中的时间间隔。保持时间${t}_{H}$是指时钟上升沿之后，有效数据需要保持稳定且不变的时间间隔。存储在主锁存器中的数据会在时钟上升沿之后通过从锁存器传播，并在一段时间后成为触发器的输出，这个时间成为时钟到Q的延迟(${t}_{CLKQ}$)。

![D触发器的时序](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/timing-of-DFF.png)

下面这张图显示了D触发器在时钟的两个不同阶段的操作。在时钟的低电平阶段，新的数据进入主锁存器并被存储。数据不能传播到主锁存器之外，因为在时钟的低电平阶段，副锁存器中的三态反相器起到开路作用。此时触发器输出的仅显示存储在从锁存器中的旧数据。当时钟信号变为高电平时，存储在主锁存器中的新数据通过从锁存器传输并到达输出端。可以使用触发器的门延迟来近似估算${t}_{s}$和${t}_{CLKQ}$的值。

![D触发器的操作过程](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/DFF-operation.png)

## 时序违规

下图展示了一个流水线的一部分，有一个具有传播延迟${T}_{COMB}$的组合逻辑块夹在两个触发器边界之间。在时钟的上升沿，有效数据通过IN端口输入，需要满足建立和保持时间的要求。经过${t}_{CLKQ}$的延迟后，数据在A节点处出现，并通过组合逻辑块进行传播，时序图如下所示。

![setup-violation](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/setup-violation.png)

在此图中，数据到达节点B的时间过晚，违反了触发器的分配建立时间。这被称之为建立时间违规。违规的程度取决于时钟周期，可以通过下面的公式进行计算：

$$建立时间违规 = {t}_{s} - [{T}_{C} - {t}_{CLKQ} + {T}_{COMB}]$$

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

## 摩尔状态机(Moore machine)

状态机主要用于数字设计中以控制数据流的正确性。它们的拓扑结构主要由一个或者多个触发器和连接触发器输出到触发器输入的反馈回路组成。状态机有两种类型： 摩尔型(Moore)和米利型(mearly)。

下图显示了一个由触发器和反馈回路组成的摩尔型状态机的拓扑结构。在这种配置中, 反馈回路包含一个组合逻辑模块，该模块接受触发器输出和外部输入。如果有多个触发器，则所有触发器输出的组合构成状态机的当前状态。所有触发器输入构成状态机的下一个状态，因为在时钟的上升沿，这些输入会成为触发器的输出，并形成当前状态。触发器输出通过一个附加的组合逻辑模块进一步处理，以形成当前状态输出。

![block-diagram-moore-machine](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/block-diagram-moore-machine.png)

摩尔状态机的状态切换由当前状态和当前状态的输入共同决定，而摩尔状态机的输出完全由当前状态决定，与当前状态输入无关。


## 米利状态机

## 内存

小型的内存块可以通过各种拓扑类型的单比特寄存器实现。例如下图所示的32位宽、16位深的存储块可以通过将16行32位寄存器逐行堆叠起来构建。每个32位寄存器在其输出端包含三态缓冲器，在读取过程中使用。