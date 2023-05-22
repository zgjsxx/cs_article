---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 05 了解c++默默编写并调用哪些函数

## 分析

c++会一个类默认编写一些函数， 下面是一个例子：

```cpp
class Empty
{
public:
	Empty() {}
	Empty(const Empty& rhs) {}
	~Empty() {}
	Empty& operator=(const Empty& rhs) {}
};
```

## 总结
- 编译器可以暗自为class创建default构造函数， copy构造函数，copy assignment操作符，以及析构函数。
- 对于更新的c++标准，还会创建移动构造函数和移动操作符(详见effective modern c++)。