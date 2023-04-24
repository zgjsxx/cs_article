---
category: 
- C++
---

# c++11中的多线程std::thread

c++11中thread和pthread相比有如下的一些优点：
- 跨平台，pthread只能用在POSIX系统上
- 简单，易用，传参方便，过去pthread需要将数据传递给void*指针， c++11直接像函数传参一样传递参数
- 提供了std::future,std::promise等高级功能
- 风格上更加像c++， pthread更像c的。

和pthread相比， 也有一些缺点：
- 没有实现读写锁
- pthread提供的功能更加多，例如设置CPU的亲和性

## 使用普通函数创建线程

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

## 使用仿函数创建线程
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

## 使用lambda创建线程
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

## 使用detach进行分离线程

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
    th.detach();

    std::this_thread::sleep_for(std::chrono::milliseconds(300));
    std::cout << "main thread end" << std::endl;
}
```

detach分离线程，这种方式平常使用较少。也容易引用一些问题。


