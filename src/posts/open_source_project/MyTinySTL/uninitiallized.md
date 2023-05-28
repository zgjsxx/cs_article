---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# uninitialized模板

## 分析

### uninitialized_copy

```cpp
template <class InputIter, class ForwardIter>
ForwardIter uninitialized_copy(InputIter first, InputIter last, ForwardIter result)
{
  return mystl::unchecked_uninit_copy(first, last, result, 
                                     std::is_trivially_copy_assignable<
                                     typename iterator_traits<ForwardIter>::
                                     value_type>{});
}
```


### uninitialized_fill_n

uninitialized_fill_n实现调用了unchecked_uninit_fill_n方法。unchecked_uninit_fill_n方法有两个版本， 第一个版本是针对平凡类型的特化版本，第二个版本是针对非平凡类型的版本。非平凡版本在构造数据时需要调用构造函数。平凡类型的unchecked_uninit_fill_n方法内部调用fill_n方法，fill_n方法也分为两个版本，一个是针对char类型的特化版本，内部调用memset，另一个是平凡类型的通用版本，使用赋值运行符进行构造，

uninitialized_fill_n的调用体系如下所示：

![uninitialized_fill_n](https://github.com/zgjsxx/static-img-repo/raw/main/blog/open_source_project/MyTinySTL/uninitialized/uninitiallized_fill_n.png)

```cpp
template <class ForwardIter, class Size, class T>
ForwardIter uninitialized_fill_n(ForwardIter first, Size n, const T& value)
{
  return mystl::unchecked_uninit_fill_n(first, n, value, 
                                        std::is_trivially_copy_assignable<
                                        typename iterator_traits<ForwardIter>::
                                        value_type>{});
}
```