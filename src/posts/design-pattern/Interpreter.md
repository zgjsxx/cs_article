# 解释器模式

```cpp
#include <iostream>
#include <string>

class Context
{
public:
    Context(const std::string& val):val_(val)
    {

    }
    std::string getVal() const
    {
        return val_;
    }
private:
    std::string val_;
};

class IExpression
{
public:
    IExpression() = default;
    virtual ~IExpression() = default;
public:
    virtual int interpret(const Context& context) const = 0;
};

class AExpression : public IExpression
{
public:
    virtual int interpret(const Context& context) const override
    {
        int count = 0;
        for(auto& c : context.getVal())
        {
            if(c == 'A')
            {
                count++;
            }
        }
        return count;
    }
};

class BExpression : public IExpression
{
public:
    virtual int interpret(const Context& context) const override
    {
        int count = 0;
        for(auto& c : context.getVal())
        {
            if(c == 'B')
            {
                count++;
            }
        }
        return count;
    }
};


int main()
{
    Context context("AAABBBB");
    IExpression* expression1 = new AExpression();
    IExpression* expression2 = new BExpression();   

    std::cout << "Aexpression get val " << expression1->interpret(context) << std::endl;
    std::cout << "Bexpression get val " << expression2->interpret(context) << std::endl;

    delete expression1;
    delete expression2;
}
```