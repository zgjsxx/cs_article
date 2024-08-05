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
  - [类和对象](#类和对象)
    - [什么是RTTI](#什么是rtti)
  - [STL](#stl)
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




## 参考

https://zhuanlan.zhihu.com/p/629336564(含答案)