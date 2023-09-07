---
category: 
- C++
---

# 深入理解c++特殊成员函数

在c++中，特殊成员函数有下面6个：
- 构造函数
- 析构函数
- 复制构造函数(拷贝构造函数)
- 赋值运算符(拷贝运算符)
- 移动构造函数(c++11引入)
- 移动运算符(c++11引入)

以Widget类为例，其特殊成员函数的签名如下所示：

```cpp
class Widget{
public:
    Widget();//构造函数
    ~Widget();//析构函数
    Widget(const Widget& rhs);//复制构造函数(拷贝构造函数)
    Widget& operator=(const Widget& rhs);//赋值运算符(拷贝运算符)
    Widget(Widget&& rhs);//移动构造函数
    Widget& operator=(Widget&& rhs);//移动运算符
}
```

每个方法都有哪些作用，又都有哪些注意点？ 

本文将针对这些方法，进行详细的讲解。

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

这很好理解，但是何时需要自定义析构函数呢？

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
    char* name_{nullptr};
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
    char* name_{nullptr};
}
```

其实这个类到目前为止还是有问题的，在下文中提到拷贝操作时会解释为什么。

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

通常一个类需要**管理一些资源时**(原始指针，线程，文件描述符等)，通常需要为其编写自定义的析构函数，因为此时的默认的析构函数的行为是不正确的。

接下来需要了解一个著名的**rule of three定理**，如果一个类需要用户**自定义的析构函数**、**用户定义的复制构造函数**或**用户定义的赋值运算符**三者中的一个，那么它几乎肯定需要这三个函数。

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

如果使用默认的复制构造函数，将会出现double free的错误。因为默认的复制构造函数是值拷贝，此时s1和s3的name_成员指向同一处内存，s1和s3析构时将重复析构。

如果使用默认的赋值运算符，不仅会有double free的问题，还会有一处内存泄漏。由于s2被赋值为了s1，因此s2原来的name_指向的内存将不再有指针指向，于是产生了内存泄漏。接下来，同理s1和s2的name_成员指向同一处内存，s1和s2析构时将重复析构。

正确的写法就是在添加自定义析构函数的同时，为其添加自定义的复制构造函数和自定义的赋值运算符。

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

赋值运算符中的这段代码的写法，在effective c++中有提到，这样做是为了保证**异常安全性**，这样的写法可以确保new的失败的情况下，不会对原有对象的数据进行破坏。

```cpp
    std::size_t n{std::strlen(other.name_) + 1};
    char* new_cstring = new char[n];            // allocate
    std::memcpy(new_cstring, other.name_, n); // populate
    delete[] name_;                           // deallocate
    name_ = new_cstring;
```

对于大三律(Rule of three)，这里想补充一下如果成员对象包含unique_ptr的情形，如下所示，析构函数可以使用default，但复制操作要自己定义。如不定义，则复制操作被delete。

例如常用的pImpl方法：

```cpp
#include <memory>
#include <string>

class Foo {
public:
    Foo();

    // 需要将~Foo的实现放入Foo.cpp中，避免出现delete imcomplete type错误
    ~Foo();

    // 1.定义了~Foo之后不会自动生成移动函数
    // 2.移动构造函数中因为会生成处理异常的代码，所以需要析构成员变量，也会造成delete imcomplete type问题，所以将实现放入Foo.cpp
    // 3.移动赋值函数中因为会先删除自己指向的Impl对象指针，也会造成delete imcomplete type问题，所以将实现放入Foo.cpp
    Foo(Foo&& rhs) noexcept;
    Foo& operator=(Foo&& rhs) noexcept;

    // 由于unique_ptr不支持复制，所以无法生成默认拷贝函数
    Foo(const Foo& rhs);
    Foo& operator=(const Foo& rhs);

    void setName(std::string name);
    const std::string& getName() const noexcept;

private:
    struct Impl;
    std::unique_ptr<Impl> m_upImpl;
};
```

```cpp
//Foo.cpp
struct Foo::Impl {
    std::string name;
};

Foo::Foo() : m_upImpl(new Impl) {}

Foo::~Foo() = default;

Foo::Foo(Foo&& rhs) noexcept = default;
Foo& Foo::operator=(Foo&& rhs) noexcept = default;

Foo::Foo(const Foo& rhs) : m_upImpl(new Impl) {
    *m_upImpl = *rhs.m_upImpl;
}

Foo& Foo::operator=(const Foo& rhs) {
    *m_upImpl = *rhs.m_upImpl;
    return *this;
}

void Foo::setName(std::string name) {
    m_upImpl->name = name;
}

