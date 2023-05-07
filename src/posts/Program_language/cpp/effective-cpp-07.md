---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 07 多态基类析构函数需要声明为virtual的


## 总结
- 带有多态性质的基类应该声明一个virtual的析构函数。如果class带有任何virtual函数，它就应该用有一个virtual 析构函数。
- class的设计目的如果不是作为base classes使用，或不是为了具备多态性，就不该声明virtual 析构函数。
  