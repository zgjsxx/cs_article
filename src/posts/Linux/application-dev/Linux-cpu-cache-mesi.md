---
category: 
- Linux
---

# CPU缓存一致性原理

在本站的文章**CPU缓存那些事儿**中， 介绍了cpu的多级缓存的架构和cpu缓存行cacheline的结构。CPU对于缓存的操作包含读和写，读操作在cacheline中有所涉及，在本文中，将讨论CPU对于缓存进行写时的行为。

## 单核CPU对高速缓存的读操作

CPU对于高速缓存的读操作的过程在之前的文章中有提到过，这里梳理一下其流程：

- 1.首先对于一个内存地址，按照索引规则（直接映射/多路组相连/全相连）去cache line中进行检索。
- 2.如果检索到了，意味着该内存地址的内容已经存在于cache line中，则直接读取内容到CPU中，流程结束。如果没有检索到，进行步骤3。
- 3.此时确认内存的数据不在cache line中，如果cpu cache line已经存满或者已经被其他内存地址映射，则进入步骤4，如果cache line中还有空位，则进入步骤5.
- 4.执行缓存淘汰策略，腾出位置
- 5.加载内存数据到cache line中，将cache块上的内容读取到cpu中。

对于单核CPU， 对cache的读操作的流程如下所示：

![single-cpu-read](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/single_cpu_read.png)

## 单核CPU对于高速缓存的写操作

CPU对于高速缓存的写操作比读操作要复杂一些，写操作会修改cache中的数据，而这一数据最终需要同步到内存中，对于同步到内存这一步骤的不同，写操作的策略可以分为写直达策略和写回策略。注意这里的讨论仍然是针对单核CPU而言的。

### 写直达策略

写直达策略的思想是对于写入操作，同时修改cache中的数据和内存中的数据，使得cache和内存中的数据保持一致。这将使得cache和内存拥有数据的强一致性。

写直达策略可以被细化为下列的步骤：
1.判断待写入的数据是否已经存在于cache中。如写入的数据已经存在于cache中，则跳转到步骤2，否则跳转到步骤3。
2.将数据写入cache中。
3.将数据写入内存。

其流程如下所示：

写直达的优缺点如下：

优点：对于写操作而言，可以保证内存和高速缓存内容的强一致性。

缺点：由于每次写入操作都需要同时写入cache和写入内存，使得写操作的耗时增加，失去了高速缓存的高效性。

### 写回策略

写直达策略的思想是当需要修改cache时，延迟修改内存。在每个cache line上增加了Dirty的标记，当修改了cache中的内容时，会将Dirty标记置位，表明它的数据和内存数据不一致。注意此时，并不会立即写回内存。只有当cache块被替换出去时，才会回写到内存中。


### 多CPU核的缓存一致性问题。

上面的写直达策略和写回策略可以解决单核CPU的cache和内存的一致性问题。而现代的CPU往往都是多核CPU，每个核心都拥有其自己的cache。那么对于写操作而言，除了保证本CPU的cache和内存的一致性，还需要保证其它CPU的cache和内存的一致性问题。

MESI协议就是用来解决这个问题的。

MESI协议是一种用于保证缓存一致性的协议，其对应了CPU cache的四种状态，每个字母代表了一种状态，其含义如下：

- M（Modified，已修改）： 表明 Cache 块被修改过，但未同步回内存；
- E（Exclusive，独占）： 表明 Cache 块被当前核心独占，而其它核心的同一个 Cache 块会失效；
- S（Shared，共享）： 表明 Cache 块被多个核心持有且都是有效的；
- I（Invalidated，已失效）： 表明 Cache 块的数据是过时的。

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/MESI-state.png)

对于MESI协议，有一个可视化的网站可以演示其过程，网址：https://www.scss.tcd.ie/Jeremy.Jones/VivioJS/caches/MESIHelp.htm。

下面我们借助该网站来理解MESI每个状态的变换过程。

**状态E转状态M**

初始化状态为E：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoM_1.png)

通过processor write，状态E转为状态M：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoM_2.png)


**状态M转状态S**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/MtoS_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/MtoS_2.png)


**状态S转状态I**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/StoI_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/StoI_2.png)


**状态S转状态E**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/StoE_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/StoE_2.png)


**状态I转状态E**

状态I转状态E有两种路径，第一种是通过Processor Read, 
![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoE_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoE_2.png)

第二种是通过process write

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoE_3.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoE_4.png)

**状态I转状态S**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoS_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoS_2.png)


**状态E转状态I**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoI_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoI_2.png)

**状态E转状态S**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoS_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoS_2.png)

**状态M转状态I**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/MtoI_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/MtoI_2.png)


**状态I转状态M**

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoM_1.png)


![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/ItoM_2.png)



## 写缓冲区和失效队列



写缓冲区（Store Buffer）

从上面的对于MESI的理解中，不难发现，MESI协议其实并不高效。例如当CPU1将要修改cache line时，需要广播RFO获得独占权，当收到其它cpu核的ACK之前，CPU1只能空等。 这对于CPU1而言，是一种资源的浪费。写缓冲区就是为了解决这个问题的。当CPU核需要写操作时，会将写操作放入缓冲区中，然后就可以执行其它指令了。当收到其它核心的ACK后，就可以将写入的内容写入cache中。

失效队列（Invalidation Queue）

写缓冲区是对写操作发送命令时的优化，而失效队列则是针对收写操作命令时的优化。

对于其它的CPU核心而言，在其收到RFO请求时，需要更新当前CPU的cache line状态，并回复ACK。然而在收到RFO请求时，CPU核心可能在处理其它的事情，不能及时回复

写缓冲区和失效队列将RFO请求的收发修改为了异步的，这实际上实现的是一种最终一致性。这也会引入新的问题，即CPU对于指令会有重排。如果有一些程序对于内存序有要求，那么就需要进行考虑。

## 参考文献

https://www.scss.tcd.ie/Jeremy.Jones/VivioJS/caches/MESIHelp.htm
https://juejin.cn/post/7158395475362578462
https://blog.51cto.com/qmiller/5285102