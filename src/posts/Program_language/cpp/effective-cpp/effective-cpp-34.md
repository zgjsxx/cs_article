---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 34 区分接口实现和实现继承

## 总结

- 接口继承和实现继承不同。在public继承之下，derived classes总是继承base class的接口。
- pure virtual函数只具体指定接口继承。
- 非纯虚函数具体指定接口继承及实现继承。
- non-virtual函数具体指定接口继承以及强制性实现继承。