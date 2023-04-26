
---
category: 
  - 设计模式
tag:
  - 设计模式
---

# 策略模式
```cpp
#include <iostream>

class IStrategy
{
public:
    IStrategy() = default;
    virtual ~IStrategy() = default;
public:
    virtual void exec() const = 0;
};

class StrategyA : public IStrategy
{
public:
    StrategyA() = default;
    ~StrategyA() = default;
public:
    virtual void exec() const override
    {
        std::cout << "StrategyA::exec()" << std::endl;
    }
};

class StrategyB : public IStrategy
{
public:
    StrategyB() = default;
    ~StrategyB() = default;
public:
    virtual void exec() const override
    {
        std::cout << "StrategyB::exec()" << std::endl;
    }
};


class Context
{
public:
    explicit Context(IStrategy* strategy):strategy_(strategy)
    {

    }
    
    void setStrategy(IStrategy* strategy)
    { 
        strategy_ = strategy; 
    }

    void exec() const
    { 
        strategy_->exec();
    }
private:
    IStrategy* strategy_;
};


int main()
{
    IStrategy* strategy1 = new StrategyA();
    IStrategy* strategy2 = new StrategyB();  

    Context* context = new Context(strategy1);
    context->exec();

    context->setStrategy(strategy2);
    context->exec(); 
}

```