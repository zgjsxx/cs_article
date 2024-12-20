---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [Spanner：Google 的全球分布式数据库](#spannergoogle-的全球分布式数据库)
  - [摘要](#摘要)
  - [1.介绍](#1介绍)
  - [2.实现](#2实现)
    - [2.1 Spanner 服务器软件栈](#21-spanner-服务器软件栈)
    - [2.2 目录与放置](#22-目录与放置)
    - [2.3 数据模型](#23-数据模型)
  - [3.TrueTime](#3truetime)
  - [4.并发控制](#4并发控制)
    - [4.1 时间管理](#41-时间管理)
      - [4.1.1 Paxos 领导者租约](#411-paxos-领导者租约)
    - [4.1.2 为读写事务分配时间戳](#412-为读写事务分配时间戳)
      - [4.1.3 在某时间戳处提供读取服务](#413-在某时间戳处提供读取服务)
      - [4.1.4 为只读事务分配时间戳](#414-为只读事务分配时间戳)
    - [4.2 细节](#42-细节)
      - [4.2.1 读写事务](#421-读写事务)
  - [8. 结论](#8-结论)

# Spanner：Google 的全球分布式数据库

## 摘要

Spanner是谷歌的可伸缩，多版本，全球化分布，同步多副本的数据库。它是首个能将数据分布到全球范围内且支持外部一致性的分布式事务的系统。本文介绍了如下几个方面：
- Spanner的结构、特性、底层设计决策的原理
- 公开时钟不确定性的新型时间API。此 API 及其实现对于支持外部一致性以及各种强大功能至关重要：在整个 Spanner 中实现对过去的无阻塞读取、无锁只读事务以及原子模式更改。

注：Spanner底层并不是纯粹的关系型数据库，但是提供了SQL查询语言。

## 1.介绍

Spanner 是一种可扩展的、全球分布式数据库，由谷歌设计、构建并部署。在最高抽象层次上，它是一个在遍布全球的数据中心中的多组 Paxos 状态机上对数据进行分片的数据库。复制用于实现全局可用性和地理局部性；客户端会在副本之间自动进行故障转移。随着数据量或服务器数量的变化，Spanner 会自动在机器之间重新分片数据，并且它会自动在机器之间（甚至跨数据中心）迁移数据，以平衡负载并应对故障。Spanner 被设计为可扩展到数百个数据中心的数百万台机器以及数万亿条数据库行。

通过在一个大洲内部甚至跨大洲复制其数据，应用程序可以使用 Spanner 实现高可用性，即使在面临广域自然灾害的情况下也是如此。我们的最初客户是 F1，它是谷歌广告后端的重写版本。F1 使用分布在美国各地的五个副本。F1 使用分布在美国各地的五个副本。大多数其他应用程序可能会在一个地理区域的三到五个数据中心之间复制其数据，但具有相对独立的故障模式。也就是说，大多数应用程序只要能够在一两个数据中心出现故障的情况下存活下来，就会选择较低的延迟而不是较高的可用性。(副本数量越多，可用性越强，但是延迟越高)。

Spanner 的主要重点是管理跨数据中心的复制数据，但我们也在分布式系统基础设施之上设计和实现重要的数据库功能方面花费了大量时间。

尽管许多项目愉快地使用 Bigtable，但我们也一直收到用户的抱怨，即对于某些类型的应用程序，Bigtable 可能难以使用。
- 那些具有复杂、不断演变的模式的应用，或者那些在广域复制的情况下想要强一致性的应用。（其他作者也提出了类似的主张)

谷歌的许多应用程序选择使用，是因为它的半关系型数据模型以及对同步复制的支持，尽管它的写入吞吐量相对较低。

因此，Spanner 已从类似 Bigtable 的带版本控制的键值存储演变为一个时间多版本数据库。数据存储在有模式的半关系型表中；数据是有版本的，并且每个版本都自动带有其提交时间的时间戳；旧版本的数据受可配置的垃圾回收策略约束；并且应用程序可以读取旧时间戳下的数据。Spanner 支持通用事务，并提供一种基于 SQL 的查询语言。

作为一个全球分布式数据库，Spanner 提供了一些有趣的特性。
- 首先，应用程序可以对数据的复制配置进行精细的动态控制。应用程序可以指定约束条件来控制哪些数据中心包含哪些数据、数据与用户的距离（以控制读取延迟）、副本之间的距离（以控制写入延迟）以及维护的副本数量（以控制持久性、可用性和读取性能）。数据也可以由系统在数据中心之间动态且透明地移动，以平衡跨数据中心的资源使用。
- 第二，Spanner 有两个在分布式数据库中难以实现的特性：它提供外部一致的读和写，以及在某个时间戳下整个数据库的全局一致读。这些特性使 Spanner 能够在全球范围内支持一致的备份、一致的 MapReduce 执行和原子模式更新，即使在有正在进行的事务的情况下也是如此。

这些特性是由这样一个事实实现的，即尽管事务可能是分布式的，但 Spanner 为事务分配具有全局意义的提交时间戳。这些时间戳反映了序列化顺序。此外，序列化顺序满足外部一致性（或者等价地，满足线性一致性）：如果一个事务 T1 在另一个事务 T2 开始之前提交，那么 T1 的提交时间戳小于 T2 的提交时间戳。Spanner 是第一个在全球范围内提供此类保证的系统。

这些特性的关键促成因素是新的 TrueTime API 及其实现。该 API 直接暴露时钟不确定性，而 Spanner 的时间戳保证取决于实现所提供的界限。如果不确定性很大，Spanner 会放慢速度以等待这种不确定性消失。谷歌的集群管理软件提供了 TrueTime API 的一种实现。这种实现通过使用多个现代时钟参考（GPS 和原子钟）使不确定性保持在较小范围内（通常小于 10 毫秒）。

论文的后续安排如下所示：
- 第 2 节描述了 Spanner 实现的结构、其功能集以及在设计中所做的工程决策。
- 第 3 节描述了我们新的 TrueTime API 并概述了其实现。
- 第 4 节描述了 Spanner 如何使用 TrueTime 来实现外部一致的分布式事务、无锁只读事务和原子模式更新。
- 第 5 节提供了一些关于 Spanner 性能和 TrueTime 行为的基准测试，并讨论了 F1 的经验。
- 第 6、7 和 8 节描述了相关工作和未来工作，并总结了我们的结论。

## 2.实现

本节描述了 Spanner 实现的结构及其背后的基本原理。然后描述了目录抽象，它用于管理复制和局部性，并且是数据移动的单位。最后，描述了我们的数据模型，为什么 Spanner 看起来像一个关系型数据库而不是键值存储，以及应用程序如何控制数据局部性。

一个 Spanner 部署被称为一个 universe。鉴于 Spanner 在全球范围内管理数据，运行中的 universe 只会有几个。我们目前运行着一个测试 / 试验 universe、一个开发 / 生产 universe 以及一个仅用于生产的 universe。

Spanner 被组织为一组 zone，其中每个zone大致类似于一个 Bigtable 服务器的部署。zone是管理部署的单位。zone集合也是数据可以被复制的位置集合。随着新的数据中心投入使用和旧的数据中心关闭，区域可以分别被添加到正在运行的系统中或从其中移除。Zone也是物理隔离的单位：例如，在一个数据中心中可能有一个或多个Zone，如果不同应用程序的数据必须在同一个数据中心的不同服务器集合之间进行分区的话。

![Spanner服务器状态](https://github.com/zgjsxx/static-img-repo/raw/main/blog/lesson/6.824/lesson13/paper/fig1-spanner-server-organization.png)

图 1 展示了 Spanner universe 中的服务器。一个zone有一个zonemaster以及在一百到几千个 Spanner server之间。前者将数据分配给 Spanner server；后者为客户端提供数据服务。每个zone的location proxy被客户端用来定位被分配为其提供数据服务的 Spanner server。

目前，universe master和placement driver都是单一的实例。universe主服务器主要是一个控制台，用于显示所有区域的状态信息，以便进行交互式调试。placement driver在几分钟的时间尺度上处理数据在不同区域之间的自动移动。placement driver会定期与 Spanner 服务器通信，以找到需要移动的数据，要么是为了满足更新后的复制约束，要么是为了平衡负载。由于篇幅原因，我们将只详细描述 Spanner 服务器。

### 2.1 Spanner 服务器软件栈

本节重点介绍 Spanner 服务器的实现，以说明复制和分布式事务是如何分层构建在我们基于 Bigtable 的实现之上的。软件栈如图 2 所示。在底层，每个 Spanner 服务器负责 100 到 1000 个被称为 "数据片"（tablet）的数据结构实例。一个数据片类似于 Bigtable 的数据片抽象，因为它实现了一组如下的映射：

```shell
(key: string, timestamp: int64) -> string
```

与 Bigtable 不同，Spanner 为数据分配时间戳，这是 Spanner 更像一个多版本数据库而不是键值存储的一个重要方式。一个数据片的状态存储在一组类似 B 树的文件和一个预写日志中，所有这些都存储在一个名为 Colossus 的分布式文件系统中（它是 Google 文件系统的后续版本）。

为了支持复制，每个 Spanner 服务器在每个数据片之上实现一个单独的 Paxos 状态机。（早期的 Spanner 版本在每个数据片上支持多个 Paxos 状态机，这允许更灵活的复制配置。但该设计的复杂性使我们放弃了它。）每个状态机将其元数据和日志存储在相应的数据片中。我们的 Paxos 实现支持具有基于时间的领导权租约的长期领导者，其租约时长默认为 10 秒。当前的 Spanner 实现将每个 Paxos 写入操作记录两次：一次在数据片的日志中，一次在 Paxos 日志中。这个选择是出于权宜之计，我们最终可能会纠正这一点。我们对 Paxos 的实现是流水线式的，以便在存在广域网延迟的情况下提高 Spanner 的吞吐量；但是 Paxos 会按顺序应用写入操作（在第 4 节中我们将依赖这一事实）。

Paxos 状态机被用来实现一个一致复制的映射集合。每个副本的键值映射状态存储在其相应的数据片中。写入操作必须在领导者处启动 Paxos 协议；读取操作可以从任何足够新的副本的底层数据片中直接访问状态。副本集合共同构成一个 Paxos 组。

在每个作为领导者的副本处，每个 Spanner 服务器实现一个锁表来实现并发控制。锁表包含两阶段锁的状态：它将键的范围映射到锁状态。（注意，拥有一个长期存在的 Paxos 领导者对于高效管理锁表至关重要。）在 Bigtable 和 Spanner 中，我们都为长期事务（例如，可能需要几分钟的报告生成）进行了设计，在存在冲突的情况下，这些事务在乐观并发控制下表现不佳。需要同步的操作，如事务性读取，在锁表中获取锁；其他操作绕过锁表。

在每个作为领导者的副本处，每个 Spanner 服务器还实现一个事务管理器来支持分布式事务。事务管理器用于实现一个参与者领导者；组中的其他副本将被称为参与者从属。如果一个事务只涉及一个 Paxos 组（大多数事务都是如此），它可以绕过事务管理器，因为锁表和 Paxos 一起提供了事务性。如果一个事务涉及多个 Paxos 组，这些组的领导者进行协调以执行两阶段提交。其中一个参与者组被选为协调者：该组的参与者领导者将被称为协调者领导者，该组的从属将被称为协调者从属。每个事务管理器的状态存储在底层的 Paxos 组中（因此是被复制的）。

### 2.2 目录与放置

在键值映射集合之上，Spanner 实现支持一种称为 "目录"（directory）的分桶抽象，它是一组具有共同前缀的连续键的集合。（"目录" 这个术语的选择是一个历史偶然；一个更好的术语可能是 "桶"（bucket）。）我们将在 2.3 节中解释这个前缀的来源。支持目录使得应用程序能够通过谨慎选择键来控制其数据的局部性。

目录是数据放置的单位。一个目录中的所有数据具有相同的复制配置。当数据在 Paxos 组之间移动时，它是按目录逐个移动的，如图 3 所示。Spanner 可能会移动一个目录以减轻一个 Paxos 组的负载；将经常被一起访问的目录放入同一个组中；或者将一个目录移动到更接近其访问者的组中。在客户端操作进行时可以移动目录。可以预期一个 50MB 的目录可以在几秒钟内被移动。

一个 Paxos 组可能包含多个目录这一事实意味着 Spanner 的数据片与 Bigtable 的数据片不同：前者不一定是行空间的单个按字典序连续的分区。相反，Spanner 的数据片是一个容器，可以封装行空间的多个分区。我们做出这个决定是为了能够将经常一起被访问的多个目录放置在同一位置。

"Movedir" 是用于在 Paxos 组之间移动目录的后台任务。"Movedir" 也被用于向 Paxos 组添加或移除副本，因为 Spanner 尚不支持在 Paxos 内部进行配置更改。"Movedir" 不是作为单个事务来实现的，以避免在大量数据移动时阻塞正在进行的读取和写入操作。相反，"Movedir" 记录它开始移动数据的事实，并在后台移动数据。当它移动了除了少量标称数量的数据之外的所有数据时，它使用一个事务来原子性地移动该标称数量的数据，并更新两个 Paxos 组的元数据。

目录也是应用程序可以指定其地理复制属性（简称为放置）的最小单位。我们的放置规范语言的设计将管理复制配置的职责分开。管理员控制两个维度：副本的数量和类型，以及这些副本的地理位置放置。他们在这两个维度上创建一个命名选项的菜单（例如，北美，以五种方式复制并带有一个见证者）。应用程序通过用这些选项的组合标记每个数据库和 / 或单个目录来控制数据的复制方式。例如，应用程序可以将每个最终用户的数据存储在其自己的目录中，这将使得用户 A 的数据在欧洲有三个副本，而用户 B 的数据在北美有五个副本。

为了阐述清晰，我们进行了过度简化。实际上，如果一个目录变得太大，Spanner 会将其分割成多个片段。片段可以从不同的 Paxos 组（因此也是不同的服务器）提供服务。“Movedir” 实际上在组之间移动的是片段，而不是整个目录。

### 2.3 数据模型

Spanner 向应用程序公开了以下一组数据特性：基于模式化半关系表的数据模型、一种查询语言以及通用事务。朝着支持这些特性的方向发展是由许多因素驱动的。支持模式化半关系表和同步复制的需求是由 Megastore 的流行所推动的。谷歌内部至少有 300 个应用程序使用 Megastore（尽管它的性能相对较低），因为它的数据模型比 Bigtable 的更容易管理，并且因为它支持跨数据中心的同步复制。(Bigtable 只支持跨数据中心的最终一致性复制。)使用 Megastore 的著名谷歌应用程序的例子有 Gmail、Picasa、日历、Android 市场和 App Engine。考虑到 Dremel 作为一种交互式数据分析工具的流行，Spanner 中支持类似 SQL 的查询语言的需求也很明确。最后，Bigtable 中缺乏跨行事务导致了频繁的抱怨；Percolator 在一定程度上是为了解决这个缺陷而构建的。一些作者声称，通用的两阶段提交由于其带来的性能或可用性问题而过于昂贵而难以支持。我们认为，最好让应用程序程序员在出现瓶颈时处理由于过度使用事务而导致的性能问题，而不是总是围绕缺乏事务进行编码。在 Paxos 上运行两阶段提交缓解了可用性问题。

应用程序的数据模型构建在实现所支持的基于目录分桶的键值映射之上。一个应用程序在一个 "全域" 中创建一个或多个数据库。每个数据库可以包含无限数量的模式化表。表看起来像关系数据库表，具有行、列和带版本的值。我们不会详细介绍 Spanner 的查询语言。它看起来像 SQL，并带有一些扩展以支持协议缓冲区（protocol buffer）值的字段。

图 4 包含了一个在每个用户、每张专辑的基础上存储照片元数据的 Spanner 模式示例。模式语言与 Megastore 的类似，另外要求每个 Spanner 数据库必须由客户端划分成一个或多个表的层次结构。客户端应用程序通过 "INTERLEAVE IN" 声明在数据库模式中声明层次结构。层次结构顶部的表是一个目录表。目录表中具有键 K 的每一行，以及按字典顺序以 K 开头的所有后代表中的行，共同形成一个目录。"ON DELETE CASCADE" 表示删除目录表中的一行将删除任何相关的子行。

该图还展示了示例数据库的交错布局：例如，"Albums (2,1)" 表示用户 ID 为 2、专辑 ID 为 1 的 "Albums" 表中的一行。这种表的交错形成目录是很重要的，因为它允许客户端描述多个表之间存在的局部性关系，这对于分片的分布式数据库中的良好性能是必要的。如果没有它，Spanner 将不知道最重要的局部性关系。

```SQL
CREATE TABLE Users {
  uid INT64 NOT NULL, email STRING
} PRIMARY KEY (uid), DIRECTORY;

CREATE TABLE Albums {
  uid INT64 NOT NULL, aid INT64 NOT NULL,
  name STRING
} PRIMARY KEY (uid, aid),

INTERLEAVE IN PARENT Users ON DELETE CASCADE
```

## 3.TrueTime

|方法|返回值|
|--|--|
|```TT.now()```|True Time时间间隔：[earliest， latest]|
|```TT.after(t)```|如果时间一定超过了t，返回true|
|```TT.before(t)```|如果时间一定在t之前，返回true|

本章描述了TrueTime API并概述了其实现。我们将大部分的细节放在了另一篇论文中，本文的目标是证明这一API的能力。

表1列出了API的方法。TrueTime显式地将时间表示为$TTinterval$，它是一个有时间不确定度界限的时间范围（不像标准的时间接口，标准时间接口不会给客户端不确定度的概念）。$TTinterval$的接入点（endpoint）是$TTstamp$类型。$TT.now()$方法返回一个$TTinterval$，该时间范围保证了包含$TT.now()$被调用的绝对时间。该时间类似于带有闰秒（leap-second）的UNIX时间。（译注：此处原文为"The time epoch is analogous to UNIX time with leap-second smearing."）定义瞬时误差的界限为$\epsilon$，其为时间范围宽度的一半，定义平均错误界限为$\bar{\epsilon}$。$TT.after()$和$TT.before()$是对$TT.now()$的方便的封装。

函数$t_{abs}(e)$表示事件$e$的绝对时间。用更加正式的术语来说，TrueTime能够保证，对于一次调用$tt = TT.now()$来说，$tt.earliest \le t_{abs}(e_{now}) \le tt.latest$，其中$e_{now}$表示调用事件。

TrueTime在底层使用的参考时间为GPS和原子时钟。TrueTime使用了两种形式的参考时间，因为它们有不同的故障模式。GPS参考源的弱点有天线和接收器故障、本地无线电干扰、相关故障（例如，如闰秒处理不正确的设计故障、和欺骗等）、和GPS系统停机。原子时钟可能会以与GPS和彼此不相关的方式发生故障，且在长时间后会由于频繁错误而发生明显的漂移。

TrueTime通过每个数据中心的time server机器集合和每个机器的timeslave daemon的实现。大多数的master都有带专用天线的GPS接收器；这些master在物理上被划分开，以减少天线故障、无线电干扰、和欺骗的影响。其余的master（我们称其为Armageddon master）配备了原子时钟。原子时钟并没有那么贵：Armageddon master的成本与GPS master的成本在同一数量级。所有master的参考时间通常彼此不同。每个master还会通过它自己的本地时钟较差验证其参考时间提前的速率，如果二者有实质性的分期，则自己退出集合。在同步期间，Armageddom master会保守地给出从最坏的情况下的时钟漂移得出的缓慢增长的时间不确定性。GPS master会给出通常接近零的的不确定性。

每个daemon会轮询各种master来减少任意一个master的错误的影响。一些是从就近的数据中心选取的GPS master，一些是从更远的数据中心的GPS master，对Armageddon master来说也是一样。daemon使用一种Marzullo算法的变体来检测并拒绝说谎者，并与没说谎的机器同步本地的机器时钟。为了防止本地时钟故障，应该淘汰掉发生偏移频率大于从组件规格和操作环境得出的界限的机器。

在同步期间，daemon会给出缓慢增长的时间不确定性。$\epsilon$保守地从最坏的本地市中偏移得出。$\epilson$还依赖time master的不确定性和到time master的通信延迟。在我们的生产环境中，$\epsilon$通常是时间的锯齿波函数（sawtooth functon），每次轮询的间隔大概在1ms到7ms间。因此，大部分时间里$\bar{\epsilon}$为4ms。目前，daemon的轮询间隔为30秒，且当前的漂移速率被设置为200ms/s，二者一起组成了0到6ms的锯齿边界。剩下的1ms来自于到time master的通信延迟。在出现故障时，锯齿波可能会出现偏移。例如，偶尔的time master的不可用可能导致数据中心范围的$\epsilon$增加。同样，机器和网络连接过载可能导致$\epsilon$偶尔出现局部峰值。

## 4.并发控制

本节描述了如何使用 TrueTime 来保证围绕并发控制的正确性属性，以及如何使用这些属性来实现诸如外部一致的事务、无锁只读事务以及过去的非阻塞读取等功能。例如，这些功能确保了在时间戳 t 进行的全数据库审计读取将准确看到在时间 t 为止已提交的每个事务的效果。

展望未来，区分由 Paxos 看到的写入（在上下文清楚的情况下我们将其称为 Paxos 写入）与 Spanner 客户端写入将非常重要。例如，两阶段提交为准备阶段生成一个 Paxos 写入，但没有相应的 Spanner 客户端写入。

### 4.1 时间管理

表 2 列出了 Spanner 支持的操作类型。Spanner 实现支持读写事务、只读事务（预先声明的快照隔离事务）以及快照读取。独立写入被实现为读写事务。非快照独立读取被实现为只读事务。两者在内部都会进行重试（客户端无需编写自己的重试循环）。

只读事务是一种具有快照隔离性能优势的事务类型。只读事务必须预先声明为没有任何写入操作；它不只是一个没有任何写入的读写事务。只读事务中的读取操作在系统选定的时间戳下执行，无需锁定，因此不会阻塞传入的写入操作。只读事务中的读取操作可以在任何足够新的副本上进行（4.1.3 节）。

快照读取是一种在过去进行的无需锁定的读取操作。客户端可以为快照读取指定一个时间戳，或者提供所需时间戳的最大过时程度上限，并让 Spanner 选择一个时间戳。在任何一种情况下，快照读取的执行都可以在任何足够新的副本上进行。

对于**只读事务**和**快照读取**而言，一旦选择了一个时间戳，提交就是不可避免的，除非该时间戳处的数据已被垃圾回收。因此，客户端可以避免在重试循环中缓冲结果。当服务器出现故障时，客户端可以通过重复时间戳和当前读取位置在不同的服务器上内部继续查询。

#### 4.1.1 Paxos 领导者租约

Spanner 的 Paxos 实现使用定时租约来使领导权长期存在（默认情况下为 10 秒）。潜在的领导者发送定时租约投票请求；一旦收到法定数量的租约投票，领导者就知道它拥有租约。副本在成功写入时隐式地延长其租约投票，并且如果租约即将到期，领导者会请求租约投票延期。将领导者的租约区间定义为从它发现自己拥有法定数量的租约投票时开始，到它不再拥有法定数量的租约投票时结束（因为有些已经过期）。
Spanner 依赖于以下互斥不变性：对于每个 Paxos 组，每个 Paxos 领导者的租约区间与其他任何领导者的租约区间都是不相交的。附录 A 描述了如何强制执行这个不变性。

Spanner 的实现允许 Paxos 领导者通过解除其从节点的租约投票来退位。为了保持互斥不变性，Spanner 对何时允许退位进行了限制。定义 ${s}_{max}$ 为领导者使用的最大时间戳。后续部分将描述何时推进 ${s}_{max}$。在退位之前，领导者必须等待直到 TT.after (${s}_{max}$) 为真。


### 4.1.2 为读写事务分配时间戳

事务的读写使用两阶段锁。因此，可以在已经获取了所有锁之后与任何锁被释放之前的任意时间里为其分配时间戳。对一个给定的事务，Spanner为其分配的时间戳是Paxos为Paxos write分配的表示事务提交的时间戳。

Spanner依赖如下的单调定理：在每个Paxos group内，Spanner以单调增加的顺序为Paxos write分配时间戳，即使跨leader也是如此。单个leader副本可以单调递增地分配时间戳。通过使用不相交定理，可以在跨leader的情况下保证该定理：leader必须仅在它的leader租约的期限内分配时间戳。注意，每当时间戳$s$被分配时，$s_{max}$会增大到$s$，以保持不相交性。

Spanner还保证了如下的的外部一致性定理：如果事务$T_2$在事务$T_1$提交之后开始，那么$T_2$的提交时间戳一定比$T_1$的提交时间戳大。

定义事务$T_i$的开始事件与提交事件分别为$e_i^{start}$和$e_i^{commit}$、事务$T_i$的提交时间戳为$s_i$。该定理可以使用$t_{abs}(e_1^{commit}) < t_{abs}(e_2^{start}) \implies s_1 < s_2$表示。这一用来执行事务与分配时间戳的协议遵循两条规则，二者共同保证了定理，如下所示。定义写入事务$T_i$的提交请求到达coordinator leader的事件为$e_i^{server}$。

**开始（Start）**： 写入事务$T_i$的coordinator leader在$e_i^{server}$会为其计算并分配值不小于$TT.now().latest$的时间戳$s_i$。注意，participant leader于此无关；章节4.2.1描述了participant如何参与下一条规则的实现。

**提交等待（Commit Wait）**： coordinator leader确保了客户端在$TT.after(s_i)$为true之前无法看到任何由$T_i$提交的数据。提交等待确保了$s_i$比$T_i$的提交的绝对时间小，或者说$s_i < t_{abs}(e_i^{commit})$。该提交等待的实现在章节4.2.1中描述。证明：

$$ s_1 < t_{abs}(e_1^{commit}) \tag{commit wait} $$
$$ t_{abs}(e_1^{commit}) < t_{abs}(e_2^{start}) \tag{assumption} $$
$$ t_{abs}(e_2^{start}) \le t_{abs}(e_2^{server}) \tag{causality} $$
$$ t_{abs}(e_2^{server}) \le s_2 \tag{start} $$
$$ s_1 < s_2 \tag{transitivity} $$

这里的理解很关键，论文中使用了公式进行了严谨的表达，这里将其将其画在一条时间轴上，这样更容易理解。

![读写事务的时间戳](https://github.com/zgjsxx/static-img-repo/raw/main/blog/lesson/6.824/lesson13/paper/read-write-trx.png)

对于一个client端，如果其已知事务$T_2$在事务$T_1$提交之后开始，也就是说$T_2$和$T_1$存在一个明确的先后关系。
- $s_1 < t_{abs}(e_1^{commit})$：在获得提交时间$s_1$之后，系统会不停调用$TT.after(s_1)$,直到返回true。因此事务实际的提交的绝对时间要晚于事务分配的之间戳。
- $t_{abs}(e_1^{commit}) < t_{abs}(e_2^{start})$：这个点很容易得到，即e1提交的绝对时间要早于e2开始的绝对时间，这个结论来源于假设的前提，$T_2$和$T_1$的先后关系。
- $t_{abs}(e_2^{start}) \le t_{abs}(e_2^{server})$：这个不等式来源于因果关系，事务协调器发起事务提交的时间一定晚于事务的开始时间。
- $t_{abs}(e_2^{server}) \le s_2$: $e_i^{server}$被定义为写入事务$T_i$的提交请求到达coordinator leader的事件，其会为其计算并分配值不小于$TT.now().latest$的时间戳$s_i$，因为取的是latest，根据True Time的定义很容易获得。
- $s_1 < s_2$： 这个结论来源于不等式的传递。

因此通过这样的推到我们的得到的结论是，如果事务$T_2$在事务$T_1$提交之后开始，那么$T_2$的提交时间戳一定比$T_1$的提交时间戳大。

该结论用公式表达，就是：

$$t_{abs}(e_1^{commit}) < t_{abs}(e_2^{start}) \implies s_1 < s_2$$

#### 4.1.3 在某时间戳处提供读取服务

章节4.1.2中描述的单调性定理让Spanner能够正确地确定副本的状态对一个读取操作来说是否足够新。每个副本会追踪一个被称为safe time（安全时间） 的值$t_{safe}$，它是最新的副本中的最大时间戳。如果读操作的时间戳为$t$，那么当$t \le t_{safe}$时，副本可以满足该读操作。
定义$t_{safe} = \min(t_{safe}^{Paxos},t_{safe}^{TM})$，其中每个Paxos状态机有safe time $t_{safe}^{Paxos}$，每个transaction manager有safe time $t_{safe}^{TM}$。$t_{safe}^{Paxos}$简单一些：它是被应用的序号最高的Paxos write的时间戳。因为时间戳单调增加，且写入操作按顺序应用，对于Paxos来说，写入操作不会发生在$t_{safe}^{Paxos}$或更低的时间。
如果没有就绪（prepared）的（还没提交的）事务（即处于两阶段提交的两个阶段中间的事务），那么$t_{safe}^{TM}$为$\infty$。（对于participant slave，$t_{safe}^{TM}$实际上表示副本的leader的transaction manager的safe time，slave可以通过Paxos write中传递的元数据来推断其状态。）如果有任何的这样的事务存在，那么受这些事务影响的状态是不确定的：particaipant副本还不知道这样的事务是否将会提交。如我们在章节4.2.1中讨论的那样，提交协议确保了每个participant知道就绪事务的时间戳的下界。对group $g$来说，每个事务$T_i$的participant leader会给其就绪记录（prepare record）分配一个就绪时间戳（prepare timestamp）$s_{i,g}^{prepare}$。coordinator leader确保了在整个participant group $g$中，事务的提交时间戳$s_i \ge s_{i,g}^{prepare} $。因此，对于group $g$中的每个副本，对$g$中的所有事务$T_i$，$t_{safe}^{TM} = \min_i(s_{i,g^{prepare}})-1$。


#### 4.1.4 为只读事务分配时间戳

只读事务分两个阶段执行：分配一个时间戳 ${s}_{read}$，然后在 ${s}_{read}$ 处将事务的读取作为快照读取执行。快照读取可以在任何足够新的副本上执行。

在事务开始后的任何时间简单地分配 ${s}_{read} = TT.now ().latest$，通过与 4.1.2 节中针对写入所呈现的类似论证来保持外部一致性。然而，这样的时间戳可能要求在 ${s}_{read}$ 处执行数据读取时，如果 ${t}_{safe}$ 没有充分推进，则会阻塞。（此外，请注意选择 ${s}_{read}$ 的值也可能会推进 ${s}_{max}$ 以保持互斥性。）为了减少阻塞的可能性，Spanner 应该分配保持外部一致性的最旧时间戳。4.2.2 节解释了如何选择这样的时间戳。

### 4.2 细节

本节解释了前面省略的读写事务和只读事务的一些实际细节，以及用于实现原子模式变更的一种特殊事务类型的实现。然后，它描述了如前所述的基本方案的一些改进。

#### 4.2.1 读写事务

与 Bigtable 一样，在事务中发生的写入在客户端被缓冲，直到提交。因此，事务中的读取操作看不到该事务写入的效果。这种设计在 Spanner 中效果很好，因为读取操作会返回任何被读取数据的时间戳，而未提交的写入尚未被分配时间戳。

读写事务中的读取操作使用 "受伤等待"（wound-wait）来避免死锁。客户端向相应组的领导者副本发出读取请求，领导者副本获取读锁然后读取最新的数据。在客户端事务保持打开状态期间，它会发送保持活动的消息以防止参与者领导者使它的事务超时。当客户端完成了所有读取并缓冲了所有写入后，它开始两阶段提交。客户端选择一个协调者组，并向每个参与者的领导者发送一个提交消息，其中包含协调者的身份以及任何缓冲的写入。让客户端驱动两阶段提交可以避免在广域网链路上两次发送数据。

非协调者参与者的领导者首先获取写锁。然后，它选择一个准备时间戳，这个时间戳必须大于它之前为任何事务分配的时间戳（以保持单调性），并通过 Paxos 记录一个准备记录。接着，每个参与者将其准备时间戳通知给协调者。

协调者领导者也首先获取写锁，但跳过准备阶段。在收到所有其他参与者领导者的消息后，它为整个事务选择一个时间戳。提交时间戳 s 必须大于或等于所有准备时间戳（以满足 4.1.3 节中讨论的约束条件），大于协调者在收到其提交消息时的 TT.now ().latest，并且大于该领导者之前为任何事务分配的时间戳（同样，是为了保持单调性）。然后，协调者领导者通过 Paxos 记录一个提交记录（如果在等待其他参与者时超时，则记录一个中止记录）。

在允许任何协调者副本应用提交记录之前，协调者领导者等待直到 TT.after (s)，以遵守 4.1.2 节中描述的提交等待规则。因为协调者领导者基于 TT.now ().latest 选择了 s，并且现在等待直到那个时间戳被保证在过去，所以预期的等待时间至少是 2×ε。这个等待通常与 Paxos 通信重叠。在提交等待之后，协调者将提交时间戳发送给客户端和所有其他参与者领导者。每个参与者领导者通过 Paxos 记录事务的结果。所有参与者在同一时间戳应用并然后释放锁。

## 8. 结论

总而言之，Spanner结合并扩展了两个研究领域的观点：在更接近的数据库领域，需要易用的半结构化接口、事务、和基于SQL的查询语言；在系统领域，需要可伸缩、自动分片、容错、一致性副本、外部一致性、和广域分布。自从Spanner诞生以来，我们花了5年多的时间迭代设计与实现。这漫长的迭代部分原因是，人们很久才意识到Spanner应该做的不仅仅是解决全球化多副本命名空间的问题，还应该着眼于Bigtable锁缺少的数据库特性。

我们的设计中的一方面十分重要：Spanner的特性的关键是TrueTime。我们证明了，通过消除时间API中的始终不确定度，=能够构建时间语义更强的分布式系统。此外，因为底层系统对时钟不确定度做了更严格的限制，所以实现更强的语义的开销减少了。在这一领域中，在设计分布式算法时，我们应该不再依赖宽松的时钟同步和较弱的时间API。



https://blog.mrcroxx.com/posts/paper-reading/spanner-osdi2012/#2-%E5%AE%9E%E7%8E%B0

https://blog.csdn.net/qq_40229166/article/details/129676187

https://blog.mrcroxx.com/posts/paper-reading/spanner-osdi2012/#421-%E8%AF%BB%E5%86%99%E4%BA%8B%E5%8A%A1