---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 44 与参数无关的代码抽离templates

## 分析

如果模板中有类型无关的参数，那一定得小心，很容易就会出现模板膨胀的问题。

这里有一个矩阵类，并且有一个求逆的方法，这里我们假设这个invert方法有100行代码，为了便于下面进行计算。
```cpp
template<typename T, std::size_t n>
class SquareMatrix
{
public:
	void invert()
	{
		//这里有100行代码
	}
};
```

下面我们生成几个对象，看看这个模板类生成了多少代码。

```cpp
SquareMatrix<int, 1> a1;
a.invert() //100行invert代码

SquareMatrix<int, 2> a2;
a.invert() //100行invert代码

SquareMatrix<int, 3> a3;
a.invert() //100行invert代码
```

这里这个invert函数就生成了300行，如果我们继续写下去，那将是非常可怕的膨胀。

这个非类型模板参数n导致了上述问题，我们可以尝试将n换为class成员变量。

这里我们将计算矩阵的逆的方法抽象到基类中来，invert函数拥有一个入参matrixSize，代表矩阵的大小。

我们派生出一个模板类SquareMatrix，在其中调用基类的invert方法。
```cpp
template<typename T>
class SquareMatrixBase
{
protected:
	void invert(std::size_t matrixSize)
	{
		//这里有100行
	}
};


template<typename T, std::size_t n>
class SquareMatrix : private SquareMatrixBase<T>
{
private:
	using SquareMatrixBase<T>::invert;

public:
	void invert()
	{
		this->invert(n);
	}
};

```

我们再次进行统计，代码的膨胀将少了很多。是不是很有效！

```cpp
SquareMatrix<int, 1> a1;
a.invert() //1行派生类代码+100行基类invert代码

SquareMatrix<int, 2> a2;
a.invert() //1行派生类代码

SquareMatrix<int, 3> a3;
a.invert() //1行派生类代码
```


再继续往下，求逆所需要的数据放在那里呢？

一种方法就是给invert增加一个入参T*， 但是如果matrix类的内部有n多个类似的函数，就意味这会一次又一次的传递参数，没有必要，于是我们将T*放置到基类中。

```cpp
	void invert(T* t)
	{
		this->invert(n, t);
	}
	void invert2(T*)
	{
		this->invert2(n, t);
	}
	void invert3(T*)
	{
		this->invert2(n, t);
	}
	void invert4(T*)
	{
		this->invert2(n, t);
	}

	void invert5(T*)
	{
		this->invert2(n, t);
	}
```


我们给基类增加一个```T* pData```用于接受数据。
```cpp
template<typename T>
class SquareMatrixBase
{
protected:
	SquareMatrixBase(std::size_t n, T* pMem) : size(n), pData(pMem)
	{
	}

private:
	std::size_t size;
	T* pData;
};


template<typename T, std::size_t n>
class SquareMatrix : private SquareMatrixBase<T>
{
public:
	SquareMatrix() : SquareMatrixBase<T>(n, data)
	{
	}

private:
	T data[n * n];
};
```


## 总结

- 如果因非类型模板参数而造成的代码膨胀，往往可以消除，做法就是以函数参数或class成员变量替换模板参数。(重要)
- 如果因类型模板参数而造成的代码膨胀，往往可降低，做法是让带有完全相同的二进制表述的具体类型共享实现码。
