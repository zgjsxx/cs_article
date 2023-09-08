---
category: 
- C++
---

# c++智能指针之shared_ptr

## std::shared_ptr简介

## shared_ptr自定义删除器

### 函数指针

```cpp
#include <iostream>
#include <memory>

void deleter(int* pNum) {
    std::cout << "function pointor deleter" << std::endl;
    delete pNum;
}

int main(int argc, const char* argv[]) {
    std::shared_ptr<int> spNum1;
    {
        std::shared_ptr<int> spNum2(new int,  deleter);
        spNum1 = spNum2;
    }

    std::cout << sizeof(spNum1) << std::endl;
    return 0;
}
```

### lambda函数

```cpp
#include <iostream>
#include <memory>

int main(int argc, const char* argv[]) {
    auto deleter = [](int* pNum) {
        std::cout << "lambda deleter" << std::endl;
        delete pNum;
    };
    
    std::shared_ptr<int> spNum1;
    {
        std::shared_ptr<int> spNum2(new int,  deleter);
        spNum1 = spNum2;
    }

    std::cout << sizeof(spNum1) << std::endl;
    return 0;
}
```

### 仿函数

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

    std::shared_ptr<int> spNum1;
    {
        std::shared_ptr<int> spNum2(new int,  MyDelete());
        spNum1 = spNum2;
    }

    std::cout << sizeof(spNum1) << std::endl;
    return 0;
}
```

## shared_from_this

shared_ptr使用时的一个需要注意的点是，其于this指针配合使用时，可能会创建多个control block。

例如下面例子中的案例(1)。 this指针属于裸指针，因此当返回```std::shared_ptr<X>(this)```又创建了第二个control block。因此案例(1)会出现double free的问题。

```cpp
#include <memory>
#include <cassert>

class X
{
public:

    std::shared_ptr<X> f()
    {
        return std::shared_ptr<X>(this);
    }    
};

class XX: public std::enable_shared_from_this<XX>
{
public:

    std::shared_ptr<XX> f()
    {
        return shared_from_this();
    }
};

class XXX: public std::enable_shared_from_this<XXX>
{
public:

    std::shared_ptr<XXX> f()
    {
        return std::shared_ptr<XXX>(this);
    }
};

int main()
{
    //（1）
    std::shared_ptr<X> p(new X);
    std::shared_ptr<X> q = p->f();

    // (2)
    // std::shared_ptr<XX> pp(new XX);
    // std::shared_ptr<XX> qq = pp->f();

    //（3）
    // std::shared_ptr<XXX> pp(new XXX);
    // std::shared_ptr<XXX> qq = pp->f();
}
```

shared_ptr已有API来解决这个问题，即```std::enable_shared_from_this```。```std::enable_shared_from_this```是一个基类模板。它的模板参数总是某个继承自它的类。因此XX总是继承```std::enable_shared_from_this<XX>```。这样的设计还有个标准名字，尽管该名字和```std::enable_shared_from_this```一样怪异。这个标准名字就是奇异递归模板模式（The Curiously Recurring Template Pattern（CRTP）。


## 总结
- std::shared_ptr为共享所有权的资源提供了一种垃圾回收的方式。
- std::shared_ptr也支持自定义删除器，但是其删除器并不会作为模板的参数类型，其被创建在control block中。因此其删除器的类型并不会影响shared_ptr的大小。
- 从原始指针创建shared_ptr时，会为其创建一个control block， 当使用一个原始指针创建多个shared_ptr时就会产生double free的问题。因此，尽量避免从原始指针创建shared_ptr。
- 如果你的类的内部需要为this指针返回shared_ptr，那么需要让你的类继承于std::enable_shared_from_this，并使用shared_from_this()进行返回。