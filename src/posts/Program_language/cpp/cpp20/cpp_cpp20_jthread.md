---
category: 
- C++
tag:
- C++
---

# c++20 jthread

jthread是c++20所支持的新的线程类型，jthread = joinable thread, 即可以自动join的线程。我们知道在c++11之后，c++标准库开始支持多线程编程，那么thread和jthread之间有何区别，本文将进行重点讲解。

## c++11 thread

c++11中thread对象如果在销毁之前处于可join的状态，却没有join的话，将会引发一个异常， 例如下面的例子：

```cpp
#include <iostream>
#include <thread>

int main(){
    
    std::cout << std::endl;
    std::cout << std::boolalpha;
    
    std::thread thr{[]{ std::cout << "Joinable std::thread" << std::endl; }};
    std::cout << "thr.joinable(): " << thr.joinable() << std::endl;
    std::cout << std::endl;
    
}
```

[点击在线运行](https://godbolt.org/z/TY3E5bfeP)

在effective modern c++的37条曾经提到过，使```std::thread```在所有路径最后都不可结合。而这样的需求就很容易让人想起RAII。

```cpp
class ThreadRAII {
public:
    enum class DtorAction { join, detach };     //enum class的信息见条款10
    
    ThreadRAII(std::thread&& t, DtorAction a)   //析构函数中对t实行a动作
    : action(a), t(std::move(t)) {}

    ~ThreadRAII()
    {                                           //可结合性测试见下
        if (t.joinable()) {
            if (action == DtorAction::join) {
                t.join();
            } else {
                t.detach();
            }
        }
    }

    std::thread& get() { return t; }            //见下

private:
    DtorAction action;
    std::thread t;
};

```

这样看起来似乎万事大吉，但是也是有弊端的。effective modern c++ Item39表明了使用ThreadRAII来保证在```std::thread```的析构时执行join有时不仅可能导致程序表现异常，还可能导致程序挂起，例如下面的例子，thread析构时，程序陷入死锁状态。

```cpp
#include <iostream>
#include <thread>
#include <future>

std::promise<void> p;

class ThreadRAII {
public:
    enum class DtorAction { join, detach };     //enum class的信息见条款10

    ThreadRAII(std::thread&& t, DtorAction a)   //析构函数中对t实行a动作
    : action(a), t(std::move(t)) {}

    ~ThreadRAII()
    {
        std::cout << "call ~ThreadRAII" << std::endl;
            //可结合性测试见下
        if (t.joinable()) {
            if (action == DtorAction::join) {
                t.join();
            } else {
                t.detach();
            }
        }
    }

    std::thread& get() { return t; }            //见下

private:
    DtorAction action;
    std::thread t;
};

void react()
{

}

void detect()
{
    ThreadRAII tr(
        std::thread([]
                    {
                        p.get_future().wait();
                        react();
                    }),
        ThreadRAII::DtorAction::join
    );
    throw 1;//这里抛出了异常
    p.set_value();
}

int main()
{
    try{
        detect();
    }
    catch(...){
    }
}

```

解决方案是此类程序应该和异步执行的lambda通信，告诉它不需要执行了，可以直接返回，但是C++11中不支持可中断线程（interruptible threads）。

结合上述的例子，jthread的由来就很好理解了，jthread除了拥有```std::thread``` 的行为外，主要增加了以下两个功能：

- jthread 对象被析构时，会自动调用join，等待其所表示的执行流结束。
- jthread支持外部请求中止（通过 get_stop_source、get_stop_token 和 request_stop ）。

这两个特点和上面的例子是相呼应的。

## jthread

了解了jthread产生的原因，下面将介绍jthread的使用方法。

回顾上节的第一个案例，joinable的```std::thread```如果析构的时候没有join，将会导致异常退出。

```cpp
#include <iostream>
#include <thread>

int main(){
    
    std::cout << std::endl;
    std::cout << std::boolalpha;
    
    std::thread thr{[]{ std::cout << "Joinable std::thread" << std::endl; }};
    std::cout << "thr.joinable(): " << thr.joinable() << std::endl;
    std::cout << std::endl;
}
```

将其改成jthread，再次运行，不再会异常退出。

```cpp
#include <iostream>
#include <thread>

int main(){

    std::cout << std::endl;
    std::cout << std::boolalpha;

    std::jthread thr{[]{ std::cout << "Joinable std::thread" << std::endl; }};
    std::cout << "thr.joinable(): " << thr.joinable() << std::endl;
    std::cout << std::endl;
}
```

[点击在线运行](https://godbolt.org/z/jT9zbn6Tz)


下面的这个例子是使用request_stop向线程发出停止运行的请求。注意lambda函数的入参中需要添加```std::stop_token```类型的入参， 并且需要在线程中添加检查stop_token的代码。

```cpp
#include <thread>
#include <iostream>

using namespace std::chrono_literals;

void test_jthread01() {
        std::jthread jt{ [](std::stop_token stoken) {
                while (!stoken.stop_requested()) { 
                        std::cout << "Doing work\n";
                        std::this_thread::sleep_for(1s);
                }
        }};
        sleep(5);
        jt.request_stop(); // 请求线程停止，因有响应停止请求而终止线程
        jt.join();
}
int main()
{
    test_jthread01();
}
```


上面我们提到过，使用ThreadRAII来保证在```std::thread```的析构时执行join有时不仅可能导致程序表现异常，还可能导致程序挂起。

jthread同样可以解决上述问题，jthread对象在析构时会调用request_stop，jthread的析构函数伪代码可能是下面这样的：

```cpp
~jthread() {
    if(joinable()) {
        request_stop(); //More on stop request below.
        join();
    }
}
```

而在线程的内部可以使用```std::condition_variable_any```去进行配合。condition_variable_any和一样条件变量不同的是， 其wait时会接受一个stop_token，当收到request_stop时，wait会直接返回，不再进行等待。下面是condition_variable_any进行wait时的伪代码：

```cpp
template<class Lock, class Predicate>
bool wait(Lock& lock, std::stop_token stoken, Predicate stop_waiting){
    while (!stoken.stop_requested()) {
        if (stop_waiting()) return true;
        wait(lock);
    }
    return stop_waiting();
}
```

结合jthread和condition_variable_any就可以很好的解决上述问题，官网对于jthread和condition_variable_any结合的描述如下所示：

> If the request_stop() does issue a stop request (i.e., returns true), then all condition variables of base type std::condition_variable_any registered with an interruptible wait for std::stop_tokens associated with the jthread's internal stop-state will be awoken.

意思是说如果发出了request_stop，那么condition_variable_any类型的条件变量将会唤醒。下面是一个使用jthread和condition_variable_any的完整例子，jthread对象析构时，不再会陷入无穷的等待中。

```cpp

#include <iostream>
#include <thread>
#include <chrono>
#include <mutex>
#include <condition_variable>
 
using namespace std::chrono_literals;
std::condition_variable_any cond;

int main()
{
    std::jthread waiting_worker([](std::stop_token stoken) {
        std::mutex mutex;
        std::unique_lock lock(mutex);
        std::cout << "wait" << std::endl;
        cond.wait(lock, stoken,
            [] { return false; });
        if (stoken.stop_requested()) {
            std::cout << "Waiting worker is requested to stop\n";
            return;
        }
    });

    std::this_thread::sleep_for(100s);
    std::cout << "destroy jthread object, and call request_stop" << std::endl;
    // Or automatically using RAII:
    // waiting_worker's destructor will call request_stop()
    // and join the thread automatically.
}

```

## 总结

jthread扩充了```std::thread``` 的功能，主要增加了以下两个功能：

- jthread 对象被析构时，会自动调用join，等待其所表示的执行流结束。
- jthread支持外部请求中止（通过 get_stop_source、get_stop_token 和 request_stop ）。