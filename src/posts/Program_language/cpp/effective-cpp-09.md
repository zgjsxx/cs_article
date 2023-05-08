---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 09 绝不要在构造和析构过程中调用virtual函数


## 总结

- 在构造和析构期间不要调用virtual函数，因为这类调用从不下降至derived class运行。