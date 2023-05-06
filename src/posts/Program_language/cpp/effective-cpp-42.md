---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 42-typename的双重含义

## 1.在用于声明template参数的时候，class和typename的含义是相同的

下面两种声明中，```class```和```typename```的含义是相同的。

```cpp
template<class T> class Widget;                 // uses "class"
template<typename T> class Widget;              // uses "typename"
```
## 2.typename必须作为嵌套从属类型名称的前缀词， 但是有两个例外

在模板函数体中，使用``::``去获取嵌套从属类型时，需要加上```typename```， 例如：
```cpp
template<typename IterT>
void workWithIterator(IterT iter)
{
	typename std::iterator_traits<IterT>::value_type temp(*iter);
}
```

但是有两个例外，不要加```typename```，

**第一个例外**是存在继承时，基类不需要加上```typename```。

**第二个例外**是存在继承时，构造函数成员值初始化时不需要加上```typename```。

例如如下的例子：
```cpp
template<typename T>
class Derived: public Base<T>::Nested
{ 					// base class list: typename not
public:                                 // allowed

  explicit Derived(int x) 
  : Base<T>::Nested(x)                  // base class identifier in mem
  {                                     // init. list: typename not allowed
    typename Base<T>::Nested temp;      // use of nested dependent type
    ...                                 // name not in a base class list or
  }                                     // as a base class identifier in a
  ...                                   // mem. init. list: typename required
};

```

实际上总结起来就是在```typename```只允许在函数体内部出现。


## 总结
- 在用于声明template参数的时候，class和typename的含义是相同的
- typename必须作为嵌套从属类型名称的前缀词, 但是这一原则有两个例外，一个在在继承时，基类不需要加上```typename```， 二是在构造函数成员值初始化时不需要加上```typename```