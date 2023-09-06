---
category: 
- C++
---

# c++智能指针之unique_ptr

## std::unique_ptr简介

std::unique_ptr是一种几乎和原始指针一样高效的智能指针，对所管理的指针资源拥有独占权。由C++11标准引入，用于替代C++98中过时的std::auto_ptr智能指针。相比而言，std::unique_ptr的优点有：

- 语义更清晰：std::auto_ptr进行拷贝的时候实际执行的是移动语义，但C++98中并没有定义出移动语义，所以使用的时候可能会违背直觉。而std::unique_ptr利用了C++11中新定义的移动语义，只允许移动操作，禁止拷贝操作，从而让语义更加清晰。
- 允许自定义删除器：由于std::unique_ptr将删除器作为自己的成员变量，所以传入自定义删除器之前需要在模板参数中指定删除器的类型std::unique_ptr<T, D> up(nullptr, deleter)。
- 支持STL容器：在C++98中，容器要求元素必须是可以拷贝的，比如«effective STL»中提到的，对容器中的元素进行std::sort时，会从区间中选一个元素拷贝为主元素（pivot），然后再对所有元素进行分区操作。但是std::auto_ptr的拷贝操作执行的却是移动语义，这样就会造成bug。在C++11中，STL容器是支持移动语义的，std::unique_ptr只提供移动操作删除了拷贝操作，并且移动操作是noexcept的（这一点很重要，因为STL容器有些操作需要保证强异常安全会要求要么用拷贝操作要么用无异常的移动操作）。只要不涉及到拷贝的容器操作，比如fill函数，那么std::unique_ptr作为容器元素是正确的。

其定义在memeoy这个头文件中，unique_ptr为非数组形式和数组形式的内存空间创建了两个模板

```cpp
template<
    class T,
    class Deleter = std::default_delete<T>
> class unique_ptr;//(1)	(since C++11)

template <
    class T,
    class Deleter
> class unique_ptr<T[], Deleter>; //(2)	(since C++11)
```

在unique_ptr类的内部，提供了下列方法：
- release 返回指向的指针，但不会释放内存， 返回后内部的指针指向空
- reset 释放内部指针指向的地址，并释放内存，让内部指向重新指向新的地址
- swap 交换内部指针
- get 获取内部的指针
- get_deleter 获取内部的删除器
- operator bool 判断内部指针是否为空
- operator* 实现和原始指针一样的解引用
- operator-> 实现和原始指针一样的->

## unique_ptr的基本使用

下面是几种容易写出的使用方式，其中(1)和(4)是正确的。因为unique_ptr不支持复制操作。

```cpp
    // 创建一个unique_ptr实例
    unique_ptr<int> pInt(new int(5));//(1)正确
    unique_ptr<int> pInt2(pInt);    // (2)报错
    unique_ptr<int> pInt3 = pInt;   // (3)报错
    unique_ptr<int> pInt2(std::move(pInt));//(4)正确
```

## unique_ptr添加自定义删除器

- 添加函数指针作为删除器

```cpp
#include <iostream>
#include <memory>

int main(int argc, const char* argv[]) {
    auto deleter = [](int* pNum) {
        std::cout << "lambda deleter" << std::endl;
        delete pNum;
    };

    typedef void(*Delete)(int*);
    std::unique_ptr<int, Delete> upNum(new int, deleter);
    std::cout << sizeof(upNum) << std::endl;
    // 输出8+8=16（函数指针类型的大小也为8）

    return 0;
}
```

```cpp
#include <iostream>
#include <memory>

void deleter(int* pNum) {
    std::cout << "function deleter" << std::endl;
    delete pNum;
}

int main(int argc, const char* argv[]) {
    std::unique_ptr<int, decltype(&deleter)> upNum(new int, deleter);

    // 输出8+8=16（函数指针类型的大小也为8）
    std::cout << sizeof(upNum) << std::endl;

    return 0;
}
```

