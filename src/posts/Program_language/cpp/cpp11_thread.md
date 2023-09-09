---
category: 
- C++
---

# c++11中的多线程std::thread


## 简介

在c++11中提供了新的多线程的创建方式```std::thread```, 丰富了对于多线程的使用。本文将从下面几个角度对```std::thread```进行讲解。

- std::thread的原型
- std::thread创建线程的方式
- std::thread的销毁
- std::thread的传参
- 如何获取线程的返回值

## std::thread的原型

```std::thread```类的原型如下所示：

```cpp
namespace std {
class thread {
public:
    // 类型声明:
    class id;
    typedef implementation-defined native_handle_type;

    // 构造函数、拷贝构造函数和析构函数声明:
    thread() noexcept;
    template <class F, class ...Args> explicit thread(F&& f, Args&&... args);
    ~thread();
    thread(const thread&) = delete;
    thread(thread&&) noexcept;
    thread& operator=(const thread&) = delete;
    thread& operator=(thread&&) noexcept;

    // 成员函数声明:
    void swap(thread&) noexcept;
    bool joinable() const noexcept;
    void join();
    void detach();
    id get_id() const noexcept;
    native_handle_type native_handle();

    // 静态成员函数声明:
    static unsigned hardware_concurrency() noexcept;
};
}
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

## std::thread创建线程的方式

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

## std::thread的销毁

在```std::thread```的析构函数中有下面的判断，即当一个线程在析构时处于可以join的状态，那么将会调用```std::terminate```方法，这将会异常终止程序的运行。

```cpp
    ~thread()
    {
      if (joinable())
	    std::terminate();
    }
```

因此如果一个线程是可以join的，那么在析构前一定要join掉。**effective modern c++**一书中的Item37也曾提到，使```std::thread```在所有路径最后都不可结合（unjoinable）。

这里特别的提一下detach。detach函数将当前线程从主线程中分离出来，使其变成一个独立的线程，并在其执行完成后自动销毁，而不会阻塞主线程。

一个有趣的问题的是，如果main函数退出了，[detach的线程会怎样？](
https://stackoverflow.com/questions/19744250/what-happens-to-a-detached-thread-when-main-exits)

例如下面的例子：

```cpp
#include <iostream>
#include <string>
#include <thread>
#include <chrono>

void thread_fn() {
  std::this_thread::sleep_for (std::chrono::seconds(1)); 
  std::cout << "Inside thread function\n";   
}

int main()
{
    std::thread t1(thread_fn);
    t1.detach();

    return 0; 
}
```

在linux下，使用gcc编译，上面的程序没有任何输出。当主线程结束时，已经detach的线程会被**强行杀掉**。注意，这里使用了强行两个字，意味的杀掉的方式将是暴力的。

看下面的例子：

```cpp
#include <iostream>
#include <string>
#include <thread>
#include <chrono>

class A
{
public:
	A() 
	{
		std::cout << "A()" << std::endl;
	}
	~A()
	{
		std::cout << "~A()" << std::endl;
	}
};

void thread_fn() {
  A a;
  std::this_thread::sleep_for (std::chrono::seconds(1)); 
  std::cout << "Inside thread function\n";   
}

int main()
{
    std::thread t1(thread_fn);
    t1.detach();

    return 0; 
}
```

执行结果：
```shell
A()
```

上面的程序在线程中创建了a对象，从执行结果可以看到a对象的构造函数已经打印。但是析构函数没有打印。

这里我推测的原因是子线程被强行杀掉，因此没有必要调用~A()，直接由操作系统回收所有资源。

从这个例子也看出，主线程退出，detach的子线程被强行杀掉将会造成一些奇怪的现象和问题，因此平常开发时要避免这一点，主线程退出前要让子线程安全的退出。

## std::thread的传参

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


## 如何获取线程的返回值

- 通过promise-future获取线程函数返回值

```cpp
#include <iostream>
#include <iomanip>
#include <string>
#include <random>
#include <any>
#include <functional>
#include <future>
#include <thread>
#include <chrono>
#include <cstdlib>

