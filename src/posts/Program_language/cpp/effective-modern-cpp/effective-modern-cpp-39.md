---
category: 
- C++
- effective Modern C++
---

# Item39: 对于一次性事件通信考虑使用void的futures

通常我们需要在一个线程中**通知**另一个线程处理事务时，会使用条件变量去实现。本文提供了另外一种思路，即使用```std::promise```和```std::future```进行一次性的通讯。

## 分析

我们首先看看使用条件变量是如何实现的。

这里的案例是一个反应任务等待检测任务的过程。检测任务完毕，触发反应任务执行。

```cpp
#include <iostream>
#include <string>
#include <thread>
#include <mutex>
#include <condition_variable>

std::mutex mutex;
std::condition_variable cv;
bool ready = false;
int main() {
  
    auto react_func = [](){
        std::unique_lock<std::mutex> lock(mutex);
        std::cout << "react wait to work" << std::endl;
        cv.wait(lock, [] { return ready; });
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::cout << "react work finish" << std::endl;
    };
    std::thread react(react_func);

    // 等待工作线程处理数据。
    std::cout << "detect start to run" <<  std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "detect work finish" << std::endl;
    ready = true;
    cv.notify_one();
    react.join();

    return 0;
}
```

在上面的例子中，我们看出，基于条件变量的方案需要一把互斥锁。并且为了避免"虚假唤醒"，还使用了一个flag。

接下来，我们看看使用```std::promise```和```std::future```是如何实现该功能的。

```cpp
#include <iostream>
#include <string>
#include <thread>
#include <mutex>
#include <future>
#include <condition_variable>

std::promise<void> p;

int main() {
  
    auto react_func = [](){
        std::cout << "react wait to work" << std::endl;
        p.get_future().wait();
        std::this_thread::sleep_for(std::chrono::seconds(1));
        std::cout << "react work finish" << std::endl;
    };
    std::thread react(react_func);

    // 等待工作线程处理数据。
    std::cout << "detect start to run" <<  std::endl;
    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "detect work finish" << std::endl;
    p.set_value();

    react.join();

    return 0;
}
```

可以看到代码简化了不少。但是需要注意下面两点：

- ```std::promise```和```future```之间有个共享状态，并且共享状态是动态分配的。因此你应该假定此设计会产生基于堆的分配和释放开销。

- 更重要的是，```std::promise```只能设置一次。```std::promise```和```future```之间的通信是一次性的：不能重复使用。这是与基于条件变量或者基于flag的设计的明显差异，条件变量和flag都可以通信多次。


## 总结

- 对于简单的事件通信，基于条件变量的设计需要一个多余的互斥锁，对检测和反应任务的相对进度有约束，并且需要反应任务来验证事件是否已发生。
- 基于flag的设计避免的上一条的问题，但是是基于轮询，而不是阻塞。
- 条件变量和flag可以组合使用，但是产生的通信机制很不自然。
- 使用std::promise和future的方案避开了这些问题，但是这个方法使用了堆内存存储共享状态，同时有只能使用一次通信的限制。