---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 46 需要类型转换时请为模板定义非成员函数

本节是在模板中出现所有参数都需要隐式类型转换时的要点，也是friend关键字的非常规的用法，了解即可，使用到的概率并不大，因为平常我们都不建议进行隐式转换。

## 分析

看下面的例子，```oneHalf * 2```，我们希望将一个int类型的参数隐式转化成一个```Rational<int>```的类型。当```operator*```没有friend修饰时是不能通过编译的。

```cpp
template<typename T>
class Rational
{
public:
	Rational(const T& numerator = 0, const T& denominator = 1) : n(numerator), d(denominator)
	{
	}

	const T numerator() const { return n; }
	const T denominator() const { return d; }

	friend const Rational operator*(const Rational& lhs, const Rational& rhs)
	{
		return Rational(lhs.numerator() * rhs.numerator(), lhs.denominator() * rhs.denominator());
	}

private:
	T n, d;
};

int main()
{
	Rational<int> oneHalf(1, 2);
	Rational<int> result = oneHalf * 2;

	return 0;
}
```

本文讲解的就是这样一个点，平常不太常用。

## 总结

- 当我们编写一个class template，而它所提供之"与此template相关的"函数支持"所有参数之隐式类型转换"时，请将那些函数定义为"class template内部的friend函数"。


