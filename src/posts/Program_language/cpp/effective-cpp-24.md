---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 24 若所有参数皆需要类型转换，请为此采用non-member函数


## 总结
- 如果你需要为某个函数的所有参数(包括被this指针所指的那个隐喻参数)进行类型转换，那么这个函数必须是个non-member