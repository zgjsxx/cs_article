---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 25 考虑写一个不抛出任何异常的swap函数


## 总结
- 当std::swap对你的类型效率不高时，提供一个swap成员函数，并确定函数不抛出异常
- 如果你提供一个member swap， 也该提供一个non-member swap用来调用前者。
- 调用swap时应针对std::swap使用using 声明式， 然后调用swao并且不带任何"命名空间资格修饰"
- 为"用户定义类型"进行std template全特化时好的，但千万不要尝试在std内加入某些std而言全新的东西。
