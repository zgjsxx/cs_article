---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 03 尽可能使用const

## 在可以使用const的地方尽量使用const，可以避免很多错误

## 如果在const函数内部需要修改成员变量， 则需要使用mutable

下面是一个例子，如果不适用mutable， 则不能通过编译。
```cpp
#include <string>
#include <string.h>

class CTextBlock3
{
public:
	explicit CTextBlock3(const char* t) : pText(t), lengthIsValid(false)
	{
	}

	std::size_t length() const;

private:
	const char* pText;

	mutable std::size_t textLength;
	mutable bool lengthIsValid;
};

std::size_t CTextBlock3::length() const
{
	if (!lengthIsValid)
	{
		textLength = strlen(pText);
		lengthIsValid = true;
	}

	return textLength;
}

int main()
{
    CTextBlock3 block("chinese");
    block.length();
}
```

更常见的一个场景，在一个类中有一个互斥锁的成员变量，在const函数中要对这个互斥锁加锁，那这个时候不加mutable是会失败的。

## 当const和non-const成员函数有着实质等价的实现时，令non-const版本调用const版本可避免代码重复

这个点可以参考书本中的实现，但是我觉得这个点使用的频率不是很高。

```cpp
#include <iostream>
#include <string>

class TextBlock
{
public:
	TextBlock(std::string t) : text(t)
	{
	}

	// operator[] for const objects.
	const char& operator[](std::size_t position) const
	{
        std::cout << "call const" << std::endl;
		return text[position];
	}

	// operator[] for non-const objects.
	char& operator[](std::size_t position)
	{
        std::cout << "call non-const" << std::endl;
		// In order for the non-const operator[] to call const operator[].
		return const_cast<char&>(static_cast<const TextBlock&>(*this)[position]);
	}

private:
	std::string text;
};

int main()
{
    TextBlock book("chinese");
    std::cout << book[0] << std::endl;

    const TextBlock book2("chinese");
    std::cout << book2[0] << std::endl;
}
```

[have a try]("https://godbolt.org/z/nGdoPrqd4")

## 总结
- 将某些东西声明为const可以帮助编译器检查出错误用法。const可被施加于任何作用域的对象，函数参数，函数返回值类型，成员函数本体。
- 编译器强制实施比特常量性bitwise constness， 但你编写的程序应该使用概念上的常量性（conceptual constness）
- 当const和non-const成员函数有着实质等价的实现时，令non-const版本调用const版本可避免代码重复。