const std::string& Foo::getName() const noexcept {
    return m_upImpl->name;
}
```

## 复制构造函数和赋值运算符

复制构造函数的作用是**使用一个已经存在的对象去创建一个新的对象**。

赋值运算符的作用是将**一个对象的所有成员变量**赋值给**另一个已经创建的对象**。

二者的区别在于一个是**创建一个新对象**，一个是**赋值给一个已经存在的对象**。

在下面的例子中，语法（1）就是调用复制构造函数， 语法（2）就是调用赋值运算符。

```cpp
{
    Student s1("shirley");
    Student s2("tom");

    Student s3(s1);//(1)复制构造函数
    s2 = s1;//(2)赋值运算符
}
```

下面我们回顾下面提到的Student类，看下正确的复制构造函数和赋值运算符的编写需要注意什么。

复制构造函数的功能相对简单，主要是成员的复制，如果存在类管理的指针，则需要进行深拷贝。

```cpp
Student(const Student& other) // II. copy constructor
    : Student(other.name_) {}
```

赋值运算符的编写的注意点相对较多。

- 首先要添加自我赋值判断。
- 其次由于赋值运算符是对一个已经存在的对象再次赋值，因此首先需要销毁原有对象的成员。
- 接着需要处理成员对象的赋值，如果存在类管理的指针，则需要进行深拷贝。
- 最后需要将```*this```进行返回，以便进行连续赋值。

```cpp
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
```

当你没有提供自定义的复制构造函数和赋值运算符时，编译器将创建默认的复制构造函数和赋值运算符，其将对成员进行**浅拷贝**。

如果你的类没有管理资源，那么浅拷贝可能是合适的。如果你的类是管理某些资源的（**原始指针**，**线程对象**，**文件描述符**等），那么大概率默认的复制构造函数和赋值运算符是不合适的。

但是要注意有时候，类成员虽然包含原始指针，但是并不代表该原始指针由该类管理。

例如下面的例子中，Client类中拥有handler_指针，但是该指针的生命周期并不由该类管理，该类仅仅是使用该指针，因此在这种场景下，浅拷贝就没有问题，默认的复制构造函数和赋值运算符就可以满足要求。

```cpp
#include <memory>
#include <functional>
#include <iostream>
#include <thread>
#include <future>

class IHandler
{
public:
    IHandler() = default;
    virtual ~IHandler() = default;
public:
    virtual void connect() = 0;
};

class TcpHandler  :public IHandler
{
public:
    TcpHandler() = default;
    virtual ~TcpHandler() = default;
public:
    void connect(){
        std::cout << "tcp connect" << std::endl;
    }
};

class UdpHandler : public IHandler
{
public:
    UdpHandler() = default;
    virtual ~UdpHandler() = default;
public:
    void connect() {
        std::cout << "udp connect" << std::endl;
    }
};

class Client{
public:
    Client(IHandler* handler):handler_(handler){};
    ~Client() = default;
public:
    void connect(){
        handler_->connect();
    }
private:
    IHandler* handler_{nullptr};
};

void process(IHandler* handler)
{
    if(!handler) return;

    Client client(handler);
    client.connect();
}
int main()
{
    IHandler* handler = new TcpHandler();
    process(handler);
    delete handler;
    handler = nullptr;
    handler = new UdpHandler();
    process(handler);   
    delete handler;
    handler = nullptr;
}
```

因此，在设计类的时候，需要注意类是否是管理资源还是仅仅是使用资源。如果是管理资源，那么大概率你需要自定义**复制构造函数**和**赋值运算符**。

这里再次会提到**rule of three定理**，通常情况下，如果你需要**自定义析构函数**的时候，大概率你就需要自定义**复制构造函数**和**赋值运算符**。

牢记这个点，当你在设计一个类时需要有这样的条件反射。

其实如果当你自定义了析构函数之后，默认的**复制构造函数**和**赋值运算符**就可以被delete，但是在c++98年代，这个点还没有被重视。到了c++11年代，因为考虑到旧代码的迁移困难，这个点还是没有继续支持。编译器选择对新支持的移动构造函数和移动运算符支持这个点上的考虑，即如果定义了析构函数，则默认的移动构造函数和移动运算符将会delete，这个点在下面还会继续讲解。

## 移动构造函数和移动运算符

**移动语义**在c++11之后大面积使用，它允许将一个对象的所有权从一个对象转移到另一个对象，而不需要进行数据的拷贝。 这种转移可以在对象生命周期的任意时刻进行，可以说是一种轻量级的复制操作。

而移动构造函数和移动运算符就是在类中支持移动语义的二个方法。

关于如何书写移动构造函数和移动运算符，这里参考微软的文档进行理解。

[移动构造函数和移动赋值运算符](https://learn.microsoft.com/zh-cn/cpp/cpp/move-constructors-and-move-assignment-operators-cpp?view=msvc-170)

下面的例子是用于管理内存缓冲区的 C++ 类 MemoryBlock。

```cpp
// MemoryBlock.h
#pragma once
#include <iostream>
#include <algorithm>