- 添加lamdda函数作为删除器

```cpp
#include <iostream>
#include <memory>

int main(int argc, const char* argv[]) {
    auto deleter = [](int* pNum) {
        std::cout << "lambda deleter" << std::endl;
        delete pNum;
    };
    std::unique_ptr<int, decltype(deleter)> upNum(new int, deleter);

    // 输出8
    std::cout << sizeof(upNum) << std::endl;

    return 0;
}
```

- 添加仿函数作为删除器

```cpp
#include <iostream>
#include <memory>

class MyDelete{
public:
    void operator()(int* num){
        std::cout << "lambda deleter" << std::endl;
        delete num;
    }
};

int main(int argc, const char* argv[]) {
    std::unique_ptr<int, MyDelete> upNum(new int);

    // 这里将输出8
    std::cout << sizeof(upNum) << std::endl;

    return 0;
}
```

这里需要注意的是当仿函数的内部存在一些私有变量时，将会增加unique_ptr的大小。例如这里的MyDelete的内部有一个int类型的state1，那么MyDelete类的大小就是4。此时的unique_ptr的内部就包含了一个8个字节的原始指针，和一个4个字节的MyDelete的实列对象， 由于内存对齐，此时upNum的大小将是16。

因此当使用仿函数作为删除器时，需要考虑仿函数的内部是否包含一些私有变量。

```cpp
#include <iostream>
#include <memory>

class MyDelete{
public:
    void operator()(int* num){
        std::cout << "lambda deleter" << std::endl;
        delete num;
    }
private:
    int state1;
};

int main(int argc, const char* argv[]) {
    std::unique_ptr<int, MyDelete> upNum(new int);

    // 输出16
    std::cout << sizeof(upNum) << std::endl;
    return 0;
}
```

从上面的对比中不难发现，如果使用函数指针作为删除器一定会比增加unique_ptr的尺寸。

如果使用仿函数作为删除器，其内部的变量可能会增加unique_ptr的尺寸。

而没有内部变量的仿函数和没有捕获变量的lambda表达式，其不会增加unique_ptr的大小。

因此在自定义删除器时，可以优先考虑使用lambda表达式的形式。

这里的结论和effective modern c++的第18章的结论是一致的。

>我之前说过，当使用默认删除器时（如delete），你可以合理假设std::unique_ptr对象和原始指针大小相同。当自定义删除器时，情况可能不再如此。函数指针形式的删除器，通常会使std::unique_ptr的从一个字（word）大小增加到两个。对于函数对象形式的删除器来说，变化的大小取决于函数对象中存储的状态多少，无状态函数（stateless function）对象（比如不捕获变量的lambda表达式）对大小没有影响，这意味当自定义删除器可以实现为函数或者lambda时，尽量使用lambda：

## unique_ptr常用使用场景

- 工厂方法
  
```cpp
#include <iostream>
#include <memory>

class Foo {
public:
    void greeting() noexcept {
        std::cout << "hi! i am foo" << std::endl;
    }
};

class Factory {
public:
    std::unique_ptr<Foo> createFoo() {
        return std::unique_ptr<Foo>(new Foo);
    }
};

int main(int argc, const char* argv[]) {
    auto foo = Factory().createFoo();

    // 输出"hi! i am foo"
    foo->greeting();

    return 0;
}

```

- pImpl模式

```cpp
// Foo.h
#pragma once

#include <memory>
#include <string>

class Foo {
public:
    Foo();

    // 需要将~Foo的实现放入Foo.cpp中，避免出现delete imcomplete type错误
    ~Foo();

    // 1.定义了~Foo之后不会自动生成移动函数
    // 2.移动构造函数中因为会生成处理异常的代码，所以需要析构成员变量，也会造成delete imcomplete type问题，所以将实现放入Foo.cpp
    // 3.移动赋值函数中因为会先删除自己指向的Impl对象指针，也会造成delete imcomplete type问题，所以将实现放入Foo.cpp
    Foo(Foo&& rhs) noexcept;
    Foo& operator=(Foo&& rhs) noexcept;

    // 由于unique_ptr不支持复制，所以无法生成默认拷贝函数
    Foo(const Foo& rhs);
    Foo& operator=(const Foo& rhs);

    void setName(std::string name);
    const std::string& getName() const noexcept;

private:
    struct Impl;
    std::unique_ptr<Impl> m_upImpl;
};
```

