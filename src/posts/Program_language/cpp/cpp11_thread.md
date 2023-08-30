---
category: 
- C++
---

# c++11中的多线程std::thread

在c++11中提供了新的多线程的创建方式```std::thread```, 丰富了对于多线程的使用。 ```std::thread```类的构造函数的格式如下所示：

```cpp
thread() noexcept;       //default constructor   其中noexcept表示函数不会抛出异常，如果抛出异常程序就会终止
 
template <class Fn, class... Args> 
explicit thread (Fn&& fn, Args&&... args);   //initialization constructor  explicit 表示不支持隐式转换
 
thread (const thread&) = delete;        //copy constructor delete表示不生成默认拷贝构造函数，并且可以禁止使用某个函数，也就表示不可以使用一个线程初始化另一个线程
 
thread (thread&& x) noexcept;    //move constructor
```

其包含了一个默认的构造函数和一个模板构造函数。该模板构造函数是explicit，代表不允许隐式转换。 其拷贝构造函数声明为delete，代表不可以使用一个线程初始化另一个线程。 其拥有一个移动构造函数。

对于模板构造函数，可以看到，**其入参就和函数的入参很类似**，因此创建一个线程的方式大大简化。在此之前，在linux平台，创建线程需要使用pthread_create函数，其要求将参数封装为```void*```指针， 这个在写代码的时候是不太方便的。

```cpp
template <class Fn, class... Args> 
explicit thread (Fn&& fn, Args&&... args);
```

c++11中thread和pthread相比有如下的一些优点：
- 跨平台，pthread只能用在POSIX系统上
- 简单，易用，传参方便，过去pthread需要将数据传递给void*指针， c++11直接像函数传参一样传递参数
- 提供了std::future,std::promise等高级功能
- 风格上更加像c++， pthread更像c的。

和pthread相比， 也有一些缺点：
- 没有实现读写锁
- pthread提供的功能更加多，例如设置CPU的亲和性

下面看看使用```std::thread```创建线程的几种方式。

## ```std::thread```创建线程的方式

### 使用普通函数创建线程

```cpp
#include<iostream>
#include <thread>

void myprint()
{
    std::cout<<"thread start to run" << std::endl;
}

int main()
{
    std::thread th(myprint);
    th.join();
    std::cout << "main thread end" << std::endl;
}
```

### 使用仿函数创建线程

```cpp
#include<iostream>
#include <thread>

class Test
{
public:
    void operator()() const
    {
        std::cout << "function object starts to run" << std::endl;
    }
};

int main()
{
    Test obj;
    std::thread th(obj);
    th.join();

    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    std::cout << "main thread end" << std::endl;
}
```

### 使用lambda表达式创建线程

```cpp
#include<iostream>
#include <thread>

int main()
{
    auto func = [](){
        std::cout << "lambda function thread start to run" << std::endl;
    };

    std::thread th(func);
    th.join();

    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    std::cout << "main thread end" << std::endl;
}
```

### 使用成员函数创建线程

使用成员函数创建线程有下面几种实现的思路

- 直接传参给std::thread

```cpp
#include <iostream>
#include <algorithm>
#include <vector>
#include <thread>

class Test{
public:
    Test() = default;
    ~Test() = default;
public:
    void func(){
        std::cout << "test func" << std::endl;
    }
};

int main()
{
    Test testobj;
    std::thread th1{&Test::func, &testobj};
    th1.join();
}
```

- 使用std::bind生成function对象再传给std::thread

```cpp
#include <iostream>
#include <algorithm>
#include <vector>
#include <thread>
#include <functional>

class Test{
public:
    Test() = default;
    ~Test() = default;
public:
    void func(){
        std::cout << "test func" << std::endl;
    }
};

int main()
{
    Test testobj;
    std::function<void()> testfunc = std::bind(&Test::func, &testobj);
    std::thread th1{testfunc};
    th1.join();
}
```

- 封装成lambda函数再传给std::thread

```cpp
#include <iostream>
#include <algorithm>
#include <vector>
#include <thread>
#include <functional>

class Test{
public:
    Test() = default;
    ~Test() = default;
public:
    void func(){
        std::cout << "test func" << std::endl;
    }
};

int main()
{
    Test testobj;
    auto testfunc = [&testobj](){
        testobj.func();
    };

    std::thread th1{testfunc};
    th1.join();
}
```

