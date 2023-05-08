---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 30 彻底了解inline的里里外外



## 总结
- 将大多数inlining限制在小型、被频繁调用的函数身上。这可使日后的调试过程和二进制升级更容易，也可使潜在的代码膨胀问题最小化，使程序的速度提升机会最大化。
- 不要只因为function templates出现在头文件，就将它们声明为inline。