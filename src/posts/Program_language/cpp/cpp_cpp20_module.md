---
category: 
- C++
tag:
- C++
---

# c++20 module

helloworld:

```cpp
//g++ main.cpp -o main -std=c++20 -fmodules-ts -x c++-system-header iostream
import <iostream>;

int main()
{
    std::cout << "Hello, World" << std::endl;
}
```

第一次编译会失败，生成gcm.cache之后，再次编译就可以成功。


Put the following in hello.cc:

```cpp
module;
#include <iostream>
#include <string_view>
export module hello;
export void greeter (std::string_view const &name)
{
    std::cout << "Hello " << name << "!\n";
}
```
and put the following in main.cc:

```cpp
import hello;
int main (void)
{
    greeter ("world");
    return 0;
}
```

Now compile with:

```shell
g++ -fmodules-ts hello.cc main.cc
```

You can run the a.out:

```shell
bester:7>./a.out
Hello world!
```


main.cpp
```cpp
import b;

int main()
{
    io::print(data::get());
}
```

a.cppm:

```cpp
export module b;
import <cstdio>;

export namespace data
{
    int get()
    {
        return 123;
    }
}

template<typename T>
concept floatlike = requires (T t) { static_cast<float>(t); };

export namespace io
{
    void print(floatlike auto x)
    {
        printf("%f\n", static_cast<float>(x));
    }
}
```

Compilation:

GCC 12.2.0:
```shell
gcc -std=c++20 -fmodules-ts -x c++-system-header cstdio -x c++ a.cppm main.cpp -o main
```