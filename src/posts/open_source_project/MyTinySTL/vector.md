---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# MyTinySTL-vector容器

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

reallocate_insert的作用是重新分配空间并将元素追加到指定位置pos的后面。push_back中重新分配空间进行尾部插入就是它的一个特例。

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

### resize

resize和reserve是比较容器混淆的两个方法。

reserve只是分配空间，并不创建对象，更改capacity但不改变size，并且只能扩大不能减小。

而resize既可能修改size，也可能修改capacity。

下面是源码部分。

```cpp
template <class T>
void vector<T>::resize(size_type new_size, const value_type& value)
{
    if (new_size < size())
    {
        erase(begin() + new_size, end());
    }
    else
    {
        insert(end(), new_size - size(), value);
    }
}
```

分两种情况，第一种是入参n比目前的vector的尺寸小（end_-begin_），第二种是入参n比目前的vector的尺寸大。

**入参n比目前的vector的尺寸小**

这种情况实际上就是缩小vector的尺寸，将vector的size修改为n， 实际就是释放多余的对象然后前移end_指针。

![resize1](https://github.com/zgjsxx/static-img-repo/raw/main/blog/open_source_project/MyTinySTL/vector/resize1.png)

这个过程使用了erase方法，传入了起始位置begin() + new_size， 和结束的位置end()，将这个区间的对象分别调用了析构函数进行析构，最后将end_位置前移。

**入参n比目前的vector的尺寸大**

这里也需要分两种情况，第一种情况是n比capacity小。第二种情况是n比capacity还要大。

当n比capacity小时，将size扩充为n，capacity不变。

当n比capacity大时，就会进行扩容，capacity增加。

### shrink_to_fit

该函数的作用是缩小vector的尺寸。我们知道vector的容器内部有三个指针，begin_， end_ 和 cap_。 end_到cap_这段区间内的空间其实是没有构建对象的。因此当我们的容器的这部分的内存有些多余的时候就可以考虑将其释放。

在c++11之前， STL中释放容器多余的空间通常使用swap的技巧。（effective STL item17）。在c++11之后开始支持shrink_to_fit方法。下面是shrink_to_fit的源码部分。

```cpp
template <class T>
void vector<T>::shrink_to_fit()
{
    if (end_ < cap_)
    {
        reinsert(size());
    }
}
```

首先对容器的现状做一个分析，如果end_小于cap_，意味着容器可以缩小尺寸。其中调用了reinsert方法，将begin_到end_的对象，移动到新的空间中，并将旧的空间和对象释放掉。


### erase

erase方法的作用是将vector容器```[first，Last)```区间的数据进行删除。下面是其源码部分：

```cpp
template <class T>
typename vector<T>::iterator
vector<T>::erase(const_iterator first, const_iterator last)
{
    MYSTL_DEBUG(first >= begin() && last <= end() && !(last < first));
    const auto n = first - begin();
    iterator r = begin_ + (first - begin());
    data_allocator::destroy(mystl::move(r + (last - first), end_, r), end_);
    end_ = end_ - (last - first);
    return begin_ + n;
}
```

其实现过程分为三步：
- 将[last， end]区间的数据移到first处
- 将剩余空间的对象释放
- 重新设置end_指针

过程如下图所示：

![erase](https://github.com/zgjsxx/static-img-repo/raw/main/blog/open_source_project/MyTinySTL/vector/erase1.png)

### swap
swap函数的作用就是与另一个vector交换内容，实际就是交换了一些指针。

```cpp
template <class T>
void vector<T>::swap(vector<T>& rhs) noexcept
{
  if (this != &rhs)
  {
    mystl::swap(begin_, rhs.begin_);
    mystl::swap(end_, rhs.end_);
    mystl::swap(cap_, rhs.cap_);
  }
}
```


### fill_init

fill_init的作用是vecotr初始化时候调用的方法。

首先是确定容器的大小，首先将入参n和16比较，取二者中的较大者。接着调用init_space方法申请内存空间，最后调用uninitialized_fill_n进行构造对象。

```cpp
template <class T>
void vector<T>::
fill_init(size_type n, const value_type& value)
{
    const size_type init_size = mystl::max(static_cast<size_type>(16), n);
    init_space(n, init_size);
    mystl::uninitialized_fill_n(begin_, n, value);
}
```

### fill_assign

fill_assign方法是vector::assign方法调用的，assign 方法是用来重新设置vector 容器中元素的数量和值。

根据n的值为三种情况:
- 如果n大于现在的vector的capacity，那么需要重新构造一个新的vector，进行置换。
- 如果n比size大，但是小于capacity，那么首先调用fill方法将begin_到end_之间的内存用value填充，将end_开始之后的(n - size())元素初始化为n。
- 如果n小于size，将begin_开始的n个元素赋值为value， 并且将多余的元素erase，并调整相应的指针。

```cpp
template <class T>
void vector<T>::
fill_assign(size_type n, const value_type& value)
{
    if (n > capacity())
    {
        vector tmp(n, value);
        swap(tmp);
    }
    else if (n > size())
    {
        mystl::fill(begin(), end(), value);
        end_ = mystl::uninitialized_fill_n(end_, n - size(), value);
    }
    else
    {
        erase(mystl::fill_n(begin_, n, value), end_);
    }
}
```

### reinsert

该方法在shrink_to_fit函数中被调用，作用是收缩vector的空间。其源码实现如下所示：

```cpp
template <class T>
void vector<T>::reinsert(size_type size)
{
auto new_begin = data_allocator::allocate(size);
try
{
    mystl::uninitialized_move(begin_, end_, new_begin);
}
catch (...)
{
    data_allocator::deallocate(new_begin, size);
    throw;
}
data_allocator::deallocate(begin_, cap_ - begin_);
begin_ = new_begin;
end_ = begin_ + size;
cap_ = begin_ + size;
}
```

首先调用```data_allocator::allocate```申请大小为size的内存空间，将原来的begin_到end_区域的元素移动，移动成功后将原来vector申请的内存空间释放，重新设置相应的begin_， end_， cap_指针。

### operator==

比较两个vector是否相等，首先判断两个vector的尺寸是否相等，其次调用```mystl::equal```比较两个vector中的内容是否相等。

```cpp
template <class T>
bool operator==(const vector<T>& lhs, const vector<T>& rhs)
{
  return lhs.size() == rhs.size() &&
    mystl::equal(lhs.begin(), lhs.end(), rhs.begin());
}
```

### operator<

两个vector比较大小，这里使用了```mystl::lexicographical_compare```字典序列比较算法，详见algobase章节。

```cpp
template <class T>
bool operator<(const vector<T>& lhs, const vector<T>& rhs)
{
    return mystl::lexicographical_compare(lhs.begin(), lhs.end(), rhs.begin(), rhs.end());
}
```