---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 35 考虑virtual函数以外的其他选择

在本节中，作者给出了一些可以替代调用virtual函数的方法。下面就一一进行介绍。


## 分析

1.考虑NVI的实现方式(模板方法设计模式)

```cpp
class GameCharacter
{
public:
	// derived classes do not redefine this
	int healthValue() const
	{
		int retVal = doHealthValue();
		return retVal;
	}

private:
	// derived classes may redefine this
	// default algorithm for calc health
	virtual int doHealthValue() const
	{
		return 0;
	}
};


class MyCoolCharacter : public GameCharacter
{
private:
	int doHealthValue() const
	{
		return 17;
	}
};
```


2.考虑函数指针（策略模式）

```cpp
// The Strategy Pattern via Function Pointers.

// Forward declaration
class GameCharacter;

// Function for the default health calculation algorithm.
int defaultHealthCalc(const GameCharacter& gc)
{
	return 0;
}


class GameCharacter
{
public:
	typedef int (*HealthCalcFunc)(const GameCharacter&);

	explicit GameCharacter(HealthCalcFunc hcf = defaultHealthCalc) :
		healthFunc(hcf)
	{
	}

	int healthValue() const
	{
		return healthFunc(*this);
	}

private:
	HealthCalcFunc healthFunc;
};


class EvilBadGuy : public GameCharacter
{
public:
	explicit EvilBadGuy(HealthCalcFunc hcf = defaultHealthCalc) :
		GameCharacter(hcf)
		{
		}
};
```


3.考虑使用```std::function```（策略模式）

```cpp
// The Strategy Pattern via tr1::function.

#include <functional>


// Forward declaration
class GameCharacter;

// Function for the default health calculation algorithm.
int defaultHealthCalc(const GameCharacter& gc)
{
	return 0;
}


class GameCharacter
{
public:
	// HealthCalcFunc is any callable entity that can be called with
	// anything compatible with a GameCharacter and that returns
	// anything compatible with an int; see below for details.
	typedef std::tr1::function<int (const GameCharacter&)> HealthCalcFunc;

	explicit GameCharacter(HealthCalcFunc hcf = defaultHealthCalc) :
		healthFunc(hcf)
	{
	}

	int healthValue() const
	{
		return healthFunc(*this);
	}

private:
	HealthCalcFunc healthFunc;
};


class EvilBadGuy : public GameCharacter
{
public:
	explicit EvilBadGuy(HealthCalcFunc hcf = defaultHealthCalc) :
		GameCharacter(hcf)
		{
		}
};

class EyeCandyGuy : public GameCharacter
{
public:
	explicit EyeCandyGuy(HealthCalcFunc hcf = defaultHealthCalc) :
		GameCharacter(hcf)
		{
		}
};


// New flexibility:

// Health calculation function.
// Note: non-int return type.
short calcHealth(const GameCharacter&)
{
	return 256;
}

// Class for health calculation object.
struct HealthCalculator
{
	// Calculation function object.
	int operator()(const GameCharacter&) const
	{
		return 7;
	}
};


class GameLevel
{
public:
	// Health calculation member function.
	// Note: non-int return type.
	float health(const GameCharacter&) const
	{
		return 7.5f;
	}
};
```


4.经典的策略模式
```cpp
// The "Classic" Strategy Pattern.

// Forward declaration
class GameCharacter;


class HealthCalcFunc
{
public:
	virtual int calc(const GameCharacter& gc) const
	{
		return 17;
	}
};

class MyHealthCalcFunc : public HealthCalcFunc
{
public:
	int calc(const GameCharacter& gc) const
	{
		return 25;
	}
};


HealthCalcFunc defaultHealthCalcFunc;


class GameCharacter
{
public:
	explicit GameCharacter(HealthCalcFunc* phcf = &defaultHealthCalcFunc) :
		pHealthCalcFunc(phcf)
	{
	}

	int healthValue() const
	{
		return pHealthCalcFunc->calc(*this);
	}

private:
	HealthCalcFunc* pHealthCalcFunc;
};


class EvilBadGuy : public GameCharacter
{
public:
	explicit EvilBadGuy(HealthCalcFunc* phcf = &defaultHealthCalcFunc) :
		GameCharacter(phcf)
		{
		}
};
```

## 总结
- 使用non-virtual interface(NVI)手法， 那么是Template Method设计模式的一种特殊形式。它以public non-virtual成员函数包裹较低访问性的virtual函数。
- 将virtual函数替换为"函数指针成员变量"， 这是Strategy设计模式的一种分解表现形式。
- 使用std::function成员变量替换virtual函数，因而允许任何可调用对象搭配一个兼容于需求的签名式。这也是Strategy设计模式的某种形式。
- 将继承体系内的virtual函数替换为另一个继承体系内的virtual函数。这是Strategy设计模式的传统实现手法。

