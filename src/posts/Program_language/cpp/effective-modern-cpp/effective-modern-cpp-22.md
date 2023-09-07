---
category: 
- C++
tag:
- effective modern c++读书笔记
---

# Item22 当使用Pimpl惯用法，请在实现文件中定义特殊成员函数

亲测，下面这种写法在gcc编译器上，不会报delete incomplete 的问题。

```cpp
//widget.h
#include <memory>

class Widget {                     
public:
    Widget();

private:
    struct Impl;
    std::unique_ptr<Impl> pImpl;
};

#include <string>
#include <vector>

struct Widget::Impl {
    std::string name;
    std::vector<double> data;
};

Widget::Widget()                    //根据条款21，通过std::make_unique
: pImpl(std::make_unique<Impl>())   //来创建std::unique_ptr
{}

int main(){
    Widget w;      
}
```