---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 18 让接口容易被正确使用， 不易被误用

在本节中作者建议大家在写代码的时候要提供的接口需要拥有正确性和易用性。 写代码时你可能根据第一感觉就写出了一个接口，这个时候你可能需要再思考思考这个接口是否好用， 是否可能被误用。作者这里用了一些例子来说明如此写出好的接口。 实际工作中， 开发出好的接口远比本节讲的要复杂的多。 个人的理解就是你可以根据第一感觉写出接口， 但是建议再思考思考这样是不是最好的。 如果你的同事抱怨你的接口不好用， 这个时候你就更应该重新思考你的接口。

## 分析

作者这里给了一个例子，设计了如下的一个日期的类。 乍一看好像没有啥问题， 哈哈。其实实际工作中大部分人都是这么干的。

```cpp
class Date{
public：
    Date(int month, int day, int year);
}
```

如果遇到比较粗心的程序员， 他可能这样调用：

```cpp
Date d(30, 3, 1995)
```

这个时候编译器不会有任何报错。这个错误将会一直到运行时才能发现。很多时候需要到QA才能报出问题。

倘若这时候我们为年月日定义出类型， 并且在构造函数中使用该类型， 这样上面的使用错误将会在编译期就报出。

因此**恰当地引入新类型**对预防"接口被误用"有很好的效果。

```cpp
struct Day
{
explicit Day(int d) : val(d) {}
int val;
};

struct Month
{
explicit Month(int m) : val(m) {}
int val;
};

struct Year
{
explicit Year(int y) : val(y) {}
int val;
};


class Date
{
 public:
	Date(const Month& m, const Day& d, const Year& y) :
	   month(m.val), day(d.val), year(y.val)
	{
	}

private:
	int month, day, year;
};
```

## 总结
- 好的接口很容易被正确使用，不容易被误用。你应该在你的所有接口中努力达成这些性质。
- "促进正确使用"的办法包括接口的一致性，以及与内置类型的行为兼容。
- "阻止误用"的办法包括建立新类型、限制类型上的操作，束缚对象值，以及消除客户的资源管理责任。
- tr1::shared_ptr支持定制型删除器。这可防范DLL问题，可被用来自动解除互斥锁。(新标准是std::shared_ptr)
  