---
category: 
- C++
tag:
- C++
---

# c++20 coroutine

在c++20中，千呼万唤的协程终于来了，本文将对c++20的协程进行讲解，了解其使用方法。

## 简介
c++20的协程是**无栈协程**，通俗讲其是一种可以支持暂停和恢复运行的函数。

为此c++20新引入了3个关键字， co_await，co_yield和co_return，定义包含了上述三个关键字之一的函数是协程。

**co_await** 表达式——用于暂停执行，直到恢复：

```cpp
task<> tcp_echo_server()
{
    char data[1024];
    while (true)
    {
        std::size_t n = co_await socket.async_read_some(buffer(data));
        co_await async_write(socket, buffer(data, n));
    }
}
```

**co_yield** 表达式——用于暂停执行并返回一个值：
```cpp
generator<int> iota(int n = 0)
{
    while (true)
        co_yield n++;
}
```

**co_return** 语句——用于完成执行并返回一个值：

```cpp
lazy<int> f()
{
    co_return 7;
}
```

下面这一大串是我不想讲却又不得不讲的，c++20的协程范式，确实非常复杂，像是写给library的编写者，而不是写给应用层开发者的。上网搜了一下，c++20协程的提出者David Mazières，可以参考他写的文章([My tutorial and take on C++20 coroutines](https://www.scs.stanford.edu/~dm/blog/c++-coroutines.html))，网上关于其的讨论也非常多，例如下面的论坛[c++20协程的讨论](https://www.reddit.com/r/cpp/comments/lpo9qa/my_tutorial_and_take_on_c20_coroutines_david/)，个人感觉这个协程的设计非常的**学院派**，不知道工程界的人怎么看...


## c++20 coroutine编程范式

如果你想要拥有一个协程，首先要做的是要构建一个promise_type和awaitable类型：

c++20 coroutine要求你定义一个包含 promise_type 的类型，其中 promise_type 又需要至少包含 get_return_object, initial_suspend, final_suspend, return_void 和 unhandled_exception 函数；另外co_await 表达式还要你实现一个 awaitable 类型，这个 awaitable 类型至少需要实现 await_ready, await_suspend 和 await_resume。

接着就是理解promise_type和awaitable类型是如何配合的。

当调用协程函数时，其步骤如下：
- 使用 operator new 申请空间并初始化协程状态；
- 复制协程参数到到协程状态中；
- 构造协程承诺对象 promise；
- 调用 promise.get_return_object() 并将其结果存储在局部变量中。该结果将会在协程首次挂起时返回给调用者；
- 调用 co_await promise.initial_suspend()，预定义了 std::suspend_always 表示始终挂起，std::suspend_never 表示始终不挂起；
- 而后正式开始执行协程函数内过程。

当协程函数执行到 ```co_return [expr]``` 语句时：

- 若 expr 为 void 则执行 promise.return_void()，否则执行 promise.return_value(expr)；
- 按照创建顺序的倒序销毁局部变量和临时变量；
- 执行 co_await promise.final_suspend()。

当协程执行到 ```co_yield expr``` 语句时：
- 执行 co_await promise.yield_value(expr)。

当协程执行到 ```co_await expr``` 语句时：
- 通过 expr 获得 awaiter 对象；
- 执行 awaiter.await_ready()，若为 true 则直接返回 awaiter.await_resume()；
- 否则将协程挂起并保存状态，执行 awaiter.await_suspend()，若其返回值为 void 或者 true 则成功挂起，将控制权返还给调用者 / 恢复者；
- 直到 handle.resume() 执行后该协程才会恢复执行，将 awaiter.await_resume() 作为表达式的返回值。

当协程因为某个未捕获的异常导致终止时：

- 捕获异常并调用 promise.unhandled_exception()；
- 调用 co_await promise.final_suspend()。

当协程状态销毁时（通过协程句柄主动销毁 / co_return 返回 / 未捕获异常）：

- 析构 promise 对象；
- 析构传入的参数；
- 回收协程状态内存。

这一串流程是如此的复杂而严谨，让我觉得写代码就像是在写论文一样。。

梳理上述的流程，其伪代码就像下面的流程一样：

```cpp
return_type MyCoroutine(args...)
{
    create coroutine state
    copy parameters to coroutine frame
    promise_type p;
    auto return_object = p.get_return_object();

    try {
        co_await p.initial_suspend();
        coroutine function body
    } catch (...) {
        p.unhandled_exception();
    }
    co_await p.final_suspend();
    destruct promise p
    destruct parameters in coroutine frame
    destroy coroutine state
}
```


话不多说，理解上述的流程还是要通过一个例子来看。

```cpp
//g++ main.cpp  -std=c++20
#include <coroutine>
#include <iostream>
#include <thread>

std::coroutine_handle<> handle;

struct ReadAwaiter {
    bool await_ready() {
        std::cout << "current, no data to read" << std::endl;
        return false;
    }

    void await_resume() {
        std::cout << "get data to read" << std::endl;
    }

    void await_suspend(std::coroutine_handle<> h) {
        std::cout << "suspended self, wait data to read" << std::endl;
        handle = h;
    }
};

struct Promise {
    struct promise_type {
        auto get_return_object() noexcept {
            std::cout << "get return object" << std::endl;
            return Promise();
        }

        auto initial_suspend() noexcept {
            std::cout << "initial suspend, return never" << std::endl;
            return std::suspend_never{};
        }

        auto final_suspend() noexcept {
            std::cout << "final suspend, return never" << std::endl;
            return std::suspend_never{};
        }

        void unhandled_exception() {
            std::cout << "unhandle exception" << std::endl;
            std::terminate();
        }

        void return_void() {
            std::cout << "return void" << std::endl;
            return;
        }
    };
};

Promise ReadCoroutineFunc() {
    co_await ReadAwaiter();
}

int main() {
    ReadCoroutineFunc();

    std::this_thread::sleep_for(std::chrono::seconds(1));
    std::cout << "sleep 1s and then read data" << std::endl;
    handle.resume();
}
```

执行结果如下所示：

```shell
get return object
initial suspend, return never
current, no data to read
suspended self, wait data to read
sleep 1s and then read data
get data to read
return void
final suspend, return never
```

上述例子演示了一开始协程方法没有数据可读，然后挂起，等有数据可读时再恢复协程的运行。

下面来解释一下运行的过程：

- 在main函数中调用了ReadCoroutineFunc函数，该函数是一个coroutine。
- 在进入ReadCoroutineFunc的时候，创建了Promise对象，并调用了Promise对象的get_return_object方法，也调用了Promise对象的initial_suspend方法。可以看到日志打印了get return object和initial suspend, return never。
- 接下来co_await ReadAwaiter()将调用await_ready去判断是否可以运行，由于返回的是false，于是执行了await_suspend，可以看到日志打印了current, no data to read和suspended self, wait data to read。在await_suspend函数中将全局变量handle用于存储协程的运行状态。
- 经过此番操作，ReadCoroutineFunc被挂起，于是继续执行main方法，在sleep 1s之后，打印了sleep 1s and then read data。
- 接着handle.resume()协程将从挂起状态的地方继续执行，于是执行了await_resume方法，于是打印了get data to read。
- 最终协程执行完毕，隐式的co_return，调用了return_void和final_suspend，于是打印了return void和final suspend, return never。

上述例子是一个较为简单的例子， 下面这个例子涉及到了co_yield， co_return， co_await所有的关键字, 对理解协程的过程很有帮助。

```cpp
//g++ main.cpp -std=c++20
#include <coroutine>
#include <iostream>
#include <thread>

struct MyAwaiter {
    bool await_ready() {
        std::cout << "current, no data to read" << std::endl;
        return false;
    }

    void await_resume() {
        std::cout << "get data to read" << std::endl;
    }

    void await_suspend(std::coroutine_handle<> h) {
        std::cout << "suspended self, wait data to read" << std::endl;
    }
};

template <typename T>
struct Task_ret {
    struct promise_type;
    using handle_type = std::coroutine_handle<promise_type>;
    handle_type task_handle_;
    bool task_done_{false};

    Task_ret(handle_type h)
        : task_handle_(h)
    {
    }

    Task_ret(const Task_ret&) = delete;
    Task_ret(Task_ret&& s)
        : task_handle_(s.task_handle_)
    {
        s.task_handle_ = nullptr;
    }
    ~Task_ret()
    {
        if (task_handle_){
            std::cout << "destroy" << std::endl;
                task_handle_.destroy();
        }

    }

    void resume()
    {
        task_handle_.resume();
        task_done_ = task_handle_.done();
    }

    void start()
    {
        task_handle_.resume();
    }

    bool done() const{
        return task_done_;
    }

    T get()
    {
        return task_handle_.promise().return_data_;
    }

    struct promise_type {

        promise_type() = default;
       ~promise_type() = default;

        auto get_return_object() noexcept {
            return Task_ret<T>{handle_type::from_promise(*this)};
        }

        auto initial_suspend() noexcept {
            return std::suspend_always{};
        }

        auto final_suspend() noexcept {
            std::cout << "final suspend" << std::endl;
            return std::suspend_always{};
        }

        void unhandled_exception() {
            std::exit(1);
        }

        void return_value(T v)
        {
            return_data_ = v;
            return;
        }

        auto yield_value(T v)
        {
            std::cout << "yield_value invoked." << std::endl;
            return_data_ = v;
            return std::suspend_always{};
        }

        T return_data_;
    };
};

template<typename T>
Task_ret<T> ReadCoroutineFunc() {
    std::cout << "Coroutine co_await std::suspend_never" << std::endl;
    co_await std::suspend_never{};
    std::cout << "Coroutine co_await std::suspend_always" << std::endl;
    co_await std::suspend_always{};
    std::cout << "after Coroutine co_await std::suspend_always" << std::endl; 
    co_await std::suspend_always{};
    std::cout << "after Coroutine co_await std::suspend_always" << std::endl; 

    co_await MyAwaiter{};

    co_yield 1;

    co_yield 2;

    co_return 3;
}

int main() {
    Task_ret<int> task_ret = ReadCoroutineFunc<int>();
    std::cout << "start to coroutine" << std::endl;
    task_ret.start();

    while(!task_ret.done()){
        task_ret.resume();
    }

    std::cout << "end of code" << std::endl;

}
```

分析上面的这个例子，我们创建了Task_ret类型作为协程的返回值，因为Task_ret类型中包含了promise_type的定义，因此是合法的。


在promise_type中的get_return_object方法中，使用了```std::coroutine_handle<promise_type>：：from_promise```将promise对象封装成coroutine_handle类型的对象，并传递给了Task_ret的构造函数。

```cpp
    auto get_return_object() noexcept {
        return Task_ret<T>{handle_type::from_promise(*this)};
    }
```

于是在main函数中，我们可以使用下面的语句接受协程的返回值：
```cpp
Task_ret<int> task_ret = ReadCoroutineFunc<int>();
```

由于promise的initial_suspend返回的是```std::suspend_always{}```， 因此协程并不会立即执行，除非显示调用start方法。
```cpp
    auto initial_suspend() noexcept {
        return std::suspend_always{};
    }
```

于是在main函数中使用了start方法，运行了协程：
```cpp
    std::cout << "start to coroutine" << std::endl;
    task_ret.start();
```

剩下的部分就是当协程没有执行完毕时，就一直执行，直到任务结束：
```cpp
    while(!task_ret.done()){
        bool ret = task_ret.resume();
    }
```

上述代码将一次打印下面的语句：
```shell
start to coroutine
Coroutine co_await std::suspend_never
Coroutine co_await std::suspend_always
after Coroutine co_await std::suspend_always
after Coroutine co_await std::suspend_always
current, no data to read
suspended self, wait data to read
get data to read
yield_value invoked.
yield_value invoked.
final suspend
end of code
destroy
```


git上有这样一个demo， 是一个基于c++20的epoll-server， https://github.com/Ender-events/epoll-coroutine.git， 这对你深入理解c++20协程和如何运行协程将有很好的帮助。

对照代码和协程的范式，虽然可以将原理理清楚，但是其目前的复杂程度还是让我对c++20的协程的第一印象不太好。相较于c++20的无栈协程，目前我还是更愿意使用state-thread或者libco等三方库或者中提供的有栈协程。


## 总结
- c++20的协程是一个无栈协程，目前使用起来并不方便，有较为复杂的编程范式，个人认为仅仅需要对c++20协程的内容有个大体认识就好，这么原始的接口使用起来还是太麻烦，期待后续的标准对其进行简化，降低使用难度。