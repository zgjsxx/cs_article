---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 20 传引用代替传值

本节，作者开始讨论引用。我们知道c语言已经有了指针，通过指针我们也就可以修改变量本身，而不是修改变量的副本（传值）， 那么在c++中又搞出来个引用， 那么其是不是有点重复？ 

## 分析

我们知道在函数的传参中，如果传递的是指针， 那么就不可避免的要进行取地址和解引用，如下面的这段代码所示，就需要使用"&"和"*"。这就可给我们的代码增加了一定的复杂性。其实c++引入引用也就是为了简化这种写法。

```cpp
#include <iostream>

void print(int* a)
{
    *a = 4;
    std::cout << *a << std::endl;
}

int main()
{
    int a = 3;
    print(&a);
}
```

上面的代码修改成用引用的方式，是不是就简化了很多。

```cpp
#include <iostream>

void print(int& a)
{
    a = 4;
    std::cout << a << std::endl;
}

int main()
{
    int a = 3;
    print(a);
}
```

因此我们在c++中，涉及传参的时候，要尽量使用引用。但是要强调的是，引用并不能取代指针，涉及内存的操作的时候，指针还是不可替代的。

由于引用有指针的特性，在传参的时候是没有copy的行为的。例如下面这个validateStudent函数，使用了常引用作为入参，避免了对象的拷贝。如果用传值的方式， 其内部有多个string对象要涉及拷贝，这将是低效的。

```cpp
class Person
{
public:
	Person() : name("AAAA"), addr("BBBB")
	{
	}
	virtual ~Person() {}

private:
	std::string name;
	std::string addr;
};

class Student : public Person
{
public:
	Student() : schoolName("CCCC"), schoolAddr("DDDD")
	{
	}
	~Student() {}

private:
	std::string schoolName;
	std::string schoolAddr;
};

bool validateStudent(const Student& s);
```

另外， 由于引用的背后是由指针实现的，所以其将拥有"多态"的功能。 如下面中的printNameAndDisplay函数， 其入参是一个Window类的引用，在类的继承关系上，WindowWithScrollBars继承于Window。因此当传入的对象是Window对象时，w.display将调用window类的display方法，当传入的参数是WindowWithScrollBars类的对象时，w.display将调用WindowWithScrollBars类的display方法。

```cpp
class Window
{
public:
	std::string name() const { return "WINDOW"; }
	virtual void display() const
	{
		std::cout << "Display: window" << std::endl;
	}
};

class WindowWithScrollBars : public Window
{
public:
	void display() const
	{
		std::cout << "Display: window with scroll bars" << std::endl;
	}
};

void printNameAndDisplay(const Window& w)
{
    std::cout << w.name();
    w.display();
}

```


上面主要讲解了传引用的好处， 那么什么时候我们引用考虑传值呢？

作者这里也给出了解答， 下面三种场景可以考虑直接传值：
- 内置类型（只读不修改时）
- STL迭代器
- 函数对象

关于STL迭代器和函数对象为什么可以考虑传值，我在知乎上搜到了下面的解释，我觉得比较有道理：

> 很多时候迭代器可以做成可平凡复制的小对象（有时就是裸指针或裸指针直接外包），这时值传递迭代器和传递一个指针开销相同。不过例外也是存在的。

> 函数对象的话，无状态函数对象和函数指针是常见的情况。不过“大块头”的函数对象（如 std::function 或状态庞大的函数对象）也不能说少见。这时选择传值还是 const 引用可能就需要斟酌。


## 总结
- 尽量以传常引用去替代传值。前者通常比较高效，并且可以避免切割问题。
- 以上规则并不适用于内置类型 ，以及STL的迭代器和函数对象，对它们而言，传值往往比较合适。