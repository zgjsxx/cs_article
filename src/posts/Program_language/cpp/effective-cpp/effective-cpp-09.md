---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 09 绝不要在构造和析构过程中调用virtual函数

本文主要介绍的是一个误区，即在基类的构造函数中调用虚函数，该调用不会下降到派生类中的虚函数中执行。

## 分析

看下面的一个例子，我们在main函数中创建了Derived对象， 该对象会首先调用Base类的构造函数去初始化基类的成分。在Base类的构造函数中，其调用了虚函数doSomething，试想我们最终会调用那个版本的doSomething？ ```Base::doSomething```还是```Derived::doSomething```?

```cpp
#include <iostream>
// Base class for all transactions.
class Base
{
public:
	Base();
	virtual ~Base() {}

	virtual void doSomething() const
	{
        std::cout << "Base::doSomething" << std::endl;
	}
};

// Implementation of base class ctor.
Base::Base()
{
	doSomething();
}

class Derived : public Base
{
public:
	Derived() : Base()
	{
	}

	virtual void doSomething() const
	{
        std::cout << "Derived::doSomething" << std::endl;
	}
};

int main()
{
	Derived d{};
	return 0;
}
```

最终的执行结果是打印了```Base::doSomething```的日志, 为何如此？

在构造基类成分的时候，对象还是一个Base对象，可以想象在构造函数的开始，编译器帮我们生成了一条vptr的赋值语句，如下所示:

```cpp
Base::Base()
{
	vptr = &Base::vftable;//编译器帮我们生成的
	doSomething();
}
```

由于其vptr(虚表指针)还是指向Base类的虚表， 因此其调用并不会下降到派生类中。

在基类的析构函数中调用virtual函数的话也不会下降到调用派生类的虚函数，因为这个时候，对象的派生类成分已经被析构，此时的对象已经是只含有基类成分的对象，因此这个时候其调用也不会下降到派生类中。

这个点是很容易犯的错误。因此作者提醒我们在**构造函数**和**析构函数**中千万不要调用virtual函数！

## 总结

- 在构造和析构期间不要调用virtual函数，因为这类调用从不下降至derived class运行。