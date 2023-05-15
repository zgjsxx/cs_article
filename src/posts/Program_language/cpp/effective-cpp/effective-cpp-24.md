---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 24 若所有参数皆需要类型转换，请为此采用non-member函数

本节所讲解的点是一个比较细节的点，本文所focus的点和隐式转换强相关，实际工作中并不会经常用到，因为我们并不推荐使用隐式类型转换。因此，本章节直接通过例子理解作者所要表达的观点即可。

## 分析

现在有一个Rational类，这个类重载了```operator*```运算符。Rational的构造函数并不是explicit的，它允许隐式转化。

因此，下面的表达式中，前三个表达式将可以成功通过编译， 然而最后一个将不能成功通过编译。因为没有一个
```operator*(int ，Rational)```的运算符。

```cpp
result = oneFourth * oneEighth;		// fine
result = result * oneEighth;		// fine

result = oneFourth * 2;				// fine
result = 2 * oneFourth;				// hooray, it works!
```

下面是一个完整的例子。

```cpp
class Rational
{
public:
	Rational(int numerator = 0, int denominator = 1) :
	  n(numerator), d(denominator)
	{
	}

	int numerator() const { return n; }
	int denominator() const { return d; }

	const Rational operator*(const Rational& rhs) const
	{
		return Rational(n * rhs.numerator(), d * rhs.denominator());
	}

private:
	int n, d;
};

int main()
{
	Rational oneEighth(1, 8);
	Rational oneFourth(1, 4);

	Rational result;
	result = oneFourth * oneEighth;		// fine
	result = result * oneEighth;		// fine

	result = oneFourth * 2;				// fine
	result = 2 * oneFourth;				// hooray, it works!

	return 0;
}
```

为了让最后一个case通过。我们可以这样修改，我们在全局返回为增加一个```operator*(const Rational& lhs, const Rational& rhs)```的操作符， 这个操作符第一个参数可以接受隐式转换的入参， 于是```result = 2 * oneFourth;```就可以通过编译。

```cpp
class Rational
{
public:
	Rational(int numerator = 0, int denominator = 1) :
	  n(numerator), d(denominator)
	{
	}

	int numerator() const { return n; }
	int denominator() const { return d; }

private:
	int n, d;
};


const Rational operator*(const Rational& lhs, const Rational& rhs)
{
	return Rational(lhs.numerator() * rhs.numerator(), lhs.denominator() * rhs.denominator());
}
```

## 总结
- 如果你需要为某个函数的所有参数(包括被this指针所指的那个隐喻参数)进行类型转换，那么这个函数必须是个non-member。