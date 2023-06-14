---
category: 
- C++
tag:
- C++
---


# c++14的新增的小的特性

## std::decay


类型退化：
- 去除const和volatile
- 去除引用
- 数组退化为指针
- 函数退化为指针

如果类型T是一个函数类型，那么从函数到指针的类型转换将被应用，并且T的衰变类型等同于：

```add_pointer<T>::type```

如果类型T是一个数组类型，那么从数组到指针的类型转换将被应用，并且T的衰变类型等同于：

```add_pointer<remove_extent<remove_reference<T>::type>::type>::type```

当左值到右值转换被应用时，T的衰变类型等同于：

```remove_cv<remove_reference<T>::type>::type```

```cpp
#include <iostream>
#include <type_traits>
 
template <typename T, typename U>
struct decay_equiv : 
    std::is_same<typename std::decay<T>::type, U>::type 
{};
 
int main()
{
    std::cout << std::boolalpha
              << decay_equiv<int, int>::value << '\n'
              << decay_equiv<int&, int>::value << '\n'
              << decay_equiv<int&&, int>::value << '\n'
              << decay_equiv<const int&, int>::value << '\n'
              << decay_equiv<const volatile int&, int>::value << '\n'
              << decay_equiv<int[2], int*>::value << '\n'
              << decay_equiv<int(int), int(*)(int)>::value << '\n';
}
```