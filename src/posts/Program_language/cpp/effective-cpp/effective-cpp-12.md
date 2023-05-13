---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 12 复制对象时勿忘其每一个成分

本文也是主要讲解的是赋值构造函数需要复制应该复制的每一个成分，这里面最容易忘记复制的就是基类的成分。

## 分析

本例主要强调在自定义复制构造函数和赋值运算符时一定要检查是否复制了所需要的元素。尤其是派生类中不能忘记复制基类的成分。

下面便是一个例子，其中的派生类中处理了复制基类的成分。

```cpp
#include <string>
#include <iostream>

class Base
{
public:
	Base(int b) : b_(b) {}

	Base(const Base& rhs);
	Base& operator=(const Base& rhs);
public:
    int getB() const{
        return b_;
    }

private:
	int b_;
};

Base::Base(const Base& rhs) :
	b_(rhs.b_)
{

}

Base& Base::operator=(const Base& rhs)
{

	b_ = rhs.b_;
	return *this;
}

class Derived : public Base
{
public:
	Derived(int d, int b) : d_(d), Base(b)
	{}

	Derived(const Derived& rhs);
	Derived& operator=(const Derived& rhs);
public:
    void printVal() const
    {
        std::cout << "d_ = " << d_ << ", b_ = " << getB() << std::endl;
    }
private:
	int d_;
};

Derived::Derived(const Derived& rhs):
    d_(rhs.d_),
    Base(rhs)
{

}

Derived& Derived::operator=(const Derived& rhs)
{
	d_ = rhs.d_;
    Base::operator=(rhs);
	return *this;
}

int main()
{
    Derived d1(1,2);
    d1.printVal();
    Derived d2(d1);
    d2.printVal();
    Derived d3(2,3);
    d3.printVal();
    d3 = d1;
    d3.printVal();
}
```

[have a try](https://godbolt.org/z/r7sxqEzba)

## 总结
- copying函数应该确保复制"对象内的所有成员变量"以及"所有base class成分"。
- 不要尝试以一个copying 函数去实现另一个copying函数。应该将共同机能放进第三个函数中，并又两个copying函数共同调用。