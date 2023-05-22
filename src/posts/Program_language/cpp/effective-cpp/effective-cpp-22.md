---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 22 将成员变量声明为private

成员变量通常需要声明为private， 这使得我们的类具有更好的封装性。

在讲解之前，我们可以回忆一下三种类型以及对应不同的继承时的行为。

|继承方式|基类public成员|基类protected成员|基类private成员|
|--|--|--|--|
|public继承|public|protected|不可见|
|protected继承|protected|protected|不可见|
|private继承|private|private|不可见|

## 分析

将变量设置为private， 我们可以提供更好的封装性。我们可以控制变量的读写权限。如下所示：

```cpp
class AccessLevels
{
public:
	int getReadOnly() const { return readOnly; }

	int getReadWrite() const { return readWrite; }
	void setReadWrite(int value) { readWrite = value; }

	void setWriteOnly(int value) { writeOnly = value; }

private:
	int noAccess;
	int readOnly;
	int readWrite;
	int writeOnly;
};
```

理解了private所提供的封装性之后，作者又解释了protected和public在封装性这个点上的对比，作者认为protected和public一样，都是不提供封装性的。

假设我们有一个 public 数据成员，随后我们消除了它。有多少代码会被破坏呢？所有使用了它的客户代码，其数量通常大得难以置信。从而 public 数据成员就是完全未封装的。

但是，假设我们有一个 protected 数据成员，随后我们消除了它。现在有多少代码会被破坏呢？所有使用了它的派生类，典型情况下，代码的数量还是大得难以置信。

## 总结
- 切记将成员变量声明为private， 这可赋予客户访问数据的一致性，可细微划分访问控制、允诺约束条件获得保证，并提供class作者以充分的实现弹性。
- protected并不比public更具封装性。