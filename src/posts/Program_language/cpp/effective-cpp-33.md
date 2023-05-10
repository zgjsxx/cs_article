---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 33 避免遮掩继承而来的名称

本节主要分析了在继承中，如果在Derived类中有和Base类中相同名称的方法，那么将遮掩Base类中的方法。

## 分析

下面这个例子中，```Derived::mf1``` 函数遮掩了```Base::mf1```和```Base::mf1(int)```, ```Derived::mf3``` 函数遮掩了```Base::mf3```和```Base::mf3(double)```。

```cpp
class Base
{
public:
	virtual void mf1() = 0;
	virtual void mf1(int) {}
	virtual void mf2() {}

	void mf3();
	void mf3(double);

private:
	int x;
};

class Derived : public Base
{
public:
	virtual void mf1() {}
	void mf3() {}
	void mf4(){};
};
int main()
{
	int x{0};
	Derived d;
	d.mf1();//调用Derived::mf1
	// d.mf1(x);//错误， Derived::mf1遮掩了Base::mf1
	d.mf2();//调用Base::mf2
	d.mf3();//调用Derived::mf3
	// d.mf3(x);//错误，因为Derived::mf3遮掩了Base::mf3
	d.mf4();//调用Derived::mf4
}
```

解决办法很简单， 可以使用using让被遮掩的函数重见天日：

```cpp
class Base
{
public:
	virtual void mf1() = 0;
	virtual void mf1(int) {}
	virtual void mf2() {}

	void mf3(){};
	void mf3(double){};

private:
	int x;
};

class Derived : public Base
{
public:
	using Base::mf1;
	using Base::mf3;
	virtual void mf1() {}
	void mf3() {}
	void mf4(){};
};
int main()
{
	int x{0};
	double y{0};
	Derived d;
	d.mf1();//调用Derived::mf1
	d.mf1(x);//重见天日
	d.mf2();//调用Base::mf2
	d.mf3();//调用Derived::mf3
	d.mf3(y);//重见天日
	d.mf4();//调用Derived::mf4
}
```

另外如果并不想让Base类所有被遮掩的函数都重见天日，仅仅想使用某一个方法，就可以使用foward函数（转交函数）。

```cpp
class Base
{
public:
	virtual void mf1() = 0;
	virtual void mf1(int i) {}
};

class Derived : private Base
{
public:
	virtual void mf1()
	{
		// forwarding function.
		// implicitly inline
		Base::mf1(30);
	}
};

int main()
{
	int x{0};
	double y{0};
	Derived d;
	d.mf1();//调用Derived::mf1
}
```

## 总结

- derived classes内的名称会遮掩base classes内的名称。在public继承下从来没有人希望如此。
- 为了让被遮掩的名称再见天日，可使用using声明式或转交函数（forward function）。


