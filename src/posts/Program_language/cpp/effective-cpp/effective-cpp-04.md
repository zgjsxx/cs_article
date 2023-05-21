---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 04 确定对象被使用前已被初始化

在本节中，作者主要强调了对象使用前一定要进行显式的初始化。其中要区分构造函数中的赋值和初始化。另外跨编译模块的初始化问题需要引起注意(通常可以使用单例模式解决)。

## 分析

### 使用成员变量初始化列表进行初始化

在构造函数中，下面的形式是赋值:

```CPP
//01. Assignments
ABEntry::ABEntry(const std::string& name, const std::string& address, const std::list<PhoneNumber>& phones)
{
	// these are all assignments.
	theName = name;
	theAddress = address;
	thePhones = phones;
	numTimesConsulted = 0;
}
```

下面这样的形式才是初始化：

```cpp
//02. Initialization list.
ABEntry::ABEntry(const std::string& name, const std::string& address, const std::list<PhoneNumber>& phones) :
	theName(name),
	theAddress(address),
	thePhones(phones),
	numTimesConsulted(0)
{
	// the ctor body is empty.
}
```

### 确保全局变量已经初始化

Directory的对象构造时会调用tfs对象的方法，然而此时tfs可能还没有初始化：

```cpp
class Directory
{
public:
	Directory()
	{
		std::size_t disks = tfs.numDisks();
	}
};
```

可以使用单例模式的思想去进行修改，这里调用tfs去返回FileSystem的对象，在tfs函数内部，创建了一个静态变量fs，这就确保了对象的创建。

```cpp
class Directory
{
public:

	Directory2()
	{
		std::size_t disks = tfs().numDisks();
	}
};

FileSystem& tfs()
{
	static FileSystem fs;
	return fs;
}
```


## 总结
- 为内置型对象进行手工初始化，因为c++不保证初始化它们。
- 构造函数最好使用成员函数初始化列表进行初始化，而不是在构造函数内部使用赋值操作。初值列列出的成员变量，其排列顺序应该和它们在class中的声明次序相同。
- 为免除"跨编译单元的初始化次序"问题，请以local static对象替换non-local static对象。
