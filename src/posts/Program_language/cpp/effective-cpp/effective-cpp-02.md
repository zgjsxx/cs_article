---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 02-尽量以 const，enum，inline 替换 #define

题干中使用了**尽量**二字，说明```#define```并非一无是处，只不过```#define```对开发者使用上要求较高，用不好的话出现问题，查错调试的成本较大。

这里主要从两个角度阐述如何替代define：
- 如何替代define定义常量？
- 如何替代define定义宏函数？

## 如何替代define定义常量

对于```#define```定义一个常量ASPECT_RATIO，

```cpp
#define ASPECT_RATIO 1.653
```

我们可以用const常量进行替代。 对于更新的c++标准，这里可能就是**constexpr**。

```cpp
const double AspectRatio = 1.35;
```

另外如果该常量是一个限定作用域的常量， 那么可以用static const 或者 enum进行替代。

```cpp
class GamePlayer1
{
private:
	static const int NumTurns = 5;		// constance declaration
	int scores[NumTurns];				// use of constant
};


class GamePlayer2
{
private:
	// The enum "hack" makes NumTurns symbolic name for 5
	enum { NumTurns = 5 };
	int scores[NumTurns];		// fine
};

```

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


对于```#define```定义宏函数， 我们可以用inline函数进行替代，当然加上模板是更加的选择，它让我们可以接受更多类型的参数，实现编译器多态。
```cpp
template<typename T>
inline void CallWithMax(const T& a, const T& b){
    f(a>b ? a:b);
}
```

## 总结
- 对于#define定义常量的功能，我们尽量以const或者enums进行替换。
- 对于#define实现的宏函数的功能，我们最好用inline进行替换。