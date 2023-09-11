---
category: 
- C++
---

# noexcept


## vector容器扩容时

如下面的代码

```cpp
#include <iostream>
#include <memory>
#include <vector>

class A{  
public:  
    A(){  
        std::cout << "A()" << std::endl;  
    }  
    ~A(){  
        std::cout << "~A()" << std::endl;  
    }  
    A(const A& other){  
        std::cout << "A(const A& other)" << std::endl;  
    }  
    
    A& operator=(const A& other){  
        std::cout << "operator=(const A& other" << std::endl;  
    return *this;  
    }  
    
    A(A&& other) {  
        std::cout << "A(A&& other)" << std::endl;  
    }  
    
    A& operator=(A&& other){  
        std::cout << "A& operator=(A&& other)" << std::endl;  
        return *this;  
    }  
};  
  


int main(int argc, const char* argv[]) {

    std::vector<A> vec;
    vec.resize(1);
    std::cout << vec.size() << std::endl;
    std::cout << vec.capacity() << std::endl;
    std::cout << "===" << std::endl;
    A a1;
    vec.emplace_back(a1);

    std::cout << vec.size() << std::endl;
    std::cout << vec.capacity() << std::endl;
}
```

```
A()
1
1
===
A()
A(const A& other)
A(const A& other)//注意这里，使用的是复制，也就是说，在扩容的时候调用的复制构造，因为移动构造不是noexcept的
~A()
2
2
~A()
~A()
~A()
```

如果此时添加上noexcept

```cpp
#include <iostream>
#include <memory>
#include <vector>

class A{  
public:  
    A(){  
        std::cout << "A()" << std::endl;  
    }  
    ~A(){  
        std::cout << "~A()" << std::endl;  
    }  
    A(const A& other){  
        std::cout << "A(const A& other)" << std::endl;  
    }  
    
    A& operator=(const A& other){  
        std::cout << "operator=(const A& other" << std::endl;  
    return *this;  
    }  
    
    A(A&& other) noexcept{  
        std::cout << "A(A&& other)" << std::endl;  
    }  
    
    A& operator=(A&& other) noexcept {  
        std::cout << "A& operator=(A&& other)" << std::endl;  
        return *this;  
    }  
};  

int main(int argc, const char* argv[]) {
    std::vector<A> vec;
    vec.resize(1);
    std::cout << vec.size() << std::endl;
    std::cout << vec.capacity() << std::endl;
    std::cout << "===" << std::endl;
    A a1;
    vec.emplace_back(a1);

    std::cout << vec.size() << std::endl;
    std::cout << vec.capacity() << std::endl;
}
```

结果如下：

```cpp
A()
1
1
===
A()
A(const A& other)
A(A&& other)//这里转为使用移动构造进行扩容
~A()
2
2
~A()
~A()
~A()
```

因为push_back/emplace_back需要保证异常安全性，复制构造是可以保证的，移动构造不能保证。因此只有移动构造是noexcept的，push_back/emplace_back扩容时才会使用移动构造。