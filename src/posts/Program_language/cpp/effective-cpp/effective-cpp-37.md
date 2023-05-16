---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 37 不重新定义继承而来的缺省参数值

本节主要讲解了和虚函数中的默认参数有关的话题。本节的话题在日常工作中使用到的频率不是很高。下面通过例子来具体说明。

## 分析

我们有一个Shape类，其中含有一个名为draw的虚函数，draw含有一个入参color， 其默认参数为Red。目前我们有两个派生类Rectangle和Circle，其中Rectangle的draw方法的入参设置了color的默认参数为Green， 而Circle的默认参数没有指定参数的默认值。

我们新建了Rectangle和Circle的对象，并使用Shape的指针指向它们，并调用draw方法，并且不指定参数，那么color值将会是多少呢？

```cpp
#include <iostream>
class Shape
{
public:
	enum ShapeColor { Red, Green, Blue };

	// All shapes must offer a function to draw themselves.
	virtual void draw(ShapeColor color = Red) const = 0;
};


class Rectangle : public Shape
{
public:
	// Notice the different default parameter value = bad!
	virtual void draw(ShapeColor color = Green) const
	{
        std::cout << "color is " << color << std::endl;
	}
};


class Circle : public Shape
{
public:
	virtual void draw(ShapeColor color) const
	{
        std::cout << "color is " << color << std::endl;        
	}
};

int main()
{
	Shape* pr = new Rectangle;	// static type = Shape*		dynaminc type = Rectangle*
	Shape* pc = new Circle;		// static type = Shape*		dynaminc type = Circle*

    pr->draw();
	pc->draw();

	delete pc;
	delete pr;

	return 0;
}
```

[have a try](https://godbolt.org/z/vc3o849Ws)

通过结果，我们发现不传递参数进入draw方法时，其参数的默认值将使用基类中所定义入参的默认值，也就是说缺省参数的默认值都是静态绑定的。

## 总结

- 绝对不要重新定义一个继承而来的缺省参数值， 因为缺省参数值都是静态绑定， 而virtual函数-你唯一应该覆写的东西-确是动态绑定。

