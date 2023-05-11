---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 32 确定你的public继承塑模出is-a的关系

本节主要分析了public继承的现实含义，public继承中，每个Derived类的对象都是Base类的对象。 Base比Derived表现出更为一般化的概念，而Derived比Base表现出更为特殊化的概念。

## 分析

这里举了两个例子， 每个Student一定都是一个Person：

```cpp
class Person
{
};

class Student : public Person
{
};
```

而每个正方形一定也是一个矩形：

```cpp
class Rectangle
{
public:
	virtual int getHeight() const { return height; }
	virtual int getWidth() const { return width; }

	virtual void setHeight(int newHeight) { height = newHeight; }
	virtual void setWidth(int newWidth) { width = newWidth; }

private:
	int height;
	int width;
};


class Square : public Rectangle
{
};
```

## 总结
- public继承意味着is-a,适用于base class身上的每一件事情一定也使用于derived classes身上，因为每一个derived class对象也都是一个basic class对象。


