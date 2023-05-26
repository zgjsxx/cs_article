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

push_back有两个版本，第一种入参是左值引用，第二种入参是右值引用。可以看到右值引用的版本仅仅是调用了emplace_back，因此这里不再讲解，可以参考emplace_back章节。这里详细介绍第一个版本。

```cpp
void push_back(const value_type& value);
void push_back(value_type&& value)
{ 
    emplace_back(mystl::move(value)); 
}
```

下面是第一个版本的push_back的源码。

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

如果当前容器已满，那么这个时候就需要进行扩容，才能进行插入，这里调用了```reallocate_insert```实现扩容后的插入。关于扩容机制，参考```reallocate_insert```章节。



### capacity

这里使用了两个指针相减的方式，指针相减的含义是（地址差）/类型大小，因此指针相减正好就是元素的个数。

注意指针相减得到的是一个ptrdiff_t类型的结果，ptrdiff_t是一个有符号的数据类型，因为指针相减可以是复数。

而在capacity计算这里，不会出现begin_比cap_大的场景，因此这里可以将其强转为size_type，实际就是size_t。

```cpp
size_type capacity() const noexcept
{ 
    return static_cast<size_type>(cap_ - begin_); 
}
```

### empty

该函数判断vector内是否存在数据，直接通过begin_和end_的值进行比较得到。

```cpp
bool empty()  const noexcept
{ 
    return begin_ == end_; 
}
```

### reallocate_insert

reallocate_insert的作用是重新分配空间并将元素追加到pos的后面。push_back中重新分配空间进行尾部插入就是它的一个特例。

其源码实现如下所示：

```cpp
    const auto new_size = get_new_cap(1);
    auto new_begin = data_allocator::allocate(new_size);
    auto new_end = new_begin;
    const value_type& value_copy = value;
    try
    {
        new_end = mystl::uninitialized_move(begin_, pos, new_begin);
        data_allocator::construct(mystl::address_of(*new_end), value_copy);
        ++new_end;
        new_end = mystl::uninitialized_move(pos, end_, new_end);
    }
    catch (...)
    {
        data_allocator::deallocate(new_begin, new_size);
        throw;
    }
    destroy_and_recover(begin_, end_, cap_ - begin_);
    begin_ = new_begin;
    end_ = new_end;
    cap_ = new_begin + new_size;
```

首先调用get_new_cap根据一定的算法获取扩容后的容器大小，进而调用```data_allocator::allocate```分配new_size大小的内存空间。接下来将begin_到pos区间内的元素拷贝到新的空间中， 接着在pos的后方按照value进行构造， 最后将pos到end_部分的元素移动过去。如果这中间发生了异常，则将新申请的内存空间进行释放。

接着调用destroy_and_recover将原来的空间的对象释放。这包括了两个步骤，一个步骤是调用对象的析构函数， 第二个步骤是释放内存。

最后，一切步骤确保无误，将begin_，end_和cap_替换为新的空间对应的位置。

函数的内部使用了copy-and-swap的思想来确保了异常安全性(Effective c++ Item29)。


### reserve

reserve的作用是用于预留一部分的内存空间。下面是其实现的内容。

```cpp
template <class T>
void vector<T>::reserve(size_type n)
{
    if (capacity() < n)
    {
        THROW_LENGTH_ERROR_IF(n > max_size(),
                                "n can not larger than max_size() in vector<T>::reserve(n)");
        const auto old_size = size();
        auto tmp = data_allocator::allocate(n);
        mystl::uninitialized_move(begin_, end_, tmp);
        data_allocator::deallocate(begin_, cap_ - begin_);
        begin_ = tmp;
        end_ = tmp + old_size;
        cap_ = begin_ + n;
    }
}
```

如果reserve的大小比之前的capacity相比还要小，那么我们什么都不做处理。

当reserve的大小比之前的capacity还要大时，进入我们的逻辑。

首先如果传入的n比max_size()还要大的话，将抛出```std::length_error```异常。后续我们将使用```data_allocator::allocate```重新申请```n*sizeof(T)```大小的内存空间。然后将调用```uninitialized_move```将旧的数据移动到新申请的内存上。最后调用```data_allocator::deallocate```释放掉旧的内存，并将begin_， end_， cap_重新指向新的内存地址的相应位置。

作者这里的deallocate的第二个参数没有太多意义。

```cpp
data_allocator::deallocate(begin_, cap_ - begin_);
```

作者在allocator.h中的实现，两个重载的版本内部内容是相同的。

```cpp
template <class T>
void allocator<T>::deallocate(T* ptr)
{
    if (ptr == nullptr)
        return;
    ::operator delete(ptr);
}

template <class T>
void allocator<T>::deallocate(T* ptr, size_type /*size*/)
{
    if (ptr == nullptr)
        return;
    ::operator delete(ptr);
}
```