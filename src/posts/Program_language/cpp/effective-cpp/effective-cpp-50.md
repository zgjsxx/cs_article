---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 50 了解new和delete的合理替换时机

本文主要讲解什么场景下我们需要替换编译器提供的operator new或者operator delete。其实平常开发项目中很少会重载operator new和operator delete， 如果出现了这样的需求可以回过头来再来温习温习本节的内容。

## 分析

- 用来检测运用上的错误。
- 为了强化效能
- 为了收集使用上的统计数据
- 为了检测运用错误
- 为了收集动态分配内存之使用统计信息
- 为了增加分配和归还的速度。
- 为了降低缺省内存管理器带来的空间额外开销。
- 为了弥补缺省分配器中的非最佳齐位
- 为了将相关对象成簇集中
- 为了获得非传统的行为


## 总结

- 有许多理由需要写个自定的new和delete，包括改善性能、对heap运用错误进行调试、收集heap使用信息。

