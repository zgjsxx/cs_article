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

**1.考虑NVI的实现方式(模板方法设计模式)**

父类和子类都调用healthValue同一接口，但是返回值不同。这是一种public非virtual函数调用virtual函数的实现多态的方法。

```cpp
#include <iostream>

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

class MyRichCharacter : public GameCharacter
{
private:
	int doHealthValue() const
	{
		return 100;
	}
};


int main()
{
    GameCharacter* gameCharacter = new MyCoolCharacter();
    std::cout << gameCharacter->healthValue() << std::endl;      

    GameCharacter* gameCharacter2 = new MyRichCharacter();
    std::cout << gameCharacter2->healthValue() << std::endl;      
}
```


[have a try](https://godbolt.org/z/bP45T7cr8)

**2.考虑函数指针（策略模式）去实现多态**

父类和子类都调用healthValue方法，但是二者的返回值是不同的。这里是因为healthValue方法内调用了healthFunc指针所指向的方法，但是父类和子类中healthFunc指针所指向的方法是不同的，通过这样的方式实现了多态。

```cpp
// The Strategy Pattern via Function Pointers.

#include <iostream>

class GameCharacter;

// Function for the default health calculation algorithm.
int defaultHealthCalc(const GameCharacter& gc)
{
    std::cout << "defaultHealthCalc" << std::endl;
	return 0;
}

int lossHealthFastCalc(const GameCharacter& gc)
{
    std::cout << "lossHealthFastCalc" << std::endl;
	return 0;
}

int lossHealthSlowCalc(const GameCharacter& gc)
{
    std::cout << "lossHealthSlowCalc" << std::endl;
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

class GoodGuy : public GameCharacter
{
public:
	explicit GoodGuy(HealthCalcFunc hcf = defaultHealthCalc) :
		GameCharacter(hcf)
		{
		}
};

int main()
{
    GameCharacter* gameCharacter = new EvilBadGuy(lossHealthFastCalc);
    gameCharacter->healthValue();

    GameCharacter* gameCharacter2 = new GoodGuy(lossHealthSlowCalc);  
    gameCharacter2->healthValue();
}
```

[have a try](https://godbolt.org/z/sP3nba1Go)

**3.考虑使用```std::function```（策略模式）**

本例和第二点的例子并不大的区别，只是使用了```std::function```充当函数指针。```std::function```可以接受更多类型的可调用对象，例如lambda function， 类的成员函数，仿函数等等。

```cpp
#include <functional>
#include <iostream>

// Forward declaration
class GameCharacter;

// Function for the default health calculation algorithm.
int defaultHealthCalc(const GameCharacter& gc)
{
    std::cout << "defaultHealthCalc" << std::endl;
	return 0;
}


class GameCharacter
{
public:
	// HealthCalcFunc is any callable entity that can be called with
	// anything compatible with a GameCharacter and that returns
	// anything compatible with an int; see below for details.
	typedef std::function<int (const GameCharacter&)> HealthCalcFunc;

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
    std::cout << "calcHealth" << std::endl;
	return 256;
}

// Class for health calculation object.
struct HealthCalculator
{
	// Calculation function object.
	int operator()(const GameCharacter&) const
	{
        std::cout << "HealthCalculator operator()" << std::endl;
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
        std::cout << "GameLevel health" << std::endl; 
		return 7.5f;
	}
};

int main()
{
    GameCharacter* gameCharacter = new EvilBadGuy(calcHealth);
    gameCharacter->healthValue();

    GameCharacter* gameCharacter2 = new EvilBadGuy(HealthCalculator());
    gameCharacter2->healthValue();
    
    GameLevel gameLevel;
    
    GameCharacter* gameCharacter3 = new EvilBadGuy(std::bind(&GameLevel::health, gameLevel, std::placeholders::_1));
    gameCharacter3->healthValue();
}
```

[have a try](https://godbolt.org/z/3W7fvjGGP)

**4.经典的策略模式**

经典的策略模式是将继承体系内的virtual函数替换为另一个继承体系内的virtual函数。

```cpp
// The "Classic" Strategy Pattern.

#include <iostream>

class GameCharacter;

class HealthCalcFunc
{
public:
	virtual int calc(const GameCharacter& gc) const
	{
        std::cout << "HealthCalcFunc calc" << std::endl;
		return 17;
	}
};

class MyHealthCalcFunc : public HealthCalcFunc
{
public:
	int calc(const GameCharacter& gc) const
	{
        std::cout << "MyHealthCalcFunc calc" << std::endl;
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

int main()
{
    MyHealthCalcFunc myHealthCalcFunc;
    GameCharacter* gameCharacter = new EvilBadGuy(&myHealthCalcFunc);
    gameCharacter->healthValue();

}
```

[have a try](https://godbolt.org/z/c7PzTYhq3)

## 总结
- 使用non-virtual interface(NVI)手法， 那么是Template Method设计模式的一种特殊形式。它以public non-virtual成员函数包裹较低访问性的virtual函数。
- 将virtual函数替换为"函数指针成员变量"， 这是Strategy设计模式的一种分解表现形式。
- 使用std::function成员变量替换virtual函数，因而允许任何可调用对象搭配一个兼容于需求的签名式。这也是Strategy设计模式的某种形式。
- 将继承体系内的virtual函数替换为另一个继承体系内的virtual函数。这是Strategy设计模式的传统实现手法。

