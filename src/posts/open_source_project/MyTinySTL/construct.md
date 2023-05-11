
---
category: 
- C++
tag:
- C++
- MyTinySTL
---


# construct

## construct

construct有多个重载的模板。

下面这个版本是调用全局的placement new操作符调用无参构造函数构造对象。

```cpp
template <class Ty>
void construct(Ty* ptr)
{
  ::new ((void*)ptr) Ty();
}
```

下面这个版本则是利用完美转发，直接调用Ty的有参的构造函数。构造时也是利用了全局的placement new方法。
```cpp
template <class Ty, class... Args>
void construct(Ty* ptr, Args&&... args)
{
  ::new ((void*)ptr) Ty(mystl::forward<Args>(args)...);
}
```