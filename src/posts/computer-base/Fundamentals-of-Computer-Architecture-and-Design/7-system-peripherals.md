---
category: 
- 计算机架构
tag:
- 计算机架构
---

- [系统外设](#系统外设)
  - [整体系统架构](#整体系统架构)


# 系统外设

当主处理器或其中一个协处理器执行用户程序时，它要么与系统存储器（如```SRAM```、```SDRAM```或```Flash```）交换数据，要么通过串行总线（有时也通过并行总线）与系统外设进行通信以执行各种任务。

一个传统的计算系统可能由一个或多个CPU内核、用于执行专门任务的协处理器（如硬件加速器）、用于在内存之间进行常规数据传输的直接内存访问（```DMA```）单元、用于支持屏幕的显示适配器和用于管理I/O生成或用户生成中断的中断控制器组成。在大多数情况下，负责将外部模拟信号转换为数字形式或将数字信号转换为模拟形式的数据转换器、用于控制事件持续时间的定时器以及负责串行传输和接收外设数据的SPI或${I}^{2}C$收发器都是中断驱动单元，并连接到中断控制器。中断控制器通过一系列驻留在程序存储器中的中断服务程序（```ISR```）管理所有事件驱动或程序驱动的任务。

## 整体系统架构

图1展示了一个包含必要总线主控和从控的基本系统架构。在这张图中，CPU是一个总线主控，用于执行用户程序。直接内存访问（```DMA```）是另一个总线主控，负责在不同的系统存储器之间传输数据。总线从控通常是系统存储器，例如```SRAM```、```SDRAM```和闪存。然而，其他系统设备，如显示适配器或连接到低速I/O总线的外围缓存存储器，也被视为总线从控。

显示适配器被视为一个重要的高速外围设备，用于在屏幕上显示运行程序或应用程序的结果。由于其带宽，通常将该单元连接到CPU的并行端口。然而，有时显示适配器也可以连接到低速I/O总线。这种选择在很大程度上取决于运行应用程序时监视器的使用频率。

