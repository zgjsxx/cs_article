---
category: 
- C++
---

# std::move

## std::move返回局部变量
```cpp
#include <memory>
#include <iostream>

class A
{
public:
    A(){
        std::cout << "A()" << std::endl;
    }
    ~A(){
        std::cout << "~A()" << std::endl;
    }
    A(const A& other){
        std::cout <<"A(const A& other)"<< std::endl;
    }
    A& operator=(const A& other){
        std::cout <<"const A& other"<< std::endl;        
    }
    A(A&& other){
        std::cout <<"A&& other"<< std::endl; 
    }
    A& operator=(A&& other){
        std::cout <<"A& operator=(A&& other)"<< std::endl;        
    }
};

A GetA_1(){
    A a;
    return a;
}

A GetA_2(){
    A a;
    return std::move(a);
}

A GetA_3(A& other){
    return other;
}

A GetA_4(A&& other){
    return std::move(other);
}

int main()
{
    A a1 = GetA_1();
    std::cout << "===" << std::endl;
    A a2 = GetA_2();
    std::cout << "===" << std::endl; 
    A a3;
    A a4 = GetA_3(a3);
    std::cout << "===" << std::endl; 
    A a5;
    A a6 = GetA_4(std::move(a5));
    std::cout << "===" << std::endl; 
}
```