---
category: 
- C++
tag:
- C++
---


# c++20的新增的小的特性

## std::format

c++20支持新的字符串格式化方式```std::format```

```cpp
#include <format>
#include <iostream>
  
using namespace std;
  
int main()
{
    // Declare variables
    int num = 42;
    std::string name = "John";
  
    // Use std::format to format a string with placeholders
    // for variables
    std::string formatted_str = std::format(
        "My name is {} and my favorite number is {}", name,
        num);
  
    // Print formatted string to console
    std::cout << formatted_str << std::endl;
  
    return 0;
}
```
## Calendar
```cpp
#include <chrono>

int main()
{
    using namespace std::chrono;

    // Get a local time_point with system_clock::duration precision
    auto now = zoned_time{current_zone(), system_clock::now()}.get_local_time();

    // Get a local time_point with days precision
    auto ld = floor<days>(now);

    // Convert local days-precision time_point to a local {y, m, d} calendar
    year_month_day ymd{ld};

    // Split time since local midnight into {h, m, s, subseconds}
    hh_mm_ss hms{now - ld};

    // This part not recommended.  Stay within the chrono type system.
    int year{ymd.year()};
    int month = unsigned{ymd.month()};
    int day = unsigned{ymd.day()};
    int hour = hms.hours().count();
    int minute = hms.minutes().count();
    int second = hms.seconds().count();
}
```
## timezone

时区工具

```cpp
#include <chrono>
#include <iostream>
 
int main() {
    const std::chrono::zoned_time cur_time{ std::chrono::current_zone(),
                                            std::chrono::system_clock::now() };
    std::cout << cur_time << '\n';
}
```

## std::source_location

文件位置的工具

```cpp
#include <iostream>
#include <source_location>
#include <string_view>
 
void log(const std::string_view message,
         const std::source_location location =
               std::source_location::current())
{
    std::clog << "file: "
              << location.file_name() << '('
              << location.line() << ':'
              << location.column() << ") `"
              << location.function_name() << "`: "
              << message << '\n';
}
 
template<typename T>
void fun(T x)
{
    log(x);
}
 
int main(int, char*[])
{
    log("Hello world!");
    fun("Hello C++20!");
}
```

## std::span

过去如果一个函数想接受无法确定数组长度的数组作为参数，那么一定需要声明两个参数：数组指针和长度：

```cpp
void set_data(int *arr, int len) {}

int main()
{
    int buf[128]{ 0 };
    set_data(buf, 128);
}
```

这种人工输入增加了编码的风险，数组长度的错误输入会引发程序的未定义行为，甚至是成为可被利用的漏洞。C++20标准库为我们提供了一个很好解决方案std::span，通过它可以定义一个基于连续序列对象的视图，包括原生数组，并且保留连续序列对象的大小。例如：

```cpp
#include <iostream>
#include <span>
void set_data(std::span<int> arr) {
    std::cout << arr.size();
}

int main()
{
    int buf[128]{ 0 };
    set_data(buf);
}
```


## 航天飞机运算符 <=>

```shell
(a <=> b) < 0 if a < b,
(a <=> b) > 0 if a > b,
(a <=> b) == 0 if a and b are equal/equivalent.
```

```cpp
#include <compare>
#include <iostream>
 
int main()
{
    double foo = -0.0;
    double bar = 0.0;
 
    auto res = foo <=> bar;
 
    if (res < 0)
        std::cout << "-0 is less than 0";
    else if (res > 0)
        std::cout << "-0 is greater than 0";
    else if (res == 0)
        std::cout << "-0 and 0 are equal";
    else
        std::cout << "-0 and 0 are unordered";
}
```
## std::endian判断大小端

```cpp
#include <bit>
#include <iostream>
 
int main()
{
    if constexpr (std::endian::native == std::endian::big)
        std::cout << "big-endian\n";
    else if constexpr (std::endian::native == std::endian::little)
        std::cout << "little-endian\n";
    else
        std::cout << "mixed-endian\n";
}
```


## std::remove_cvref

去除cv和引用

```cpp
#include <type_traits>
 
int main()
{
    static_assert(std::is_same_v<std::remove_cvref_t<int>, int>);
    static_assert(std::is_same_v<std::remove_cvref_t<int&>, int>);
    static_assert(std::is_same_v<std::remove_cvref_t<int&&>, int>);
    static_assert(std::is_same_v<std::remove_cvref_t<const int&>, int>);
    static_assert(std::is_same_v<std::remove_cvref_t<const int[2]>, int[2]>);
    static_assert(std::is_same_v<std::remove_cvref_t<const int(&)[2]>, int[2]>);
    static_assert(std::is_same_v<std::remove_cvref_t<int(int)>, int(int)>);
}
```

## bind_front

和std::bind是一个系列的方法，bind_front可以绑定前n个参数而不用敲placeholder。

```cpp
#include <functional>
#include <iostream>

