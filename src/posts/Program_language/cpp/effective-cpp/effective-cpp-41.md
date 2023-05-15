---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 41 隐式接口和编译器多态

## 总结

- classes和template都支持接口和多态。
- 对classes而言接口时显示的explicit， 以函数签名为中心。多态则是通过虚函数发生于运行期。
- 对template参数而言，接口时隐式的，奠基于有效表达式。多态则是通过template具现化和函数重载解析发生于编译期。
