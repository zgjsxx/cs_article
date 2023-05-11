---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 15 在资源管理类中提供对原始资源的访问

本章节继续讨论RAII类的注意点。作者建议对于RAII类，需要提供对于原始资源的访问。

在item-28中作者建议避免返回handles指向对象内部的成分，在item-28中就解释过，这一原则并不是绝对的。 本章节便是item-28的一个例外。

## 分析

这里我们以shared_ptr为例， 其就为获取原始资源提供了get()方法。

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
		std::shared_ptr<A> ptrA = std::make_shared<A>();		
		A* a = ptrA.get();
	}
}
```

## 总结
- APIs往往要求访问原始资源， 所以每一个RAII class应该提供一个取得其管理之资源的办法。
- 对原始资源的访问可能经由显示转换或者隐式转换。一般而言，显示转换比较安全，但隐式转换对客户比较方便。
