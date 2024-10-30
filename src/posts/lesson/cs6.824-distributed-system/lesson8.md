---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [cs-6.824 第8讲 zookeeper](#cs-6824-第8讲-zookeeper)

# cs-6.824 第8讲 zookeeper

今天的论文是关于线性一致性的，之所以要研读zookeeper的论文，部分原因是它是一个成功的现实世界系统，这是一个开源服务，很多人在使用它，已经被应用于众多实际软件中，因此它具有一定的实际效果和成功之处。

zookeeper基于Raft协议，具有分区容错性。

它运行将读操作分散到任意副本上进行，因此读取的内容可能不是最新的。另一方面，zookeeper确保每个副本按照顺序逐一处理写入流，所有副本均按照相同的顺序执行写操作。所有由单个客户端生成的读写操作，系统也会按照顺序处理。

zookeeper可以解决那些问题？

- VMWare VT test and set service
- 发布配置信息供其他服务器使用。

Zookeeper的API像是一个文件系统，所以它拥有一个目录结构。

CREATE(path, data, flag)

DELETE(path, version)

EXISTS(path, watch);

example-count

