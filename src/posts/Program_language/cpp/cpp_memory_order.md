---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# c++原子变量中的内存序

关于内存序，我们从下面这个例子看起，线程1首先设置a = 1, 再将c设置为3。 线程2判断c是否等于3， 等于3之后，则打印a是否等于1。

于是有人说，问这个问题，不是傻子吗，肯定等于1啊。然而事实是这样吗？我们使用```-O3```进行编译。

```cpp
//g++ main.cpp -O3
#include <thread>
#include <iostream>

int a = 0, c = 0;
void func1()
{
    a = 1;
    c = 3;
}

void func2()
{
    while(c != 3);
    std::cout << (a == 1) << std::endl;
}

int main()
{
    std::thread th1(func1);
    std::thread th2(func2);
    th1.join();
    th2.join();
}
```


```cpp
#include <atomic>
#include <thread>
#include <iostream>

std::atomic<bool> x{false};
int a = 0;

void func1() { // 线程1
    a = 1;
    x.store(true, std::memory_order_relaxed);
}
void func2() { // 线程2
    while(!x.load(std::memory_order_relaxed));
    std::cout << (a == 1) << std::endl;
}
int main() {
    std::thread t1(func1);
    std::thread t2(func2);
    t2.join();
    t1.join();
    return 0;
}
```



其执行结果如下所示：
```
1
1
0
1
0
0
```

可以看到，其结果可以为0。

这是因为下面的语句可能被重排，
```
    a = 1;
    c = 3;
```
重排为
```cpp
    c = 3;
    a = 1;
```

存储(store)操作;其std::memory_order参数可以取: 
- std::memory_order_relaxed
- std::memory_order_release
- std::memory_order_seq_cst

载入(load)操作;其std::memory_order参数可以取: 
- std::memory_order_relaxed
- std::memory_order_seq_cst
- std::memory_order_acquire
- std::memory_order_consume

**memory_order_relaxed**

这个很好理解，宽松的内存序，指定为这个的所有原子操作就真的仅仅是保证自身的原子性，不会对任何其他变量的读写产生影响。如果确实不需要其他的内存同步，那么这是最好的选择，比如原子计数器。

```cpp
#include <vector>
#include <iostream>
#include <thread>
#include <atomic>
 
std::atomic<int> cnt = {0};
 
void inc_counter()
{
    for (int n = 0; n < 1000; ++n) {
        cnt.fetch_add(1, std::memory_order_relaxed);
    }
}
 
int main()
{
    std::vector<std::thread> v;
    for (int n = 0; n < 10; ++n) {
        v.emplace_back(inc_counter);
    }
    for (auto& t : v) {
        t.join();
    }
    std::cout << "Final counter value is " << cnt << '\n';
}
```

## release -acquire

memory_order_release限制当前线程store操作之前的读写(指令)不能重排到store后面执行。

memory_order_acquire限制当前线程load操作之后的读写(指令)不能重排到load前面执行。

```cpp
#include <thread>
#include <atomic>
#include <cassert>
#include <string>
 
std::atomic<std::string*> ptr;
int data;
 
void producer()
{
    std::string* p  = new std::string("Hello"); // 写入p不能重排到store后面
    data = 42;                                  // 写入data不能重排到store后面
    ptr.store(p, std::memory_order_release);
}
 
void consumer()
{
    std::string* p2;
    while (!(p2 = ptr.load(std::memory_order_acquire)))
        ;
    // 读取到producer写入值，两线程间内存同步完成
    assert(*p2 == "Hello"); // 断言绝不会失败; 读取p2不能重排到load前面
    assert(data == 42);     // 断言绝不会失败；读取data不能重排到load前面
}
 
int main()
{
    std::thread t1(producer);
    std::thread t2(consumer);
    t1.join(); t2.join();
}
```



## release-consume

memory_order_release限制当前线程store操作之前原子变量依赖的读写(指令)不能重排到store后面执行。

memory_order_consume限制当前线程load操作之后依赖原子变量的读写(指令)不能重排到load前面执行。

```cpp
#include <thread>
#include <atomic>
#include <cassert>
#include <string>
 
std::atomic<std::string*> ptr;
int data;
 
void producer()
{
    std::string* p  = new std::string("Hello"); // ptr依赖p
    data = 42;                                  // ptr不依赖data
    ptr.store(p, std::memory_order_release);
}
 
void consumer()
{
    std::string* p2;
    while (!(p2 = ptr.load(std::memory_order_consume)))
        ;
    // 读取到producer写入值，两线程间ptr依赖的前置写同步完成
    assert(*p2 == "Hello"); // 断言绝不会失败，p2依赖ptr
    assert(data == 42);     // 断言可能会失败，data不依赖ptr
}
 
int main()
{
    std::thread t1(producer);
    std::thread t2(consumer);
    t1.join(); t2.join();
}
```


## sequence

不允许重排+所有seq_cst原子变量写入顺序对于相关线程来说都是一致的

```cpp
#include <thread>
#include <atomic>
#include <cassert>
 
std::atomic<bool> x = {false};
std::atomic<bool> y = {false};
std::atomic<int> z = {0};
 
void write_x()
{
    x.store(true, std::memory_order_seq_cst);
}
 
void write_y()
{
    y.store(true, std::memory_order_seq_cst);
}
 
void read_x_then_y()
{
    while (!x.load(std::memory_order_seq_cst))
        ;
    if (y.load(std::memory_order_seq_cst)) {
        ++z;
    }
}
 
void read_y_then_x()
{
    while (!y.load(std::memory_order_seq_cst))
        ;
    if (x.load(std::memory_order_seq_cst)) {
        ++z;
    }
}
 
int main()
{
    std::thread a(write_x);
    std::thread b(write_y);
    std::thread c(read_x_then_y);
    std::thread d(read_y_then_x);
    a.join(); b.join(); c.join(); d.join();
    assert(z.load() != 0);  // 断言绝不会失败，z只有1或2两种取值
}
```
https://gcc.gnu.org/wiki/Atomic/GCCMM/AtomicSync