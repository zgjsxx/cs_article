---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [Frangipani：一种可扩展的分布式文件系统(1997)](#frangipani一种可扩展的分布式文件系统1997)
  - [摘要](#摘要)
  - [1.介绍](#1介绍)
  - [2.系统结构。](#2系统结构)
    - [2.1 组件](#21-组件)

# Frangipani：一种可扩展的分布式文件系统(1997)

## 摘要

理想的分布式文件系统有下面几个要求：
- 将为其所有用户提供对同一组文件的一致、共享访问，
- 能够任意扩展，以便为不断增长的用户群体提供更多的存储空间和更高的性能。
- 尽管存在组件故障，它也应具有高可用性。
- 需要最少的人工管理，并且随着更多组件的添加，管理不会变得更加复杂。

Frangipani 是一种新的文件系统，它接近这个理想状态。由于其两层结构，相对容易构建。底层是 Petal（在早期的一篇论文中有描述），这是一种分布式存储服务，提供可增量扩展、高可用性、自动管理的虚拟磁盘。在上层，多台机器在共享的 Petal 虚拟磁盘之上运行相同的 Frangipani 文件系统代码，并使用分布式锁服务来确保一致性。

Frangipani 旨在在一组处于共同管理下且能够安全通信的机器集群中运行。因此，这些机器相互信任，共享虚拟磁盘的方法是可行的。当然，Frangipani 文件系统可以使用普通的网络文件访问协议导出到不受信任的机器上。

我们在一组运行 DIGITAL Unix 4.0 的 Alpha 机器上实现了 Frangipani。初步测量表明，Frangipani 具有出色的单服务器性能，并且随着服务器的增加，扩展性良好。

## 1.介绍

使用当今技术构建的大型、不断发展的计算机系统的文件系统管理是一项艰巨的任务。为了存储更多文件并服务更多用户，必须添加更多磁盘，并将其连接到更多机器上。这些组件中的每一个都需要人工管理。文件组通常被手动分配到特定磁盘，然后当组件装满、出现故障或成为性能热点时，再手动移动或复制。使用 RAID 技术将多个磁盘驱动器组合成一个单元只是一个部分解决方案；一旦系统增长到需要多个 RAID 和多台服务器机器的程度，管理问题仍然会出现。

Frangipani 是一种新型的可扩展分布式文件系统，它将多台机器上的磁盘集合作为一个单一的共享存储池进行管理。假定这些机器处于共同管理之下，并且能够安全地进行通信。此前已经有很多构建在吞吐量和容量方面具有良好扩展性的分布式文件系统的尝试。

Frangipani 的一个显著特点是它具有非常简单的内部结构：一组协作的机器使用一个共同的存储，并通过锁来同步对该存储的访问。这种简单的结构使我们能够用极少的机制来处理系统恢复、重新配置和负载均衡。Frangipani 的另一个关键方面是它结合了一系列特性，使得与我们所知道的现有文件系统相比，使用和管理 Frangipani 更加容易。
- 所有用户都能看到同一组文件的一致视图。
- 可以很容易地向现有的 Frangipani 安装中添加更多服务器，以增加其存储容量和吞吐量，而无需改变现有服务器的配置或中断其运行。服务器可以被视为 "砖块"，可以逐步堆叠以构建所需大小的文件系统。
- 系统管理员可以添加新用户，而无需关心哪些机器将管理他们的数据或哪些磁盘将存储这些数据。
- 系统管理员可以在不关闭整个文件系统的情况下对其进行完整且一致的备份。备份可以选择在线保存，允许用户快速访问意外删除的文件。
- 文件系统能够容忍并从机器、网络和磁盘故障中恢复，无需操作员干预。


Frangipani 构建在 Petal 之上，Petal 是一个易于管理的分布式存储系统，为其客户端提供虚拟磁盘。与物理磁盘一样，Petal 虚拟磁盘提供可以按块进行读取或写入的存储。与物理磁盘不同的是，虚拟磁盘提供一个稀疏的 2⁶⁴字节地址空间，仅在有需求时才分配物理存储。Petal 可选择地复制数据以实现高可用性。Petal 还提供高效的快照以支持一致的备份。Frangipani 从底层存储系统继承了其大部分的可扩展性、容错性和易管理性，但是需要精心设计才能将这些特性扩展到文件系统级别。下一节将更详细地描述 Frangipani 的结构及其与 Petal 的关系。

图 1 说明了 Frangipani 系统中的层次结构。多个可互换的 Frangipani 服务器通过在共享的 Petal 虚拟磁盘之上运行来提供对相同文件的访问，它们使用锁来协调其操作以确保一致性。文件系统层可以通过添加 Frangipani 服务器来进行扩展。它通过从服务器故障中自动恢复并继续使用幸存的服务器来实现容错。通过将文件系统负载拆分并转移到正在使用文件的机器上，它比集中式网络文件服务器提供了更好的负载均衡。Petal 和锁服务也为了可扩展性、容错性和负载均衡而进行分布式部署。

![图1：Frangipani分层](https://github.com/zgjsxx/static-img-repo/raw/main/blog/lesson/6.824/lesson11/paper/fig1-frangipani-layer.png)

Frangipani 服务器相互信任、信任 Petal 服务器以及锁服务。Frangipani 被设计为在单个管理域内的工作站集群中良好运行，尽管 Frangipani 文件系统可以被导出到其他域。因此，Frangipani 可以被视为一个集群文件系统。

我们在 DIGITAL Unix 4.0 下实现了 Frangipani。由于 Frangipani 在现有的 Petal 服务之上有清晰的层次结构，我们仅在几个月内就实现了一个可用的系统。Frangipani 针对具有程序开发和工程工作负载的环境。我们的测试表明，在这样的工作负载下，Frangipani 具有出色的性能，并且可以扩展到网络所施加的极限。

## 2.系统结构。

图 2 描绘了一种典型的将功能分配到机器的方式。顶部所示的机器运行用户程序和 Frangipani 文件服务器模块；它们可以是无盘的。底部所示的机器运行 Petal 和分布式锁服务。

Frangipani 的组件不必完全按照图 2 所示的方式分配到机器上。Petal 和 Frangipani 服务器不必在单独的机器上；对于每台 Petal 机器也运行 Frangipani 是有意义的，特别是在 Petal 机器负载不重的安装环境中。分布式锁服务独立于系统的其他部分；我们展示了一个锁服务器在每台 Petal 服务器机器上运行，但它们也可以在 Frangipani 主机或任何其他可用的机器上运行。

### 2.1 组件

如图 2 所示，用户程序通过标准操作系统调用接口访问 Frangipani。在不同机器上运行的程序都能看到相同的文件，并且它们的视图是一致的；也就是说，在一台机器上对文件或目录所做的更改会立即在所有其他机器上可见。

程序基本上获得与本地 Unix 文件系统相同的语义保证：
- 对文件内容的更改通过本地内核缓冲池暂存，并且在下次适用的 fsync 或 sync 系统调用之前不能保证到达非易失性存储，但元数据的更改会被记录，并且可以选择在系统调用返回时保证其非易失性。
- 与本地文件系统语义稍有不同的是，Frangipani 仅大致维护文件的最后访问时间，以避免每次读取数据时都进行元数据写入。

每台机器上的 Frangipani 文件服务器模块在操作系统内核中运行。它向内核的文件系统切换机制注册自己，作为可用的文件系统实现之一。

文件服务器模块使用内核的缓冲池来缓存最近使用过的文件中的数据。它使用本地的 Petal 设备驱动程序来读取和写入 Petal 虚拟磁盘。所有的文件服务器在共享的 Petal 磁盘上读取和写入相同的文件系统数据结构，但每个服务器在 Petal 磁盘的不同部分保留自己的待处理更改的重做日志。日志保存在 Petal 中，以便当 Frangipani 服务器崩溃时，另一个服务器可以访问该日志并进行恢复。Frangipani 服务器无需直接相互通信；它们只与 Petal 和锁服务进行通信。这使得服务器的添加、删除和恢复变得简单。

Petal 设备驱动程序隐藏了 Petal 的分布式特性，使 Petal 在操作系统的更高层看来就像一个普通的本地磁盘。该驱动程序负责联系正确的 Petal 服务器，并在必要时故障转移到另一个服务器。任何 Digital Unix 文件系统都可以在 Petal 之上运行，但只有 Frangipani 能从多台机器提供对相同文件的一致访问。



问题：

Frangipani和GFS有什么区别？

- 一个重要的架构差异是，GFS将大部分文件系统逻辑放在服务器上，而Frangipani在运行Frangipani的工作站上分布逻辑。换句话说，Frangipani并没有像GFS那样真正意义上的文件服务器的概念。为了允许工作站在其本地缓存中纯粹执行文件系统操作，Frangipani将文件系统逻辑放在工作站上。当大部分活动是工作站读取和写入单个用户的（缓存的）文件时，这是有道理的。Frangipani有许多机制来确保工作站缓存保持一致，这样一个工作站上的写操作对另一个工作站上的读操作立即可见，同时复杂的操作（如创建文件）即使其他工作站试图查看涉及的文件或目录，也是原子的。对于Frangipani来说，最后一种情况是棘手的，因为没有指定的文件服务器执行对给定文件或目录的所有操作。
- 相比之下，GFS根本没有缓存，因为它的重点是对无法放入任何缓存的大型文件进行顺序读写。通过将每个文件分布在许多GFS服务器上，它在读取大型文件时获得了高性能。由于GFS没有缓存，它没有缓存一致性协议。由于文件系统逻辑在服务器上，GFS客户端相对较简单；只有服务器需要进行锁定并担心崩溃恢复。
- Frangipani看起来是一个真正的文件系统，你可以与任何现有的工作站程序一起使用。从这个意义上说，GFS并不像文件系统那样呈现出来；应用程序必须明确编写以通过库调用使用GFS。