class MemoryBlock
{
public:

   // Simple constructor that initializes the resource.
   explicit MemoryBlock(size_t length)
      : _length(length)
      , _data(new int[length])
   {
      std::cout << "In MemoryBlock(size_t). length = "
                << _length << "." << std::endl;
   }

   // Destructor.
   ~MemoryBlock()
   {
      std::cout << "In ~MemoryBlock(). length = "
                << _length << ".";

      if (_data != nullptr)
      {
         std::cout << " Deleting resource.";
         // Delete the resource.
         delete[] _data;
      }

      std::cout << std::endl;
   }

   // Copy constructor.
   MemoryBlock(const MemoryBlock& other)
      : _length(other._length)
      , _data(new int[other._length])
   {
      std::cout << "In MemoryBlock(const MemoryBlock&). length = "
                << other._length << ". Copying resource." << std::endl;

      std::copy(other._data, other._data + _length, _data);
   }

   // Copy assignment operator.
   MemoryBlock& operator=(const MemoryBlock& other)
   {
      std::cout << "In operator=(const MemoryBlock&). length = "
                << other._length << ". Copying resource." << std::endl;

      if (this != &other)
      {
         // Free the existing resource.
         delete[] _data;

         _length = other._length;
         _data = new int[_length];
         std::copy(other._data, other._data + _length, _data);
      }
      return *this;
   }

   // Retrieves the length of the data resource.
   size_t Length() const
   {
      return _length;
   }

private:
   size_t _length; // The length of the resource.
   int* _data; // The resource.
};
```

**为MemoryBlock创建移动构造函数**

- 1.定义一个空的构造函数方法，该方法采用一个对类类型的右值引用作为参数，如以下示例所示：
```cpp
MemoryBlock(MemoryBlock&& other)
   : _data(nullptr)
   , _length(0)
{
}
```

- 2.在移动构造函数中，将源对象中的类数据成员添加到要构造的对象：

```cpp
_data = other._data;
_length = other._length;
```

- 3.将源对象的数据成员分配给默认值。 这可以防止析构函数多次释放资源（如内存）:

```cpp
other._data = nullptr;
other._length = 0;
```

**为MemoryBloc类创建移动赋值运算符**

- 1.定义一个空的赋值运算符，该运算符采用一个对类类型的右值引用作为参数并返回一个对类类型的引用，如以下示例所示：

```cpp
MemoryBlock& operator=(MemoryBlock&& other)
{
}
```

- 2.在移动赋值运算符中，如果尝试将对象赋给自身，则添加不执行运算的条件语句。

```cpp
if (this != &other)
{
}
```

- 3.在条件语句中，从要将其赋值的对象中释放所有资源（如内存）。

以下示例从要将其赋值的对象中释放 _data 成员：

```cpp
// Free the existing resource.
delete[] _data;
```

- 4.执行第一个过程中的步骤 2 和步骤 3 以将数据成员从源对象转移到要构造的对象：

```cpp
// Copy the data pointer and its length from the
// source object.
_data = other._data;
_length = other._length;

// Release the data pointer from the source object so that
// the destructor does not free the memory multiple times.
other._data = nullptr;
other._length = 0;
```

- 5.返回对当前对象的引用，如以下示例所示：

```cpp
return *this;
```

完整的MemoryBlock类如下所示：

```cpp
#include <iostream>
#include <algorithm>

class MemoryBlock
{
public:

   // Simple constructor that initializes the resource.
   explicit MemoryBlock(size_t length)
      : _length(length)
      , _data(new int[length])
   {
      std::cout << "In MemoryBlock(size_t). length = "
                << _length << "." << std::endl;
   }

   // Destructor.
   ~MemoryBlock()
   {
      std::cout << "In ~MemoryBlock(). length = "
                << _length << ".";

      if (_data != nullptr)
      {
         std::cout << " Deleting resource.";
         // Delete the resource.
         delete[] _data;
      }

      std::cout << std::endl;
   }

   // Copy constructor.
   MemoryBlock(const MemoryBlock& other)
      : _length(other._length)
      , _data(new int[other._length])
   {
      std::cout << "In MemoryBlock(const MemoryBlock&). length = "
                << other._length << ". Copying resource." << std::endl;

      std::copy(other._data, other._data + _length, _data);
   }

