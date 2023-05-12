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

看下面的一个例子，我们在main函数中创建了BuyTransaction对象， 该对象会首先调用Transation的构造函数去初始化基类的成分。在Tranction的构造函数中，其调用了虚函数logTransaction，试想我们最终会调用那个版本的logTransaction？ Transation::logTransaction还是BuyTransaction::logTransaction？

```cpp
#include <iostream>
// Base class for all transactions.
class Transation
{
public:
	Transation();
	virtual ~Transation() {}

	virtual void logTransaction() const
	{
        std::cout << "Transation::logTransaction" << std::endl;
	}
};


// Implementation of base class ctor.
Transation::Transation()
{
	logTransaction();
}


class BuyTransaction : public Transation
{
public:
	BuyTransaction() : Transation()
	{
	}

	virtual void logTransaction() const
	{
        std::cout << "BuyTransaction::logTransaction" << std::endl;
	}
};

int main()
{
	BuyTransaction b{};
	return 0;
}
```

最终的执行结果是打印了```Transation::logTransaction```的日志？为何如此？

在构造基类成分的时候，对象还是一个Transation对象，因此其vptr(虚表指针)还是指向Transation类的虚表。 因此其调用并不会下降到派生类中。

这个点是很容易犯的错误。因此作者提醒我们在**构造函数**和**析构函数**中千万不要调用virtual函数！

## 总结

- 在构造和析构期间不要调用virtual函数，因为这类调用从不下降至derived class运行。