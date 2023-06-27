---
category: 
- C++
---

# c++小技巧之为析构函数增加override签名

在有**继承**和**多态**的使用场景下，如果父类的析构函数没有添加virtual签名，那么在使用delete删除对象时，就不会调用父类的析构函数，这可能就会造成一些资源泄露。

例如下面的例子，当使用```Base* b = new Derived();```创建对象时，delete该对象不会调用Base类的析构函数。

注意，这个问题仅限于继承+多态组合的情况。如果你使用```Derived *d = new Derived();```创建对象，delete该对象时不会有问题。

```cpp
#include <cstdio>
#include <iostream>

class Base
{
public:
	~Base() { 
        std::cout << "~Base" << std::endl; 
    }
};

class Derived 
    : public Base
{
public:
	~Derived()  { 
        std::cout << "~Derived" << std::endl; 
    }
};


int main()
{
    Derived *d = new Derived();
    delete d;
    
    std::cout << "=========" << std::endl;

    Base* b = new Derived();
    delete b;
}
```

运行结果：

```shell
~Derived
~Base
=========
~Base
```

而在有**继承**+**多态**组合的情况时，忘记写virtual关键字是很容易出现的，这个时候可以使用一个小技巧来避免遗忘写virtual签名，那就是在子类的析构函数上增加override关键字，如下所示:

```cpp
#include <cstdio>
#include <iostream>

class Base
{
public:
	~Base() { 
        std::cout << "~Base" << std::endl; 
    }
};

class Derived 
    : public Base
{
public:
	~Derived() override  { 
        std::cout << "~Derived" << std::endl; 
    }
};


int main()
{
    Derived *d = new Derived();
    delete d;
    
    std::cout << "=========" << std::endl;

    Base* b = new Derived();
    delete b;
}
```

其编译结果如下所示，会报一个编译错误，这就会提醒你会基类的析构函数添加virtual签名。

```shell
<source>:16:9: error: 'Derived::~Derived()' marked 'override', but does not override
   16 |         ~Derived() override  {
      |         ^
```

