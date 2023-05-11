---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 31 文件间的编译依存关系降低至最低

本文中介绍了两种接口与实现分离的两种方法。

## Handle classes(pImpl设计)

常见的pImpl代码格式如下所示：

由于满足了封装性，所以Impl中的数据可以是public的，因此可以使用struct来声明Impl。

```cpp
#include <string>
#include <iostream>
#include <memory>

struct Address 
{
public:
	Address(std::string address):address_(address){}
public:
	std::string getAddress() const{
		return address_;
	}
private:
	std::string address_;
};

struct Date 
{
public:
	Date(std::string date):date_(date){}
public:
	std::string getDate() const{
		return date_;
	}
private:
	std::string date_;
};

class Person
{
public:
	Person();
	Person(const std::string& name, const Date& birthday, const Address& addr);

	std::string name() const;
	std::string birthDate() const;
	std::string address() const;

private:
	// ptr to implementation (Item13)
	struct Impl;
	std::shared_ptr<Impl> pImpl;
};

struct Person::Impl
{
	Impl(const std::string& name, const Date& birthday, const Address& addr);
	std::string name() const{return theName;}
	std::string birthDate() const{ return theBirthDate.getDate();};
	std::string address() const{return theAddress.getAddress();};

	std::string theName;	// implementation detail
	Date theBirthDate;		// implementation detail
	Address theAddress;		// implementation detail	
};

Person::Impl::Impl(const std::string& name, const Date& birthday, const Address& addr) :
	theName(name), theBirthDate(birthday), theAddress(addr)
{
}


Person::Person(const std::string& name, const Date& birthday, const Address& addr) :
	pImpl(new Impl(name, birthday, addr))
{
}

std::string Person::name() const
{
	return pImpl->name();
}
std::string Person::birthDate() const
{
	return pImpl->birthDate();
}
std::string Person::address() const
{
	return pImpl->address();
}

int main()
{
	Date d("2022-9-10");
	Address addr("nanjing");
	Person p("zhangsan", d, addr);
	std::cout << p.name() << " " << p.birthDate() << " " << p.address() << std::endl;
}

```

## Interface classes

另一种方法是将基类构造成一个抽象类，即类中方法都是纯虚的。

```cpp
#include <string>
#include <iostream>
#include <memory>

struct Address 
{
public:
	Address(std::string address):address_(address){}
public:
	std::string getAddress() const{
		return address_;
	}
private:
	std::string address_;
};

struct Date 
{
public:
	Date(std::string date):date_(date){}
public:
	std::string getDate() const{
		return date_;
	}
private:
	std::string date_;
};

class Person
{
public:
	Person() {}
	Person(const std::string& name, const Date& birthday, const Address& addr);
	virtual ~Person() {}
	
	virtual std::string name() const = 0;
	virtual std::string birthDate() const = 0;
	virtual std::string address() const = 0;
};

class RealPerson : public Person
{
public:
	RealPerson(const std::string& name, const Date& birthday, const Address& addr) :
		theName(name), theBirthDate(birthday), theAddress(addr)
	{
	}
	
	virtual ~RealPerson() {}

	static std::shared_ptr<Person> create(const std::string& name, const Date& birthday, const Address& addr)
	{
		return std::shared_ptr<Person>(new RealPerson(name, birthday, addr));
	}

	std::string name() const		{ return theName; }
	std::string birthDate() const	{ return theBirthDate.getDate(); }
	std::string address() const		{ return theAddress.getAddress(); }

private:
	std::string theName;
	Date theBirthDate;
	Address theAddress;
};

int main()
{
	Date d("2022-9-10");
	Address addr("nanjing");
	Person *p = new RealPerson("zhangsan", d, addr);
	std::cout << p->name() << " " << p->birthDate() << " " << p->address() << std::endl;
}

```

## 总结
- 支持"编译依存最小化"的一般构想时:相依于声明式，不要相依于定义式。基于此构想的两个手段是Handle class和Interface classes。
- 程序头文件应该以"完全且仅有声明式"的形式存在。这种做法不论是否涉及template都使用。

