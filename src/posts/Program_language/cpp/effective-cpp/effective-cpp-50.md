---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 50 new合理替换时机

本文主要讲解什么场景下我们需要替换编译器提供的operator new或者operator delete。

## 分析

- 用来检测运用上的错误。
- 为了强化效能
- 为了收集使用上的统计数据
- 为了检测运用错误
- 为了收集动态分配内存之使用统计信息


## 总结

- 有许多理由需要写个自定的new和delete，包括改善性能、对heap运用错误进行调试、收集heap使用信息。

