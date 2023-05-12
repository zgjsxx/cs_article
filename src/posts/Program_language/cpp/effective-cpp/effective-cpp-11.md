---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 11 operator= 处理自我赋值

我们知道复制构造函数和赋值运算符的区别是赋值构造函数用于创建一个新的对象，而赋值运算符用于给一个已经存在的对象重新赋值。

因此赋值运算符就可能存在把自己赋值给自己的情况，本节就是专门讨论这个场景的。

## 分析

本文介绍了三种办法来处理这个问题，其实作者后续不仅仅讨论了自我赋值的问题，还讨论了赋值运算符的异常安全问题。

```cpp
Widget& Widget::operator=(const Widget& rhs)
{

	// Identity test.
	if (&rhs == this)
	{
		return *this;
	}

	delete pb;
	pb = new Bitmap(*rhs.pb);

	return *this;
}
```
## 总结
- 确保当对象自我赋值时operator=有良好行为。其中技术包括比较"来源对象"和"目标对象"的地址、精心周到的语句顺序，以及copy-and-swap。
- 确定任何函数做过操作一个以上的对象，而其中多个对象是同一个对象时，其行为仍然正确。
