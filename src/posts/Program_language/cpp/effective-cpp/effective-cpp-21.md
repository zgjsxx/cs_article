---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 21  必须返回对象时， 别妄想返回其reference

本节主要讨论，函数的返回值如果需要返回引用时需要注意的点。下面将通过例子详细分析。

## 分析

我们有一个Ratinoal的类， 我们现在想要得到两个Ratinoal类的对象相乘的结果。

于是一个新手程序员写出了下面的代码。其返回了一个指向栈上的对象的引用。这个一个非常错误的实现，当```operator*```函数执行完毕之后， result对象就被析构了，这个时候还返回了该对象的引用。

```cpp
	//Bad code #1
	friend const Rational& operator*(const Rational& lhs, const Rational& rhs)
	{
		Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
		return result;
	}
``` 

新手程序员于是改进了一下， 他在对上new了对象，便避免了函数执行完毕之后对象被析构的问题。

```cpp
	//Bad code #2
	friend const Rational& operator*(const Rational& lhs, const Rational& rhs)
	{
		Rational* result = new Rational(lhs.n * rhs.n, lhs.d * rhs.d);
		return *result;
	}
```
这个实现是有进步的，但仍然还是有不足之处。 问题在于这样的实现需要用户去管理内存， 返回的对象需要去delete。
但是如果是一个连等的形式，那么就无法避免内存泄漏的问题。(y*z)返回的隐藏的对象就无法被删除。

```cpp
Rational w, x, y, z;
w = x * y * z;
```


新手程序员于是又想到了static变量。写出来下面的实现。该实现就更加错误了。

```cpp
	//Bad code #3
	friend const Rational& operator*(const Rational& lhs, const Rational& rhs)
	{
		static Rational result;
        result = ...
		return result;
	}
```

试想我们有下面的表达式， 那么无论a,b,c,d的值是多少， if(expr)表达式中， expr永远等于true。

```cpp
Rational a, b, c, d;
if(a * b == (c * d))
```

讲述了三个错误的实现后，下面讲解正确的实现。也很简单， 干脆直接返回值。 这意味着可能会多出一次构造和析构。但是编译器有返回值优化，这个多余的构造和析构可以被优化掉。

```cpp
class Rational
{
public:
	Rational(int numerator = 0, int denominator = 1) :
	  n(numerator), d(denominator)
	{
	}

	const Rational operator*(const Rational& rhs)
	{
		Rational result(n * rhs.n, d * rhs.d);
		return result;
	}
private:
	int n, d;

	friend inline const Rational operator*(const Rational& lhs, const Rational& rhs)
	{
		Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
		return result;
	}

	//bool operator==(const Rational& lhs, const Rational& rhs)
	friend bool operator==(const Rational& lhs, const Rational& rhs)
	{
		return (lhs.n == rhs.n && lhs.d == rhs.d);
	} 
};
```

于是我们得出了结论， 该返回值的时候就返回值，不要怕！

## 总结
- 绝对不要返回pointer或者reference指向一个local stack对象，或者返回reference指向一个heap-allocated对象，或返回pointer或reference指向一个local static对象而有可能同时需要多个这样的对象。条款4已经为单线程环境中合理返回reference指向一个local static对象提供了一份设计实例。
  