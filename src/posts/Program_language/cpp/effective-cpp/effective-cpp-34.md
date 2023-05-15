---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 34 区分接口实现和实现继承

本节内容比较简单， 对于一个写过一段时间c++代码同志不难理解。

## 分析

```cpp
class Shape
{
public:
	virtual void draw() = 0 ;
	virtual void error(const std::string& msg) {}
	int objectID() const;
};
```

- 声明一个纯虚函数的目的是为了让派生类只继承函数接口，例如Shape类的draw方法。
- 声明非纯虚函数的目的， 是为了让派生类继承该函数的接口和缺省实现， 例如Shape类的error方法。
- 声明non-virtual函数的目的是为了令派生类继承函数的接口及一份强制实现， 例如Shape类的objectID方法。

## 总结

- 接口继承和实现继承不同。在public继承之下，derived classes总是继承base class的接口。
- pure virtual函数只具体指定接口继承。
- 非纯虚函数具体指定接口继承及实现继承。
- non-virtual函数具体指定接口继承以及强制性实现继承。