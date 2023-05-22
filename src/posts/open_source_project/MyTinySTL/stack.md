---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# stack


## stack实现概述

下面的代码是stack的类数据部分的定义，其是一个类模板。

```cpp
template <class T, class Container = mystl::deque<T>>
class stack
{
public:
    typedef Container                           container_type;
    // 使用底层容器的型别
    typedef typename Container::value_type      value_type;
    typedef typename Container::size_type       size_type;
    typedef typename Container::reference       reference;
    typedef typename Container::const_reference const_reference;

    static_assert(std::is_same<T, value_type>::value,
                    "the value_type of Container should be same with T");
private:
    container_type c_;  // 用底层容器表现 stack
```