   // Copy assignment operator.
   MemoryBlock& operator=(const MemoryBlock& other)
   {
      std::cout << "In operator=(const MemoryBlock&). length = "
                << other._length << ". Copying resource." << std::endl;

      if (this != &other)
      {
          // Free the existing resource.
          delete[] _data;

          _length = other._length;
          _data = new int[_length];
          std::copy(other._data, other._data + _length, _data);
      }
      return *this;
   }
    // Move constructor.
    MemoryBlock(MemoryBlock&& other) noexcept
    : _data(nullptr)
    , _length(0)
    {
        std::cout << "In MemoryBlock(MemoryBlock&&). length = "
                    << other._length << ". Moving resource." << std::endl;

        // Copy the data pointer and its length from the
        // source object.
        _data = other._data;
        _length = other._length;

        // Release the data pointer from the source object so that
        // the destructor does not free the memory multiple times.
        other._data = nullptr;
        other._length = 0;
    }

    // Move assignment operator.
    MemoryBlock& operator=(MemoryBlock&& other) noexcept
    {
        std::cout << "In operator=(MemoryBlock&&). length = "
                    << other._length << "." << std::endl;

        if (this != &other)
        {
            // Free the existing resource.
            delete[] _data;

            // Copy the data pointer and its length from the
            // source object.
            _data = other._data;
            _length = other._length;

            // Release the data pointer from the source object so that
            // the destructor does not free the memory multiple times.
            other._data = nullptr;
            other._length = 0;
        }
        return *this;
    }
   // Retrieves the length of the data resource.
   size_t Length() const
   {
        return _length;
   }

private:
   size_t _length; // The length of the resource.
   int* _data; // The resource.
};
```

值得一提的是，有时候为了减少重复代码，在移动构造函数中也可以调用移动运算符，不过需要确保这样做不会有什么问题。

```cpp
// Move constructor.
MemoryBlock(MemoryBlock&& other) noexcept
   : _data(nullptr)
   , _length(0)
{
    *this = std::move(other);
}
```

下面要介绍的是，如果一个类自定了析构函数，赋值构造函数，赋值运算符三者之一，则默认的移动构造和移动运算符将不会生成，而是转为**调用复制构造函数/赋值运算符**。

例如，MemoryBlock自定了析构函数，赋值构造函数，赋值运算符，于是默认的移动构造和移动运算符就会被delete。

即便你使用了```MemoryBlock m2(std::move(m1));```，其仍然调用的是复制构造函数。

```cpp
#include <iostream>
#include <algorithm>

class MemoryBlock
{
public:

   // Simple constructor that initializes the resource.
   explicit MemoryBlock(size_t length)
      : _length(length)
      , _data(new int[length])
   {
      std::cout << "In MemoryBlock(size_t). length = "
                << _length << "." << std::endl;
   }

   // Destructor.
   ~MemoryBlock()
   {
      std::cout << "In ~MemoryBlock(). length = "
                << _length << ".";

      if (_data != nullptr)
      {
         std::cout << " Deleting resource.";
         // Delete the resource.
         delete[] _data;
      }

      std::cout << std::endl;
   }

   // Copy constructor.
   MemoryBlock(const MemoryBlock& other)
      : _length(other._length)
      , _data(new int[other._length])
   {
      std::cout << "In MemoryBlock(const MemoryBlock&). length = "
                << other._length << ". Copying resource." << std::endl;

      std::copy(other._data, other._data + _length, _data);
   }

   // Copy assignment operator.
   MemoryBlock& operator=(const MemoryBlock& other)
   {
      std::cout << "In operator=(const MemoryBlock&). length = "
                << other._length << ". Copying resource." << std::endl;

      if (this != &other)
      {
         // Free the existing resource.
         delete[] _data;

         _length = other._length;
         _data = new int[_length];
         std::copy(other._data, other._data + _length, _data);
      }
      return *this;
   }

   // Retrieves the length of the data resource.
   size_t Length() const
   {
      return _length;
   }

private:
   size_t _length; // The length of the resource.
   int* _data; // The resource.
};

