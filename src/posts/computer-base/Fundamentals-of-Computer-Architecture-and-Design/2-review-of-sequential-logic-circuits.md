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

D锁存器(D-Latch)是逻辑设计中最基本的存储元件。它具有数据输入D、时钟输入clock和数据输出Q，如图2.1所示，它包含一个三态反相器作为输入级，后面连接着两个背靠背的反相器，构成了一个环形配置，用于存储数据。

连接到三态反相器使能输入端的时钟信号可以设置为高电平使能或低电平使能。在下图中，输入的变化通过存储元件传输，并在时钟的低电平期间成为输出。相反，在时钟的高电平期间，输入的变化被屏蔽，不会传输到输出端。一旦数据存储在背靠背的反相器环路中，它就变得稳定，并且直到在输入引入不同的数据之前都不会改变。锁存器的输出级缓冲器用于驱动多个逻辑门输入。

![D-Latch-circuit](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/D-Latch-circuit.png)

D锁存器的操作下图所示。在时钟的低电平期间，三态反相器被使能。新数据通过三态反相器传输，覆盖了背靠背反相器阶段的旧数据，并到达输出。当时钟切换到高相位时，输入输出数据传输停止，因为三态缓冲器被禁用并阻止任何新数据传输。因此，如果需要在锁存器中保留某些数据，需要在时钟上升沿之前的某个时间存储。这个时间间隔称为建立时间tS，大致等于通过三态反相器和存储元件中反相器的延迟之和。在时钟的高相位，存储在锁存器中的数据不再改变，如下图所示。

![D锁存器的操作](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/2/2-2.png)


## D触发器(D-Flip-Flop)

逻辑系统中的时序由流水线结构维护。流水线由组合逻辑与存储单元组合而成，如图2.3所示。流水线的主要目的是在同一时钟周期内处理多个数据包，并最大化数据吞吐量。

为了说明流水线的概念，将以图2.3为例，这里的流水线结构中使用了D锁存器作为存储单元。在每个锁存器的边界处，数据在时钟的高电平和低电平从一个组合逻辑传播到下一个组合逻辑。

图2.3显示了数据传输的时序图，数据传输在IN端口，数据包从D1到D3。第一个数据包${D1}^{0}$在时钟的高电平阶段（1H周期）在节点A处保持其原始值。然后，${D1}^{0}$通过T1阶段传播，并在时钟下降沿之前以修改后的形式${D1}^{1}$安定在节点B处。类似地，节点C处的${D1}^{1}$在时钟的低电平阶段保持其值，而其处理后的形式${D1}^{2}$通过T2阶段传播，并在时钟上升沿之前到达节点D。这些数据在T3阶段进一步处理，并在时钟下降沿时转换为${D1}^{3}$，于Cycle 2L周期时在OUT端口处可用。

同样地，接下来的两个数据包，${D2}^{0}$和${D3}^{0}$，也在随后的负时钟沿边沿被送入流水线。这两个数据都通过组合逻辑阶段T1、T2和T3传播，并分别在Cycle 3L和Cycle 4L的时钟下降沿时在OUT端口处可用。

根据图2.3中的时序图，所有三个数据包的总执行时间为四个时钟周期。如果我们在节点A和节点F之间移除所有的锁存器边界，并等待所有三个数据包D1、D2和D3通过三个组合逻辑阶段T1、T2和T3的总和处理，总执行时间将为3 x 1.5 = 4.5个时钟周期，因为每个组合逻辑阶段需要半个时钟周期来处理数据。因此，流水线技术可以优势地用于在更短的时间内处理数据并增加数据吞吐量。


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