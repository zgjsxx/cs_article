---
category: 
- C++
---

# 深入理解c++特殊成员函数

在c++中，特殊成员函数有下面6个：
- 构造函数
- 析构函数
- 复制构造函数
- 赋值运算符
- 移动构造函数(c++11引入)
- 移动运算符(c++11引入)

以Widget类为例，其特殊成员函数的签名如下所示：
```cpp
class Widget{
public:
    Widget();//构造函数
    ~Widget();//析构函数
    Widget(const Widget& rhs);//复制构造函数
    Widget& operator=(const Widget& rhs);//赋值运算符
    Widget(Widget&& rhs);//移动构造函数
    Widget& operator=(Widget&& rhs);//移动运算符
}
```

## 构造函数

构造函数的作用是帮助**创建对象的实例**，并对实例进行初始化。

在c++中，下面两种形式的语句将会调用类的构造函数:

```cpp
Widget widget;
Widget *w = new Widget();
```

调用构造函数将会创建一个类的实例对象。当一个类拥有数据成员时，就需要为该类编写构造函数，在构造函数中对数据成员进行初始化。

对于c++98，如果一个类没有set方法，那么就需要为其创建含参数的构造函数，如下所示：

```cpp
#include <iostream>

class Widget
{
public:
    Widget(int width, int height):height_(height), width_(width){}
private:
    int height_;
    int width_;
};

int main()
{
    Widget w(1,1);
    return 0;
}
```

倘若此时不为其创建含参数的构造函数，那么此时创建的对象中的成员的值是随机的，显而易见，这样的创建出的对象是不好的。

```cpp
#include<iostream>
using namespace std;

class Widget
{
public:
    int getHeight() const{
        return height_;
    }

    int getWidth() const{
        return width_;
    }
private:
    int height_;
    int width_;
};

int main()
{
    Widget w;
    std::cout << w.getHeight()<<std::endl;
    std::cout << w.getWidth()<<std::endl;   
    return 0;
}
```

但是对于c++11之后的标准，成员的初始值可以在类中定义。

在这种场景下，所有该类创建出的对象将拥有相同的初始值。如果你希望创建出的对象的初始值可以是不相同的，那么还是需要添加含参数的构造函数。

```cpp
#include<iostream>
using namespace std;

class Widget
{
public:
    int getHeight() const{
        return height_;
    }

    int getWidth() const{
        return width_;
    }
private:
    int height_{1};
    int width_{1};
};

int main()
{
    Widget w;
    std::cout << w.getHeight()<<std::endl;
    std::cout << w.getWidth()<<std::endl;   
    return 0;
}
```


## 析构函数

构造函数的作用是帮助**销毁一个实例**。

首先看下面这个类，这个类需要写自定义析构函数吗？

```cpp
class Student{
public:
    Student(std::string name , int age, int id):name_(name), age_(age), id(id_){}；
    //需要析构函数吗？
public:
    std::string getName() const{
        return name_;
    }
    int getAge() const{
        return age_;
    }
    int getId() const{
        return id_;
    }
private:
    std::string name_;
    int age_;
    int id_;
}
```

答案是否定的，这个Student类只包含了三个成员，默认的析构函数会清理掉这些数据，因此不需要自定义析构函数。

再看看下面这个例子，需要为其自定义析构函数吗？

```cpp
class Student{
public:
    Student(const char* s , std::size_t n) ：name_(new char[n]);{
        memcpy(name_, s, n);
    }
    //需要析构函数吗？
public:
    char* getName() const{
        return name_;
    }

private:
    char* name_;
}
```

很显然，该类需要自定义析构函数。默认的析构函数只会将name_置为nullptr，而不会释放new所创建的内存空间。

因此上面的例子需要改造为下面这样的形式：

```cpp
class Student{
public:
    Student(const char* s , std::size_t n) ：name_(new char[n]);{
        memcpy(name_, s, n);
    }
    ~Student(){
        if(name_){
            delete[] name_;
        }
    }
    //需要析构函数吗？
public:
    char* getName() const{
        return name_;
    }

private:
    char* name_;
}
```

