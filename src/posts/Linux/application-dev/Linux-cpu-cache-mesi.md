# CPU缓存哪些事儿




## cache line

cache line 又分为多种类型，分别为直接映射缓存，多路组相连缓存，全相连缓存。


### 直接映射缓存

将一个内存地址划分为三块，分别是Tag, Index，Offset。

将cacheline理解为一个数组，那么通过Index则是数组的下标，通过Index就可以获取对应的cache-line。才获取cache-line的数据后，获取其中的Tag值，将其与地址中的Tag值进行对比，如果相同，则代表该内存地址位于该cache line中。最后根据Offset的值去data数组中获取对应的数据。

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/direct-mapping.png)

下面是一个例子：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/direct-mapping2.png)

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/direct-mapping3.png)



### 多路组相连缓存

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/multi-way.png)


### 全相连缓存

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/full-connected.png)

全连接缓存中所有的cache line都位于一个组(set)内，因此地址中将不会划出一部分作为index。在判断cache line是否命中时，需要遍历所有的cache line，将其与虚拟地址中的tag成分进行对比，如果相等，则意味着匹配上了。因此对于全连接缓存而言，任意地址的数据可以缓存在任意的cache line中，这可以避免缓存的颠簸，但是与此同时，硬件上的成本也是最高。

## 参考文献

https://www.scss.tcd.ie/Jeremy.Jones/VivioJS/caches/MESIHelp.htm
https://cloud.tencent.com/developer/article/1495957