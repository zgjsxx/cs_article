---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# c++中的编程技巧pImpl
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