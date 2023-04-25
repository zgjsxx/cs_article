---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 02-尽量以 const，enum，inline 替换 #define

题干中使用了**尽量**二字，说明#define并非一无是处，只不过#define对开发者使用上要求较高，用不好的话出现问题，查错调试的成本较大。

这里主要从两个角度阐述如何替代define：
- 如何替代define定义常量？
- 如何替代define定义宏函数？

## 如何替代define定义常量



## 如何替代define定义宏函数

#define定义宏函数对开发者要求较高，一不小心就可能带来意想不到的错误。

例如有一个宏函数：
```cpp
#define CALL_MAX(a,b) f((a) > (b) ? (a) : (b))
```
当main函数中调用如下:

cout<<MAX(++a, b)<<endl;              // a被增加两次
cout<<MAX(++a, b+10)<<endl;           // a被累加一次

我们写一个完整的程序：
```cpp
#include <iostream>

#define CALL_MAX(a,b) f((a) > (b) ? (a) : (b))

void f(int a)
{
    std::cout << a << std::endl;
}

int main()
{
    int a = 5, b = 0;
    CALL_MAX(++a, b);
    CALL_MAX(++a, b+10);
}
```

输出为：
```cpp
7
10
```
说明第一次调用，a确实被增加了两次。 这并不是我们所预期的。


对于#define定义宏函数， 我们可以用inline函数进行替代，
```cpp
template<typename T>
inline void CallWithMax(const T& a, const T& b){
    f(a>b ? a:b);
}
```


## 总结
- 对于#define定义常量的功能，我们尽量以const或者enums进行替换。
- 对于#define实现的宏函数的功能，我们最好用inline进行替换。