再看看下面这个例子，需要为其自定义析构函数吗？

```cpp
class AsyncExec{
public:
    void exec(std::function<void()>& func){
        threadPtr_ = new std::thread(func);
    }
    //需要析构函数吗？
private：
    std::thread* threadPtr_{nullptr};
}
```

很显然，该类也需要自定义析构函数。AsyncExec类的实例在调用完Exec方法后,其内部包含了一个指针，并且其成员是```std::thread```类型的指针，如果其没有被detach，那么就必须要进行join，否则将会terminate程序。

因此上面的例子需要改造为下面这样的形式：

```cpp
class AsyncExec{
public
    ~AsyncExec(){
        if(threadPtr){
            threadPtr->join;
        }
        delete threadPtr;
    }
public:
    void exec(std::function<void()>& func){
        threadPtr_ = new std::thread(func);
    }
    //需要析构函数吗？
private：
    std::thread* threadPtr_{nullptr};
}
```

通过上面两个例子，也基本可以发现这样的规律：

通常一个类需要管理一些资源时(原始指针，线程，文件描述符等)，通常需要为其编写自定义的析构函数，因为此时的默认的析构函数的行为是不正确的。

接下来需要了解一个著名的**rule of three定理**，如果一个类需要用户定义的析构函数、用户定义的复制构造函数或用户定义的复制赋值运算符三者中的一个，那么它几乎肯定需要这三个函数。

例如下面的例子

```cpp
#include <cstdint>
#include <cstring>

class Student{
public:
    Student(const char* s , std::size_t n) :name_(new char[n]){
        memcpy(name_, s, n);
    }
    explicit Student(const char* s = "")
        : Student(s, std::strlen(s) + 1) {}
    ~Student(){
        if(name_){
            delete[] name_;
        }
    }
public:
    char* getName() const{
        return name_;
    }

private:
    char* name_;
};

int main()
{
    Student s1("shirley");
    Student s2("tom");

    Student s3(s1);//(1)
    s2 = s1;//（2）
}
```

如果使用默认的复制构造函数，将会出现double free的错误。此时s1和s3的name_成员指向同一处内存，s1和s3析构时将重复析构。

如果使用默认的赋值运算符，不仅会有double free的问题，还会有一处内存泄漏。由于s2被赋值为了s1，因此s2原来的name_指向的内存将不再有指针指向，于是产生了内存泄漏。接下来，同理s1和s2的name_成员指向同一处内存，s1和s2析构时将重复析构。

正确的写法就是在添加自定义析构函数的同时，为其添加自定义的赋值构造函数和自定义的赋值运算符。
```cpp
#include <cstdint>
#include <cstring>

class Student{
public:
    Student(const char* s , std::size_t n) :name_(new char[n]){
        memcpy(name_, s, n);
    }
    explicit Student(const char* s = "")
        : Student(s, std::strlen(s) + 1) {}
    ~Student(){
        if(name_){
            delete[] name_;
        }
    }
    Student(const Student& other) // II. copy constructor
        : Student(other.name_) {}
 
    Student& operator=(const Student& other) // III. copy assignment
    {
        if (this == &other)
            return *this;
 
        std::size_t n{std::strlen(other.name_) + 1};
        char* new_cstring = new char[n];            // allocate
        std::memcpy(new_cstring, other.name_, n); // populate
        delete[] name_;                           // deallocate
        name_ = new_cstring;
 
        return *this;
    }
public:
    char* getName() const{
        return name_;
    }

private:
    char* name_;
};

int main()
{
    Student s1("shirley");
    Student s2("tom");

    Student s3(s1);
    s2 = s1;
}
```

赋值运算符中的这段代码的写法，在effective c++中有提到，这样做是为了保证异常安全性，这样的写法可以确保new的失败的情况下，不会对原有对象的数据进行破坏。

```cpp
    std::size_t n{std::strlen(other.name_) + 1};
    char* new_cstring = new char[n];            // allocate
    std::memcpy(new_cstring, other.name_, n); // populate
    delete[] name_;                           // deallocate
    name_ = new_cstring;
```


## 赋值构造函数和赋值运算符