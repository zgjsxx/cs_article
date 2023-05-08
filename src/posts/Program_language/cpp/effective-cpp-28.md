---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 28 便面返回handles指向对象内部成分


## 总结

- 避免返回handles(包括references、指针、迭代器)指向对象内部。遵守这个条款可增加封装性，帮助const成员函数的行为像一个const，并将发生虚吊号码牌的可能性降至最低。
