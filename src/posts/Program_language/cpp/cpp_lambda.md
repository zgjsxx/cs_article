---
category: 
- C++
---


# c++中的lambda表达式

## 简介

在c++11中引入了Lambda表达式，利用Lambda表达式可以方便的定义和创建匿名函数。

为什么需要匿名函数这种语法呢？我个人觉得主要有以下一些原因：
- 程序员起名字是个麻烦事，有时候有的函数只在有限的地方调用，希望不通过名字调用。
- 避免命名冲突(当然避免命名冲突有很多种方法)
- 丰富c++11的语法类型，就像写作文的同义词一样，同样的事情可以有不同的实现方式，本身就可以丰富代码的多样性。

so， 下面就看看Lambda表达式具体的写法吧。

## 声明Lambda表达式

Lambda表达式完整的声明格式如下：

```cpp
[capture list] (params list) mutable exception-> return type { function body }
```
各项具体含义如下:

- capture list：捕获外部变量列表
- params list：形参列表
- mutable指示符：用来说用是否可以修改捕获的变量
- exception：异常设定
- return type：返回类型
- function body：函数体


## 捕获外部变量

### 值捕获

```cpp
#include <iostream>
int main()
{
    int a = 111;
    auto f = [a] { std::cout << a << std::endl; }; 
    a = 222;
    f();
}
```
执行结果：
```txt
111
```

## 参考文献
https://www.cnblogs.com/DswCnblog/p/5629165.html