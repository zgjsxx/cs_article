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

本文介绍了三种办法来处理这个问题，其实作者后续不仅仅讨论了自我赋值的问题，还讨论了赋值运算符的**异常安全问题**。

第一种方法比较简单，既然operator=可能存在自我赋值的场景，那么我们便在进入赋值运算符的函数内部首先做一个"证同测试"。如果是同一个对象，就直接返回。

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

第二种方法其实并不是在讨论"证同测试"的方法。而是在讨论异常安全性。 个人认为Scott Mayer的书有这样的特点，它不像是一本教科书，而是像一本杂谈。 可能聊到某个话题的时候，可能也和另一个话题有关系，就也会谈一谈。

我们注意方法一中剩下拷贝的代码。如果```new Bitmap```出现异常，那么原来对象的pb指向的对象就已经被删除了。这是不能忍受的。后面在item-29中专门讨论异常安全性的时候会提到，异常安全性就类似于数据库的"回滚"机制，当操作失败时，需要恢复到执行之前的样子。显然上面的代码在这方面是有问题的。


```cpp
	delete pb;
	pb = new Bitmap(*rhs.pb);

```

修改方法也很简单，即先将原来的pb指针保存起来。只有当new成功了之后，再删除原来的指针指向的对象。

```cpp
Widget& Widget::operator=(const Widget& rhs)
{
	Bitmap* pOrig = pb;
	pb = new Bitmap(*rhs.pb);

	delete pOrig;
	return *this;
}
```

第三种方法其实也是在讨论异常安全性，只不过在代码上更加简洁，其使用了copy-and-swap的思想。首先将Widget对象拷贝给对象temp，接着将temp和当前的对象进行交换。

```cpp
Widget& Widget::operator=(const Widget& rhs)
{
	// Copy constructor: make copy of rhs data.
	Widget temp(rhs);

	swap(const_cast<Widget&>(rhs));
	return *this;
}
```

## 总结
- 确保当对象自我赋值时operator=有良好行为。其中技术包括比较"来源对象"和"目标对象"的地址、精心周到的语句顺序，以及copy-and-swap。
- 确定任何函数做过操作一个以上的对象，而其中多个对象是同一个对象时，其行为仍然正确。
