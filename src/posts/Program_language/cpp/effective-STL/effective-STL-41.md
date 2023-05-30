---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-41 了解使用ptr_fun， mem_fun和mem_fun_ref的原因

```cpp
#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>

class AddObj
{
public:
    AddObj(int a, int b):a_(a), b_(b){

    }
public:
    void add() const
    {
        std::cout << "a + b = " <<  a_ + b_  << std::endl;
    }
private:
    int a_{0};
    int b_{0};
};

int main()
{
    std::vector<AddObj>  addObjVec{  {1 , 2},
                                {2 , 3},
                                {3 , 4},
                                {5 , 8},
                                {7 , 9}
                            };
    for_each(addObjVec.cbegin(), addObjVec.cend(), std::mem_fn(&AddObj::add));

}
```


mem_fun：针对指针容器中调用成员函数

mem_fun_ref：针对对象容器中调用成员函数

mem_fn	把成员函数转为函数对象，使用对象指针或对象(引用)进行绑定(更通用)

ptr_fun：针对一般函数的调用，（可有可无，在not1 not2等配接的时候就要加上ptr_fun）