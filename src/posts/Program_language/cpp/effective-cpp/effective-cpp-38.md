---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 38 通过复合塑模出has-a或者根据某物实现出

前面介绍过类和类之间的一种关系-继承。本节将介绍另一种类和类的关系-组合。其含义就是在某个类型中嵌入一个另外一个类的对象。

通过组合，我们可以实现出has-a或者is-implemented-in-terms-of。

## 分析

has-a的关系也很好理解， 例如一个Person类型，其中含有一些属性地址， 电话号码， 如下所示：

```cpp
class Address{}；
class PhoneNumber {}；

class Person{
public：
private：
    std::string name;
    Address address;
    PhoneNumber voicenumber;
    PhoneNumber faxNumber;
}
```

is-implemented-in-terms-of是组合的另一种用途。 我们有一个自定义的Set类，我们通过了list类型进行了实现。

```cpp
template<class T>
class Set
{
public:
	bool member(const T& item) const;
	void insert(const T& item);
	void remove(const T& item);
	std::size_t size() const;

private:
	// Representation of the Set data.
	std::list<T> rep;
};


template<typename T>
bool Set<T>::member(const T& item) const
{
	return std::find(rep.begin(), rep.end(), item) != rep.end();
}

template<typename T>
void Set<T>::insert(const T& item)
{
	if (!member(item))
	{
		rep.push_back(item);
	}
}

template<typename T>
void Set<T>::remove(const T& item)
{
	// See Item42 for information on typename
	typename std::list<T>::iterator it = std::find(rep.begin(), rep.end(), item);

	if (it != rep.end())
	{
		rep.erase(it);
	}
}

template<typename T>
std::size_t Set<T>::size() const
{
	return rep.size();
}
```

## 总结
- 复合的意义和public继承完全不同
- 在应用域，复合意味has-a。在实现域，复合意味is-implemented-in-terms-of根据某物实现出。

