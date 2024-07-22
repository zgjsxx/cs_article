---
category: 
- 面经
tag:
- c++面经
---


# c++面经

## c++基础

### ++i和i++哪个效率更高？

对于**内建数据类型**，效率没有区别。

对于**自定义的数据类型**， 前缀式(++i)可以返回对象的引用，而后缀式(i++)必须返回对象的值，存在复制开销。因此++i效率更高。


### c++中const的作用

- 1.用于定义常量(注意修饰指针时的含义)
- 2.用于修饰函数形参
```cpp
void func(const A& a);
```
- 3.const修饰函数返回值
- 4.const修饰类的成员函数
```cpp
int getValue(void) const;
```

### 如何禁用拷贝构造函数

- 如果你的编译器支持 C++11，直接使用 delete

- 可以把拷贝构造函数和赋值操作符声明成private同时不提供实现。

- 可以通过一个基类来封装第二步，因为默认生成的拷贝构造函数会自动调用基类的拷贝构造函数，如果基类的拷贝构造函数是private，那么它无法访问，也就无法正常生成拷贝构造函数


## 类和对象

**什么是RTTI**

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