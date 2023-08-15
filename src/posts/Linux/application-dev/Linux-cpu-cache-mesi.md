---
category: 
- Linux
---

# CPU缓存一致性原理

在本站的文章**CPU缓存那些事儿**中， 介绍了cpu的多级缓存的架构和cpu缓存行cacheline的结构。CPU对于缓存的操作包含读和写，读操作在cacheline中有所涉及，在本文中，将讨论CPU对于缓存进行写时的行为。

## CPU对高速缓存的读操作

## CPU对于高速缓存的写操作

### 写直达


### 写回策略


## 写操作带来的不一致问题



### MESI协议

MESI协议是一种用于保证缓存一致性的协议，其对应了CPU cache的四种状态，每个字母代表了一种状态，其含义如下：

- M（Modified，已修改）： 表明 Cache 块被修改过，但未同步回内存；
- E（Exclusive，独占）： 表明 Cache 块被当前核心独占，而其它核心的同一个 Cache 块会失效；
- S（Shared，共享）： 表明 Cache 块被多个核心持有且都是有效的；
- I（Invalidated，已失效）： 表明 Cache 块的数据是过时的。

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/MESI-state.png)

状态E转状态M

初始化状态为E：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoM_1.png)

通过processor write，状态E转为状态M：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache-mesi/EtoM_2.png)


写缓冲区（Store Buffer）

由于在写入操作之前，CPU 核心 1 需要先广播 RFO 请求获得独占权，在其它核心回应 ACK 之前，当前核心只能空等待，这对 CPU 资源是一种浪费。因此，现代 CPU 会采用 “写缓冲区” 机制：写入指令放到写缓冲区后并发送 RFO 请求后，CPU 就可以去执行其它任务，等收到 ACK 后再将写入操作写到 Cache 上。

失效队列（Invalidation Queue）

由于其他核心在收到 RFO 请求时，需要及时回应 ACK。但如果核心很忙不能及时回复，就会造成发送 RFO 请求的核心在等待 ACK。因此，现代 CPU 会采用 “失效队列” 机制：先把其它核心发过来的 RFO 请求放到失效队列，然后直接返回 ACK，等当前核心处理完任务后再去处理失效队列中的失效请求。

https://www.scss.tcd.ie/Jeremy.Jones/VivioJS/caches/MESIHelp.htm
https://juejin.cn/post/7158395475362578462
