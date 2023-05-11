---
category: 
- C++
tag:
- effective modern c++读书笔记
---


# Item38：关注不同线程句柄的析构行为

本文主要focus线程的future句柄析构行的讨论上。

## 分析

future的析构行为是要分场景的。

如果future的创建同时满足了一下几个条件，它的析构过程会阻塞到任务执行完毕：

- 它关联到由于调用std::async而创建出的共享状态。
- 任务的启动策略是std::launch::async（参见Item36），原因是运行时系统选择了该策略，或者在对std::async的调用中指定了该策略。
- 这个future是关联共享状态的最后一个future。对于std::future，情况总是如此，对于std::shared_future，如果还有其他的std::shared_future，与要被销毁的future引用相同的共享状态，则要被销毁的future遵循正常行为（即简单地销毁它的数据成员）。


如果上述条件中任一条件不能满足，future的析构就是析构本身的数据成员， 不会有其他的附加行为。

试想为何如此设计？

如果使用```std::async```配合```std::launch::async```的策略， 那么```std::async```便和线程使用上大同小异了（除了资源调度以外）。

之前条款中提到过确保线程在任何路径最后都要是unjoinable的。这中场景下要如何保证？

似乎答案已经很明了了。```std::async```使用时并不创建对象， 只是会得到一个返回值```std::future```。所以unjoinable的任务只能交给```std::future```。

```cpp
auto fut = std::async(f);   //使用默认启动策略运行f
```


## 总结

- future的正常析构行为就是销毁future本身的数据成员。
- 引用了共享状态——使用std::async启动的未延迟任务建立的那个——的最后一个future的析构函数会阻塞住，直到任务完成。