---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 03 尽可能使用const



## 总结
- 将某些东西声明为const可以帮助编译器检查出错误用法。const可被施加于任何作用域的对象，函数参数，函数返回值类型，成员函数本体。
- 编译器强制实施比特常量性bitwise constness， 但你编写的程序应该使用概念上的常量性（conceptual constness）
- 当const和non-const成员函数有着实质等价的实现时，令non-const版本调用const版本可避免代码重复。