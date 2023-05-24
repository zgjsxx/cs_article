---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# vector

vector是STL中使用最为广泛的容器之一，vector的动态内存的管理功能给我们写程序带来了很大的便利性。本节就通过分析MyTinySTL中关于vector的源码了解其实现原理。

## 分析

### vector数据部分的定义

下面是vector这个模板类数据部分的定义。可以看到public部分都是一些类型定义， 例如迭代器类型，const迭代器类型，reverse迭代器类型， const reverse迭代器类型等等。

private部分比较简单，就是三个**原始指针**类型的迭代器。

```cpp
template <class T>
class vector
{
    static_assert(!std::is_same<bool, T>::value, "vector<bool> is abandoned in mystl");
public:
    // vector 的嵌套型别定义
    typedef mystl::allocator<T>                      allocator_type;
    typedef mystl::allocator<T>                      data_allocator;

    typedef typename allocator_type::value_type      value_type;
    typedef typename allocator_type::pointer         pointer;
    typedef typename allocator_type::const_pointer   const_pointer;
    typedef typename allocator_type::reference       reference;
    typedef typename allocator_type::const_reference const_reference;
    typedef typename allocator_type::size_type       size_type;
    typedef typename allocator_type::difference_type difference_type;

    typedef value_type*                              iterator;
    typedef const value_type*                        const_iterator;
    typedef mystl::reverse_iterator<iterator>        reverse_iterator;
    typedef mystl::reverse_iterator<const_iterator>  const_reverse_iterator;

private:
    iterator begin_;  // 表示目前使用空间的头部
    iterator end_;    // 表示目前使用空间的尾部
    iterator cap_;    // 表示目前储存空间的尾部
}；
```

如果我们的模板参数T为int，vector数据部分就如下所示：

```cpp
class vector
{
public：
    typedef int*  iterator;
private:
    int* begin_;
    int* end_;
    int* cap_;
}
```

如果我们的模板参数为一个类，比如Widget，vector数据部分就如下所示：

```cpp
class Widget;
class vector
{
public：
    typedef Widget*  iterator;
private:
    Widget* begin_;
    Widget* end_;
    Widget* cap_;
}
```

### vector() noexcept

```vector() noexcept```是一个默认的构造函数，并承若不抛出异常。
其内部调用了try_init方法进行初始化。



### try_init

try_init是对内存进行初始化的方法，如果初始化失败，就将rollback，将所有指针置0。下面是try_init的源码。

```cpp
template <class T>
void vector<T>::try_init() noexcept
{
    try
    {
        begin_ = data_allocator::allocate(16);
        end_ = begin_;
        cap_ = begin_ + 16;
    }
    catch (...)
    {
        begin_ = nullptr;
        end_ = nullptr;
        cap_ = nullptr;
    }
}
```

其中调用了```data_allocator::allocate```去分配内存，默认大小是16一个T类型的大小。

```data_allocator::allocate```的实现也很简单，直接调用```::operator new```去申请16个T类型的内存大小。注意这里并不会调用构造函数，它仅仅是分配了内存空间。

```cpp
template <class T>
T* allocator<T>::allocate(size_type n)
{
  if (n == 0)
    return nullptr;
  return static_cast<T*>(::operator new(n * sizeof(T)));
}
```


### push_back

push_back是vector中一个非常重要的方法。应重点了解。包括其与emplace_back的区别也是十分重要，在很多大厂的面试题中非常高频的出现。

下面是push_back的源码。

```cpp
template <class T>
void vector<T>::push_back(const value_type& value)
{
    if (end_ != cap_)
    {
        data_allocator::construct(mystl::address_of(*end_), value);
        ++end_;
    }
    else
    {
        reallocate_insert(end_, value);
    }
}
```

代码主要分为两个分支，第一个分支代表不需要扩容， 第二个分支代表需要扩容。

在第一个分支中，首先判断end_是否抵达了cap_的边界处，如果没有抵达边界，可以继续在尾部构建。这里调用了```data_allocator::construct```方法进行构建。

这里的construct实际上内部使用了placement new方法将对象构建在指定的内存上，并且是调用了复制构造函数进行的构建。

```cpp
template <class Ty1, class Ty2>
void construct(Ty1* ptr, const Ty2& value)
{
  ::new ((void*)ptr) Ty1(value);
}
```

这里需要说的是作者使用了```mystl::address_of```用于获取对象地址，然而该实现可能是不正确的。因为如果重载了```operator&```方法后，上述输出就可能有问题。 如果使用```std::addressof```可以解决。

```cpp
template <class Tp>
constexpr Tp* address_of(Tp& value) noexcept
{
    return &value;
}
```
