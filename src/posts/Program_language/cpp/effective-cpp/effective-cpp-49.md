---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 49 了解new-handler的行为

本章节主要探讨了如何自定义new-handler。 new-handler是当operator new抛出异常时会调用的一个处理函数。

当没有设定时，operator new在无法获取内存时将抛出异常。当设定了new-handler时， operator new在无法获取内存时将调用设定的new-handler。

## 分析

我们在编写代码时，经常会使用new来创建对象。如果内存不够了，new会怎样？ 默认的行为是，new将抛出一个异常。然而有时候我们不希望这样的默认行为，这个时候我们就需要new-handler。

我们可以通过set_new_handler设置一个handler。

```cpp
#include <new>
#include <iostream>

void outofMem()
{
    std::cerr << "Unable to satisfy request for memory\n";
    std::abort();
}

int main()
{
    std::set_new_handler(outofMem);
    int* bigDataArray = new int[1000000000000000000];
}
```

当operator new无法满足内存申请时，它会不断调用new-handler函数，直到找到足够的内存。由于会循环调用new-handler，因此设计new-handler时需要注意如下几点：
- 让更多内存可被使用。
- 安全其他new-handler
- 卸载new-handler
- 抛出bad_alloc的异常
- 不返回，通常调用abort或者exit
  

有时候我们需要为某个类的对象创建时候而自定义一个new-handler。我们通常可以像下面这样操作。

我们需要为Widget类重载operator new的操作符，并且在operator new操作符中使用RAII类NewHandlerHolder去自动resotre默认的new-handler。

```cpp
class NewHandlerHolder
{
public:
	explicit NewHandlerHolder(std::new_handler nh) : handler(nh)
	{
	}
	~NewHandlerHolder()
	{
		std::set_new_handler(handler);
	}

private:
	std::new_handler handler;

	// Prevent copying
	NewHandlerHolder(const NewHandlerHolder&);
	NewHandlerHolder& operator=(const NewHandlerHolder&);
};

class Widget
{
public:
	static std::new_handler set_new_handler(std::new_handler p) throw();
	static void* operator new(std::size_t size) throw(std::bad_alloc);

private:
	static std::new_handler currentHandler;
};

std::new_handler Widget::currentHandler = 0;


std::new_handler Widget::set_new_handler(std::new_handler p) throw()
{
	std::new_handler oldHandler = currentHandler;
	currentHandler = p;

	return oldHandler;
}

void* Widget::operator new(std::size_t size) throw(std::bad_alloc)
{
	//std::new_handler handler = std::set_new_handler(currentHandler);
	//NewHandlerHolder h(handler);

	NewHandlerHolder h(std::set_new_handler(currentHandler));
	return ::operator new(size);
}
```

如果做的更加通用一点，如果有很多个类都希望可以设置new-handler， 就可以使用模板的方法。让有需要的类去继承模板类。

```cpp
#include <new>

template<typename T>
class NewHandlerSupport
{
public:
	static std::new_handler set_new_handler(std::new_handler p) throw();
	static void* operator new(std::size_t size) throw(std::bad_alloc);

private:
	static std::new_handler currentHandler;
};


template<typename T>
std::new_handler NewHandlerSupport<T>::currentHandler = 0;


template<typename T>
std::new_handler NewHandlerSupport<T>::set_new_handler(std::new_handler p) throw()
{
	std::new_handler oldHandler = currentHandler;
	currentHandler = p;

	return oldHandler;
}


template<typename T>
void* NewHandlerSupport<T>::operator new(std::size_t size) throw(std::bad_alloc)
{
	//class Widget : public NewHandlerSupport<Widget> {};
	//std::new_handler handler = std::set_new_handler(currentHandler);
	//NewHandlerSupport h;
	//h.set_new_handler(handler);

	NewHandlerHolder h(std::set_new_handler(currentHandler));
	return ::operator new(size);
}

class Widget : public NewHandlerSupport<Widget>
{
};
```


## 总结
- set_new_handler允许客户指定一个函数，在内存分配无法获得满足时被调用。
- Nothrow new是一个颇为局限的工具，因为它只使用与内存分配，后继的构造函数调用还是可能抛出异常。
