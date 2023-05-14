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

	//Bad code #1
	//friend const Rational& operator*(const Rational& lhs, const Rational& rhs)
	//{
	//	Rational result(lhs.n * rhs.n, lhs.d * rhs.d);
	//	return result;
	//}

	//Bad code #2
	//friend const Rational& operator*(const Rational& lhs, const Rational& rhs)
	//{
	//	Rational* result = new Rational(lhs.n * rhs.n, lhs.d * rhs.d);
	//	return *result;
	//}

	//Bad code #3
	//friend const Rational& operator*(const Rational& lhs, const Rational& rhs)
	//{
	//	static Rational result;
	//	return result;
	//}

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
## 总结
- 绝对不要返回pointer或者reference指向一个local stack对象，或者返回reference指向一个heap-allocated对象，或返回pointer或reference指向一个local static对象而有可能同时需要多个这样的对象。条款4已经为单线程环境中合理返回reference指向一个local static对象提供了一份设计实例。
  