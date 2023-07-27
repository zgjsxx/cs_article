# CPU缓存哪些事儿


https://www.scss.tcd.ie/Jeremy.Jones/VivioJS/caches/MESIHelp.htm
https://cloud.tencent.com/developer/article/1495957

## cache line

将一个内存地址划分为三块，分别是Tag, Index，Offset。

将cacheline理解为一个数组，那么通过Index则是数组的下标，通过Index就可以获取对应的cache-line。才获取cache-line的数据后，获取其中的Tag值，将其与地址中的Tag值进行对比，如果相同，则代表该内存地址位于该cache line中。最后根据Offset的值去data数组中获取对应的数据。

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/cpu-cache-line.png)

下面是一个例子：

![cache line](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/CPU-cache/cpu-cache-line2.png)