---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# util

util.h主要实现了一些通用的模板方法，例如move， forward， swap等函数， 以及pair等。

## remove_reference

util.h并没有自己实现自己的remove_reference版本，而是直接调用了```std::remove_reference```。这里还是有必要了解其实现的原理。

首先讲解一下remove_reference的作用，其作用是为了去除&的标记。

例如，T&& -> T， T& -> T， T -> T。

这里定义了类模板，并为其创建了两个特化版本。

```cpp
template<typename _Tp>
struct remove_reference
{ typedef _Tp   type; };
 
// 特化版本
template<typename _Tp>
struct remove_reference<_Tp&>
{ typedef _Tp   type; };
 
template<typename _Tp>
struct remove_reference<_Tp&&>
{ typedef _Tp   type; };
```

## move

标准库中有```std::move```,作者这里自己实现了一遍，便于读者理解其原理。

move的作用是:
- 当传递一个左值时，入参arg为一个左值引用，这个时候将强转为右值引用。
- 当传递一个右值时，入参arg为一个右值引用，这个时候仍然强转为右值引用。


```cpp
template <class T>
typename std::remove_reference<T>::type&& move(T&& arg) noexcept
{
  return static_cast<typename std::remove_reference<T>::type&&>(arg);
}
```

最后还需要补充一点：

从函数的形式中看出，```move```最终会返回一个右值引用```T &&```，那么它是左值还是右值呢?

看下面的例子这个：

```cpp
int a = 0;
int &&ref = std::move(a);
```

右值引用ref指向的必须是右值，所以move返回的```T &&```是个右值。而ref本身又是左值。

所以右值引用既可能是左值，又可能是右值吗？ 

确实如此：右值引用既可以是左值也可以是右值，如果有名称则为左值，否则是右值。

作为函数返回值的 && 是右值，直接声明出来的 && 是左值。

因此```std::move```返回的是一个右值引用，但是该右值引用是一个右值。



## forward

```cpp
//转发左值
template <class T>
T&& forward(typename std::remove_reference<T>::type& arg) noexcept
{
    return static_cast<T&&>(arg);
}

//转发右值
template <class T>
T&& forward(typename std::remove_reference<T>::type&& arg) noexcept
{
    static_assert(!std::is_lvalue_reference<T>::value, "bad forward");
    return static_cast<T&&>(arg);
}
```
从搭配情况下来看，应该有下面四种组合：

- 接受左值 -> T为左值引用 -> 转发成左值引用(左值)
- 接受右值 -> T为右值引用 -> 转发成右值引用(右值)
- 接受左值 -> T右值引用 -> 转发成右值引用
- 接受右值 -> T左值引用 -> 转发成左值引用(static_assert)

前两点便是我们所认识的完美转发，搭配万能引用，从而完美转发给调用的函数。(完美转发 = 引用折叠 + 万能引用 + std::forward)
- 接受左值 -> T为左值引用 -> 转发成左值引用(左值)
- 接受右值 -> T为右值引用 -> 转发成右值引用(右值)


关于第三点和第四点，第四点明确拒绝了。为什么第三点却被允许呢？

- 接受左值 -> T右值引用 -> 转发成右值引用
- 接受右值 -> T左值引用 -> 转发成左值引用(static_assert)

实际上第三点和```std::move```的功能是一样的，所以可以被允许。

```cpp
#include <memory>
#include <iostream>

#include <memory>

void func(int&& a)
{
    std::cout << "right value" << std::endl;
}

void func(int& a)
{
    std::cout << "left value" << std::endl;
}

int main()
{
    int i = 1;
    func(std::forward<int&&>(i));//ok print right value a
    // func(std::forward<int&>(7));//fail
}
```

下面看一个完美转发的例子：
```cpp
#include <iostream>
#include <memory>

void PrintV(int &t){
    std::cout<<"lvalue"<<std::endl;
}
void PrintV(int &&t){
    std::cout<<"rvalue"<<std::endl;
}
template<typename T>
void Test(T &&t){
    PrintV(std::forward<T>(t));
}
int main(int argc, const char * argv[]) {
    // insert code here...
    Test(1); // lvalue rvalue rvalue
    int a = 1;
    Test(a);  // lvalue lvalue rvalue
    return 0;
}
```
