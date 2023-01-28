---
title: 什么是operator new和placement new?
category: 
- C++
---

当我们使用了new关键字去创建一个对象时，你知道背后做了哪些事情吗？
```cpp
Test* a = new Test；
```
实际上吗这样简单的一行语句， 背后做了一下三件事情：
- 1.调用operator new 申请内存， 申请大小为Test类的大小
- 2.调用placement new调用构造函数，构造对象
- 3.返回对象的地址

这里的三个步骤中出现了operator new和placement new，下面将对这两个语句进行详解。

```cpp
#include <iostream>
#include <string>
#include <malloc.h>
using namespace std;

//student class
class stu
{
public:
    stu(string name, int age)
    {
        name_ = name;
        age_ = age;
    };
public:
    void print() const
    {
        cout << "name = " << name_ << std::endl;
        cout<< "age = " << age_ << std::endl;
    };
private:
    string name_;
    int age_;
};
int main()
{
    void* stu1 = (stu*)malloc(sizeof(stu));
    ::new (stu1) stu("stu1", 10);
    ((stu*)stu1)->print();
}
```