void SetPromise(std::promise<int>& promiseObj) {
    std::cout << "In a thread, making data...\n";
    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    promiseObj.set_value(10);
    std::cout << "Finished\n";
}

int main() {
    std::promise<int> promiseObj;
    std::future<int> futureObj = promiseObj.get_future();
    std::thread t(&SetPromise, std::ref(promiseObj));
    std::cout << futureObj.get() << std::endl;
    t.join();

    return 0;
}
```

- 通过packaged_task获取函数返回值

```cpp
#include <iostream>     // std::cout
#include <future>       // std::packaged_task, std::future
#include <chrono>       // std::chrono::seconds
#include <thread>       // std::thread, std::this_thread::sleep_for

// count down taking a second for each value:
int countdown (int from, int to) {
    for (int i=from; i!=to; --i) {
        std::cout << i << '\n';
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
    std::cout << "Finished!\n";
    return from - to;
}

int main ()
{
    std::packaged_task<int(int,int)> task(countdown); // 设置 packaged_task
    std::future<int> ret = task.get_future(); // 获得与 packaged_task 共享状态相关联的 future 对象.

    std::thread th(std::move(task), 10, 0);   //创建一个新线程完成计数任务.

    int value = ret.get();                    // 等待任务完成并获取结果.

    std::cout << "The countdown lasted for " << value << " seconds.\n";

    th.join();
    return 0;
}
```

- 使用std::async结合std::launch::async策略启动线程

```cpp
#include <iostream>
#include <future>
#include <thread>
#include <chrono>
using namespace std::chrono_literals;
 
int main()
{
    std::future<int> future = std::async(std::launch::async, [](){
        std::this_thread::sleep_for(3s);
        return 8;
    });
 
    std::cout << "waiting...\n";
    std::future_status status;
    do {
        switch(status = future.wait_for(1s); status) {
            case std::future_status::deferred: std::cout << "deferred\n"; break;
            case std::future_status::timeout: std::cout << "timeout\n"; break;
            case std::future_status::ready: std::cout << "ready!\n"; break;
        }
    } while (status != std::future_status::ready);
 
    std::cout << "result is " << future.get() << '\n';
}
```

## std::thread的native handle

c++中的线程库```std::thread```所提供的线程控制能力非常有限， 线程创建完成后即开始运行，只提供了joinable, join, detach，为了弥补这个不足，c++提供了一个```std::thread::native_handle()``` 函数来获取与特性线程库实现相关的handle,以此来提供更多线程控制能力。

```cpp
#include <thread>
#include <mutex>
#include <iostream>
#include <chrono>
#include <cstring>
#include <pthread.h>

std::mutex iomutex;
void f(int num)
{
    std::this_thread::sleep_for(std::chrono::seconds(1));

    sched_param sch;
    int policy;
    pthread_getschedparam(pthread_self(), &policy, &sch);
    std::lock_guard<std::mutex> lk(iomutex);
    std::cout << "Thread " << num << " is executing at priority "
              << sch.sched_priority << '\n';
}

int main()
{
    std::thread t1(f, 1), t2(f, 2);

    sched_param sch;
    int policy;
    pthread_getschedparam(t1.native_handle(), &policy, &sch);
    sch.sched_priority = 20;
    if (pthread_setschedparam(t1.native_handle(), SCHED_FIFO, &sch)) {
        std::cout << "Failed to setschedparam: " << std::strerror(errno) << '\n';
    }

    t1.join(); t2.join();
}
```

## 总结
- c++11提供的std::thread提供了简便的创建线程的方式
- 确保线程在所有路径上都是unjoinable的
- 如果std::thread提供的接口不能满足你的开发需求，可以尝试用native handle操调用线程库原生的接口进行操作。