int main()
{
    auto calc=[](int a, int b, int c) { return a+b-c;};
    
    auto aa = std::bind_front(calc, 1,2);
    std::cout << aa (3)<<"\n";
    auto bb = std::bind_front(calc, 1,2,3);
    std::cout << bb ()<<"\n";
    auto cc=std::bind(calc, 1,std::placeholders::_2,std::placeholders::_1);
    std::cout<<cc(3,2)<<"\n";   
    auto dd=std::bind(calc, std::placeholders::_1,std::placeholders::_2,3);
    std::cout<<dd(1,2); 
}
```

## std::atomic_ref

原子引用

在下面的例子中，最终将打印100

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

int do_count(int value)
{
   std::atomic<int> counter { value };

   std::vector<std::thread> threads;
   for (int i = 0; i < 10; ++i)
   {
      threads.emplace_back([&counter]() {
         for (int i = 0; i < 10; ++i)
         {
            ++counter;
            {
               using namespace std::chrono_literals;
               std::this_thread::sleep_for(50ms);
            }
         }
      });
   }

   for (auto& t : threads) t.join();

   return counter;
}

int main()
{
   int result = do_count(0);
   std::cout << result << '\n'; // prints 100
}
```

std::atomic并作用于引用不生效， 下面的例子将打印0。

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

void do_count_ref(int& value)
{
   std::atomic<int> counter{ value };

   std::vector<std::thread> threads;
   for (int i = 0; i < 10; ++i)
   {
      threads.emplace_back([&counter]() {
         for (int i = 0; i < 10; ++i)
         {
            ++counter;
            {
               using namespace std::chrono_literals;
               std::this_thread::sleep_for(50ms);
            }
         }
         });
   }

   for (auto& t : threads) t.join();
}

int main()
{
   int value = 0;
   do_count_ref(value);
   std::cout << value << '\n'; // prints 0
}
```

使用atimic_ref进行修改，可以打印100。

```cpp
#include <atomic>
#include <thread>
#include <vector>
#include <iostream>

void do_count_ref(int& value)
{
   std::atomic_ref<int> counter{ value };

   std::vector<std::thread> threads;
   for (int i = 0; i < 10; ++i)
   {
      threads.emplace_back([&counter]() {
         for (int i = 0; i < 10; ++i)
         {
            ++counter;
            {
               using namespace std::chrono_literals;
               std::this_thread::sleep_for(50ms);
            }
         }
         });
   }

   for (auto& t : threads) t.join();
}

int main()
{
   int value = 0;
   do_count_ref(value);
   std::cout << value << '\n'; // prints 0
}
```


## ```std::map<Key,T,Compare,Allocator>::contains```

map新增contains方法，在此之前使用的是find或者count。

```cpp
#include <iostream>
#include <map>
 
int main()
{
    std::map<int,char> example = {{1,'a'},{2,'b'}};
 
    for(int x: {2, 5}) {
        if(example.contains(x)) {
            std::cout << x << ": Found\n";
        } else {
            std::cout << x << ": Not found\n";
        }
    }
}
```
## std::barrier

线程屏障

```cpp
#include <barrier>
#include <iostream>
#include <string>
#include <thread>
#include <vector>
 
int main()
{
    const auto workers = { "Anil", "Busara", "Carl" };
 
    auto on_completion = []() noexcept
    {
        // locking not needed here
        static auto phase = "... done\n" "Cleaning up...\n";
        std::cout << phase;
        phase = "... done\n";
    };
 
    std::barrier sync_point(std::ssize(workers), on_completion);
 
    auto work = [&](std::string name)
    {
        std::string product = "  " + name + " worked\n";
        std::cout << product;  // ok, op<< call is atomic
        sync_point.arrive_and_wait();
 
        product = "  " + name + " cleaned\n";
        std::cout << product;
        sync_point.arrive_and_wait();
    };
 
    std::cout << "Starting...\n";
    std::vector<std::jthread> threads;
    threads.reserve(std::size(workers));
    for (auto const& worker : workers)
        threads.emplace_back(work, worker);
}
```

## std::latch锁存器

latch = single-use barrier.

```cpp

#include <functional>
#include <iostream>
#include <latch>
#include <string>
#include <thread>
 
