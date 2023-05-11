---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 13 以对象管理资源

本章节主要讲解的就是C++中常用的一种设计模式RAII，使用对象进行管理资源，从而有效的防止资源泄露。

## 分析

最典型的使用RAII的例子就是智能指针。

```cpp
#include <iostream>
#include <memory>
class A
{
public:
	A() = default;
	~A(){
		std::cout << "call ~A()" << std::endl;
	}
};

int main()
{
	{
		std::unique_ptr<A> ptrA = std::make_unique<A>();
	}

	{
		std::shared_ptr<A> ptrA = std::make_shared<A>();		
	}
}
```

除此以外，互斥锁也是经常会使用RAII来确保每个路径都unlock。

## 总结
- 为防止资源泄露，请使用RAII对象，它们在构造函数中获得资源并在析构函数中释放资源。
- 两个常被使用的RAII class分别是tr1::shared_ptr和auto_ptr。(这个点可以忽略，对于更新的c++标准，这些类是std::shared_ptr, std::unique_ptr 和 std::weak_ptr)。