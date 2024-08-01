---
category: 
- 计算机架构
tag:
- 计算机架构
---

- [计算机基本架构-内存](#计算机基本架构-内存)
  - [1.静态随机存取存储器 (SRAM)](#1静态随机存取存储器-sram)
  - [2.同步动态随机存取存储器（SDRAM）](#2同步动态随机存取存储器sdram)
  - [3.电可擦除可编程只读存储器(EEPROM)](#3电可擦除可编程只读存储器eeprom)
  - [4.Flash memory](#4flash-memory)
  - [5.Serial Flash Memory](#5serial-flash-memory)
  - [refernce](#refernce)
  - [附录](#附录)

# 计算机基本架构-内存

先前的章节解释了基本的串行和并行总线结构，以及总线主控器和从设备之间不同形式的数据传输。无论总线架构如何，总线主控器被定义为发起数据传输的逻辑块，而从设备被定义为只能在主控器要求下监听和交换数据的设备。然而，这两个设备都包含某种形式的存储器。在从设备的情况下，这可以是系统存储器或属于外设设备的缓冲存储器。

根据读取和写入速度、容量和数据的持久性，系统存储器和外设缓冲区可以分为三种不同的形式。如果需要快速的读写时间，则使用静态随机存取存储器 (```SRAM```)，尽管与其他类型的存储器相比，其单元尺寸相对较大。```SRAM``` 通常用于存储小的临时数据，并且通常连接到系统中的高速并行总线。如果需要大量存储，但可以容忍较慢的读写速度，那么动态随机存取存储器 (```DRAM```) 应该是主要使用的存储类型。```DRAM``` 仍然连接到高速并行总线，通常以接收或传送数据突发的方式运行。典型的 ```DRAM``` 单元比 ```SRAM``` 单元小得多，功耗也显著降低。```DRAM``` 的主要缺点是高数据读写延迟、存储控制和数据管理的复杂性。

数据的永久性存储需要第三种存储器类型，其单元类型由双栅金属氧化物半导体（MOS）晶体管组成。数据被永久性地存储在该设备的浮动栅中，直到被新数据覆写。电可擦可编程只读存储器（${E}^{2}PROM$）或闪存记忆体属于这种类型的设备。这种存储器类型的优点是，即使系统断电，它仍然保留存储的数据。然而，与所有其他存储器类型相比，这种存储器速度最慢，并且受到有限的读写周期限制。因此，它的最佳用途是用于存储内建操作系统（```BIOS```）的永久数据，特别是在功耗关键的手持设备中。典型的计算系统可以根据使用和应用软件的需要包含一种或全部三种类型的存储器。

本章中描述的```SDRAM```、```EEPROM```和```Flash```存储器的基本功能灵感来源于东芝存储器数据表[1-6]。较新的带SPI接口的串行Flash存储器则基于Atmel Flash存储器的数据表[7]。在每种情况下，存储块的功能相较于原始数据表已经被大幅简化（并修改），以提高读者对相关主题的理解。这里的目的是展示每种存储器类型在系统中的操作方式，仅涵盖基本的操作模式，以便训练读者，而不是详细探讨实际数据表的内容。每种存储器的地址、数据和控制时序限制也较数据表进行了简化。这使我们能够轻松地为每种存储器类型设计总线接口。为了简化起见，我们避免了重复端口名称、确切的时序要求和功能细节，这些都可以在实际数据表中找到。读完本章后，建议有兴趣的读者在进行设计任务之前先研究参考数据表。

## 1.静态随机存取存储器 (SRAM)

静态随机存取存储器（```SRAM```）是数字设计中最基础的存储块之一。在各种类型的存储器中，```SRAM```速度最快。然而，其较大的存储单元尺寸限制了它在多种应用中的使用。

如图下图所示，典型的```SRAM```架构由四个不同的模块组成：**SRAM核心**、**地址译码器**、**感应放大器**和**内部SRAM控制器**。存储核心保持即时数据。感应放大器在读取过程中将单元电压放大到完整的逻辑电平。地址译码器根据N位地址生成${2}^{N}$个字线（Word Lines）。最后，控制器生成在读取或写入周期中所需的自时序脉冲。

![图1：一个典型的有8比特地址和32比特数据位的SRAM架构](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-1-SRAM-arhi-with-eight-bit-address-32-bit-data.png)

每个```SRAM```单元由两个背对背的反相器组成，就像锁存器中使用的那样，并且有两个N沟道金属氧化物半导体（NMOS）传输门晶体管来隔离单元中的现有数据或允许新数据进入单元，如下图所示。当需要将数据写入单元时，```WL = 1```会打开两个NMOS晶体管，允许来自Bit和Bitbar输入端的真实数据和互补数据同时写入单元。如果我们假设节点A初始为逻辑0，节点B为逻辑1，且```WL = 0```，那么WL的逻辑电平会关闭两个NMOS晶体管，锁存器将完全与其周围环境隔离。结果是逻辑0电平被保持在单元中。但是，如果```WL = 1```，Bit节点为1，Bitbar节点为0，那么WL的逻辑电平会打开两个NMOS晶体管，允许Bit和Bitbar上的值覆盖节点A和B上现有的逻辑电平，从而将单元中存储的位从逻辑0更改为逻辑1。

同样地，如果需要从单元中读取数据，可以通过设置```WL=1```来打开两个NMOS晶体管，然后在Bit和Bitbar输出之间产生的小差分电位会被感应放大器放大，最终在SRAM输出端达到完整的逻辑电平。

![图2：SRAM内存单元](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-2-SRAM-memory-cell.png)

数据写入序列以```EN= 1```和```WE = 1```开始。这种组合将SRAM核心中的```Bit```和```Bitbar```节点预充到预设电压值，并为写入做准备。当预充周期完成后，控制器通过设置```EnWL = 1```来启用地址解码器，如下图所示。解码器根据```AddrIn[7:0]```提供的值激活256个```WL```中的一个。在同一时间段内，控制器还生成```WritePulse = 1```，允许有效数据```DIn[31:0]```写入指定地址。

从SRAM核心读取数据通过设置```EN = 1```和```WE = 0```来执行。与写入操作类似，控制器在读取数据之前首先对SRAM核心进行预充，然后启用地址解码器。根据```AddrIn```端口的地址值，特定行的```WL```输入被激活，数据从指定行的每个单元被读取到相应的Bit和Bitbar节点。感应放大器将单元电压放大到全逻辑电平，并将数据传送到```DOut```端口。

![图3：SRAM写操作时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-3-SRAM-IO-timing-for-write.png)

![图4：SRAM读操作时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-4-SRAM-IO-timing-for-read.png)

将SRAM模块集成到现有系统中的一个重要任务是设计其总线接口。下图显示了这种实现的框图。总线接口基本上将所有总线控制信号转换为SRAM控制信号（反之亦然），但很少对地址或数据进行修改。在第4章描述的单向总线协议中，SRAM被视为总线从设备，它根据```Ready```信号与总线主设备交换数据。同样如**系统总线章节**中所述，总线主设备有四个控制信号来配置数据传输。```Status```信号指示总线主设备是发送第一个数据包（START）还是正在发送剩余的数据包（```CONT```）。总线主设备还可能发送```IDLE```或```BUSY```信号，分别指示其已完成当前数据传输或正忙于内部任务。```Write```信号指定总线主设备是打算向从设备写入数据还是从从设备读取数据。```Burst```信号指定事务中的数据包数量，而```Size```信号定义数据的宽度。

![图5：SRAM总线接口](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-5-sram-bus-interface.png)

下图中的时序图展示了如何将四个数据包```W1```至```W4```写入四个连续的SRAM地址```A1```至```A4```。要启动写入序列，总线主设备在第一个时钟周期内发出一个有效地址，并设定```Status = START```和```Write = 1```，同时通过产生一个有效高的总线接口写入使能信号（```BIWEn```, Bus Interface Write Enable）来启用总线接口进行写入。在接收到```BIWEn = 1```后，总线接口在下一个周期内产生```Ready = 1```，并提示总线主设备在第三个周期内更改地址和控制信号。当总线主设备将地址从```A1```更改为```A2```时，它也根据第4章中解释的单向总线协议发送第一个数据包```W1```。然而，为了写入SRAM地址，有效数据必须与有效地址在同一个周期内可用，如图5-3所示。因此，在图5-5中，SRAM的```Addr```端口上添加了一组八个触发器，使地址```A1```延迟一个时钟周期，并与当前数据```W1```对齐。总线接口还在第三个周期内产生```EN = WE = 1```，以便在第四个时钟周期的正沿将```W1```写入```A1```。接下来的写入以相同的方式完成：SRAM地址延迟一个周期，以便在第五个周期的正沿将```W2```写入地址```A2```。在第六个周期，总线接口降低```Ready```信号，以使总线主设备停止递增从设备地址。然而，它保持```EN = WE = 1```，以便能够将```W4```写入```A4```。

![图6：SRAM总线写操作的接口时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-6-SRAM-bus-interface-timing-diagram-for-write.png)

总线接口状态图中的写入操作（见图7）是基于时序图（见图6）而生成的。第一个状态是空闲状态，这是因为总线接口在等待总线主设备发送```BIWEn = 1```信号，这对应于时序图中第一个时钟周期。空闲状态之后是待机状态，在此状态下，总线接口会生成```Ready = 1```信号。这个状态持续一个时钟周期，对应于时序图中的第二个时钟周期。

写入状态是实际写入操作发生的状态：当总线主设备发出的写入地址数小于突发长度时，```EN```和```WE```信号保持为逻辑1。这个状态对应于时序图中的第三、第四和第五个时钟周期。当写入地址数达到突发长度的值时，总线接口进入最后写入阶段，```Ready```信号变为逻辑0。总线主设备在第六个时钟周期将最后一个数据包写入SRAM的最后一个地址。

![图7：SRAM写操作的总线接口](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-7-SRAM-bus-interface-for-write.png)

为了启动读取序列，总线主设备在图8的第一个时钟周期内发出一个有效的SRAM地址，并设定```Status = START```和```Write = 0```信号。这种组合产生一个有效高的总线接口读使能信号，即```BIREn = 1```，这被解释为总线主设备打算从SRAM地址读取数据。因此，总线接口在第二个周期内产生```EN = 1```，```WE = 0```，```Ready = 1```。这在第三个周期从SRAM地址```B1```获取第一个数据```R1```。第四和第五周期内的读事务与第三周期相同，总线主设备分别从地址B2和B3读取数据R2和R3。在第六个周期，总线接口保持```Ready = 1```，以便总线主设备仍能够从地址B4读取最后一个数据R4。

![图8：SRAM总线读操作的接口时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-8-SRAM-bus-interface-timing-diagram-for-read.png)

与写操作情况类似，图9中的读总线接口也是图8中的时序图的直接结果。空闲状态对应于图8中时序图的第一个时钟周期。一旦生成```BIREn = 1```，总线接口就会过渡到待机状态，在该状态下，它产生```EN = 1```、```WE = 0```和```Ready = 1```。接口在第三个周期进入读状态，并产生与之前相同的输出，以便总线主设备读取其第一个数据R1，并在下一个周期发送新地址。接口保持在读状态，直到总线主设备发出的读地址数量少于突发长度。读状态覆盖图8中时序图的第三到第五个周期。当读地址数量达到突发长度时，总线接口在第六个周期过渡到最后读状态，并继续生成```Ready = 1```。这样做是为了使总线主设备仍然能够读取最后的数据，如前所述。接口在接下来的周期无条件返回到空闲状态。

![图9：SRAM读操作的总线接口](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-9-SRAM-bus-interface-for-read.png)

增加SRAM容量需要使用额外的地址位。在图10所示的示例中，通过添加两个额外的地址位```Addr[5:4]```，SRAM容量从```32 x 16```位增加到```32 x 64```位，这些地址位用于访问四个SRAM块中的一个。在这个图中，即使```Addr[3:0]```指向所有四个32 x 16 SRAM块的相同地址位置，```Addr[5:4]```结合EN信号只启用四个块中的一个。此外，从所选块读取的数据通过```Addr[5:4]```输入路由到4-1多路复用器。```Addr[5:4] = 00```选择```DOut0```端口的内容，并通过4-1多路复用器的端口0将数据路由到Out[31:0]。同样，```Addr[5:4]``` = 01、10和11分别选择4-1多路复用器的端口1、2和3，并将```DOut1```、```DOut2```和```DOut3```端口的数据分别路由到```Out[31:0]```。

![图10：SRAM总线接口](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-10-increasing-SRAM-address-space.png)

## 2.同步动态随机存取存储器（SDRAM）

**同步动态随机存取内存**(SDRAM) 是一种旧版 DRAM 的变种，它构成了几乎所有计算系统的主要内存。尽管它的容量可以比 SRAM 高出几个数量级，但它的速度却不如 SRAM。因此，SDRAM 主要用于在速度不重要的情况下存储大量数据块。

一个```SDRAM```模块由四个部分组成。存储核心是数据存储的地方。行和列解码器定位数据。感应放大器在读取过程中放大单元电压。控制器管理所有读写序列。

图11中的框图显示了一种典型的32位SDRAM架构，它由四个称为存储库的内存核心组成，通过单个双向输入/输出端口进行访问。在操作内存之前，必须将主要的内部功能，例如地址模式、数据延迟和突发长度，存储在地址模式寄存器中。一旦编程完成，低电平有效的行地址选通信号（```RAS```）、列地址选通信号（```CAS```）和写使能信号（```WE```）将决定内存的功能，如表1所示。选定存储库的输入/输出端口上的数据可以在数据到达输入/输出端口```DInOut```之前在读/写逻辑块处屏蔽。

![图11：一个典型的SDRAM的架构](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-11-a-typical-SDRAM-architecture.png)

![表1：SDRAM操作模式](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/tbl-1-SDRAM-modes-of-operation.png)

```SDRAM```单元是一个简单的器件，由一个```NMOS```通道晶体管来控制数据的流入和流出，以及一个电容器来存储数据，如图12所示。当需要将新数据写入单元时，通过将控制信号设置为1来打开NMOS晶体管，使```DIn/Out```端子的数据显示覆盖单元节点上的旧数据。另一方面，读取单元中的数据则需要在打开通道晶体管之前激活感应放大器。当需要保存数据时，只需通过将控制信号设置为0来关闭```NMOS```晶体管。然而，单元电容器上的电荷会通过其绝缘体慢慢泄漏，导致单元电压降低。因此，在```SDRAM```操作过程中，需要自动或手动的单元刷新周期来保持单元中的位值。

![图12：SDRAM 内存单元](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-12-SDRAM-memory-cell.png)

表1的真值表的第一行说明了如何编程内部地址模式寄存器。在时钟的上升沿，$\overline{CS}$、$\overline{RAS}$、$\overline{CAS}$ 和 $\overline{WE}$ 信号被拉低至逻辑 0 以编程地址模式寄存器，如图13所示。在编程模式中，地址位 ```A[2:0]``` 定义了数据突发长度，如表2所示。突发长度可以从一个字到整页，整页等于整个存储库的内容。地址位 ```A[3]``` 定义了每个数据包的 SDRAM 地址如何递增。通过简单地将起始地址加1并根据突发长度的大小消除进位位，可以实现顺序寻址。

![图13：地址模式寄存器的编程时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-13-timing-diagram-for-programming-the-address-mode-register.png)

![表2：地址模式寄存器的编程真值表](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/tbl-2-truth-table-for-programming-the-address-mode-reg.png)

例如，如果起始地址为 13 且突发长度为两个字，则会消除列 ```A[0]``` 的进位位，下一地址变为 12，如表3所示。同一表中，如果突发长度增加到四个字，则会消除列 ```A[1]``` 的进位位，起始地址 13 之后的地址值依次变为 ```14、15、12```。如果突发长度变为八个字，则会消除列 ```A[2]``` 的进位位，地址值依次为 ```13、14、15、8、9、10、11 和 12```。顺序寻址将数据的读写限制在预定义的循环存储空间内，这对于某些特定的软件应用非常方便。

![表3：SDRAM 序列模式对于突发长度是2，4，8时的地址变化](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/tbl-3-SDRAM-sequential-mode-addressing-for-burst-length.png)

**线性寻址模式**是各种SDRAM中实际交错寻址模式的简化版本，并按线性方式增加SDRAM地址，如表4所示。在该表中，如果起始地址是13且突发长度为2，则下一个地址将是14。如果突发长度增加到4，紧随13之后的三个地址将是14、15和16。与顺序寻址模式相反，线性寻址模式按位逐个增加SDRAM地址，而不是将数据限制在一个循环地址空间内。

![表4：SDRAM先行模式对于突发长度是2，4时的地址变化](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/tbl-4-SDRAM-linear-addressing-mode-for-burst-lengths-of-2-and-4.png)

表1中真值表的第二行显示了如何启动手动刷新周期。在手动刷新模式下，SDRAM会补充每个单元的节点电压值，因为随着时间的推移，单元电容器上的电荷会通过其介电层泄漏。刷新周期之间的时间间隔取决于所使用的技术、氧化层的质量以及电容器板之间介电层的厚度，如图14所示。

![图14：自刷新的时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-14-timing-diagram-for-self-refresh.png)

表1中的第三到第六行构成了如图15所示的读写序列。在此图中，读或写序列总是从预充电SDRAM核心的所有行和列开始。接下来是一个激活周期，其中生成行地址。在最后一个周期，生成列地址，根据控制信号$\overline{CS}$、$\overline{RAS}$、$\overline{CAS}$和$\overline{WE}$，将数据写入或从内存中读取。

![图15：读写的操作周期](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-15-write-and-read-operations.png)

在进行读或写操作之前，必须对一个存储体的所有行和列预充电至某一电压水平，持续一个时钟周期，如图16所示。在预充电期间，$\overline{CS}$、$\overline{RAS}$和$\overline{WE}$信号必须拉低至逻辑0，而$\overline{CAS}$信号必须保持在逻辑1，如表1的第三行所示。预充电电压的值可以在0V到满电压之间，具体取决于技术和电路设计的要求。预充电完成后，激活周期会在一定时间后开始。预充电与激活周期之间的时间间隔称为预充电时间周期，```tPRE```，如图16所示。激活周期通过将$\overline{CS}$和$\overline{RAS}$拉低至逻辑0来启用，但保持$\overline{CAS}$和$\overline{WE}$在逻辑1，如表1的第四行所示。在激活周期之后，必须在经过一定时间后才能对同一个存储体开始下一个预充电周期。这个时间间隔称为RAS时间周期，```tRAS```，如图16所示。

![图16：Bank的预充电和激活](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-16-bank-precharge-and-activation-cycles.png)

表1的第五行显示了当$\overline{CS}$ = $\overline{CAS}$ = $\overline{WE}$ = 0和$\overline{RAS}$ = 1时，如何向选定的存储体写入数据。实际的写入操作发生在图15中的写入序列的最后阶段，在预充电和激活周期之后。为了详细说明写入序列，图17中给出了一个单次写入的例子。在此图中，写入周期从预充电存储体1开始。在```t = tPRE```之后，激活周期开始，并将**行地址**提供给SDRAM。当在时间周期```tCAS```之后提供**列地址**时，四个数据包```D(0)```到```D(3)```在四个连续的时钟周期内被写入SDRAM。请注意，在此图中，如果同一个存储体用于另一次写入操作，则需要在存储体激活周期和下一次预充电周期之间安排一个新的时间周期```tRAS```。

![图17：单个写周期](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-17-a-single-write-cycle.png)

图18中的例子展示了向两个不同BANK进行的两个独立写入序列。当对多个BANK进行写操作时，通过将各BANK的预充电和激活时间段交错进行，可以节省时间，使一个写入突发操作在另一个操作之后立即进行，从而缩短整体写入周期。在此图中，这种技术允许在向存储体0写入四个字后，立即向存储体1写入四个字，而不会有任何周期损失。因此，向两个（或更多）存储体进行写操作比向单个存储体进行写操作更为优越，因为这种过程消除了预充电周期之间所有不必要的等待时间。然而，当突发长度涉及比四个字更多的数据时，预充电周期在时间图中的位置变得不那么重要。

![图18：向不同的bank写数据的周期](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-18-multiple-write-cycles-to-different-banks.png)

表1的第六行展示了如何从已选中的存储库（bank）启动读取周期。从SDRAM读取数据涉及一个延迟周期，该延迟周期需要在地址模式寄存器中进行编程。图19中的示例显示，在读取命令和地址给出后，经过三个时钟周期的延迟期，读取突发（burst）开始。三个时钟周期的延迟意味着数据在读取命令和地址发出后的第三个时钟周期时在SDRAM的输出端变的可用。

![图19：读周期中延迟的定义](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-19-definition-of-latency-during-a-read-cycle.png)

图20中的示例显示了从BANK1进行的一次读取操作。在发出读取命令和列地址之前，读取和写入操作的路径是相同的。然而，从这一点开始，读取突发会采取不同的路径，并等待编程的延迟期结束。与写入过程类似，在读取过程中也必须经过一定的${t}_{RAS}$周期，才能从同一存储库中读取其他数据流。在该图中，${t}_{WAIT}$表示最后一个数据包与下一个预充电周期开始之间的等待期。

![图20：单个读周期](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-20-single-read-cycle.png)

图21中的示例描述了从同一BANK进行的多次读取，并假设${t}_{WAIT}$等于零。这种情况下，从存储库1读取四个字（```D(0)```到```D(3)```）的突发读取，并在最后一个数据包传送期间对同一存储库进行预充电。第二次从存储库1的突发读取遵循与第一次相同的模式，在经过两个时钟周期的编程延迟后传送```D(4)```到```D(7)```。如果${t}_{WAIT}$不为零，那么该图中的第二次预充电期将遵循图20中的模式，并在${t}_{WAIT}$期满后开始。

![图21：在同一个bank中多个读周期(${t}_{pre} = 1 cycle$,${t}_{CAS} = 2 cycles$, ${t}_{WAIT} = 0 cycles$)](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-21-multi-read-cycle-same-bank.png)

从两个不同存储单元读取数据的交错技术，在图22中，与图18中写入数据到两个不同存储单元时的技术并无不同。与写入情况一样，时序图中第二次预充电周期的位置对于实现两个连续的读取突发（从存储单元0读取D0(0)到D0(3)和从存储单元1读取D1(0)到D1(3)）非常重要，这样可以在不丢失任何周期的情况下完成，并且能够在最短的时间内从SDRAM中获取数据。

![图22：在不同bank中多个读周期(${t}_{pre} = 1 cycle$,${t}_{CAS} = 2 cycles$)](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-22-multi-read-cycle-from-different-banks.png)

表1的第七行显示了如何停止读或写突发。图23展示了在数据突发中途发出突发停止命令时的单次写入序列。接收到该命令后，被选中的存储单元进入待机模式，并等待下一个预充电命令。

![图23：突发停止](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-23-burst-stop-during-write.png)

当在读取过程中间发出突发停止命令时，最后一个数据包仍会在紧随突发停止命令的时钟边沿传送，如图24所示。

![图24：读期间发生突发停止](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-24-burst-stop-during-read.png)

输入/输出数据可以通过图11中的读/写逻辑块进行屏蔽。表5中的真值表列出了屏蔽和传输来自SDRAM核心的输入数据的所有可能情况。例如，当```Mask[3:0] = 0000```时，不对输出数据应用任何屏蔽；所有32位数据都可以被写入或读取到选定的存储单元。而当```Mask[3:0] = 1111```时，则屏蔽所有四个字节的数据，不允许任何字节被写入或读取选定地址。

表5

图25是一个SDRAM总线接口的数据路径和控制器的示例。在这个例子中，每个10位宽的总线接口寄存器包含预充电（${t}_{PRE}$）、CAS（${t}_{CAS}$）、突发（${t}_{BURST}$）、延迟（${t}_{LAT}$）和等待（${t}_{WAIT}$）周期，必须通过10位编程总线在操作SDRAM之前进行编程。预充电、CAS和等待寄存器包含实现所需等待周期的时钟周期数。突发寄存器应该存储数据传输的数据包数量。因此，该寄存器中的值必须与地址模式寄存器中编程的值相同。延迟寄存器指定从SDRAM地址读取第一个数据之前的时钟周期数。为了避免复杂性，图25省略了正常SDRAM操作之前的编程如何进行以及所需的硬件细节。

![图25：SDRAM 总线接口图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-25-SDRAM-bus-interface-block-diagram.png)

许多旧式SDRAM中存在地址模式寄存器（或一组定义基本SDRAM功能的寄存器）。然而，最近的SDRAM模块完全省略了模式寄存器，而依赖于总线接口单元来存储这些信息。为了管理预充电、CAS、突发和等待周期，内存控制器不断地与图25中的一个下降计数器进行交互，因为这些周期通常会持续多个时钟周期。

对于正常的SDRAM操作，总线地址```Addr[31:0]```必须被划分为几个段。在图26的例子中，SDRAM地址的四个最高有效位```Addr[31:28]```表示SDRAM芯片标识，用于激活相应的总线接口。```Addr[21:20]```用于选择SDRAM的存储体，即```BS[1:0]```。```Addr[19:10]```和```Addr[9:0]```分别指定行地址和列地址。

![图26：SDRAM 总线接口地址映射](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-26-SDRAM-bus-interface-address-mapping.png)

图27显示了一个典型的SDRAM写入序列。在这个时序图中，所有五个SDRAM接口寄存器必须在IDLE/PROG时钟周期之前进行编程，如前所述。SDRAM写入序列从系统总线发送Status = START，Write = 1和起始SDRAM地址开始。这三个信号使总线接口写使能信号BIWEn转换为逻辑1，从而在图27的第一个周期中启用总线接口进行写操作。一旦启用，总线接口将在地址寄存器中存储起始SDRAM地址，并通过$\overline{CS} = 0$ ，$\overline{RAS} = 0$，$\overline{CAS} = 1$和$\overline{WE} = 0$为所选存储单元发出预充电命令。在同一个周期内，计数器通过LoadtPRE = 1加载预充电等待周期tPRE，如时序图所示。

![图27：SDRAM 总线接口的写周期](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-27-write-cycle-via-SDRAM-bus-interface.png)

预充电等待周期是通过将时钟周期数与时钟周期相乘来计算的。该设计中的计数器是一个递减计数器。当其输出值 ```CountOut``` 变为 1 时，控制器启动所选 SDRAM 存储体的激活周期并发送行地址。激活周期开始时，通过 ```LoadtCAS = 1``` 将 ${t}_{CAS}$ 值加载到递减计数器。在同一个时钟周期内，行地址 ```Addr[19:10]``` 通过选择行地址选择器（```SelRow = 1```）从地址寄存器传输到 SDRAM 的 R 端口的 3-1 复用器。当激活等待周期结束时，控制器使用 ```LoadtBURST``` 输入将写突发长度（数据包的数量）加载到递减计数器，并在下一个周期中启动写入序列。

在图27中的开始写入（START WRITE）期间，控制器通过生成 ```SelCol = 1```，将列地址 ```Addr[9:0]``` 从地址寄存器通过图25 中的 3-1 复用器的 C 端口传输到 SDRAM 的 ```A[9:0]``` 输入端。在同一时钟周期内，控制器还生成 $\overline{CS} = 0$, $\overline{RAS} = 1$, $\overline{CAS} = 0$ 和 $\overline{WE} = 0$，并通过 ```EnWData = 1``` 启用三态缓冲器，以将第一个写数据包 ```D0``` 写入 ```SDRAM```。为了能够写入剩余的数据包，从这一点开始，控制器发出 ```Ready = 1```。当序列进入图27中的加载等待（LOAD WAIT）期间（即最后一次写入发生的地方）时，控制器降低 ```Ready``` 信号，但保持 ```EnWData``` 信号为逻辑 1，以写入最后一个数据包 ```D3```。这个时钟周期也标志着等待周期 ${t}_{WAIT}$ 的开始。如果需要对同一个存储体进行另一次写入序列，控制器会发出 ${Loadt}_{WAIT} = 1$，将 ${t}_{WAIT}$ 加载到递减计数器中。

为简化起见，时序图中省略了剩余的控制信号 Burst 和 Size。在整个数据传输过程中，本例中 Burst 设置为 4，Size 设置为 32。对于字节和半字传输，Size 需要按照表5 中描述的那样进行掩码定义。

控制器的写入状态图如图28 所示。在该图中，当接口接收到 BIWEn = 1 时，控制器从 IDLE/PROG 状态（对应图27中时序图的第一个周期）转换到 LOAD PRE 状态（对应同一时序图的第二个时钟周期）。在 LOAD PRE 状态下，控制器重置 $\overline{CS}$, $\overline{RAS}$, $\overline{CAS} $ 和 $\overline{WE}$，但设置所选存储体的 CAS 以启动预充电过程。在该状态下，会生成两个附加信号：```StoreReg = 1``` 用于将总线地址存储在地址寄存器中，```LoadtPRE = 1``` 用于启动预充电等待周期。控制器在预充电等待状态 tPRE 中保持不变，直到 CountOut = 1。然后，控制器转换到 LOAD CAS 状态，激活所选存储体，发出 SelRow = 1 以将行地址传输到 SDRAM，并生成 LoadtCAS = 1 以启动激活等待周期。下一个状态 tCAS 是另一个等待状态，控制器在此状态中等待激活周期结束。一旦该周期结束，控制器首先进入 LOAD BURST 状态，然后进入 START WRITE 状态以启动将数据写入 SDRAM。后者对应于前面提到的将第一个数据包写入 SDRAM 核心的状态。随后的写入发生在控制器转换到 WRITE 状态时。控制器保持在该状态，直到 CountOut = 2，表示还有一个数据包要写入 SDRAM。当控制器移动到 LOAD WAIT 状态时，最后一个数据包被最终写入。在尝试另一个写入过程之前，控制器在 tWAIT 状态中等待，直到 CountOut = 1。

![图28：SDRAM写操作状态图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-28-SDRAM-bus-interface-for-write.png)

请注意，图28中的所有状态名称和图27顶部的周期名称保持一致，以便在时序图和状态图之间实现一一对应。

SDRAM 读取序列同样以系统总线发送```Status = START```、```Write = 0``` 和初始 SDRAM 地址开始。这一组合设置了总线接口读取使能信号 ```BIREn = 1```，使能总线接口在图29的时序图中的第一个周期从 SDRAM 核心读取数据。读取过程的其余部分与写入过程相同，直到控制器在图29的 START READ 周期中发出读取命令并发送所选 SDRAM 存储体的列地址。由于 SDRAM 数据在延迟期后才变得可用，控制器必须在读取突发前复制这个精确的延迟，并在突发期间和之后生成控制信号。例如，在延迟期结束前的一个周期，控制器需要生成 LoadtBURST = 1，将突发持续时间加载到递减计数器，以便能够检测到突发数据的开始和结束。因此，控制器可以确定何时生成 EnRData = 1 以使能三态缓冲器，从 SDRAM 的 RData 输出读取数据包 D0 到 D3。在最后一个数据传输期间，控制器发出 LoadtWAIT = 1，将 tWAIT 的值加载到递减计数器中，以便在选择同一存储体进行另一次读取时使用。

![图29：SDRAM总线接口的读周期](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-29-read-cycle-via-SDRAM-bus-interface.png)

图30中的状态图直接源于图29中的时序图。在该状态图中，当接口接收到```BIREn = 1```信号时，控制器从IDLE状态（对应于图29中的第一个周期）转换到LOAD PRE状态（对应于同一时序图中的第二个时钟周期）。在LOAD PRE状态中，通过$\overline{CS} = 0$、$\overline{RAS} = 0$、$\overline{WE} = 0$和$\overline{CAS} = 1$来选择预充电的存储体。在此状态下，控制器通过```StoreReg = 1```将有效的总线地址存储到地址寄存器中，并通过```LoadtPRE = 1```将预充电等待周期加载到递减计数器中。控制器在tPRE状态中保持，直到递减计数器中的预充电值耗尽。随后，控制器转到LOAD CAS状态，通过$\overline{CS} = 0$、$\overline{RAS} = 0$、$\overline{WE} = 1$和$\overline{CAS} = 1$激活所选存储体，发出```SelRow = 1```将行地址从地址寄存器传输到SDRAM，并生成LoadtCAS = 1将激活等待周期加载到递减计数器中。CAS等待周期对应于图30中的tCAS状态。当此周期在CountOut = 1时结束，控制器转换到START READ状态，通过$\overline{CS} = 0$、$\overline{RAS} = 1$、$\overline{WE} = 1$和$\overline{CAS} = 0$启动数据读取，并产生SelCol = 1将列地址从地址寄存器传输到SDRAM地址端口。此状态之后是四个单独的等待状态，以选择编程的读取延迟周期。由于图5.29中的读取延迟等于两个，状态机通过单个LAT WAIT状态。在LAT WAIT状态中，控制器发出LoadtBURST = 1，并将数据突发值tBURST加载到递减计数器中。在延迟状态之后，状态机转换到READ状态，直到CountOut = 2，表示读取突发结束。在此状态下，它生成EnRData = 1以启用数据输出缓冲器，并生成Ready = 1以验证读取数据。在突发周期结束时，状态机移动到LOAD WAIT状态，并发出LoadtWAIT = 1，将所需的等待周期加载到递减计数器中，直到下一个预充电发生。随后，状态机转换到tWAIT状态，并在等待周期结束前保持在此状态。

![图30：SDRAM总线接口读操作流程(控制信号为了简化目的没有展示)](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-30-SDRAM-bus-interface-for-read.png)

## 3.电可擦除可编程只读存储器(EEPROM)

电可擦除可编程只读存储器 (E2PROM) 历史上被认为是闪存的前身，同时也是计算机系统中速度最慢的存储器。它相对于其他类型存储器的最大优势在于其能够在系统断电后仍能保留数据，这是因为其存储核心采用了浮栅MOS晶体管。相较于机电硬盘，它的尺寸相对较小，使其成为存储内置操作系统 (BIOS) 的理想选择，特别适用于手持计算平台。

典型的E2PROM存储器由多个扇区组成，每个扇区包含多个页面，如图31所示。E2PROM中的单个字可以通过指定其扇区地址、页面地址和行地址来定位。扇区地址表示特定字所在的扇区。页面地址定位扇区内的具体页面。最后，行地址指向页面内数据字节的位置。E2PROM中有五个控制信号用于执行读取、写入或擦除操作。活动低电平的使能信号（EN）将特定页面置于待机模式，并为即将进行的操作做好准备。活动低电平的命令使能信号（CE）与命令代码（如读取、写入（编程）或擦除）一起发出。活动低电平的地址使能信号（AE）在提供地址时发出。最后，活动低电平的写使能信号（WE）和读使能信号（RE）分别用于写入和读取数据。

![图31：典型的EEPROM的组织形式](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-31-typical-eeprom-read-write-interface.png)

典型的E2PROM架构包括一个存储核心、地址解码器、输出数据缓冲器、状态、地址和命令寄存器，以及控制逻辑，如图32所示。在任何操作之前，需要对命令和地址寄存器进行编程。当操作开始时，控制逻辑会根据具体操作激活高电平的地址使能（ENA）、数据缓冲使能（END）、写使能核心（WEC）或读使能核心（REC）信号，从而使地址解码器、数据缓冲器和存储核心工作。地址寄存器中存储的地址会被解码器解码，以定位数据的位置。如果需要执行读操作，所需的数据会从E2PROM核心中检索出来并存储在数据缓冲器中，然后传输到I/O总线。如果是写（或编程）操作，数据会先存储在数据缓冲器中，然后再上传到指定的E2PROM地址。在所有情况下，EN信号需要置为逻辑0，以便在开始操作之前将E2PROM置于待机模式。图33中的表格描述了所有主要的操作模式。休眠模式会禁用地址解码器、存储核心和数据缓冲器，以减少功耗，并将设备置于睡眠状态。

![图32：典型的EEPROM的架构](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-32-E2PROM-major-operation-modes.png)

![图33：E2PROM的主要操作模式](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-33-E2PROM-major-modes.png)


图34所示的E2PROM单元基本上是一个N沟道MOS晶体管，在其控制栅终端（字线）和电子传导的沟道之间夹有一个额外的浮动栅层。该器件还具有漏极（位线）和源极（源线）终端，用于将单元连接到相邻电路。

要向存储单元写入逻辑0，在**字线**和**位线**之间施加高电压，同时**源线**节点保持接地。此配置在晶体管沟道中生成热载流子，这些热载流子通过栅氧化层隧穿并到达浮动栅极，提升晶体管的阈值电压。提升的阈值电压防止了在正常电路操作期间使用的标准栅源电压将已编程器件开启，并导致存储在器件中的值被解释为逻辑0。另一方面，没有在浮动栅极上带电的未编程器件表现出低阈值电压特性，并且可以通过标准栅源电压开启，产生沟道电流。在这种状态下，存储在器件中的值被解释为逻辑1。

![图34：EEPROM单元](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-34-e2prom-cell.png)

图35显示了一个典型的**命令输入序列**。对于这个E2PROM示例，有四种基本命令：读取、写入（编程）、页擦除和状态寄存器读取。在E2PROM或闪存中，写入和编程命令可以互换使用，因为它们表示相同的操作。操作序列始终是命令输入，然后是地址和数据输入。为了输入命令，$\overline{EN}$被拉低到逻辑0，$\overline{AE}$被拉高到逻辑1（因为输入的不是地址），并且$\overline{CE}$被拉低到逻辑0，表明I/O总线上的值是命令输入。由于命令输入是写入命令寄存器的，$\overline{WE}$也在$\overline{CE}$信号的负跳变后某个时间被拉低到逻辑0。这段延迟称为建立时间${t}_{s}$，如图35所示。$\overline{WE}$信号的低电平持续一段${t}_{LO}$时间，并在$\overline{CE}$的正跳变之前某个时间返回到逻辑1。这段时间间隔称为保持时间，${t}_{H}$。在$\overline{WE}$的正跳变之前，需要发出有效的命令输入，满足数据建立时间${t}_{DS}$和数据保持时间${t}_{DH}$，如图35所示。

![图35：命令序列的时序图](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/computer-base/Fundamentals-of-Computer-Architecture-and-Design/5/fig-35-Command-input-timing-diagram.png)

图36所示的**地址输入时序**与前面描述的命令输入时序原理相同：$\overline{EN}$需要为逻辑0以启用设备，$\overline{AE}$必须为逻辑0以进行地址输入，而$\overline{CE}$需要为逻辑1，因为该操作不是命令输入。在$\overline{EN}$信号的低电平阶段，$\overline{WE}$信号必须两次降到逻辑0以定位E2PROM中的数据。第一次$\overline{WE}$为0时，在$\overline{WE}$的第一个上升沿输入一个八位的行地址。接下来，在第二次$\overline{WE}$为0时输入一个由四位页地址和四位扇区地址组成的组合。在$\overline{EN}$信号的上升沿之前，$\overline{WE}$信号必须在${t}_{S}$周期后降到逻辑0，然后在${t}_{H}$周期内回到逻辑1。地址输入期间，$\overline{WE}$信号还必须在低电平保持${t}_{LO}$周期，在高电平保持${t}_{HI}$（或更长）周期。在${t}_{DS}$和${t}_{DH}$设置和保持时间内，每个$\overline{WE}$的上升沿都会发出有效的地址值。

图36

图37描述了数据输入序列，其中（M + 1）个数据包被写入E2PROM核心。在整个写入周期内，$\overline{AE}$信号必须保持为逻辑1，表示该操作是数据输入而不是地址输入。每个$\overline{{WE}$信号的上升沿都会写入一个数据包。

在读取过程中，低电平有效的控制信号$\overline{AE}$和$\overline{CE}$保持为逻辑1。读取使能信号$\overline{RE}$在每个下降沿使E2PROM从其存储核心读取数据，如图38所示。从$\overline{RE}$的下降沿到实际数据从存储器中可用之间的时间延迟称为访问时间${t}_{A}$，如同一时序图所示。$\overline{RE}$信号必须具有指定的${t}_{S}$、${t}_{H}$、${t}_{LO}$和${t}_{HI}$时间周期，才能从存储核心读取数据。

## 4.Flash memory

闪存是电可擦除可编程只读存储器 (E2PROM) 的继任者，和它的前身一样，闪存也具备在断电后保留数据的能力。因此，闪存非常适合用于手持电脑、手机和其他移动平台。

典型的闪存由多个扇区和页面组成，如图5-43所示。通过指定扇区、页面和行地址，可以在闪存中找到一个八位字。为了与前一节给出的E2PROM架构示例兼容，该闪存也包含16个扇区和16个页面。每个页面包含256字节。扇区地址构成16位闪存地址的最高四位，即```Addr[15:12]```。每个扇区中的页面通过```Addr[11:8]```寻址，每个页面中的字节通过```Addr[7:0]```寻址。闪存中有五个主要控制信号，用于执行基本的读取、写入（编程）、擦除、保护和重置操作。在描述闪存操作时，写入和编程命令是等效的，可以互换使用。许多闪存数据手册使用编程一词来定义向闪存写入一个字节或一个数据块。

贴图

低电平有效的启用输入$\overline{EN}$激活闪存中的特定页面，使其准备进行即将到来的操作。低电平有效的读取启用输入$\overline{RE}$激活读/写接口，从内存中读取数据。低电平有效的写入启用输入$\overline{WE}$使能向内存写入（编程）数据。低电平有效的重置输入$\overline{RESET}$用于重置硬件，之后闪存会自动进入读取模式。

典型的闪存架构与我们之前讨论的其他内存结构类似，由存储核心、地址解码器、感应放大器、数据缓冲区和控制逻辑组成，如图5-44所示。当内存操作开始时，控制逻辑会使能地址解码器、地址寄存器和适当的数据缓冲区，以激活读取或写入数据路径。地址寄存器中的地址被解码，以指向存储核心中的数据位置。如果需要执行读取操作，检索到的数据首先存储在数据缓冲区中，然后释放到总线。如果操作需要写入，数据首先存储在数据缓冲区中，然后定向到存储核心中的指定地址。待机模式既不向内存写入数据也不从中读取数据。休眠模式禁用地址解码器、存储核心和数据缓冲区，以减少功耗。图5-45列出了主要的闪存操作模式。

贴图

贴图

## 5.Serial Flash Memory

最新的闪存芯片已经包含I2C或SPI接口，用于与主处理器或其他总线主控交互。用户不必处理序言、等待时间或串行总线的其他复杂性，只需编写符合I2C或SPI标准的嵌入式程序，即可启动对闪存的读取、写入或擦除操作。

## refernce

1. Toshiba datasheet TC59S6416/08/04BFT/BFTL-80, -10 Synchronous Dynamic RAM
2. Toshiba datasheet TC58DVM72A1FT00/TC58DVM72F1FT00 128Mbit E2PROM
3. Toshiba datasheet TC58256AFT 256Mbit E2PROM
4. Toshiba datasheet TC58FVT004/B004FT-85, -10, -12 4MBit CMOS Flash memory
5. Toshiba datasheet TC58FVT400/B400F/FT-85, -10, -12 4MBit CMOS Flash memory
6. Toshiba datasheet TC58FVT641/B641FT/XB-70, -10 64MBit CMOS Flash memory
7. Atmel datasheet AT26DF161 16Mbit serial data Flash memory

## 附录

**Burst传输**，可以翻译为**突发传输**或者是**连续传输**。是指在同一行中相邻的存储单元连续进行数据传输的方式，只要指定**起始地址**和**突发长度**（Burst lengths，可以理解为跨度），控制器就会依次自动对后面相同数量的存储单元进行读/写操作，而不需要控制器连续提供列地址。