int main() {
    struct job {
        const std::string name;
        std::string product{"not worked"};
        std::thread action{};
    } jobs[] = {{"annika"}, {"buru"}, {"chuck"}};
    
    std::latch work_done{std::size(jobs)};
    std::latch start_clean_up{1};
    
    auto work = [&](job& my_job) {
        my_job.product = my_job.name + " worked";
        work_done.count_down();
        start_clean_up.wait();
        my_job.product = my_job.name + " cleaned";
    };
    
    std::cout << "Work starting... ";
    for (auto& job : jobs) {
        job.action = std::thread{work, std::ref(job)};
    }
    work_done.wait();
    std::cout << "done:\n";
    for (auto const& job : jobs) {
        std::cout << "  " << job.product << '\n';
    }
    
    std::cout << "Workers cleaning up... ";
    start_clean_up.count_down();
    for (auto& job : jobs) {
        job.action.join();
    }
    std::cout << "done:\n";
    for (auto const& job : jobs) {
        std::cout << "  " << job.product << '\n';
    }
}
```

## std::counting_semaphore

计数信号量 

```cpp
#include <chrono>
#include <iostream>
#include <semaphore>
#include <thread>
 
// global binary semaphore instances
// object counts are set to zero
// objects are in non-signaled state
std::binary_semaphore
    smphSignalMainToThread{0},
    smphSignalThreadToMain{0};
 
void ThreadProc()
{
    // wait for a signal from the main proc
    // by attempting to decrement the semaphore
    smphSignalMainToThread.acquire();
 
    // this call blocks until the semaphore's count
    // is increased from the main proc
 
    std::cout << "[thread] Got the signal\n"; // response message
 
    // wait for 3 seconds to imitate some work
    // being done by the thread
    using namespace std::literals;
    std::this_thread::sleep_for(3s);
 
    std::cout << "[thread] Send the signal\n"; // message
 
    // signal the main proc back
    smphSignalThreadToMain.release();
}
 
int main()
{
    // create some worker thread
    std::thread thrWorker(ThreadProc);
 
    std::cout << "[main] Send the signal\n"; // message
 
    // signal the worker thread to start working
    // by increasing the semaphore's count
    smphSignalMainToThread.release();
 
    // wait until the worker thread is done doing the work
    // by attempting to decrement the semaphore's count
    smphSignalThreadToMain.acquire();
 
    std::cout << "[main] Got the signal\n"; // response message
    thrWorker.join();
}
```


## string::starts_with / ends_with

字符串开头/结尾

```cpp
#include <iostream>
#include <string>
#include <string_view>
 
template<typename PrefixType>
void test_prefix_print(const std::string& str, PrefixType prefix)
{
    std::cout << '\'' << str << "' starts with '" << prefix << "': "
              << str.starts_with(prefix) << '\n';
}
 
int main()
{
    std::boolalpha(std::cout);
    auto helloWorld = std::string("hello world");
 
    test_prefix_print(helloWorld, std::string_view("hello"));
 
    test_prefix_print(helloWorld, std::string_view("goodbye"));
 
    test_prefix_print(helloWorld, 'h');
 
    test_prefix_print(helloWorld, 'x');
}
```

## std::size

size的common方法

```cpp
#include <iostream>
#include <vector>
 
int main()
{
    std::vector<int> v{3, 1, 4};
    std::cout << std::size(v) << '\n';
 
    int a[]{-5, 10, 15};
    std::cout << std::size(a) << '\n';
 
    // since C++20 the signed size (ssize) is available
    auto i = std::ssize(v);
    for (--i; i != -1; --i)
        std::cout << v[i] << (i ? ' ' : '\n');
    std::cout << "i = " << i << '\n';
}
```


## std::is_bounded_array_v和std::is_unbounded_array

```cpp
#include <iostream>
#include <type_traits>
 
#define OUT(...) std::cout << #__VA_ARGS__ << " : " << __VA_ARGS__ << '\n'
 
class A {};
 
int main()
{
    std::cout << std::boolalpha;
    OUT(std::is_bounded_array_v<A>);
    OUT(std::is_bounded_array_v<A[]>);
    OUT(std::is_bounded_array_v<A[3]>);
    OUT(std::is_bounded_array_v<float>);
    OUT(std::is_bounded_array_v<int>);
    OUT(std::is_bounded_array_v<int[]>);
    OUT(std::is_bounded_array_v<int[3]>);
}
```

```cpp
#include <iostream>
#include <type_traits>
 
#define OUT(...) std::cout << #__VA_ARGS__ << " : " << __VA_ARGS__ << '\n'
 
class A {};
 
