---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 36 绝不重新定义继承而来的non-virtual函数

该条款比较简单，只需记住就可以。该条款和item33是相辅相成的。

## 分析

如下所示，如果在D内重新定义mf， 那么D就将基类中的mf给隐藏了。该条款是不建议这样做的，因为public继承是is-a的关系，D的对象也是一种B的对象，其mf方法里应该相同。

```cpp
class B
{
public:
	void mf()
	{
	}
};

class D : public B
{
public:
	// hides B::mf() - Item33
	void mf()
	{
	}
};
```

## 总结

- 绝对不要重新定义继承而来的non-virtual函数。
