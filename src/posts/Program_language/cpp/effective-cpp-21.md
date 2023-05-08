---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 21  必须返回对象时， 别妄想返回其reference


## 总结
- 绝对不要返回pointer或者reference指向一个local stack对象，或者返回reference指向一个heap-allocated对象，或返回pointer或reference指向一个local static对象而有可能同时需要多个这样的对象。条款4已经为单线程环境中合理返回reference指向一个local static对象提供了一份设计实例。
  