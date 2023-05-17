---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 51 编写new和delete时需固守常规

## 分析

**new 0 bytes**

C++ 规定，即使客户要求 0 bytes， operator new 也得返回一个合法指针。如下面 non-member operator new 伪代码：

```cpp
void* operator new(std::size_t size) throw(std::bad_alloc) {
      using namespace std;
      if (size == 0) {
        size = 1;
      }
      while (true) {
        尝试分配 size bytes;
        if (分配成功) {
          return (一个指针，指向分配得来的内存)；
        }
        // 分配失败；找出目前的 new-handling 函数
        new_handler globalHandler = set_new_handler(0);
        set_new_handler(globalHandler);

        if (globalHandler)
          (*globalHandler)();
        else
          throw std::bad_alloc();
      }
    }

```
这里的技术是将 0 bytes 申请量视为 1 byte 申请。

**继承体系operator new**

operator new 成员函数会被 derived classes 继承。

写出定制型内存管理器的一个最常见理由是为了针对某特定 class 的对象分配行为提供最优化，却不是为了该 class 的任何 derived classes.

针对 class Q 而设计的 operator new， 其行为很典型地只为大小刚好为 sizeof(Q) 的对象而设计。而一旦被继承下去，很可能 base class 的operator new 被调用以分配 derived class 对象。

解决办法就是：将“内存申请量错误”的调用行为改为标准 operator new
```cpp
void* Base::operator new(std::size_t size) throw(std::bad_alloc) {
    if(size != sizeof(Base)) { // 如果大小错误，
        return ::operator new(size); // 令标准的 operator new 处理
    }
  ... // 否则在这里处理
}
```
这里C++ 会裁定所有非附属（独立式) 对象必须有非零大小，因此 sizeof(Base) 无论如何不能为0，如果 size 为0，这份申请会被转交到 ```::operator new``` 手上，后者有责任以某种合理方式对待这份申请。

因此，不能在 ```Base::operator new[]``` 内假设 array 的每个元素对象的大小是 ```sizeof(Base)```，意味着不能假设 array 的元素对象的个数是（bytes 申请数）/ sizeof(Base)

此外，传递给 ```operator new[]``` 的 size_t 参数，其值有可能比“将被填以对象”的内存数量更多，动态分配的arrays 可能包含额外空间用来存放元素个数。

**delete null指针**

C++ 保证"删除 null 指针永远安全"，必须保证这项实现。

non-member 版本

下面是 non-member operator delete 伪代码：

```cpp
void operator delete(void * rawMemory) throw()
{
    if(rawMemory == 0) return; // 如果被删除的指针是 null 指针，那就什么都不做
  现在，归还 rawMemory 所指的内存。
}
```

member版本
```cpp
class Base {
     public:
      static void* operator new(std::size_t size) throw(std::bad_alloc);
      static void operator delete(void* rawMemory, std::size_t size) throw();
    };

void Base::operator delete(void* rawMemory, std::size_t size) throw() {
  if (rawMemory == 0) {  // 检查 null 指针
    return;
  }
  if (size != sizeof(Base)) {     // 如果大小错误，
    ::operator delete(rawMemory); // 令标准版 operator delete 处理此申请
    return;
  }
  现在归还 rawMemory 所指的内存
  return;
}
```
如果被删除的derived class 来自于某个 base class，而base class 欠缺 virtual 析构函数，那么 C++ 传给 operator delete 的 size_t 数值可能不正确， operator delete 可能无法正确运作。

这就是为什么 “base class 需要拥有 virtual 析构函数”的原因。

## 总结

- operator new应该内含一个无穷循环，并在其中尝试分配内存，如果它无法满足内存需求，就应该调用new-handler。它也应该有能力处理0 bytes申请。Class专属版本则还应该处理"比正确大小更大的(错误)申请"。
- operator delete应该在收到null指针时不做任何事。Class专属版本则还应该处理"比正确大小更大的(错误)申请"。

