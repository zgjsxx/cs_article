---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 16 成对使用new和delete时采取相同形式

这一节其实是面试题经常会问的一个话题。也很简单。我们直接通过例子来进行演示。

## 分析

下面就是一个关于本节原则的一个演示。

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
		A* a = new A;
		delete a;
		std::cout << "-------------" << std::endl;
	}
	{
		A* a = new A[5];
		delete[] a;
	}
}
```

## 总结
- 如果你在new表达式中使用[]，必须在相应的delete表达式中也使用[]。如果你在new表达式中不使用[]，一定不要再相应的delete表达式中使用[]。