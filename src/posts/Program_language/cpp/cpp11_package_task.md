---
category: 
- C++
---

# c++11中的多线程std::packaged_task

```std::thread```是c++11中提供的线程，其有一大缺点，就是无法获取线程函数执行的结果。这与pthread_create是有区别的，pthread_join可以获取线程函数的返回。而```std::thread::join```是无法获取返回值的(可能大部分场景不关心返回值)。下面是```std::thread::join```的声明，既无入参，也没有返回值，因此无法获取任何信息。

```cpp
void join();
(since C++11)
```

因此当需要获取线程函数返回值的时候就需要使用packaged_task。当然也有其他类型的途径，例如```std::async```, ```std::promise```。 其不在本文的讨论之中。

可以认为当创建线程时，很关心线程的返回值，就可以使用packaged_task。

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

## 总结
- packaged_task就是为了弥补std::thread无法获取返回值而设计的， 如果需要获取线程函数的返回值，就需要使用它。