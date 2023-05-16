---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 40 明智而审慎地使用多重继承

本节讲解了多重继承的话题。多重继承是大多数程序员都比较讨厌的，因为代码中一旦有多重继承，很多程序员就会心生畏惧。本节就讨论多重继承的问题以及如何正确的利用好多重继承这个方法。

## 分析

1.当存在菱形继承时，需要使用virtual继承

```cpp
class File
{
};


// Virtual base class.
class InputFile : virtual public File
{
};


// Virtual base class.
class OutputFile : virtual public File
{
};


// Deadly Multiple Inheritance diamond.
class IOFile : public InputFile, public OutputFile
{
};
```


2.多重继承的使用场景

下面就是CPerson类public继承于IPerson， private继承于PersonInfo。IPerson中含有相关接口， PersonInfo包含相关实现。这种使用就有点像Java中的extend和implement。implement是继承一些方式， extend是继承一些实现。

```cpp
#include <string>
#include "Database.h"

// This class specifies the interface to be implemented.
class IPerson
{
public:
	virtual ~IPerson();

	virtual std::string name() const = 0;
	virtual std::string birthDate() const = 0;
};


class PersonInfo
{
public:
	explicit PersonInfo(DatabaseID pid);
	virtual ~PersonInfo();

	virtual const char* theName() const;
	virtual const char* theBirthDate() const;

private:
	virtual const char* valueDelimOpen() const;
	virtual const char* valueDelimClose() const;
};


static const int Max_Formatted_Field_Value_Length = 80;

const char* PersonInfo::valueDelimOpen() const
{
	// Default opening delimiter.
	return "[";
}

const char* PersonInfo::valueDelimClose() const
{
	// Default closing delimiter.
	return "]";
}


const char* PersonInfo::theName() const
{
	// Reserve buffer for return value;
	// Because this is static it's automatically initialized to all zeros
	static char value[Max_Formatted_Field_Value_Length];

	// Write opening delimiter.
	strcpy_s(value, Max_Formatted_Field_Value_Length, valueDelimOpen());

	// Append to the string in value this object's
	// name field (being careful to avoid buffer overrun)

	// Write closing delimiter.
	strcat_s(value, Max_Formatted_Field_Value_Length, valueDelimClose());
	return value;
}


// Note the use of multiple inheritance.
class CPerson : public IPerson, private PersonInfo
{
public:
	explicit CPerson(DatabaseID id) : PersonInfo(id)
	{
	}

	// Implementation of the required IPerson member functions.
	virtual std::string name() const
	{
		return PersonInfo::theName();
	}

	virtual std::string birthDate()
	{
		return PersonInfo::theBirthDate();
	}

private:
	// Redefinitions of inherited virtual delimiter functions.
	const char* valueDelimOpen() const { return ""; }
	const char* valueDelimClose() const { return ""; }
};
```

## 总结
- 多重继承比单一继承复杂。它可能导致新的歧义性，以及对virtual继承的需要
- virtual继承会增加大小、速度、初始化（及赋值）复杂度等等成本。如果virtual base classes不带任何数据，将是最具使用价值的情况。
- 多重继承的确有正当用途。其中一个情节设计"public继承某个Interface class"和"private继承某个协助实现的class"的两相组合。

