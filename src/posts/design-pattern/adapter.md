---
category: 
- 设计模式
tags:
- 设计模式
---

# 设计模式 - 适配器模式

## 组合方式
```cpp
#include <iostream>

using namespace std;
class Target{
public:
    virtual int output220v() = 0;
};

class Adaptee
{
public:
    int output110v(){
        return 110;
    }
};

class Adapter : public Target
{
public:
    Adapter(Adaptee* adaptee)
    {
        cout << "create the 110v to 220v adater" << endl;
        m_adaptee = adaptee;
    }
    int output220v()
    {
        int origin_voltage = m_adaptee->output110v();
        return convertVoltage(origin_voltage);
    }
    int convertVoltage(int i)
    {
        cout << "convert the 110v to 220v " << endl;
        return 220;
    }
private:
    Adaptee *m_adaptee;
};
int main()
{
    Adaptee *adaptee = new Adaptee();
    Target *target = new Adapter(adaptee);
    target->output220v();
}
```

## 继承方式
```cpp
#include <iostream>

using namespace std;
class Target{
public:
    virtual int output220v() = 0;
};

class Adaptee
{
public:
    int output110v(){
        return 110;
    }
};

class Adapter : public Target, Adaptee
{
public:
    Adapter()
    {
        cout << "create the 110v to 220v adater" << endl;
    }
    int output220v()
    {
        int origin_voltage = output110v();
        return convertVoltage(origin_voltage);
    }
    int convertVoltage(int i)
    {
        cout << "convert the 110v to 220v " << endl;
        return 220;
    }

};
int main()
{
    Adapter *adapter = new Adapter();
    adapter->output220v();

}
```