int main()
{
    MemoryBlock m1(10);
    MemoryBlock m2(std::move(m1));
}
```

因此这就诞生了另一个著名定理**rule of five定理**。即如果你需要自定义移动构造函数和移动运算符，那么大概率你需要自定义5个特殊函数(析构函数，复制构造函数，赋值运算符，移动构造函数，移动运算符)。

这里顺便再提到另一个**rule of zero**定理，

- 1.类不应定义任何特殊函数（复制/移动构造函数/赋值和析构函数），除非它们是专用于资源管理的类。

此举为了满足设计上的单一责任原则，将数据模块与功能模块在代码层面分离，降低耦合度。

```cpp
class rule_of_zero
{
    std::string cppstring;
public:
    rule_of_zero(const std::string& arg) : cppstring(arg) {}
};
```

- 2.基类作为管理资源的类在被继承时，析构函数可能必须要声明为public virtual，这样的行为会破坏移动复制构造，因此，如果基类在此时的默认函数应设置为default。

此举为了满足多态类在C ++核心准则中禁止复制的编码原则。

```cpp
class base_of_five_defaults
{
public:
    base_of_five_defaults(const base_of_five_defaults&) = default;
    base_of_five_defaults(base_of_five_defaults&&) = default;
    base_of_five_defaults& operator=(const base_of_five_defaults&) = default;
    base_of_five_defaults& operator=(base_of_five_defaults&&) = default;
    virtual ~base_of_five_defaults() = default;
};
```

关于这个点，还是需要一个例子来加深印象：

```cpp
#include <iostream>
#include <algorithm>
#include <vector>

class A{
public:
    A() {
        std::cout << "A()" << std::endl;
    };
    ~A() = default;
    A(const A& other){
        std::cout << "A(const A& other)" << std::endl;
    }
    A& operator=(const A& other){
        std::cout << "operator=(const A& other)" << std::endl;
        return *this;
    }
    A(A&& other){
        std::cout << "A(A&& other)" << std::endl;
    }
    A& operator=(A&& other){
        std::cout << "operator=(A&& other)" << std::endl;
        return *this;
    }
};

class DataMgr {
public:
    DataMgr(){
        val_.reserve(10);
    }
    virtual ~DataMgr() = default;
    // DataMgr(const DataMgr& other) = default;
    // DataMgr& operator=(const DataMgr& other) = default;
    // DataMgr(DataMgr&& other) = default;
    // DataMgr& operator=(DataMgr&& other) = default;

public:
    void push(A& a){
        val_.emplace_back(a);
    }
private:
    std::vector<A> val_;              //同之前一样
};

int main()
{
    A a1, a2;
    DataMgr s1;
    s1.push(a1);
    s1.push(a2);
    std::cout << "========" << std::endl;
    DataMgr s2 ;
    s2 = std::move(s1);
}
```

这里的运行结果如下所示：

```shell
A()
A()
A(const A& other)
A(const A& other)
========
A(const A& other)
A(const A& other)
```

尽管使用了```s2 = std::move(s1)```这里使用了移动语义，然而由于定义了析构函数，移动操作被delete，导致了调用了复制构造。试想如果这里的val_的数据量很大，那么程序的运行效率将会相差很大。

## 总结
- 特殊成员函数是编译器可能自动生成的函数，它包括下面六种, 构造函数，析构函数，复制构造函数，赋值运算符，移动构造函数，移动运算符。
- 对于构造函数而言，如果需要自定义初始化成员的方式，则不能使用默认的构造函数，需要编写自定义构造函数。
- 对于析构函数而言，如果其内部管理了资源(原始指针，文件描述符，线程等等)，则通常需要编写自定义的析构函数。如果只是借用资源，通常使用默认析构函数就可以。
- 根据rule of three，如果你自定义了析构函数，大概率你也需要自定义复制构造函数和赋值运算符。
- 默认移动操作仅当类没有显式声明移动操作，复制操作，析构函数时才自动生成。如果你定义了析构函数或者复制操作，此时的移动操作会调用复制构造函数。
```cpp
#include <memory>
class A
{
public:
    A(){}
    ~A(){}
    A(const A& other){}
    A& operator=(const A& other){}
    //只定义了析构，复制构造，赋值运算符
    //默认的移动构造和移动运算符不会生成，但并没有被delete的，而是转为调用复制操作
};
int main()
{
    A a1,a2;
    A a3(std::move(a1));
    a2 = std::move(a1);
    //无编译错误
}
```
- 如果一个类没有显示定义复制构造却显示定义了移动构造，则复制构造函数被delete。同理如果一个类没有显示定义赋值运算符却显示定义了移动运算符，则赋值运算符数被delete。
```cpp
class A
{
public:
    A(){}
    ~A{}{}
    A(A&& other){}
    A& operator=(A&& other){}
    //只定义了析构，移动构造，移动运算符
    //复制构造和复制运算符被delete的
};
int main()
{
    A a1,a2;
    A a3(a1);
    a2 = a1;
    //有编译错误
}
```

- 日常开发中，应尽量使用=default来指明是否需要生成默认的复制/移动操作的方法，这会使得这些特殊函数的生成很清晰。