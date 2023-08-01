# CPU缓存哪些事儿

CPU高速缓存集成于CPU的内部，其是CPU可以高效运行的成分之一，本文围绕下面三个话题来讲解CPU缓存的作用：

- 为什么需要高速缓存？
- 高速缓存的内部结构是怎样的？
- 如何利用好cache，优化代码执行效率？


## 为什么需要高速缓存？

## 高速缓存的内部结构

cache line 又分为多种类型，分别为**直接映射缓存**，**多路组相连缓存**，**全相连缓存**。

### 直接映射缓存

直接映射缓存会将一个内存地址**固定映射**到某一行的cache line。

其思想是将一个内存地址划分为三块，分别是Tag, Index，Offset(这里的内存地址指的是虚拟内存)。将cacheline理解为一个数组，那么通过Index则是数组的下标，通过Index就可以获取对应的cache-line。再获取cache-line的数据后，获取其中的Tag值，将其与地址中的Tag值进行对比，如果相同，则代表该内存地址位于该cache line中，即cache命中了。最后根据Offset的值去data数组中获取对应的数据。整个流程大概如下图所示：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/direct-mapping.png)

下面是一个例子，假设cache中有8个cache line，

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/direct-mapping2.png)

对于直接映射缓存而言，其内存和缓存的映射关系如下所示：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/direct-mapping3.png)

从图中我们可以看出，0x00,0x40,0x80这三个地址，其地址中的index成分的值是相同的，因此将会被加载进同一个cache line。

试想一下如果我们依次访问了0x00，0x40，0x80，0x00会发生什么？

当我们访问0x00时，cache miss，于是从内存中加载到第0行cache line中。当访问0x40时，第0行cache line中的tag与地址中的tag成分不一致，因此又需要再次从内存中加载数据到第0行cache line中。当访问0x80时，cache又会miss，又需要再次从内存中访问。最后再次访问0x00时，由于cache line中存放的是0x80地址的数据，因此cache再次miss。可以看出在这个过程中，cache并没有起什么作用，访问了相同的内存地址时，cache line并没有对应的内容，而都是从内存中进行加载。

这种现象叫做cache颠簸（cache thrashing）。针对这个问题，引入多路组相连缓存。下面一节将讲解多路组相连缓存的工作原理。

### 多路组相连缓存

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/multi-way.png)


### 全相连缓存

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/full-connected.png)

全连接缓存中所有的cache line都位于一个组(set)内，因此地址中将不会划出一部分作为index。在判断cache line是否命中时，需要遍历所有的cache line，将其与虚拟地址中的tag成分进行对比，如果相等，则意味着匹配上了。因此对于全连接缓存而言，任意地址的数据可以缓存在任意的cache line中，这可以避免缓存的颠簸，但是与此同时，硬件上的成本也是最高。

## 如何利用缓存写出高效率的代码？


## 参考文献

https://www.scss.tcd.ie/Jeremy.Jones/VivioJS/caches/MESIHelp.htm
https://cloud.tencent.com/developer/article/1495957