---
category: 
- C++
---

# c++智能指针之unique_ptr



## unique添加自定义删除器

- 添加函数指针作为删除器

```cpp
#include <iostream>
#include <memory>

int main(int argc, const char* argv[]) {
    auto deleter = [](int* pNum) {
        std::cout << "lambda deleter" << std::endl;
        delete pNum;
    };

    typedef void(*Delete)(int*);
    std::unique_ptr<int, Delete> upNum(new int, deleter);
    std::cout << sizeof(upNum) << std::endl;
    // 输出8+8=16（函数指针类型的大小也为8）

    return 0;
}
```

```cpp
#include <iostream>
#include <memory>

void deleter(int* pNum) {
    std::cout << "function deleter" << std::endl;
    delete pNum;
}

int main(int argc, const char* argv[]) {
    std::unique_ptr<int, decltype(&deleter)> upNum(new int, deleter);

    // 输出8+8=16（函数指针类型的大小也为8）
    std::cout << sizeof(upNum) << std::endl;

    return 0;
}
```

- 添加lamdda函数作为删除器

```cpp
#include <iostream>
#include <memory>

int main(int argc, const char* argv[]) {
    auto deleter = [](int* pNum) {
        std::cout << "lambda deleter" << std::endl;
        delete pNum;
    };
    std::unique_ptr<int, decltype(deleter)> upNum(new int, deleter);

    // 输出8
    std::cout << sizeof(upNum) << std::endl;

    return 0;
}
```

- 添加仿函数作为删除器

```cpp
#include <iostream>
#include <memory>

class MyDelete{
public:
    void operator()(int* num){
        std::cout << "lambda deleter" << std::endl;
        delete num;
    }
};

int main(int argc, const char* argv[]) {
    std::unique_ptr<int, MyDelete> upNum(new int);

    // 这里将输出8
    std::cout << sizeof(upNum) << std::endl;

    return 0;
}
```

这里需要注意的是当仿函数的内部存在一些私有变量时，将会增加unique_ptr的大小。例如这里的MyDelete的内部有一个int类型的state1，那么MyDelete类的大小就是4。此时的unique_ptr的内部就包含了一个8个字节的原始指针，和一个4个字节的MyDelete的实列对象， 由于内存对齐，此时upNum的大小将是16。

因此当使用仿函数作为删除器时，需要考虑仿函数的内部是否包含一些私有变量。

```cpp
#include <iostream>
#include <memory>

class MyDelete{
public:
    void operator()(int* num){
        std::cout << "lambda deleter" << std::endl;
        delete num;
    }
private:
    int state1;
};

int main(int argc, const char* argv[]) {
    std::unique_ptr<int, MyDelete> upNum(new int);

    // 输出16
    std::cout << sizeof(upNum) << std::endl;
    return 0;
}
```

从上面的对比中不难发现，如果使用函数指针作为删除器一定会比增加unique_ptr的尺寸。

如果使用仿函数作为删除器，其内部的变量可能会增加unique_ptr的尺寸。

而没有内部变量的仿函数和没有捕获变量的lambda表达式，其不会增加unique_ptr的大小。

因此在自定义删除器时，可以优先考虑使用lambda表达式的形式。

这里的结论和effective modern c++的第18章的结论是一致的。

>我之前说过，当使用默认删除器时（如delete），你可以合理假设std::unique_ptr对象和原始指针大小相同。当自定义删除器时，情况可能不再如此。函数指针形式的删除器，通常会使std::unique_ptr的从一个字（word）大小增加到两个。对于函数对象形式的删除器来说，变化的大小取决于函数对象中存储的状态多少，无状态函数（stateless function）对象（比如不捕获变量的lambda表达式）对大小没有影响，这意味当自定义删除器可以实现为函数或者lambda时，尽量使用lambda：


## 总结
- std::unique_ptr是轻量级、快速的、只可移动（move-only）的管理专有所有权语义资源的智能指针
- 默认情况，资源销毁通过delete实现，但是支持自定义删除器。有状态的删除器和函数指针会增加std::unique_ptr对象的大小
- 将std::unique_ptr转化为std::shared_ptr非常简单