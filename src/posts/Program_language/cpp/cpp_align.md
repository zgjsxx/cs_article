---
category: 
- C++
---

# c++中的对齐问题

```cpp
#include <iostream>

struct MyStruct {
    char c;
    int i;
    short s;
};

int main()
{
    MyStruct obj;
    std::cout << "offset of c = "  << offsetof(MyStruct,c) << std::endl;
    std::cout << "offset of i = " << offsetof(MyStruct,i) << std::endl;
    std::cout << "offset of s = " << offsetof(MyStruct,s) << std::endl;
    std::cout << "sizeof MyStruct = " << sizeof(MyStruct);
}
```

```cpp
start of obj = 0x7fff2e8d1e94
offset of c = 0
offset of i = 4
offset of s = 8
sizeof MyStruct = 12
```