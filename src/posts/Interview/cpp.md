---
category: 
- 面经
tag:
- c++面经
---

- [c++面经](#c面经)
  - [c++基础](#c基础)
    - [const关键字的作用](#const关键字的作用)
    - [请实现一个strcpy方法](#请实现一个strcpy方法)
    - [内存堆栈对比，分别有什么特点？它们的分配效率如何？](#内存堆栈对比分别有什么特点它们的分配效率如何)
    - [++i和i++哪个效率更高？](#i和i哪个效率更高)
    - [如何禁用拷贝构造函数](#如何禁用拷贝构造函数)
    - [std::future和std::promise的作用](#stdfuture和stdpromise的作用)
  - [类和对象](#类和对象)
    - [什么是RTTI](#什么是rtti)
  - [STL](#stl)
    - [map和unordered\_map的区别? 各自使用场景是什么？](#map和unordered_map的区别-各自使用场景是什么)
  - [参考](#参考)

# c++面经

## c++基础

### const关键字的作用

const 关键字在C++中用于定义常量。它是一个非常重要的关键字，主要用于声明不可修改的变量、指针、引用和成员函数。使用 const 可以帮助防止意外修改数据，提高代码的安全性和可维护性。

**const 的主要用法和作用**

**1.常量变量:**

使用 const 声明的变量在初始化后不可被修改。这对于定义不可改变的值（如数学常量）特别有用。
```cpp
const int MAX_SIZE = 100;、
// MAX_SIZE 不能被修改
```

**2.常量指针**:

**指向常量的指针**: const 用于指针声明中，表示指针指向的数据不可修改。

```cpp
const int* ptr;
// *ptr 不能被修改，但 ptr 可以指向不同的地址
```

**常量的指针**: const 也可以放在指针前面，表示指针本身是常量，不可修改。

```cpp
int* const ptr;
// ptr 不能被修改，但 *ptr 可以被修改
```

**常量指针和常量数据**: 可以将 const 关键字应用于指针和指向的数据，表示指针和数据都不可修改。

```cpp
const int* const ptr;
// ptr 和 *ptr 都不能被修改
```

**3.常量参数**:

使用 const 可以保证函数参数在函数内部不会被修改，提高函数的安全性和可读性。

```cpp
void processData(const std::string& data) {
    // data 不能被修改
}
```

**4.常量成员函数:**

在类中，常量成员函数是不会修改类成员的函数，声明为 const 的成员函数可以保证不会改变对象的状态。

```cpp
class MyClass {
public:
    void display() const {
        // 不能修改类的成员变量
    }
private:
    int value;
};
```

**5.常量返回值:**

函数返回 const 值，表示返回的值不能被修改。这通常用于防止修改返回对象的成员。

```cpp
const std::string& getName() const {
    return name;
}
```

**使用 const 的好处**
- 提高安全性: const 关键字可以防止数据被意外或错误地修改，从而提高代码的稳定性。
- 增强可读性: 明确表明某些数据或对象不应该被修改，使代码更易于理解和维护。
- 优化编译: 编译器可以利用 const 信息进行优化，因为它知道某些数据在代码运行期间不会变化。

**总结**

const 是C++中的一个重要关键字，广泛用于定义常量、常量指针、常量引用、常量成员函数等。它不仅有助于防止数据的意外修改，还提高了代码的安全性和可读性。在设计类和函数接口时合理使用 const 可以帮助创建更可靠和维护友好的代码。
### 请实现一个strcpy方法

```cpp
#include <stdio.h>

// 实现 strcpy 函数
char* my_strcpy(char* destination, const char* source) {
    char* ptr = destination;

    // 复制源字符串中的每一个字符到目标字符串
    while (*source != '\0') {
        *ptr++ = *source++;
    }

    // 确保目标字符串以 '\0' 结尾
    *ptr = '\0';

    return destination;
}

int main() {
    char source[] = "Hello, World!";
    char destination[50];  // 目标字符串的大小应足够容纳源字符串

    // 使用自定义的 strcpy 函数
    my_strcpy(destination, source);

    // 输出复制后的目标字符串
    printf("Copied string: %s\n", destination);

    return 0;
}
```

这里函数需要返回```char*```，主要是因为：
- 链式调用（Chaining）：

由于strcpy返回destination，可以在一条语句中进行多个操作。例如：

```c
char destination[50];
printf("%s\n", strcpy(destination, "Hello, World!"));
```

- 一致的函数接口设计：

在C标准库中，许多字符串处理函数（例如strcat、strncpy等）都会返回目标字符串指针。这种设计提供了一种一致的接口，使得函数的行为和使用方式更具一致性和可预测性。

- 增强代码的灵活性：

返回目标字符串指针可以增强代码的灵活性，使调用者可以在需要时使用返回值，或忽略它。例如：

```c
char destination[50];
char *result = strcpy(destination, "Hello, World!");
printf("Copied string: %s\n", result);
```

### 内存堆栈对比，分别有什么特点？它们的分配效率如何？

**栈（Stack）**

特点：

- 内存分配方式：栈是一个连续的内存区域，内存分配和释放遵循后进先出（LIFO，Last In First Out）原则。
- 管理方式：由编译器自动管理，无需手动控制。函数调用时，栈帧会自动分配，函数返回时，栈帧会自动释放。
- 生命周期：变量的生命周期与其所在的作用域一致，当作用域结束时，变量的内存会自动释放。
- 内存大小：栈的大小通常较小，并且在程序启动时确定。大多数系统的栈大小限制在几MB至几十MB之间。

分配效率：

- 高效率：由于栈是由编译器自动管理的，内存分配和释放速度非常快，通常只需增加或减少栈指针即可完成。
- 低开销：栈上的内存分配不需要复杂的内存管理算法，开销极低。

**堆（Heap）**

特点：

- 内存分配方式：堆是一个不连续的内存区域，通过动态内存分配函数（如malloc、calloc、realloc、free）进行分配和释放。
- 管理方式：需要程序员手动管理内存分配和释放，容易发生内存泄漏（忘记释放内存）或内存碎片（频繁分配和释放导致）。
- 生命周期：变量的生命周期由程序员控制，分配的内存在手动释放前一直有效。
- 内存大小：堆的大小通常较大，可以根据系统的物理内存和操作系统的限制进行扩展。

分配效率：

- 较低效率：堆内存的分配和释放涉及复杂的算法和数据结构（如自由链表、二叉树、位图等），因此速度较慢。
- 较高开销：由于需要维护内存管理的数据结构，分配和释放内存的操作开销较高。

总结
- 栈：
  - 优点：分配和释放速度快、开销低、自动管理内存、不容易发生内存泄漏。
  - 缺点：内存空间有限、灵活性差，不能用于需要大量内存或动态调整大小的情况。
- 堆：
  - 优点：内存空间大、灵活性高，可以分配任意大小的内存块，适合需要动态内存分配的场景。
  - 缺点：分配和释放速度慢、开销高、需要手动管理内存、容易发生内存泄漏和碎片化。

### ++i和i++哪个效率更高？

对于**内建数据类型**，效率没有区别。

对于**自定义的数据类型**， 前缀式(++i)可以返回对象的引用，而后缀式(i++)必须返回对象的值，存在复制开销。因此++i效率更高。


### 如何禁用拷贝构造函数

- 如果你的编译器支持 C++11，直接使用 delete

- 可以把拷贝构造函数和赋值操作符声明成private同时不提供实现。

- 可以通过一个基类来封装第二步，因为默认生成的拷贝构造函数会自动调用基类的拷贝构造函数，如果基类的拷贝构造函数是private，那么它无法访问，也就无法正常生成拷贝构造函数


### std::future和std::promise的作用

**1.std::promise 和 std::future 的设计原理**

**std::promise**

- std::promise 是一个模板类，表示一个值的“承诺”（promise），它允许我们在未来某个时刻设置一个值或传递一个异常。
- promise 对象内部维护了一个共享状态，这个状态可以包含一个值或异常。
- std::promise 的主要操作是 set_value（设置值）和 set_exception（设置异常）。设置完成后，这个共享状态会被标记为“就绪”。

**std::future**
- std::future 是与 std::promise 配对的对象，用于检索 promise 设置的值或异常。
- future 对象也持有相同的共享状态。通过调用 get() 方法，future 可以访问该状态中的值或捕获的异常。
- 如果 future 的 get() 在共享状态未就绪时调用，它会阻塞调用线程，直到状态就绪。

**2. promise 和 future 的基本原理**

1.共享状态:

- promise 和 future 之间共享同一个状态。promise 是生产者，可以设置共享状态的值或异常；future 是消费者，可以等待并获取这个状态的值或异常。

2.一次性:

- promise 的 set_value 或 set_exception 只能调用一次；相应地，future 的 get() 也只能调用一次。调用 get() 后，future 不再持有共享状态。
- 如果多次调用 get() 会抛出 std::future_error 异常。

3.线程安全:

- promise 和 future 的实现保证了它们在不同线程之间操作时的线程安全性。这使得它们非常适合多线程环境下的同步操作。

**3. 典型使用场景**

单一任务的异步结果获取
- 场景: 你有一个耗时操作需要在后台线程中完成，但你希望在主线程中等待其结果。
- 解决方案: 创建一个 std::promise，启动线程执行耗时任务，并在任务完成时通过 promise.set_value() 设置结果。主线程通过 std::future 的 get() 方法获取结果。

```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

std::thread t([&p]() {
    // 执行耗时操作
    int result = some_long_running_task();
    p.set_value(result);
});

int result = f.get();  // 阻塞直到 result 就绪
t.join();
```

异常传递
- 场景: 如果后台任务在执行过程中发生异常，你希望在主线程中处理这个异常。
- 解决方案: 在后台线程中捕获异常并通过 promise.set_exception() 传递给主线程。主线程在调用 future.get() 时会捕获到这个异常。

```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

std::thread t([&p]() {
    try {
        int result = some_potentially_throwing_task();
        p.set_value(result);
    } catch (...) {
        p.set_exception(std::current_exception());
    }
});

try {
    int result = f.get();
} catch (const std::exception& e) {
    std::cerr << "Exception: " << e.what() << std::endl;
}

t.join();
```

**4.std::async 和 std::shared_future**
std::async

- 作用: std::async 是一个高层的工具，用于启动异步任务，并返回一个 std::future。它可以在后台线程或当前线程中执行任务，取决于传递的标志（std::launch::async 或 std::launch::deferred）。
- 内部实现: std::async 内部会创建一个 promise，并启动任务。在任务完成时，将结果通过 promise 设置，从而使得返回的 future 可以获取这个结果。

```
std::future<int> f = std::async(std::launch::async, [] {
    return some_long_running_task();
});

int result = f.get();  // 阻塞直到结果就绪
```

std::shared_future
- 作用: std::future 是一次性的，不能被多次调用 get()。为了实现结果的多次访问，C++ 提供了 std::shared_future，它允许多个线程共享同一个 future 的结果。
- 用法: 可以通过 future.share() 方法将 std::future 转换为 std::shared_future。

```cpp
std::promise<int> p;
std::shared_future<int> sf = p.get_future().share();

std::thread t1([&sf]() { int result = sf.get(); });
std::thread t2([&sf]() { int result = sf.get(); });

p.set_value(10);

t1.join();
t2.join();
```
**5. promise 和 future 的高级用法**

链式任务执行
- 场景: 有时一个任务的输出需要作为另一个任务的输入，这种情况下可以通过 future 的链式调用来实现任务的依赖管理。
```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

auto chained_future = f.then([](std::future<int> result) {
    int val = result.get();
    return val * 2;
});

p.set_value(21);
int final_result = chained_future.get();  // final_result = 42
```

并行任务处理
场景: 你有多个独立的任务，希望它们同时执行，并在所有任务完成后获取结果。
解决方案: 可以启动多个线程，每个线程处理一个任务并使用 promise 来设置结果。使用多个 future 来等待所有任务的完成。
```cpp
std::vector<std::future<int>> futures;
for (int i = 0; i < 10; ++i) {
    futures.push_back(std::async(std::launch::async, [i]() {
        return i * i;
    }));
}

for (auto& f : futures) {
    std::cout << "Result: " << f.get() << std::endl;
}
```

小结
- std::promise: 用于在多线程环境中设置一个值或异常，并将其传递给 future。
- std::future: 用于等待和获取 promise 设置的值或异常。get() 方法在值就绪之前阻塞调用线程。
- std::async: 提供了一个简单的接口来启动异步任务，并返回一个 future。
- std::shared_future: 允许多个线程共享同一个 future 的结果。

通过合理地使用 promise 和 future，可以有效地管理多线程任务的结果传递和异常处理，从而实现复杂的异步编程模式。
## 类和对象

### 什么是RTTI

RTTI（Run-Time Type Information，运行时类型信息）是一种在程序运行时提供对象类型信息的机制。它允许在运行时检查对象的类型，通常用于以下几个方面：

- 类型识别：确定一个对象是否属于特定的类，或者确定对象的实际类型。
- 动态转换：安全地将基类指针或引用转换为派生类指针或引用。
- 调试和日志记录：在调试和日志记录过程中获取对象的类型信息。

在C++中，RTTI主要通过以下两个操作符实现：

- typeid：用于获取对象的类型信息。例如，typeid(object)会返回一个表示object类型的std::type_info对象。

- dynamic_cast：用于将基类指针或引用安全地转换为派生类指针或引用。只有在转换是合法的情况下，dynamic_cast才会成功，否则会返回nullptr（对于指针）或抛出std::bad_cast异常（对于引用）。
- 
使用RTTI需要在编译时启用支持RTTI的选项，因为某些编译器可能默认禁用RTTI以优化性能和减小代码大小。RTTI机制在C++的多态性（polymorphism）中非常有用，特别是在处理继承层次结构复杂的情况下。

以下是一个简单的示例，展示了RTTI的使用：

```cpp
#include <iostream>
#include <typeinfo>

class Base {
public:
    virtual ~Base() {}
};

class Derived : public Base {};

int main() {
    Base* b = new Derived;
    
    // 使用typeid操作符
    std::cout << "Type of b: " << typeid(*b).name() << std::endl;

    // 使用dynamic_cast进行安全的向下转换
    Derived* d = dynamic_cast<Derived*>(b);
    if (d) {
        std::cout << "b is of type Derived." << std::endl;
    } else {
        std::cout << "b is not of type Derived." << std::endl;
    }

    delete b;
    return 0;
}
```
在这个示例中，```typeid```用于获取对象的类型信息，而```dynamic_cast```用于安全地将基类指针转换为派生类指针。

## STL

### map和unordered_map的区别? 各自使用场景是什么？

**1.底层实现**

- map: 是基于红黑树（一种自平衡二叉搜索树）实现的。这使得 map 中的元素是按照键的顺序自动排序的。
- unordered_map: 是基于哈希表实现的，元素的存储顺序是无序的，取决于哈希函数的结果。

**2. 时间复杂度**
- map: 由于是平衡二叉搜索树，插入、删除和查找操作的平均时间复杂度为 O(log n)。
- unordered_map: 由于是基于哈希表实现的，插入、删除和查找操作的平均时间复杂度为 O(1)。但在最坏情况下，可能会退化到 O(n)（例如，当哈希冲突严重时）。
**3. 元素的存储顺序**
- map: 元素按键的顺序存储和遍历。
- unordered_map: 元素没有特定的顺序，遍历顺序是不可预测的。
**4. 内存消耗**
- map: 由于红黑树结构的原因，通常需要额外的内存来维持树的平衡。
- unordered_map: 由于使用哈希表，其内存使用量主要取决于负载因子和哈希冲突的处理方式。
**5. 使用场景**

- map:
  - 当需要对键值进行排序或按顺序遍历时，选择 map。
  - 例如，需要按字母顺序存储和检索学生姓名及其成绩的情况。
  - 适合需要较稳定的时间复杂度和有序数据访问的场景。
- unordered_map:
  - 当主要关注查找速度而不关心键的顺序时，选择 unordered_map。
  - 例如，用于统计单词频率或存储哈希表以快速查找的情况。
  - 适合数据量大且对性能要求高的场景，特别是需要高效的查找、插入和删除操作时。

**总结**

- 使用 map 当你需要有序的数据或者需要比较稳定的性能时。
- 使用 unordered_map 当你更关注查找、插入和删除操作的性能，并且不需要数据顺序时。

## 参考

https://zhuanlan.zhihu.com/p/629336564(含答案)