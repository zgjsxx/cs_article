
## 编译器指令重排

## CPU指令重排

## 内存屏障

```c
asm volatile ("" ::: "memory") is just a compiler barrier.
asm volatile ("mfence" ::: "memory") is both a compiler barrier and CPU barrier.
```


参考文章
内存序是如何实现的  https://blog.csdn.net/wxj1992/article/details/104266983