---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 49 了解new-handler的行为

我们在编写代码时，经常会使用new来创建对象。如果内存不够了，new会是怎样的行为？

默认的行为是，new将抛出一个异常。然而有时候我们不希望这样的默认行为，这个时候我们就需要new-handler。

本章节主要探讨了如何自定义new-handler。

## 分析

### new-handler的介绍

作者在item-51节从给出了```::operator new```的一个伪代码，这个伪代码就比较清晰地显示了new-handler是何时被调用的。从下面的伪代码中我们也可以看到，new-handler如果被设置了，它将被循环调用。

```cpp
void* operator new(std::size_t size) throw(std::bad_alloc) {
	using namespace std;
	if (size == 0) {
		size = 1;
	}
	while (true) {
		尝试分配 size bytes;
		if (分配成功) {
			return (一个指针，指向分配得来的内存)；
		}
		// 分配失败；找出目前的 new-handling 函数
		new_handler globalHandler = set_new_handler(0);//获取当前的new-handler
		set_new_handler(globalHandler);//设置new-handler

		if (globalHandler)
			(*globalHandler)();
		else
			throw std::bad_alloc();
	}
}
```


### new-handler的例子

下面就是演示如何设置new-handler。这个实验其实也暗含了很多知识点，我刚刚开始的时候始终不能触发new-handler， 每次都是被linux oom给干掉了。

下面我便总结了这个实验如何才能做的起来。我们使用三个实验。

- 在案例1中，程序触发overcommit规则而直接引起new失败。可以查看```/proc/sys/vm/overcommit_memory```， 如果为0，则代表不允许overcommit。例如我们下面的例子，我一次性申请10G，就触发了该规则，new失败，调用new-handler。
- 在案例2中，程序虚拟内存用完触发new失败。new申请的都是虚拟内存，64位系统的虚拟内存高达128T，因此如果没有触发overcommit的话，就需要循环申请才有可能new失败，而且会需要很长时间，例如案例2。
- 在案例3中，程序被oom给干掉了。如果你一次申请的内存过小的话，还没有到虚拟内存申请到128T， 物理内存就用完了（申请虚拟内存也需要占用少量物理内存），这个时候程序就会被linux oom给杀掉，就触发不了new-handler。（在我的机器上就被killed了，可以使用dmesg查看）

案例1：
```cpp
// new_handler example
#include <iostream>     // std::cout
#include <cstdlib>      // std::exit
#include <new>          // std::set_new_handler

void no_memory () {
  std::cout << "Failed to allocate memory!\n";
  std::exit (1);
}

int main () {
  std::set_new_handler(no_memory);
  std::cout << "Attempting to allocate 10 GiB...";
  char* p = new char [10*1024*1024*1024];
  std::cout << "Ok\n";
  delete[] p;
  return 0;
}
```

案例2：

```cpp
// new_handler example
#include <iostream>     // std::cout
#include <cstdlib>      // std::exit
#include <new>          // std::set_new_handler
#include <iostream>
#include <chrono>
#include <thread>
using namespace std::chrono_literals;

void no_memory () {
  std::cout << "Failed to allocate memory!\n";
  std::exit (1);
}

int main () {
    std::set_new_handler(no_memory);
    int count = 0;
    while(1)
    {
        char* p = new char [1024*1024*1024];
        count++;
        std::cout << "current used "<< count << " G" << std::endl;
    }

    return 0;
}
```

案例3：

```cpp
// new_handler example
#include <iostream>     // std::cout
#include <cstdlib>      // std::exit
#include <new>          // std::set_new_handler
#include <iostream>
#include <chrono>
#include <thread>
using namespace std::chrono_literals;

void no_memory () {
  std::cout << "Failed to allocate memory!\n";
  std::exit (1);
}

int main () {
    std::set_new_handler(no_memory);
    int count = 0;
    while(1)
    {
        char* p = new char [1024*1024];
    }

    return 0;
}
```

### new-handler的设计原则

从上面的伪代码中，我们知道，new-handler是嵌入在一个循环中的，因此当operator new无法满足内存申请时，它会不断调用new-handler函数，直到找到足够的内存。

由于会循环调用new-handler，因此设计new-handler时需要注意如下几点：
- 让更多内存可被使用。
- 安全其他new-handler
- 卸载new-handler
- 抛出bad_alloc的异常
- 不返回，通常调用abort或者exit

### 为某个类设计new-handler

有时候我们需要为某个类的对象创建时候而自定义一个new-handler。我们通常可以像下面这样操作。

我们需要为Widget类重载operator new的操作符，并且在operator new操作符中使用RAII类NewHandlerHolder去自动resotre默认的new-handler。(RAII实现的一种auto-restore机制，很常用)

```cpp
#include <new>
#include <iostream>

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
	static void* operator new(std::size_t size) ;

private:
	static std::new_handler currentHandler;
    char arr[(long)10*1024*1024*1024];//10G
};

std::new_handler Widget::currentHandler = 0;


std::new_handler Widget::set_new_handler(std::new_handler p) throw()
{
	std::new_handler oldHandler = currentHandler;
	currentHandler = p;

	return oldHandler;
}

void* Widget::operator new(std::size_t size) 
{
	NewHandlerHolder h(std::set_new_handler(currentHandler));
	return ::operator new(size);
}

void no_memory () {
  std::cout << "Failed to allocate memory!\n";
  std::exit (1);
}

int main()
{
    Widget::set_new_handler(no_memory);
    while(1){
        Widget* w = new Widget;
    }
}
```

输出结果：

```text
Failed to allocate memory!
```

### 为某个类设计new-handler（更通用的做法）

如果做的更加通用一点，如果有很多个类都希望可以设置new-handler， 就可以使用模板的方法。让有需要的类去继承模板类。

```cpp
#include <new>
#include <iostream>

#include <new>

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

template<typename T>
class NewHandlerSupport
{
public:
	static std::new_handler set_new_handler(std::new_handler p) throw();
	static void* operator new(std::size_t size) ;

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
void* NewHandlerSupport<T>::operator new(std::size_t size)
{
	NewHandlerHolder h(std::set_new_handler(currentHandler));
	return ::operator new(size);
}

class Widget : public NewHandlerSupport<Widget>
{
private:
    char arr[(long)10*1024*1024*1024];
};

void no_memory () {
  std::cout << "Failed to allocate memory!\n";
  std::exit (1);
}

int main()
{
    Widget::set_new_handler(no_memory);
    while(1){
        Widget* w = new Widget;
    }
}
```

结果输出：

```text
Failed to allocate memory!
```

## 总结
- set_new_handler允许客户指定一个函数，在内存分配无法获得满足时被调用。
- Nothrow new是一个颇为局限的工具，因为它只使用与内存分配，后继的构造函数调用还是可能抛出异常。
