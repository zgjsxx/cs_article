---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 07 为多态基类声明virtual析构函数

本章节主要讲解了c++中涉及多态时的一个很容易犯错误的点。也是面试题常问的点。

## 分析

涉及多态时，Base类需要在析构函数上需要加上virtual。

首先我们看一个例子，这个例子中基类的析构函数没有加上virtual。

```cpp
#include <iostream>
#include <memory>

class Base
{
public:
	Base() {}
	~Base() {std::cout << "~Base" << std::endl;}
};

class Derived : public Base
{
public:
	Derived(){};
	~Derived(){std::cout << "~Derived" << std::endl;}
};

int main()
{
	{
		Base* b = new Derived();
		delete b;
	}

	{
		Derived* b = new Derived();
		delete b;		
	}
}
```

其执行结果如下所示：

```cpp
~Base
~Derived
~Base
```

从执行结果可以看到，如果涉及多态，当使用基类指针指向子类对象时，如果delete掉该指针，子类的析构函数并不会调用，这就可能造成一些资源不能很好的释放。


下面我们加上virtual关键字：

```cpp
#include <iostream>
#include <memory>

class Base
{
public:
	Base() {}
	virtual ~Base() {std::cout << "~Base" << std::endl;}
};

class Derived : public Base
{
public:
	Derived(){};
	~Derived(){std::cout << "~Derived" << std::endl;}
};

int main()
{
	{
		Base* b = new Derived();
		delete b;
	}

	{
		Derived* b = new Derived();
		delete b;		
	}
}
```

输出结果：

```
~Derived
~Base
~Derived
~Base
```

加上virtual关键字之后，当delete掉基类指针时，会首先调用子类的析构函数，在调用基类的析构函数。

## 总结
- 带有多态性质的基类应该声明一个virtual的析构函数。如果class带有任何virtual函数，它就应该用有一个virtual 析构函数。
- class的设计目的如果不是作为base classes使用，或不是为了具备多态性，就不该声明virtual 析构函数。
  