## thread的传参

在上面的例子中，我们创建的函数都是没有入参的。下面我们讨论下如何传参并且需要注意的一些点。

```cpp
#include <iostream>
#include <thread>

class String
{
public:
    String(const char* cstr) { std::cout << "String()" << std::endl; }

    // 1
    String(const String& v)
    { std::cout << "String(const String& v)" << std::endl; }
  
    // 2
    String(const String&& v) noexcept
    { std::cout << "String(const String&& v)" << std::endl; }

    // 3
    String& operator=(const String& v)
    { std::cout << "String& operator=(const String& v)" << std::endl; return *this; }
};

void test(int i, const String & s) {}

int main()
{
    String s("hello");
    std::cout << "----------------" << std::endl;

    // 输出 1, 2
    std::thread t1(test, 3, s);//拷贝构造
    t1.join();
    std::cout << "----------------" << std::endl;

    // 输出 2, 2
    std::thread t2(test, 3, std::move(s));//移动构造
    t2.join();
    std::cout << "----------------" << std::endl;

    // 只输出 1
    std::thread t3(test, 3, "hello");//拷贝指针，构造函数
    t3.join();
    std::cout << "----------------" << std::endl;

    // 无输出
    std::thread t4(test, 3, std::ref(s));//无拷贝
    std::cout << "----------------" << std::endl;
    t4.join();
}
```

执行结果如下所示：
```cpp
String()
----------------
String(const String& v)
----------------
String(const String&& v)
----------------
String()
----------------
----------------
```


第一个例子，(1) s被copy到了新的memory space里去，所以call的是copy constructor 输出了1。(2) 第一步的结果生成了一个rvalue，所以传参数去函数的时候用的是move constructor，所以输出了2。

第二个例子，(1) s被move到了新thread的memory space里，所以用的是move constructor，输出2。(2) 同上，输出2。

第三个例子，输出的是这个String(const char* cstr) { std::cout << "String()" << std::endl; }。(1) 你在这里copy过去的其实是一个```const char*```指针，所以第一步没任何输出。(2) 这时你用const char*来构造一个String，所以输出0.

第四个例子，你的一切活动都是指向最初的那个s，所以没有任何constructor被调用，所以不输出任何东西。

还是上面的例子，这里将test函数中的const去除```void test(int i, String & s) {}```， 会如何？

```c
#include <iostream>
#include <thread>

class String
{
public:
    String(const char* cstr) { std::cout << "String()" << std::endl; }

    // 1
    String(const String& v)
    { std::cout << "String(const String& v)" << std::endl; }
  
    // 2
    String(const String&& v) noexcept
    { std::cout << "String(const String&& v)" << std::endl; }

    // 3
    String& operator=(const String& v)
    { std::cout << "String& operator=(const String& v)" << std::endl; return *this; }

};

void test(int i, String & s) {}

int main()
{
    String s("hello");
    std::cout << "----------------" << std::endl;

    // 输出 1, 2
    std::thread t1(test, 3, s);//拷贝构造
    t1.join();
    std::cout << "----------------" << std::endl;

    // 输出 2, 2
    std::thread t2(test, 3, std::move(s));//移动构造
    t2.join();
    std::cout << "----------------" << std::endl;

    // 只输出 1
    std::thread t3(test, 3, "hello");//拷贝指针，构造函数
    t3.join();
    std::cout << "----------------" << std::endl;

    // 无输出
    std::thread t4(test, 3, std::ref(s));//无拷贝
    std::cout << "----------------" << std::endl;
    t4.join();
}
```

这里会看到无法通过编译。为什么？

一个实参从主线程传递到子线程的线程函数中，需要经过两次传递。第1次发生在std::thread构造时，此次参数按值并以副本形式被保存。第2次发生在向线程函数传递时，此次传递是由子线程发起，并将之前```std::threa```d内部保存的副本以**右值的形式**(std::move())传入线程函数中的。

```String & s`````` 是不可以指向一个右值的。这里不熟悉的可以重新温故一下左值引用，右值引用。

形参```T```、```const T&```或```T&&``` 可以接受右值， ```T &```不可以接受右值。 因此如果函数形参是```T &```， 则传参时必须要使用```std::ref```。
