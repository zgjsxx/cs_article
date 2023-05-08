---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 13 以对象管理资源


## 总结
- 为防止资源泄露，请使用RAII对象，它们在构造函数中获得资源并在析构函数中释放资源。
- 两个常被使用的RAII class分别是tr1::shared_ptr和auto_ptr。(这个点可以忽略，对于更新的c++标准，这些类是std::shared_ptr, std::unique_ptr 和 std::weak_ptr)。