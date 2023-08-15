---
category: 
- C++
tag:
- C++
---

# c++20实用小特性之原子变量的wait/signal


> These functions are guaranteed to return only if value has changed, even if the underlying implementation unblocks spuriously.

仅当值发生更改时，这些函数才保证返回，即使底层实现虚假地解除阻塞

也就是说原子变量的wait在应用层可以确保不会虚假唤醒， 这就可以避免条件变量那样的循环测试条件。

```cpp
#include <atomic>
#include <chrono>
#include <future>
#include <iostream>
#include <thread>

using namespace std::literals;

int main()
{
    std::atomic<bool> all_tasks_completed{false};
    std::atomic<unsigned> completion_count{};
    std::future<void> task_futures[16];
    std::atomic<unsigned> outstanding_task_count{16};

    // Spawn several tasks which take different amounts of
    // time, then decrement the outstanding task count.
    for (std::future<void>& task_future : task_futures)
    {
        task_future = std::async([&]
        {
            // This sleep represents doing real work...
            std::this_thread::sleep_for(2000ms);

            ++completion_count;
            --outstanding_task_count;

            // When the task count falls to zero, notify
            // the waiter (main thread in this case).
            if (outstanding_task_count.load() == 0)
            {
                all_tasks_completed = true;
                all_tasks_completed.notify_one();
            }
        });
    }

    all_tasks_completed.wait(false);

    std::cout << "Tasks completed = " << completion_count.load() << '\n';
}
```

不过，想要使用这样的特性也是需要c++的编译器支持到c++20标准。