---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 31 文件间的编译依存关系降低至最低

## Handle classes(pImpl设计)


## Interface classes

## 总结
- 支持"编译依存最小化"的一般构想时:相依于声明式，不要相依于定义式。基于此构想的两个手段是Handle class和Interface classes。
- 程序头文件应该以"完全且仅有声明式"的形式存在。这种做法不论是否涉及template都使用。

