---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 06 不自动生成的函数，就明确拒绝

在item-5中提到了，c++会为我们所定义的类创建一些默认的方法。大多数时候，这可以让我们少敲一些键盘，让我们避免得腱鞘炎。然而有的时候我们却不需要某些自动创建的方法，这个时候我们就需要显式的拒绝。

## 分析

本文阐述了两种方法，在更新的c++标准中，还拥有=delete这样的声明方法，可以在effective modern c++中进行了解。

### 方法1:将成员函数声明为private并不予实现

下面是一个例子，这个例子如果进行赋值编译将不会通过。

```cpp
class HomeForSale
{
public:
	HomeForSale() {}

private:
	HomeForSale(const HomeForSale&);
	HomeForSale& operator=(const HomeForSale&);
};

int main()
{
    HomeForSale h1;
    HomeForSale h2 = h1;
}
```

### 方法2：继承Uncopyable

```cpp
class Uncopyable
{
protected:
	Uncopyable() {}
	~Uncopyable() {}

private:
	Uncopyable(const Uncopyable&);
	Uncopyable& operator=(const Uncopyable&);
};

class HomeForSale2 : private Uncopyable
{
public:
	HomeForSale2() {}
};

int main()
{
    HomeForSale2 h1;
    HomeForSale2 h2 = h1;
}
```

## 总结
- 某些场景，我们不愿意让编译器自动生成一些函数，可以将成员函数声明为private并不予实现。另外使用Uncopyable这样的base class也是一种方法。
- 在更新的c++标准中，可以使用```= delete```。