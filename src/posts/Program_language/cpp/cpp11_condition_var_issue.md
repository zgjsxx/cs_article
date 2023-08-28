category: 
- C++
---

# 条件变量的虚假唤醒和唤醒丢失问题

条件变量时多线程同步的重要手段，然而不正确的使用条件变量将导致很多问题。典型的问题就是**虚假唤醒**和**唤醒丢失**。本文将探索这两个问题的产生原因以及解决办法。

## 什么是虚假唤醒？

**虚假唤醒**是指当你对线程进行唤醒时，你不希望被唤醒的线程也被唤醒的现象。

**虚假唤醒**既可能是**操作系统层面**导致，也可能是**应用层代码**导致。

**内核层面导致的虚假唤醒**

内核层面导致的虚假唤醒的意思是，当你调用notify_one/signal_one等方法时，操作系统并不保证只唤醒一个线程。

这里参考[Linux pthread_cond_signal Man](https://linux.die.net/man/3/pthread_cond_signal)给出的原因。

假设这里有三个线程， A线程正在signal，B线程正在wait，C线程已经wait。

```cpp
pthread_cond_wait(mutex, cond):
    value = cond->value; /* 1 */
    pthread_mutex_unlock(mutex); /* 2 */
    pthread_mutex_lock(cond->mutex); /* 10 */
    if (value == cond->value) { /* 11 */
        me->next_cond = cond->waiter;
        cond->waiter = me;
        pthread_mutex_unlock(cond->mutex);
        unable_to_run(me);
    } else
        pthread_mutex_unlock(cond->mutex); /* 12 */
    pthread_mutex_lock(mutex); /* 13 */

pthread_cond_signal(cond):
    pthread_mutex_lock(cond->mutex); /* 3 */
    cond->value++; /* 4 */
    if (cond->waiter) { /* 5 */
        sleeper = cond->waiter; /* 6 */
        cond->waiter = sleeper->next_cond; /* 7 */
        able_to_run(sleeper); /* 8 */
    }
    pthread_mutex_unlock(cond->mutex); /* 9 */
```

其执行的时序图如下所示：

|step|A线程(正在signal)|B线程(正在wait)|
|--|--|--|
|1||value = cond->value; |
|2||pthread_mutex_unlock(mutex); |
|3|pthread_mutex_lock(cond->mutex);||
|4|cond->value++;  ||
|5|if (cond->waiter) ||
|6|sleeper = cond->waiter; ||
|7|cond->waiter = sleeper->next_cond; ||
|8|able_to_run(sleeper) ||
|9|pthread_mutex_unlock(cond->mutex); ||
|10| |pthread_mutex_lock(cond->mutex);|
|11| |if (value == cond->value)|
|12| |pthread_mutex_unlock(cond->mutex);|
|13| |pthread_mutex_lock(mutex);|

在这个场景之下，pthread_cond_signal，就会同时唤醒B线程和C线程。

有关于虚假唤醒，man页面还有下面的一些陈述。

>An added benefit of allowing spurious wakeups is that applications are forced to code a predicate-testing-loop around the condition wait. This also makes the application tolerate superfluous condition broadcasts or signals on the same condition variable that may be coded in some other part of the application. The resulting applications are thus more robust. Therefore, IEEE Std 1003.1-2001 explicitly documents that spurious wakeups may occur.

其意思是允许虚假唤醒的另一个好处是应用程序被迫围绕条件等待编写谓词测试循环。 这也使得应用程序能够容忍相同条件变量上的多余条件广播或信号，这些条件变量可能在应用程序的其他部分中进行编码。 因此，最终的应用程序更加稳健。 因此，IEEE Std 1003.1-2001 明确记录了可能发生虚假唤醒。

pthread库之所以允许虚假，是为了性能上的考虑。pthread库希望应用程序某些时候在进入内核态之前就被唤醒，这样就可以避免进入内核态的开销。关于其详细原因，可以参考本站的另一篇文章**深入了解glibc的条件变量**进行了解。

**应用层导致的虚假唤醒**

除了操作系统层面的虚假唤醒，应用层不正确的代码实现同样会引起虚假唤醒问题。

例如下面的代码，生产者只生产了一个元素，但是确调用了notify_all，导致两个线程都被唤醒，而其中的一个线程无法获得相应的任务。

```cpp
#include <condition_variable>
#include <iostream>
#include <thread>
#include <queue>
#include <string>

using namespace std::chrono_literals;
std::condition_variable cv;
std::mutex mtx;
std::queue<std::string> q;

void Producer()
{
    std::this_thread::sleep_for(2000ms);
    std::cout << "Ready Send notification." << std::endl;
    mtx.lock();
    q.push("message");
    mtx.unlock();
    cv.notify_all();
 }

void Consumer()
{
    std::cout << "Wait for notification." << std::endl;
    std::unique_lock<std::mutex> lck(mtx);
    if(q.empty())
        cv.wait(lck);
    std::string msg = q.front();
    q.pop();
    mtx.unlock();
    std::cout << "Get: " << msg <<std::endl;
}

int main()
{
    std::thread producer(Producer);
    std::thread consumer(Consumer);
    std::thread consumer2(Consumer);
    producer.join();
    consumer.join();
    consumer2.join();
    return 0;
}
```

点击在线运行： [have a try](https://godbolt.org/z/1xMd7qzcK)。

## 如何避免虚假唤醒？

无论是内核层面导致的虚假唤醒或者是应用层导致的虚假唤醒都可以通过**添加测试循环**进行避免。

所谓**测试循环**就是在wait的外层添加while循环判断是否需要wait，或者给wait方法传入一个函数指针用于判断是否需要wait，如下所示：

```cpp
while(!flag)
{
    cv.wait(mtx);
}
```

或者

```cpp
cv.wait(mtx, []{return flag})
```

对于上面的例子，按照上述方法修改之后，即便消费者调用了notify_all方法，虽然两个线程都会被唤醒，但是有一个线程由于条件不满足会继续wait，就避免了虚假唤醒造成的问题。

```cpp
#include <condition_variable>
#include <iostream>
#include <thread>
#include <queue>
#include <string>

using namespace std::chrono_literals;
std::condition_variable cv;
std::mutex mtx;
std::queue<std::string> q;

void Producer()
{
    for(int i = 0;i < 2; i++){
        std::this_thread::sleep_for(2000ms);
        std::cout << "Ready Send notification." << std::endl;
        mtx.lock();
        q.push("message");
        mtx.unlock();
        cv.notify_all();
    }
 }

void Consumer()
{
    std::cout << "Wait for notification." << std::endl;
    std::unique_lock<std::mutex> lck(mtx);

    /*
    方法1：
    while(q.empty()){
        cv.wait(lck);
    }
    */
    cv.wait(lck,[]{return !q.empty();});//方法2

    std::string msg = q.front();
    q.pop();
    mtx.unlock();
    std::cout << "Get: " << msg <<std::endl;
}

int main()
{
    std::thread producer(Producer);
    std::thread consumer(Consumer);
    std::thread consumer2(Consumer);
    producer.join();
    consumer.join();
    consumer2.join();
    return 0;
}
```

## 什么是唤醒丢失

**唤醒丢失**简而言之就是我曾经唤醒了你，但是没有收到。

详细来说就是某个线程在调用notify时，另一个线程还没有进行wait，那么这个线程后面wait时将陷入无限的等待中。

下面的例子是一个使用条件变量的demo：

```cpp
#include <condition_variable>
#include <iostream>
#include <thread>
using namespace std::chrono_literals;
std::condition_variable cv;
std::mutex mtx;

void Producer()
{
     std::cout << "Ready Send notification." << std::endl;
     cv.notify_one();   // 发送通知
 }

void Consumer()
{
    std::this_thread::sleep_for(2000ms);
     std::cout << "Wait for notification." << std::endl;
     std::unique_lock<std::mutex> lck(mtx);
     cv.wait(lck);    // 等待通知并唤醒继续执行下面的指令
     std::cout << "Process." << std::endl;
}

 int main()
 {
     std::thread producer(Producer);
     std::thread consumer(Consumer);
     producer.join();
     consumer.join();
     return 0;
}
```

在上面的这个例子中，开启了两个线程，分别是生产者线程和消费者线程。

很遗憾的是，上面程序将100%陷入死锁状态。因为生产者将首先调度运行，然而其调用notify_one的时候，消费者还没有处于wait将自己挂起，等到2s之后，消费者开始运行，首先创建了互斥锁，接着调用了cv.wait将自己挂起，由于错过了生产者的唤醒信号，于是就不能醒来，因此就一直阻塞在了这里。

很显然，上述的例子是一个错误的例子。

## 如何避免唤醒丢失?

如果在notify时，线程没有处于wait，那么就会发生唤醒丢失。这个似乎是无法避免的。我们所要做的就是即便丢失了唤醒，程序还是会根据条件去判断是否要进行wait，而不是无脑地wait。

对于上面的例子，添加上一个flag表明是否可以处理。当生产者准备好数据后，将flag置为true。

随后，虽然消费者错过了信号，但是发现条件已经满足了，无需进入wait，于是也进入了正常的处理流程。

```cpp
#include <condition_variable>
#include <iostream>
#include <thread>
using namespace std::chrono_literals;
std::condition_variable cv;
std::mutex mtx;
bool flag = false;

void Producer()
{
    mtx.lock();
    flag = true;
    std::cout << "Ready Send notification." << std::endl;
    mtx.unlock();
    cv.notify_one();   // 发送通知
 }

void Consumer()
{
    std::this_thread::sleep_for(2000ms);
    std::cout << "Wait for notification." << std::endl;
    std::unique_lock<std::mutex> lck(mtx);
    cv.wait(lck,[]{return flag;});    // 等待通知并唤醒继续执行下面的指令
    std::cout << "Process." << std::endl;
}

int main()
{
    std::thread producer(Producer);
    std::thread consumer(Consumer);
    producer.join();
    consumer.join();
    return 0;
}
```

## 总结
- 条件变量是多线程同步中重要的手段，唤醒丢失和虚假唤醒是使用条件变量时会遇到的问题，这两个问题并不是无法避免的，使用时需要添加循环测试条件就可以规避上述问题。