int main()
{
    std::cout << std::boolalpha;
    OUT( std::is_unbounded_array_v<A> );
    OUT( std::is_unbounded_array_v<A[]> );
    OUT( std::is_unbounded_array_v<A[3]> );
    OUT( std::is_unbounded_array_v<float> );
    OUT( std::is_unbounded_array_v<int> );
    OUT( std::is_unbounded_array_v<int[]> );
    OUT( std::is_unbounded_array_v<int[3]> );
}
```

## std::erase_if

按照条件erase数据

```cpp
#include <iostream>
#include <numeric>
#include <string_view>
#include <vector>
 
void print_container(std::string_view comment, const std::vector<char>& c)
{
    std::cout << comment << "{ ";
    for (auto x : c)
        std::cout << x << ' ';
    std::cout << "}\n";
}
 
int main()
{
    std::vector<char> cnt(10);
    std::iota(cnt.begin(), cnt.end(), '0');
    print_container("Initially, cnt = ", cnt);
 
    std::erase(cnt, '3');
    print_container("After erase '3', cnt = ", cnt);
 
    auto erased = std::erase_if(cnt, [](char x) { return (x - '0') % 2 == 0; });
    print_container("After erase all even numbers, cnt = ", cnt);
    std::cout << "Erased even numbers: " << erased << '\n';
}
```

对比之前的remove_if和erase

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

bool isEven(int n) // 是否是偶数
{
    return n % 2 == 0;
}

int main()
{
    std::vector<int> vecTest;
    for (int i = 0; i < 10; ++i)
        vecTest.push_back(i);

    for (int i = 0; i < vecTest.size(); ++i)
        std::cout << vecTest[i] << " ";
    std::cout << std::endl;

    // 移动元素
    std::vector<int>::iterator itor = std::remove_if(vecTest.begin(), vecTest.end(), isEven);

    // 查看移动后的变化
    for (int i = 0; i < vecTest.size(); ++i)
        std::cout << vecTest[i] << " ";
    std::cout << std::endl;

    // 删除元素
    vecTest.erase(itor, vecTest.end());

    for (int i = 0; i < vecTest.size(); ++i)
        std::cout << vecTest[i] << " ";

    return 0;
}

```


## Mathematical constants

c++20新增了一些数学常量

```cpp
#include <numbers>
#include <iostream>

int main() {
    std::cout << std::numbers::log2e_v<double> << std::endl;
}
```

## std::midpoint
```cpp
#include <cstdint>
#include <iostream>
#include <limits>
#include <numeric>
 
int main()
{
    std::uint32_t a = std::numeric_limits<std::uint32_t>::max();
    std::uint32_t b = std::numeric_limits<std::uint32_t>::max() - 2;
 
    std::cout << "a: " << a << '\n'
              << "b: " << b << '\n'
              << "Incorrect (overflow and wrapping): " << (a + b) / 2 << '\n'
              << "Correct: " << std::midpoint(a, b) << "\n\n";
 
    auto on_pointers = [](int i, int j)
    {
        char const* text = "0123456789";
        char const* p = text + i;
        char const* q = text + j;
        std::cout << "std::midpoint('" << *p << "', '" << *q << "'): '"
                  << *std::midpoint(p, q) << "'\n";
    };
 
    on_pointers(2, 4);
    on_pointers(2, 5);
    on_pointers(5, 2);
    on_pointers(2, 6);
}
```

## std::lerp

线性计算

a+t(b-a)

```cpp
#include <cassert>
#include <cmath>
#include <iostream>
 
float naive_lerp(float a, float b, float t)
{
    return a + t * (b - a);
}
 
int main()
{
    std::cout << std::boolalpha;
 
    const float a = 1e8f, b = 1.0f;
    const float midpoint = std::lerp(a, b, 0.5f);
 
    std::cout << "a = " << a << ", " << "b = " << b << '\n'
              << "midpoint = " << midpoint << '\n';
 
    std::cout << "std::lerp is exact: "
              << (a == std::lerp(a, b, 0.0f)) << ' '
              << (b == std::lerp(a, b, 1.0f)) << '\n';
 
    std::cout << "naive_lerp is exact: "
              << (a == naive_lerp(a, b, 0.0f)) << ' '
              << (b == naive_lerp(a, b, 1.0f)) << '\n';
 
    std::cout << "std::lerp(a, b, 1.0f) = " << std::lerp(a, b, 1.0f) << '\n'
              << "naive_lerp(a, b, 1.0f) = " << naive_lerp(a, b, 1.0f) << '\n';
 
    assert(not std::isnan(std::lerp(a, b, INFINITY))); // lerp here can be -inf
 
    std::cout << "Extrapolation demo, given std::lerp(5, 10, t):\n";
    for (auto t{-2.0}; t <= 2.0; t += 0.5)
        std::cout << std::lerp(5.0, 10.0, t) << ' ';
    std::cout << '\n';
}
```