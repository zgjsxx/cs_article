---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 46 需要类型转换时请为模板定义非成员函数

## 总结

- 当我们编写一个class template，而它所提供之"与此template相关的"函数支持"所有参数之隐式类型转换"时，请将那些函数定义为"class template内部的friend函数"。


