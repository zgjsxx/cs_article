---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 10 令operator= 返回一个reference to * this

本章节也是作者的一个建议，并无强制性，不这样做并不会造成编译上的问题。

作者建议我们在operator=的运算符返回指向自身的引用，这样可以使用连等形式的运算。

## 分析

看下面的一个例子，为了能让```w3 = w2 = w1```的表达式成立，我们需要在赋值运算符中返回```*this```。

```cpp
#include <iostream>

class Widget
{
public:
    Widget(int a):a_(a){}
    Widget():a_(0){}
public:
	// Standard copy assignment operators.
	Widget& operator=(const Widget& rhs)
	{
        a_ = rhs.a_;
		return *this;
	}

	// Convention applies to +=, -=, *=, etc.
	Widget& operator+=(const Widget& rhs)
	{
        a_ += rhs.a_;
		return *this;
	}

	// Applies even if operator's parameter is unconventional.
	Widget& operator=(int rhs)
	{
        a_ += rhs;
		return *this;
	}

    int getA() const
    {
        return a_;
    } 
private:
    int a_{};
};

int main()
{
    Widget w1(1);
    Widget w2;
    Widget w3;

    w3 = w2 = w1;
    std::cout << w3.getA() << std::endl;
    std::cout << w2.getA() << std::endl;
    std::cout << w1.getA() << std::endl;
}
```

在日常开发中，应该记得这样做，这不仅有代码上的意义，也能让你的老板对你高看一眼。


## 总结
- 令赋值操作符返回一个reference to *this。