```cpp
//Foo.cpp
struct Foo::Impl {
    std::string name;
};

Foo::Foo() : m_upImpl(new Impl) {}

Foo::~Foo() = default;

Foo::Foo(Foo&& rhs) noexcept = default;
Foo& Foo::operator=(Foo&& rhs) noexcept = default;

Foo::Foo(const Foo& rhs) : m_upImpl(new Impl) {
    *m_upImpl = *rhs.m_upImpl;
}

Foo& Foo::operator=(const Foo& rhs) {
    *m_upImpl = *rhs.m_upImpl;
    return *this;
}

void Foo::setName(std::string name) {
    m_upImpl->name = name;
}

const std::string& Foo::getName() const noexcept {
    return m_upImpl->name;
}
```

## 尽量使用std::make_unique

使用std::make_unique来创建std::unique_ptr智能指针有以下优点：

- 减少代码重复：从代码std::unique_ptr<Foo> upFoo(new Foo);和auto upFoo = std::make_unique<Foo>();可以得知使用make_unique只需要写一次Foo就可以，更加符合软件工程中的要求。

- 提高异常安全性：当在函数调用中构造智能指针时，由于执行顺序的不确定性，有可能会造成资源泄露，比如对于代码：

```cpp
#include <iostream>
#include <memory>
#include <exception>

bool priority() {
    throw std::exception();

    return true;
}

void func(std::unique_ptr<int> upNum, bool flag) {
    if (flag) {
        std::cout << *upNum << std::endl;
    }
}

int main() {
    func(std::unique_ptr<int>(new int), priority());

    return 0;
}
```

这里调用func函数时，会执行三个步骤

- new int
- std::unique_ptr<int>构造函数
- priority函数

这里唯一可以确定的就是步骤1发生在步骤2之前，但步骤3的次序是不一定的，如果步骤3在步骤1和步骤2中间执行那么就会造成内存泄漏。但是如果使用make_unique就不会出现这个问题。

但是std::make_unique是C++14标准才引入的，所以使用C++11环境的话需要自己实现这个函数：

## 将unique_ptr转为shared_ptr是容易的

```cpp
#include <iostream>
#include <memory>

class Foo {
public:
    void greeting() noexcept {
        std::cout << "hi! i am foo" << std::endl;
    }
};

class Factory {
public:
    std::unique_ptr<Foo> createFoo() {
        return std::unique_ptr<Foo>(new Foo);
    }
};

int main(int argc, const char* argv[]) {
    std::shared_ptr<Foo> foo = Factory().createFoo();//way1

    std::unique_ptr<Foo> uni_foo = Factory().createFoo();
    std::shared_ptr<Foo> shared_foo = std::move(uni_foo);//way2
    return 0;
}
```


## 参考文章

[unique的一种实现](https://blog.csdn.net/m0_57719144/article/details/131068172?share_token=495d0478-93fb-4069-bd0a-b06a2bd034c1)

[C++进阶：智能指针之unique_ptr](https://juejin.cn/post/7099967913594978341)

## 总结
- std::unique_ptr是轻量级、快速的、只可移动（move-only）的管理专有所有权语义资源的智能指针
- 默认情况，资源销毁通过delete实现，但是支持自定义删除器。有状态的删除器和函数指针会增加std::unique_ptr对象的大小
- 将std::unique_ptr转化为std::shared_ptr非常简单