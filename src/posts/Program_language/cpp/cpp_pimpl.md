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
// interface (widget.hpp)
#include <iostream>
#include <memory>
 
class widget
{
public:
    void draw() const; // public API that will be forwarded to the implementation
    bool shown() const { return true; } // public API that implementation has to call
 
    widget(); // even the default ctor needs to be defined in the implementation file
              // Note: calling draw() on default constructed object is UB
    explicit widget(int);
    ~widget(); // defined in the implementation file, where impl is a complete type
    widget(widget&&); // defined in the implementation file
                      // Note: calling draw() on moved-from object is UB
    widget(const widget&) = delete;
    widget& operator=(widget&&); // defined in the implementation file
    widget& operator=(const widget&) = delete;
private:
    class impl;
    std::unique_ptr<impl> pImpl;
};
 
// ---------------------------
// implementation (widget.cpp)
// #include "widget.hpp"
 
class widget::impl
{
    int n; // private data
public:
    void draw(const widget& w) const
    {
        if(w.shown()) // this call to public member function requires the back-reference 
            std::cout << "drawing a const widget " << n << '\n';
    }

    impl(int n) : n(n) {}
};
 
void widget::draw() const { pImpl->draw(*this); }
widget::widget() = default;
widget::widget(int n) : pImpl{std::make_unique<impl>(n)} {}
widget::widget(widget&&) = default;
widget::~widget() = default;
widget& widget::operator=(widget&&) = default;
 
// ---------------
// user (main.cpp)
// #include "widget.hpp"
 
int main()
{
    widget w(7);
    w.draw();
}
```

## pImpl的缺点

- pImpl是C++程序员经常遇到的一种编程模式，主要用于建立“编译防火墙”。同时，带来了屏蔽私有接口、移动语义友好等优点；
- 对于const函数被非const指针所屏蔽的问题，可以通过std::experimental::propagate_const来解决。
