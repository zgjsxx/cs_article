---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

# cs-6.824第14讲 FARM和乐观并发控制

farm是系列中关于事务、复制和分片方面的最后一篇论文。这仍然是一个开放的研究领域，人们对于现有的性能与一致性之间的权衡并不满意，仍然在努力寻求更优的解决方案。

这篇论文的动机源于这些新型RDMA NICs锁蕴含的巨大性能潜力。

farm和spanner有何不同？

这两者都实现了复制，并且它们都是用两阶段提交来处理事务，所以它们在这个层面上是非常类似的。

Spanner主要关注点是地理复制，即能够在东西海岸以及不同的数据中心拥有副本，并且能够进行设计多个不同地点数据的高效交易。它最具有创新的地方在于，为了尝试解决长距离进行提交所需时间的问题，它为制度事务设置了一系列特殊的优化。Spanner的性能，读写事务的耗时在10-100ms之间，具体取决于不同数据中心之间的距离远近。

Farm做出了截然不同的设计决策，并针对不同类型的工作负载。farm是一个**研究原型**，并非成品。 我们的目的是探索这些新型RDMA高速网络硬件的潜力。

farm假设所有副本位于同一数据中心，farm并非解决spanner所面临的问题，即如果整个数据中心发生故障，将会发生什么情况。其容错能力体现在应对个别故障或尝试在整座数据中心断电并恢复供电后进行恢复。

这里再次强调，它采用了RDMA技术，但是事实证明，RDMA在某种程度上严重限制了设计选项， 因此farm不得不采用乐观并发控制。另一方面，farm的性能远高于spanner， farm能在58微秒完成一次简单的事务处理。这比spanner快了约100倍。 这或许是farm系统和地理复制系统之间的主要差异。

在spanner系统中，人们主要担忧的瓶颈是光速和网络速度，即数据中心之间的光速延迟和网络延迟。在farm系统中，设计时主要担忧的瓶颈是服务器的CPU时间，因为他们通过将所有副本放置在同一数据中心，某种程度上，忽略了光速和网络延迟的影响。

配置管理器，负责决定哪些服务器应作为数据分片的主要和备份服务器。

4：20