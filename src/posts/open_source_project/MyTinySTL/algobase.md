---
category: 
- C++
tag:
- C++
- MyTinySTL
---


# algobase

## 分析

### unchecked_copy

unchecked_copy有两个版本，一个接受平凡的对象类型的参数，其他的类型则进入normal版本。

**1.normal版本**

```cpp
template <class InputIter, class OutputIter>
OutputIter 
unchecked_copy(InputIter first, InputIter last, OutputIter result)
{
    return unchecked_copy_cat(first, last, result, iterator_category(first));
}
```

**2.平凡类型**

由于平凡数据类型没有自定义的拷贝构造函数，因此直接可以使用memmove直接进行内存拷贝。

这里使用```std::is_trivially_copy_assignable<Up>::value```去判断类型U的拷贝构造函数是否是平凡的。

```cpp
template <class Tp, class Up>
typename std::enable_if<
  std::is_same<typename std::remove_const<Tp>::type, Up>::value &&
  std::is_trivially_copy_assignable<Up>::value,
  Up*>::type
unchecked_copy(Tp* first, Tp* last, Up* result)
{
    const auto n = static_cast<size_t>(last - first);
    if (n != 0)
        std::memmove(result, first, n * sizeof(Up));
    return result + n;
}
```

### lexicographical_compare(字典序比较)

**字典序**是指按照单词首字母顺序在字典中进行排序的方法。

该方法有三个版本。第一个版本和第二个版本是比较通用的版本，区别在于第二个版本可以传入自定义的比较函数。第三个版本是一个针对const unsigned char*的特化版本。

```cpp
template <class InputIter1, class InputIter2>
bool lexicographical_compare(InputIter1 first1, InputIter1 last1,
                             InputIter2 first2, InputIter2 last2)

template <class InputIter1, class InputIter2, class Compred>
bool lexicographical_compare(InputIter1 first1, InputIter1 last1,
                             InputIter2 first2, InputIter2 last2, Compred comp)

bool lexicographical_compare(const unsigned char* first1,
                             const unsigned char* last1,
                             const unsigned char* first2,
                             const unsigned char* last2)
```


### equal

equal方法有两个办法，区别在于第二个版本可以传入自定义的比较函数。

```cpp
template <class InputIter1, class InputIter2>
bool equal(InputIter1 first1, InputIter1 last1, InputIter2 first2)

template <class InputIter1, class InputIter2, class Compared>
bool equal(InputIter1 first1, InputIter1 last1, InputIter2 first2, Compared comp)
```