---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [Facebook的Memcache扩展](#facebook的memcache扩展)
  - [摘要](#摘要)
  - [1.引言](#1引言)
  - [2.概述](#2概述)
  - [3.集群内：延迟与负载](#3集群内延迟与负载)
    - [3.1 降低延迟](#31-降低延迟)
    - [3.2 减轻负载](#32-减轻负载)
      - [3.2.1 租约](#321-租约)
      - [3.2.2 Memcache 池](#322-memcache-池)
      - [3.2.3 池内复制](#323-池内复制)
    - [3.3 故障处理](#33-故障处理)
  - [4.区域内的复制](#4区域内的复制)
    - [4.1 区域失效操作](#41-区域失效操作)
  - [6.单服务器改进](#6单服务器改进)
    - [6.1 性能优化](#61-性能优化)
  - [参考文章](#参考文章)

# Facebook的Memcache扩展

## 摘要

Memcached 是一种广为人知的简单内存缓存解决方案。本文介绍了Facebook是如何利用 Memcached 作为构建模块来构建和扩展一个分布式键值存储系统的，该系统为全球规模最大的社交网络提供支持。我们的系统每秒可处理数十亿次请求，存储数万亿条数据项，从而为全球逾十亿用户提供丰富的体验。

## 1.引言

热门且极具吸引力的社交网站带来了重大的基础设施挑战。每天有数以亿计的人使用这些网络，由此产生的计算、网络和输入 / 输出（I/O）需求是传统网络架构难以满足的。一个社交网络的基础设施需要：
- 1.实现近乎实时的通信；
- 2.即时整合来自多个源头的内容；
- 3.能够访问和更新非常热门的共享内容；
- 4.具备扩展能力以每秒处理数百万计的用户请求。

我们将阐述我们是如何对 Memcached 的开源版本进行改进，并将其用作构建模块来为全球最大的社交网络构建一个分布式键值存储系统的。我们还将探讨我们从单个服务器集群扩展到多个地理上分布的集群的历程。据我们所知，该系统是全球规模最大的 Memcached 应用部署，每秒处理超过十亿次请求，并且存储着数万亿个数据项。

本文是一系列相关著作中的最新成果，这些著作都已认识到分布式键值存储的灵活性和实用性。本文聚焦于 Memcached—— 一种内存哈希表的开源实现，因为它能以低成本提供对共享存储池的低延迟访问。这些特性使我们能够构建数据密集型的功能，否则这些功能将不切实际。例如，一个在每次页面请求时发出数百个数据库查询的功能可能永远无法脱离原型阶段，因为它速度太慢且成本太高。然而，在我们的应用中，网页通常会从 Memcached 服务器获取数千个键值对。

我们的目标之一是呈现出在我们不同规模的部署中出现的重要主题。虽然性能、效率、容错性和一致性等特性在所有规模下都很重要，但我们的经验表明，在特定规模下，某些特性要比其他特性更难实现。例如，在小规模情况下，如果复制量极少，那么维护数据一致性可能会更容易，相比之下，在大规模情况下往往需要进行复制。此外，随着服务器数量的增加以及网络成为瓶颈，找到最佳通信调度的重要性也日益凸显。

本文包含四项主要贡献：
- 1.我们描述了 Facebook 基于 Memcached 架构的演变历程。
- 2.我们明确了对 Memcached 的一些改进措施，这些措施可提高性能并提升内存效率。
- 3.我们着重介绍了一些机制，这些机制提高了我们大规模运营系统的能力。
- 4.我们对施加于我们系统的生产工作负载进行了特征描述。

## 2.概述

以下特性对我们的设计产生了重大影响。

- 首先，用户消费的内容比他们创建的内容要多出一个数量级。这种行为导致工作负载主要集中在数据获取上，这表明缓存具有显著的优势。
- 其次，我们的读取操作从多种数据源获取数据，比如 MySQL 数据库、HDFS（分布式文件系统）部署以及后端服务。这种异构性要求采用一种灵活的缓存策略，以便能够存储来自不同来源的数据。

Memcached 提供了一组简单的操作（设置、获取和删除），这使得它作为大规模分布式系统中的一个基本组件颇具吸引力。我们最初采用的开源版本提供了一个单机内存哈希表。在本文中，我们将讨论如何利用这个基本构建模块，使其更高效，并使用它来构建一个每秒可处理数十亿次请求的分布式键值存储系统。从今往后，我们用 Memcached 来指代源代码或正在运行的二进制文件，用 Memcache 来描述分布式系统。

**查询缓存**：我们依靠 Memcache 来减轻数据库的读取负载。特别是，如图 1 所示，我们将 Memcache 用作按需填充的旁路缓存。当网络服务器需要数据时，它首先通过提供一个字符串键向 Memcache 请求相应的值。如果该键所指向的条目未被缓存，网络服务器就会从数据库或其他后端服务中检索数据，并将键值对填充到缓存中。对于写入请求，网络服务器会向数据库发出 SQL 语句，然后向 Memcache 发送一个删除请求，以使任何陈旧数据失效。我们选择删除缓存数据而不是更新它，是因为删除操作是幂等的。Memcache 并非数据的权威来源，因此可以逐出已缓存的数据。

虽然有多种方法可以解决 MySQL 数据库上过度的读取流量问题，但我们选择了使用 Memcache。在工程资源和时间有限的情况下，这是最佳选择。此外，将我们的缓存层与持久化层分离开来，使我们能够随着工作负载的变化独立地调整每一层。

**通用缓存**：我们还将 Memcache 用作一种更为通用的键值存储。例如，工程师们使用 Memcache 来存储复杂机器学习算法的预计算结果，然后这些结果可被其他各种应用程序使用。新服务可以轻松利用现有的 Memcache 基础设施，而无需承担调整、优化、配置和维护大型服务器群的负担。

就其现状而言，Memcached 不提供服务器到服务器的协调功能；它只是在单台服务器上运行的内存哈希表。在本文的其余部分，我们将描述如何基于 Memcached 构建一个能够在 Facebook 的工作负载下运行的分布式键值存储系统。我们的系统提供了一套配置、聚合和路由服务，以便将 Memcached 实例组织成一个分布式系统。

我们对本文的结构进行了安排，以强调在三种不同部署规模下出现的主题。
- 当我们只有一个服务器集群时，读密集型工作负载和广泛的扇出是首要关注点。
- 随着有必要扩展到多个前端集群，我们会解决这些集群之间的数据复制问题。
- 最后，当我们在全球范围内分布集群时，我们会描述一些机制来提供一致的用户体验。

运营复杂性和容错性在所有规模下都很重要。我们展示了支持我们设计决策的关键数据，并建议读者参考阿蒂科格鲁（Atikoglu）等人的研究成果，以获取对我们工作负载更详细的分析。从高层次来看，图 2 展示了这种最终架构，在该架构中，我们将位于同一地点的集群组织成一个区域，并指定一个主区域，该主区域提供数据流以使非主区域保持最新状态。

在对我们的系统进行演进时，我们优先考虑两个主要的设计目标。
- 1.任何变更都必须对面向用户或运营方面的问题产生影响。那些影响范围有限的优化措施很少会被考虑。
- 2.我们将读取到瞬时陈旧数据的概率当作一个可调整的参数，就如同响应性一样。我们愿意展示稍有陈旧的数据，以此来避免后端存储服务承受过重的负载。

## 3.集群内：延迟与负载

现在我们来考虑扩展到集群内数千台服务器所面临的挑战。在这种规模下，我们的大部分工作都着重于降低获取缓存数据的延迟，或者减轻因缓存未命中而带来的负载。

### 3.1 降低延迟

无论对数据的请求是导致缓存命中还是未命中，Memcache 响应的延迟都是用户请求响应时间的一个关键因素。单个用户的网络请求往往会导致数百个单独的 Memcache 获取请求。例如，加载我们的一个热门页面平均会从 Memcache 中获取 521 个不同的数据项。

我们在一个集群中配置数百台 Memcached 服务器，以减轻数据库和其他服务的负载。数据项通过一致性哈希算法分布在各台 Memcached 服务器上。因此，网络服务器必须经常与许多 Memcached 服务器进行通信，以满足用户请求。结果就是，所有网络服务器会在短时间内与每台 Memcached 服务器进行通信。这种全连接通信模式可能会导致接收端阻塞拥塞，或者使单台服务器成为众多网络服务器的瓶颈。数据复制通常能缓解单台服务器的瓶颈问题，但在常见情况下会导致严重的内存利用效率低下问题。

**并行请求与批处理**：我们对网络应用程序代码进行架构设计，以尽量减少响应页面请求所需的网络往返次数。我们构建一个有向无环图（DAG）来表示数据之间的依赖关系。网络服务器利用这个有向无环图来最大限度地增加可同时获取的数据项数量。平均而言，这些批次每个请求包含 24 个键。

**客户端与服务器通信**：Memcached 服务器之间并不相互通信。在适当的时候，我们会将系统的复杂性嵌入到无状态客户端中，而非 Memcached 服务器里。这极大地简化了 Memcached，使我们能够专注于在更有限的用例下让它实现高性能。保持客户端无状态可以实现软件的快速迭代，并简化我们的部署流程。客户端逻辑由两个组件提供：一个可嵌入到应用程序中的库，或者一个名为 mcrouter 的独立代理。该代理提供 Memcached 服务器接口，并将请求 / 回复路由到其他服务器或从其他服务器接收请求 / 回复。

客户端使用 UDP 和 TCP 与 memcached 服务器进行通信。我们依靠 UDP 来处理获取请求，以降低延迟并减少开销。由于 UDP 是无连接的，网络服务器中的每个线程都可以直接与内存缓存服务器进行通信，绕过 McRouter（一种路由代理工具），且无需建立和维护连接，从而进一步减少了开销。UDP 的实现方式可检测到丢失或乱序接收的数据包（通过使用序列号），并在客户端将其视为错误。它不提供任何从这些错误中尝试恢复的机制。在我们的基础设施中，我们发现这一决策是切实可行的。在峰值负载下，内存缓存客户端观察到有 0.25% 的获取请求被丢弃。这些丢弃情况中约 80% 是由于数据包延迟或丢失造成的，而其余则是由于数据包交付乱序导致的。客户端将获取数据时出现的错误视为缓存未命中，但网络服务器在查询数据后会跳过向内存缓存中插入条目这一步骤，以避免给可能已经过载的网络或服务器增加额外负载。

为确保可靠性，客户端会通过在与网络服务器位于同一台机器上运行的 McRouter 实例，使用传输控制协议（TCP）来执行设置（set）和删除（delete）操作。对于那些我们需要确认状态变更的操作（更新和删除操作），TCP 使得我们无需在 UDP 实现中添加重试机制。
网络服务器依靠高度的并行处理能力和超额订阅来实现高吞吐量。开放 TCP 连接对内存的高需求意味着，如果不通过 McRouter 以某种形式合并连接，让每个网络线程与内存缓存服务器之间都保持开放连接，成本将极其高昂。合并这些连接可以通过减少高吞吐量 TCP 连接所需的网络、CPU 和内存资源，来提高服务器的效率。
图 3 展示了生产环境中的网络服务器通过 UDP 以及经由 McRouter 通过 TCP 获取键值时的平均、中位数和第 95 百分位的延迟情况。在所有情况下，这些平均值的标准偏差均小于 1%。正如数据所示，依靠 UDP 可以使处理请求的延迟降低 20%。

![TCP和UDP配合使用](https://github.com/zgjsxx/static-img-repo/raw/main/blog/lesson/6.824/lesson16/paper/udp-tcp.png)

**拥塞内爆**（Incast congestion）：内存缓存（Memcache）客户端会实施流量控制机制来限制拥塞内爆情况。当客户端请求大量键值时，如果这些响应一下子全部到达，那么诸如机架交换机和集群交换机等组件可能会不堪重负。因此，客户端会使用滑动窗口机制来控制未完成请求的数量。当客户端收到一个响应时，就可以发送下一个请求。与 TCP 的拥塞控制类似，这个滑动窗口的大小会在请求成功时缓慢增大，而在请求未得到回应时缩小。该窗口独立适用于所有发往不同目的地的内存缓存请求；而 TCP 窗口仅适用于单个数据流。

图 4 展示了窗口大小对用户请求处于可运行状态但正在网络服务器内部等待调度的时长所产生的影响。这些数据是从一个前端集群中的多个机架收集而来的。在每个网络服务器上，用户请求呈现出泊松到达过程。$L = rW$根据利特尔定律，即在服务器中排队的请求数量（L）与处理一个请求所需的平均时间（W）成正比，前提是输入请求速率恒定（在我们的实验中确实如此）。网络请求等待调度的时间直接反映了系统中网络请求的数量。窗口尺寸较小时，应用程序将不得不串行地发送更多组内存缓存请求，从而增加网络请求的持续时间。当窗口尺寸变得过大时，同时发出的内存缓存请求数量会导致拥塞内爆。其结果将是出现内存缓存错误，并且应用程序会转而从持久存储中获取数据，这将导致网络请求的处理速度变慢。在这两种极端情况之间存在一种平衡，在此平衡状态下，可以避免不必要的延迟，并将拥塞内爆情况降至最低。

### 3.2 减轻负载

我们使用内存缓存（memcache）来降低通过诸如数据库查询等成本更高的途径获取数据的频率。当所需数据未被缓存时，网络服务器会转而使用这些途径。以下各小节将介绍三种用于降低负载的技术。

#### 3.2.1 租约

我们引入了一种被称为 **租约** 的新机制，用以解决两个问题：陈旧设置和惊群效应。

当网络服务器在内存缓存（memcache）中设置一个值，但该值未能反映应被缓存的最新值时，就会出现陈旧设置的情况。当对内存缓存的并发更新发生重排序时，就可能出现这种情况。

惊群效应则发生在特定键经历大量读写活动之时。由于写入活动会反复使近期设置的值失效，许多读取操作就会转而采用成本更高的途径。我们的租约机制能够解决这两个问题。

直观来讲，当客户端遇到缓存未命中的情况时，内存缓存（memcached）实例会给予该客户端一个租约，使其能将数据重新设置回缓存中。这个租约是一个与客户端最初请求的特定键相关联的 64 位令牌。客户端在将值设置到缓存中时要提供这个租约令牌。借助租约令牌，内存缓存能够进行核实并确定数据是否应该被存储，从而对并发写入操作进行仲裁。如果内存缓存由于收到了针对该项的删除请求而使租约令牌失效，那么核实操作就可能会失败。租约防止陈旧设置的方式与加载链接 / 存储条件指令（load-link/store-conditional）的运作方式类似。

对租约稍作修改也能缓解惊群效应。每个内存缓存（memcached）服务器都会对其返回令牌的速率进行调控。默认情况下，我们将这些服务器配置为每个键每 10 秒仅返回一次令牌。在发出令牌后的 10 秒内对某个键的值发起请求时，会收到一个特殊通知，告知客户端稍作等待。通常情况下，持有租约的客户端会在几毫秒内成功设置好数据。因此，当等待的客户端再次尝试请求时，数据往往已经存在于缓存中了。

为了说明这一点，我们收集了一组特别容易受到惊群效应影响的键在一周内所有缓存未命中的数据。在没有租约的情况下，所有的缓存未命中导致数据库查询峰值速率达到每秒 17000 次。而有了租约，数据库查询峰值速率为每秒 1300 次。由于我们是根据峰值负载来配置数据库的，所以我们的租约机制意味着效率的显著提升。

**陈旧值**：通过租约，在某些用例中我们可以将应用程序的等待时间降至最低。我们还可以通过识别出那些返回稍微过时的数据也可接受的情况，来进一步减少这种等待时间。当一个键被删除时，其对应的值会被转移到一个存储近期删除项的数据结构中，在被清除之前它会在那里留存一小段时间。一个获取请求可以返回一个租约令牌或者被标记为陈旧的数据。那些能够继续利用陈旧数据推进运行的应用程序无需等待从数据库中获取最新的值。我们的经验表明，由于缓存值往往是数据库单调递增的快照，所以大多数应用程序可以使用陈旧值而无需做任何更改。

#### 3.2.2 Memcache 池

当不同的工作负载（workloads）共享同一个 Memcached 集群时，会产生负面干扰（negative interference），即
- 缓存命中率（hit rate）下降
  - 某些关键的、低频率访问的数据可能被高频访问、但重要性较低的数据驱逐（evicted）。
  - 这使得缓存系统无法为关键工作负载提供理想的性能支持。
- 不同工作负载的需求差异
  - 访问模式不同：有些数据访问频繁（高 churn），有些数据访问稀疏（低 churn）。
  - 缓存命中后的收益不同：对某些数据，缓存未命中（miss）的代价很高，而对另一些数据，未命中的代价可以接受。

这些差异如果不加以管理，就会导致缓存资源分配不均，重要数据的缓存效果下降。

解决方案：将缓存分区

为了减少不同工作负载之间的干扰，文中采用了**将 Memcached 集群划分为多个独立池（pools）**的方法：
- 默认池（wildcard pool）
  默认情况下，所有的键（keys）都被存储在一个通用池中。
- 专用池（dedicated pools）
  如果某类键在默认池中产生负面干扰（例如高 churn 数据影响低 churn 数据），会为这类键单独划分一个专用池。
  例如：
  - 高频访问但缓存未命中成本低的数据：单独创建一个较小的池，不浪费太多资源。
  - 低频访问但缓存未命中成本高的数据：单独创建一个较大的池，确保缓存命中率。

通过划分池，解决了：
- 高 churn 数据将低 churn 数据驱逐出缓存的问题。
- 每类数据可以根据其特性分配适合的缓存资源（大小、策略等）。

接下来需要划分高churn和低churn。文中通过采样的方法估算工作集的大小和"churn"（数据的流动性）：
- 1.从所有操作中采样一百万分之一的键值对（items）。
- 2.对这些采样项，记录：
  - 每个键对应的最小、平均、最大值。
- 3.将这些值累加，并乘以一百万，估算整个工作集的大小。

churn 的定义：
- 日工作集（daily working set）和周工作集（weekly working set）之间的差异反映了 churn 的大小。
- 如果一个数据集的日工作集比周工作集小很多，说明数据变化非常频繁（高 churn）。
- 如果两者相差不大，说明数据的生命周期较长（低 churn）。

图 5 展示了两组不同项目的工作集，一组是低变动率的，另一组是高变动率的。

![图5：高流动key和低流动key的日工作集和周工作集](https://github.com/zgjsxx/static-img-repo/raw/main/blog/lesson/6.824/lesson16/paper/fig5-working-set.png)

总结起来，这段内容阐述了如何通过将缓存划分为多个池来减少负面干扰：
- 不同池存储不同访问模式和成本特性的数据。
- 高 churn 和低 churn 数据分离，提高命中率。
- 每个池的大小和策略根据具体需求调整，实现更优的缓存资源分配。

#### 3.2.3 池内复制

在某些池中，我们通过复制机制提高 memcached 服务器的延迟表现和效率。当满足以下条件时，我们会选择在池内对某类键进行复制：
- 1.应用程序通常会同时获取多个键。
- 2.整个数据集可以放入一台或两台 memcached 服务器。
- 3.请求速率远超单台服务器的处理能力。

在这种情况下，与进一步划分键空间相比，我们更倾向于使用复制机制。以下是原因：

假设一台 memcached 服务器存储了 100 个条目，并能以每秒 50 万次请求的速率响应请求。每次请求会获取 100 个键。而在 memcached 中，从每次请求中获取 100 个键的开销，与只获取 1 个键相比是很小的。

为了将系统扩展到每秒处理 100 万次请求，假设添加第二台服务器并将键空间均匀地分成两部分。这时，客户端需要将每次获取 100 个键的请求拆分为两次并行请求，每次请求约 50 个键。因此，两台服务器仍然需要分别处理每秒 100 万次请求。

然而，如果我们将所有 100 个键复制到多台服务器，客户端可以将每次获取 100 个键的请求发送到任意副本。这样，每台服务器的负载将减少到每秒 50 万次请求。每个客户端根据自己的 IP 地址选择副本。

这种方法要求将invalidation消息(删除cache)传递到所有副本，以保持数据的一致性。

### 3.3 故障处理

当无法从 Memcache 获取数据时，会对后端服务造成过大的负载，从而可能引发进一步的级联故障。

系统根据故障规模，设计了不同的应对策略：

小规模故障（少数服务器不可用）：
- 有少量主机由于网络或硬件问题无法访问，但整个集群依然可用。
- 这类故障通过自动修复系统尝试解决，但这种修复可能需要数分钟，而这段时间可能会触发更大的问题。
- 解决办法：引入了一个称为 Gutter 的特殊机制，缓解这段时间的压力。

大规模故障（集群不可用）：
- 整个集群不可用时，将用户请求转移到其他集群，完全移除该集群的负载，避免系统进一步恶化。

这里提到了一种Gutter机制，其实就是即一组备用的空闲memcache机器。

其工作方式如下：
- 当客户端向某个 Memcache 服务器发送 get 请求未响应时，客户端认为服务器已经失效。
- 这时，客户端会将请求转发到一个专门的 Gutter 池，即一组备用的空闲机器。
- 如果 Gutter 池中没有命中，客户端会查询后端存储（数据库）获取数据，并将结果插入到 Gutter。

特点：
- 快速过期：Gutter 中的数据有效期很短，避免了复杂的数据失效同步问题。
- 牺牲一定新鲜度：由于使用缓存和快速过期的数据，某些数据可能不是最新的，但这是为了保护后端服务所做的权衡。

常见的一种做法是将故障服务器的键重新哈希分配到剩余的服务器，但这种方法可能因流量分布不均而引发问题：
- 某些键（热点键）可能会占一个服务器很大比例的请求（如 20%）。
- 如果将这些热点键分配到其他服务器上，会造成新的负载不均，可能导致这些服务器也超载，从而引发级联故障。

采用了上述的Gutter机制后，取得的效果如下：
- 减少了对后端存储的直接请求。通过在 Gutter 中命中数据，10%-25% 的故障请求被转化为缓存命中。
- 在服务器失效的情况下，4 分钟内 Gutter 的命中率可超过 35%，保护了后端存储免受大规模流量冲击。

## 4.区域内的复制

4. 区域内的复制
随着需求的增长，简单地增加更多的 Web 和 Memcached 服务器来扩展一个集群是一个看似直观的选择。然而，简单地扩展系统并不能消除所有问题：
- 高请求量的热门数据项会因为增加 Web 服务器来处理更多用户流量而变得更加受欢迎。
- 随着 Memcached 服务器数量的增加，Incast 拥塞（大量客户端同时请求服务器造成网络瓶颈）问题会更加严重。

因此，我们将 Web 服务器和 Memcached 服务器划分为多个前端集群。这些前端集群与包含数据库的存储集群共同组成了一个区域（region）。这种区域化架构还带来了以下好处：
- 更小的故障域（failure domain），降低了单个故障对整体的影响。
- 更易于管理的网络配置（tractable network configuration）。
- 通过数据复制实现的独立性，提高了弹性，并减少了 Incast 拥塞。

我们用数据复制的开销，换取了更独立的故障域、更易管理的网络配置以及更低的 Incast 拥塞。

这一节分析了多个前端集群共享同一存储集群的影响，特别探讨了以下问题：
- 允许跨集群进行数据复制的后果。
- 禁止数据复制情况下的潜在内存效率。

### 4.1 区域失效操作

在一个区域中，存储集群（storage cluster）保存数据的权威副本（authoritative copy），但用户需求可能会将这些数据复制到前端集群（frontend clusters）。存储集群负责使缓存中的数据失效，以确保前端集群与权威版本保持一致。

为了优化性能，当 Web 服务器修改数据时，它会向自己所在的集群发送失效请求，从而在单个用户请求的上下文中提供写后读一致性（read-after-write semantics），并减少本地缓存中过时数据的存在时间。

当 SQL 语句修改权威数据时，这些语句会被附加相关的 Memcache 键信息，这些键在事务提交后需要被使失效【7】。我们在每个数据库上部署了名为 mcsqueal 的失效守护程序（invalidation daemons）。这些守护程序会检查数据库提交的 SQL 语句，从中提取任何删除操作（delete），并将这些删除操作广播到该区域内所有前端集群的 Memcache 部署中。图 6 展示了这种方法。

![图6：使用mcsqueal中间件删除cache](https://github.com/zgjsxx/static-img-repo/raw/main/blog/lesson/6.824/lesson16/paper/fig6-invalidation-with-mcsqueal.png)

实际上，大部分失效请求并不会删除数据；事实上，只有 4% 的删除操作会真正导致缓存数据失效。

**减少数据包发送量**

虽然 mcsqueal 可以直接联系 Memcached 服务器，但从后端集群到前端集群的通信中，这样的做法会导致过高的数据包发送速率。这种数据包速率问题是由于多个数据库与多个 Memcached 服务器之间跨集群边界通信而产生的。为了解决这个问题，失效守护程序将删除操作（deletes）批量化，减少数据包的数量，然后将这些批量化的删除操作发送到前端集群中运行 mcrouter 实例 的一组专用服务器。
这些 mcrouter 实例会解包批量删除操作中的每一项，并将这些失效请求路由到前端集群中的正确 Memcached 服务器。通过批量处理，每个数据包中的删除操作数量中位数提升了 18 倍。

**通过 Web 服务器进行失效**

让 Web 服务器将失效请求广播到所有前端集群是更简单的选择。然而，这种方法存在两个问题：
- 更多的数据包开销：Web 服务器在批量化失效请求方面不如 mcsqueal 流水线高效。
- 失效问题的处理能力较弱：如果因配置错误导致删除操作被错误路由（misrouting），会出现系统性失效问题。过去，这种问题通常需要对整个 Memcache 基础设施进行滚动重启，这种过程缓慢且具有破坏性。

相比之下，将失效逻辑嵌入到 SQL 语句中，并通过数据库的提交和可靠日志记录，可以使 mcsqueal 在遇到失效丢失或路由错误时轻松重放这些失效请求，避免系统中断。

## 6.单服务器改进

全连接通信模式意味着单台服务器可能会成为集群的瓶颈。本节介绍 Memcached 中的性能优化以及内存利用效率提升方面的内容，这些改进可使集群实现更好的扩展。提升单台服务器的缓存性能是一个活跃的研究领域。

### 6.1 性能优化

我们最初使用的是单线程的 Memcached，它采用固定大小的哈希表。最初的主要优化措施如下：
- 允许哈希表自动扩展，以避免查找时间增长至 O (n) 复杂度；
- 通过使用全局锁来保护多个数据结构，使服务器支持多线程；
- 为每个线程分配其自己的 UDP 端口，以减少发送回复时的争用，并随后分摊中断处理开销。

前两项优化成果已回馈给了开源社区。本节的其余部分将探讨开源版本中尚未具备的进一步优化措施。

我们的实验主机配备了英特尔至强 CPU（X5650），运行频率为 2.67GHz（12 个核心和 12 个超线程），英特尔 82574L 千兆以太网控制器以及 12GB 内存。生产服务器配备了更多内存。更多细节此前已公布 [4]。性能测试的设置是由 15 个客户端向一台拥有 24 个线程的 Memcached 服务器生成 Memcache 流量。客户端和服务器位于同一机架上，并通过千兆以太网连接。这些测试测量在两分钟持续负载下 Memcached 响应的延迟情况。
获取性能：我们首先研究用细粒度锁替代原来的多线程单锁实现方式所产生的效果。我们通过在发出每次查询 10 个键的 Memcached 请求之前，先用 32 字节的值预先填充缓存来测量命中率。图 7 展示了不同版本的 Memcached 在亚毫秒级平均响应时间下能够维持的最大请求速率。第一组柱状图代表我们在采用细粒度锁之前的 Memcached，第二组是我们当前的 Memcached，最后一组是开源版本 1.4.10，它独立实现了一种比我们的锁策略更粗粒度的版本。

采用细粒度锁使命中的峰值获取速率从每秒 60 万项提高到了每秒 180 万项，提高了三倍。未命中的性能也从每秒 270 万项提高到了每秒 450 万项。命中操作的开销更大，因为需要构建并传输返回值，而未命中操作对于整个多获取请求只需一个静态响应（END），表明所有键均未命中。
## 参考文章

- https://tech.ipalfish.com/blog/2020/04/07/fb-memcache/

- Usenix 2013: Scaling Memcache at Facebook, video(https://www.youtube.com/watch?v=6phA3IAcEJ8), slides(https://www.usenix.org/sites/default/files/conference/protected-files/nishtala_nsdi13_slides.pdf), paper(https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf)