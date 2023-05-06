---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# c++中的编程技巧pImpl

## 代码
```cpp
// ----------------------
#include <memory> // PImpl
#include <string>
using namespace std;
 
class User {
public:
    // Constructor and Destructors
 
    ~User();
    explicit User(string name);
 
    // Assignment Operator and Copy Constructor
 
    User(const User& other);
    User& operator=(User rhs);
 
    // Getter
    int getSalary() const;
 
    // Setter
    void setSalary(int);
 
private:
    // Internal implementation class
    class Impl;
 
    // Pointer to the internal implementation
    unique_ptr<Impl> pimpl;
};

#include <iostream>
using namespace std;
 
struct User::Impl {
 
    Impl(string name)
        : name(move(name)){};
 
    ~Impl(){};
 
    void welcomeMessage() const 
    {
        cout << "Welcome, "
             << name << endl;
    }
 
    string name{};
    int salary{-1};
};
 
// Constructor connected with our Impl structure
User::User(string name)
    : pimpl(new Impl(move(name)))
{
    pimpl->welcomeMessage();
}
 
// Default Constructor
User::~User() = default;
 
// Assignment operator and Copy constructor
 
User::User(const User& other)
    : pimpl(new Impl(*other.pimpl))
{
}
 
User& User::operator=(User rhs)
{
    swap(pimpl, rhs.pimpl);
    return *this;
}
 
// Getter and setter
int User::getSalary() const
{
    return pimpl->salary;
}
 
void User::setSalary(int salary)
{
    pimpl->salary = salary;
    cout << "Salary set to "
         << salary << endl;
}

int main()
{
    User user("demo");
    user.setSalary(10000);
}
```

## pImpl的缺点

- pImpl是C++程序员经常遇到的一种编程模式，主要用于建立“编译防火墙”。同时，带来了屏蔽私有接口、移动语义友好等优点；
- 对于const函数被非const指针所屏蔽的问题，可以通过std::experimental::propagate_const来解决。
