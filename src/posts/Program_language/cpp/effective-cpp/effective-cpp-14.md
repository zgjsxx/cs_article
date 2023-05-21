---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 14 资源管理类中小心copying行为

本节还是继续讨论RAII这个设计模式。

## 分析

上节中讨论了RAII设计模式，但是该模式其实是有一些需要关注的点。本节讨论的便是RAII类中的复制行为需要特别关注。

通常RAII类对于copy行为实行两种方法，**抑制copy**和**施行引用计数**。

例如像互斥锁的RAII类型， 我们是不愿意其被复制的。 如果可以被复制，就意味着互斥锁可能被unlock两次，这不是我们想要的。因此对于互斥锁这样的类型，通常将其copy构造函数和赋值运算符delete掉， 避免其复制行为。=delete的标记在item-06中有讨论过。

```cpp
#include <iostream>
#include <memory>
#include <mutex>

int main()
{
	{
		std::mutex mtx;
		std::lock_guard lk(mtx);
		std::lock_guard lk2(lk);//错误，拷贝构造函数已经delete
	}
}
```

另一种对于RAII类型copy的行为便是引用计数法。

这个典型的案例就是shared_ptr。

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
		std::shared_ptr<A> ptrB = ptrA;		
		std::cout << ptrB.use_count() << std::endl;
	}
}
```

## 总结
- 复制RAII对象必须一并复制它所管理的资源，所以资源的copying行为决定RAII对象的copying行为。
- 普遍而常见的RAII class的copying行为是：抑制copying，施行引用计数法。不过其他行为也可能被实现。
