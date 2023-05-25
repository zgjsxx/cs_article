---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# memory


## 分析

### address_of

该函数的作用是获取value的地址。但是该实现可能并不正确，当Tp类型重载了&运算符时，下面的实现就不能取到真时的地址。

可以考虑使用```std::addressof```解决。

```cpp
// 获取对象地址
template <class Tp>
constexpr Tp* address_of(Tp& value) noexcept
{
  return &value;
}
```