---
category: 
- 面经
tag:
- Linux面经
---

- [Linux](#linux)
  - [介绍几个GCC的优化参数](#介绍几个gcc的优化参数)
  - [在shell中，使用source执行一个脚本和不使用source执行一个脚本有什么区别？](#在shell中使用source执行一个脚本和不使用source执行一个脚本有什么区别)
  - [CPU 飙升该如何排查？](#cpu-飙升该如何排查)
    - [线程之间的通信方式](#线程之间的通信方式)
  - [令牌桶算法和漏筒算法的区别是什么？](#令牌桶算法和漏筒算法的区别是什么)


# Linux

## 介绍几个GCC的优化参数

以下是一些常用的GCC优化参数：
- -O0禁用所有优化，编译速度最快，但代码运行速度最慢。
- -O1启用基本优化，编译速度适中，代码运行速度适度提升。
- -O3启用所有可用优化，编译速度最慢，代码运行速度最快。
- -Os优化代码大小，编译速度较快，代码运行速度略微提升。
- -0g优化调试体验，编译速度适中，代码运行速度略微提升。

其他常见优化参数：
- -march=指定目标体系架构，例如```-march=native```使用当前机器的最佳指令集
- -mtune=指定目标处理器，例如```-mtune=corei7```使用针对Corei7处理器的优化。
- -format-frame-pointer省略帧指针，减少代码大小，但可能影响测试。
- -finline-functions内联函数，减少函数调用开销
- -fno-builtin禁用内建函数，例如memcpy、strlen等。

```-march```和```-mtune```的区别：

- 如果您使用 ```-march```，那么 GCC 将可以自由生成在指定 CPU 上运行的指令，但（通常）不能在架构系列中的早期 CPU 上运行。

- 如果您只使用 ```-mtune```，那么编译器将生成适用于其中任何一个的代码，但会优先考虑在您指定的特定 CPU 上运行速度最快的指令序列。例如为该 CPU 适当地设置循环展开启发式。

一般来说，这两个参数会这样使用，使得代码在旧版本的CPU上能够运行，同时在当前CPU上运行可以得到优化:

- ```-march=<您想要运行的最老的 CPU>``` 
- ```-mtune=generic``` 

## 在shell中，使用source执行一个脚本和不使用source执行一个脚本有什么区别？

在shell中，使用```source```命令执行一个脚本会导致该脚本在当前```shell```环境中执行。这意味着脚本中的变量、函数以及其他定义会影响当前的```shell```会话。

如果不使用```source```命令，而是简单地执行脚本，则会启动一个新的子```shell```来执行该脚本。在子```shell```中执行的所有更改（例如定义的变量、函数等）都不会影响父```shell```或当前的```shell```会话。这意味着在不使用```source```命令的情况下，脚本中的更改只会在子```shell```中生效，执行完脚本后不会影响到当前```shell```的环境。

简而言之，```source```命令用于在当前shell环境中执行脚本，而不使用```source```则会在一个新的子```shell```中执行脚本。

## CPU 飙升该如何排查？

CPU飙升是一个常见的性能问题，排查方法主要依赖于系统监控工具。以下是一些常见的排查步骤:

- 1.**监控系统指标**：使用系统监控工具 (如```top```，```htop```，```perf```等)监控CPU使用率、进程占用CPU时间、系统负载等指标，初步判断CPU飙升的原因。
- 2.**定位高负载进程**： 确定哪个进程或线程占用了大部分CPU资源，并分析该进程的功能和代码，判断是否为正常运行导致CPU飙升。
- 3.**分析代码**: 仔细检查高负载进程的代码，寻找可能导致CPU占用率高的原因，例如
   - 1.死循环或者递归调用
   - 2.繁重计算操作
   - 3.系统调用频繁
- 4.检查系统资源： 检查系统资源是否充足，例如内存、磁盘空间、网络带宽等。资源不足也会导致CPU负载过高。
- 5.排查硬件问题：检查硬件是否出现故障，例如CPU过热、主板故障等。
- 6.使用性能分析工具：使用性能分析工具(如```perf```，```valgrind```等)对代码进行分析，定位性能瓶颈，并针对性地优化代码。
- 7.优化代码。根据性能分析结果，优化代码，降低CPU占用率。例如：
  - 1.使用更高效地算法和数据结构
  - 2.减少不必要地计算操作
  - 3.优化系统调用
  - 4.使用缓存技术
  - 5.并发处理任务
- 8.调整系统配置：调整系统配置，例如限制进程地CPU占用率、调整内核参数等。

### 线程之间的通信方式

线程之间的通信有多种方式，具体选择哪种方式取决于应用的需求。常见的线程间通信方式包括：

- 共享内存和锁：使用共享变量和互斥锁来保护数据访问。
- 条件变量：用于线程之间的协调，等待某个条件的发生。
- 消息队列：通过队列传递消息，常用于生产者-消费者问题。
- 原子操作：用于简单的线程间同步，适用于少量数据。
- 管道和套接字：适用于跨进程或跨主机的线程通信。
- 信号量和事件：用于控制线程的执行顺序和并发访问。

## 令牌桶算法和漏筒算法的区别是什么？

令牌桶算法（Token Bucket Algorithm）和漏桶算法（Leaky Bucket Algorithm）是两种常用的流量控制算法，用于管理网络流量或系统资源。虽然它们都用于控制流量，避免过载，但其实现和行为有显著不同。以下是它们的主要区别：

- 1.基本原理

令牌桶算法（Token Bucket Algorithm）：

**原理**：系统有一个桶，桶中不断有令牌（或许可证）被添加。每个令牌代表一个允许的操作。请求必须获取一个令牌才能处理。桶有最大容量，一旦桶满，额外的令牌会被丢弃。令牌以一定速率生成，这允许系统在短时间内处理更多的请求，但总流量仍在控制之下。

**特点**：允许突发流量，适用于处理有一定突发性流量的情况。

漏桶算法（Leaky Bucket Algorithm）：

**原理**：系统有一个桶，桶内的水（或数据）以恒定速率从底部流出。请求（或数据）被加入桶中，如果桶满了，新的请求会被丢弃。桶的漏水速率决定了流量的平滑程度。

**特点**：输出流量是平稳的，不允许流量的突发，适用于需要流量平稳的场景。

- 2.处理流量的方式

令牌桶算法：

**突发流量**：允许在短时间内有较大的突发流量，前提是令牌的总数量在桶中足够。

**平滑输出**：通过控制令牌的生成速率来平滑输出流量，但允许瞬时的流量峰值。

漏桶算法：

**突发流量**：不允许突发流量，所有请求必须按照恒定的速率输出。

**平滑输出**：自然地平滑输出流量，通过恒定的流出速率来控制数据流。

- 3.算法实现
- 
令牌桶算法：

**令牌生成**：令牌以固定速率生成并放入桶中。

**令牌消耗**：请求从桶中取令牌，每个请求消耗一个或多个令牌。桶有最大容量，超过容量的令牌会被丢弃。

**控制**：控制令牌的生成速率，允许系统在允许的范围内处理突发流量。

漏桶算法：

**数据添加**：请求数据加入桶中。

**数据流出**：数据以恒定速率从桶中流出。如果桶满了，新的数据会被丢弃。

**控制**：通过固定的流出速率来确保流量平稳输出。

- 4.应用场景

令牌桶算法：

- 适用于需要处理一定程度的流量突发的情况，如网络流量控制、API请求限制等。
- 例如，允许一个用户在一段时间内可以有一定的突发请求，但总流量仍受到限制。

漏桶算法：

- 适用于需要平稳流量输出的场景，如网络带宽管理、服务器流量控制等。
- 例如，网络路由器中的流量管理，确保数据包以平稳的速率流出。

总结

- 令牌桶算法允许一定程度的流量突发，通过令牌控制来实现灵活的流量管理。
- 漏桶算法确保输出流量平稳，通过固定的输出速率控制流量，适合需要平稳流量的场景。
- 选择哪种算法取决于具体应用的需求和系统的要求。