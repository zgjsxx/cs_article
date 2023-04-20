---
category: 
- C++
---


# c++中单例模式总结

通常而言，c++的单例模式通常有如下一些实现办法：
- 普通懒汉
- 加锁懒汉
- 静态内部变量
- 饿汉单例
- std::call_once单例


## 普通懒汉

对于普通懒汉：
- **构造函数和析构函数**应该为**private**类型，禁止外部构造和析构
- **拷贝构造函数**和**赋值运算符**应为**private**类型或者加上** = delete**标记，禁止外部拷贝和赋值，确保单例的唯一性
- Singleton的有一个静态的函数getInstance用于获取静态对象。
  
```cpp
#include <iostream>

class Singleton
{
public:
    static Singleton* getInstance();
    static void destroy();

public:
    Singleton(const Singleton& instance) = delete;
    const Singleton& operator=(const Singleton& instance) = delete;

private:
    Singleton();
    ~Singleton();
private:
    static Singleton* m_singletonInstance;
};

Singleton* Singleton::m_singletonInstance = nullptr;

Singleton* Singleton::getInstance()
{
    if(nullptr == m_singletonInstance)
    {
        m_singletonInstance = new Singleton; 
    }
    return m_singletonInstance;
}

void Singleton::destroy()
{
    if(m_singletonInstance)
    {
        delete m_singletonInstance;
        m_singletonInstance = nullptr;
    }
}
Singleton::Singleton()
{
    std::cout << "create instance" << std::endl;
}

Singleton::~Singleton()
{
    std::cout << "destroy instance" << std::endl;
}

int main()
{
    Singleton* instance = Singleton::getInstance();
    instance->destroy();
}
```

普通懒汉会有很明显的线程安全问题，不能严格地做到单例。

![普通懒汉的线程安全问题](https://github.com/zgjsxx/static-img-repo/raw/main/blog/language/cplusplus/cpp_singleton_summarize/intro.png)

## 加锁懒汉

加锁懒汉的最经典的实现是Double-Checked Locking Pattern (DCLP)，如下所示：

```cpp
#include <iostream>
#include <mutex>

class Singleton
{
public:
    static Singleton* getInstance();
    static void destroy();

public:
    Singleton(const Singleton& instance) = delete;
    const Singleton& operator=(const Singleton& instance) = delete;

private:
    Singleton();
    ~Singleton();
private:
    static Singleton* m_singletonInstance;
    static std::mutex m_Mutex;
};

Singleton* Singleton::m_singletonInstance = nullptr;
std::mutex Singleton::m_Mutex;

Singleton* Singleton::getInstance()
{
    if(nullptr == m_singletonInstance)
    {
        std::unique_lock<std::mutex> lk(m_Mutex);
        if(nullptr == m_singletonInstance)
        {
            m_singletonInstance = new Singleton; 
        }

    }
    return m_singletonInstance;
}

void Singleton::destroy()
{
    std::unique_lock<std::mutex> lk(m_Mutex);
    if(m_singletonInstance)
    {
        delete m_singletonInstance;
        m_singletonInstance = nullptr;
    }
}
Singleton::Singleton()
{
    std::cout << "create instance" << std::endl;
}

Singleton::~Singleton()
{
    std::cout << "destroy instance" << std::endl;
}

int main()
{
    Singleton* instance = Singleton::getInstance();
    instance->destroy();
}
```

在单例创建时，使用了mutex进行加锁操作，可以一定程度上保证线程安全。但是要注意这种方式也不能完全保证线程安全。

可以使用volatile进行优化

## 静态内部变量

```cpp
#include <iostream>
#include <mutex>

class Singleton
{
public:
    static Singleton& getInstance();

public:
    Singleton(const Singleton& instance) = delete;
    const Singleton& operator=(const Singleton& instance) = delete;

private:
    Singleton();
    ~Singleton();

};


Singleton& Singleton::getInstance()
{
    static Singleton singleton;
    return singleton;
}


Singleton::Singleton()
{
    std::cout << "create instance" << std::endl;
}

Singleton::~Singleton()
{
    std::cout << "destroy instance" << std::endl;
}

int main()
{
    Singleton& instance = Singleton::getInstance();
}
```

## 饿汉单例

```cpp
#include <iostream>

class Singleton
{
public:
    static Singleton* getInstance();
    static void destroy();

public:
    Singleton(const Singleton& instance) = delete;
    const Singleton& operator=(const Singleton& instance) = delete;

private:
    Singleton();
    ~Singleton();
private:
    static Singleton* m_singletonInstance;
};

Singleton* Singleton::m_singletonInstance = new Singleton;

Singleton* Singleton::getInstance()
{
    return m_singletonInstance;
}

void Singleton::destroy()
{
    if(m_singletonInstance)
    {
        delete m_singletonInstance;
        m_singletonInstance = nullptr;
    }
}
Singleton::Singleton()
{
    std::cout << "create instance" << std::endl;
}

Singleton::~Singleton()
{
    std::cout << "destroy instance" << std::endl;
}

int main()
{
    Singleton* instance = Singleton::getInstance();
    instance->destroy();
}
```
## std::call_once单例



参考文章：
https://www.cnblogs.com/xiaolincoding/p/11437231.html

https://blog.csdn.net/u011726005/article/details/82356538

https://blog.csdn.net/bdss58/article/details/44813597