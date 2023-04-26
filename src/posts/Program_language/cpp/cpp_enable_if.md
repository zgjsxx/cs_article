# enable_if


C++11中引入了std::enable_if函数，函数原型如下:

```cpp
template< bool B, class T = void >
struct enable_if;
```
可能的函数实现:

```cpp
template<bool B, class T = void>
struct enable_if {};
  
template<class T>
struct enable_if<true, T> { typedef T type; };
```
由上可知，只有当第一个模板参数为true时，enable_if会包含一个type=T的公有成员，否则没有该公有成员。

头文件:

```cpp
#include <type_traits>
```