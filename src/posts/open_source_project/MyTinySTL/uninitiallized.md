---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# uninitialized


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