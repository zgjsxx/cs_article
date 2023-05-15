---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 35 考虑virtual函数以外的其他选择

## 总结
- 使用non-virtual interface(NVI)手法， 那么是Template Method设计模式的一种特殊形式。它以public non-virtual成员函数包裹较低访问性的virtual函数。
- 将virtual函数替换为"函数指针成员变量"， 这是Strategy设计模式的一种分解表现形式。
- 使用std::function成员变量替换virtual函数，因而允许任何可调用对象搭配一个兼容于需求的签名式。这也是Strategy设计模式的某种形式。
- 将继承体系内的virtual函数替换为另一个继承体系内的virtual函数。这是Strategy设计模式的传统实现手法。

