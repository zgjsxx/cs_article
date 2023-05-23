---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 27 尽量少做转型动作

本节主要讨论强制类型转换的相关问题，并指出平常开发中尽可能少用强制类型转换，这不利于运行效率，有时候还可能引起意想不到的问题。

## 分析

在c语言中，强制类型转换格式是像下面这样的：
```cpp
(T)expression //将expression转型为T
```

在c++中， 提供了四种新型的转型：

```cpp
const_cast<T>(expression)

dynamic_cast<T>(expression)

reinterpret_cast<T>(expression)

static_cast<T>(expression)
```


我们通过两个案例来分析为什么尽量少做转型动作。

**第一个案例是转型动作使用不当带来了问题**。

在SpecialWindow的virtual函数onResize内部，我们想先调用**Window类内部的默认实现onResize**。

因此这里使用了```static_cast<Window>(*this).onResize();```去做转型，转型成Window类再调用onResize方法，这种办法能生效吗？

```cpp
#include <iostream>
class Window
{
public:
	virtual void onResize() {
        a_ = 1;
    } 
	virtual ~Window() {}
    int getA() const
    {
        return a_;
    }
private:
    int a_{0};
};

class SpecialWindow : public Window
{
public:
	virtual void onResize()
	{
		static_cast<Window>(*this).onResize();
	}
private:
    int b_{0};
};

int main()
{
	SpecialWindow specialWindow;
	specialWindow.onResize();
    std::cout << specialWindow.getA() << std::endl;
}
```

输出：

```
0
```

[have a try](https://godbolt.org/z/T3Wrs57Yh)


从输出结果我们看出转型之后虽然调用到了父类的onResize方法，但是内部去修改a_的值却没有生效，因为我们最后打印specialWindow的getA方法发现a_的值还是0，并不是1。

问题出在了哪里？

```static_cast<Window>(*this).onResize()```这句话操作的并不是*this本身，而是一个副本。

```static_cast<Window>(*this)```是一个Window的临时副本。

上面的语句就有点像下面的语句，其最后修改的是临时对象中的值，而不是(*this)的。

```cpp
Window tmp = static_cast<Window>(*this);
tmp.onResize();
```

修改起来也很简单，就是去掉强制类型转换，使用```Window::onResize```。

```cpp
#include <iostream>
class Window
{
public:
	virtual void onResize() {
        a_ = 1;
    } 
	virtual ~Window() {}
    int getA() const
    {
        return a_;
    }
private:
    int a_{0};
};

class SpecialWindow : public Window
{
public:
	virtual void onResize()
	{
		Window::onResize();
	}
private:
    int b_{0};
};

int main()
{
	SpecialWindow specialWindow;
	specialWindow.onResize();
    std::cout << specialWindow.getA() << std::endl;
}
```

下面再看第二个案例， 第二个案例是转型操作会带来额外的性能开销。

这里我们在vector中存放了父类的指针，但是我们想调用子类的blink方法，这里便需要使用dynamic_cast强转为子类对象的指针，再调用blink方法。 

```cpp
#include <iostream>
#include <memory>
#include <vector>
class Window
{
public:
    virtual ~Window() = default;
};

class SpecialWindow : public Window
{
public:
	void blink()
	{
        std::cout << "blink" << std::endl;
		int x = 7;
	}
};

int main()
{
    using VPW = std::vector<std::shared_ptr<Window>>;
    VPW winPtrs;
    std::shared_ptr<Window> ptr1 = std::make_shared<SpecialWindow>();
    std::shared_ptr<Window> ptr2 = std::make_shared<SpecialWindow>();  
    winPtrs.push_back(ptr1);
    winPtrs.push_back(ptr2);
    for(VPW::iterator iter = winPtrs.begin(); iter != winPtrs.end(); ++iter)
    {
        Window* w = iter->get();
        SpecialWindow* psw = dynamic_cast<SpecialWindow*>(iter->get());
        if(psw)
            psw->blink();
    }     
}
```
我们知道dynamic_cast是有性能开销的，dynamic_cast内部需要调用strcmp进行字符串比较。如果在一个四层深的单继承体系内的某个对象身上执行dynamic_cast，就可能耗用多达四次的strcmp调用。

那么该如何进行优化呢？

一种优化的方法就是vector内部就不要存Window类型的share_ptr，而是存储SpecialWindow类型的share_ptr。

```cpp
#include <iostream>
#include <memory>
#include <vector>
class Window
{
public:
    virtual ~Window() = default;
};

class SpecialWindow : public Window
{
public:
	void blink()
	{
        std::cout << "blink" << std::endl;
		int x = 7;
	}
};

int main()
{
    using VPW = std::vector<std::shared_ptr<SpecialWindow>>;
    VPW winPtrs;
    std::shared_ptr<SpecialWindow> ptr1 = std::make_shared<SpecialWindow>();
    std::shared_ptr<SpecialWindow> ptr2 = std::make_shared<SpecialWindow>();  
    winPtrs.push_back(ptr1);
    winPtrs.push_back(ptr2);
    for(VPW::iterator iter = winPtrs.begin(); iter != winPtrs.end(); ++iter)
    {
        (*iter)->blink();
    }     
}
```

另一种方法就是将blink修改为virtual的函数：

```cpp
#include <iostream>
#include <memory>
#include <vector>
class Window
{
public:
    virtual ~Window() = default;
    virtual void blink(){};
};

class SpecialWindow : public Window
{
public:
	virtual void blink() override
	{
        std::cout << "blink" << std::endl;
		int x = 7;
	}
};

int main()
{
    using VPW = std::vector<std::shared_ptr<Window>>;
    VPW winPtrs;
    std::shared_ptr<Window> ptr1 = std::make_shared<SpecialWindow>();
    std::shared_ptr<Window> ptr2 = std::make_shared<SpecialWindow>();  
    winPtrs.push_back(ptr1);
    winPtrs.push_back(ptr2);
    for(VPW::iterator iter = winPtrs.begin(); iter != winPtrs.end(); ++iter)
    {
        (*iter)->blink();
    }     
}
```
当然上述两种办法只是两种思路，并不意味着必须这样做。当确实需要强转时，就去强转。

一句话总结就是尽可能少的去转型，但并不意味着完全杜绝转型，这一点要牢记，需要的时候该转还得转。

## 总结
- 如果可以，尽量避免转型，特别是在注重效率的代码中避免dynamic_cast。如果有个别设计需要转型动作，试着发展无需转型的替代设计。
- 如果转型是必要的，试着将它隐藏于某个函数背后。客户随后可以调用该函数，而不需要将转型放进他们自己的代码内。
- 宁可使用c++style新式转型，不要使用旧式转型，前者很容易辨识出来，而且也比较有着分门别类的职掌。
