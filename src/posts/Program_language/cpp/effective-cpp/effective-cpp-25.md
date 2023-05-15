---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 25 考虑写一个不抛出任何异常的swap函数

本节的内容比较长， 一步一步讲解了如何实现一个不抛任何异常的swap函数。

## 分析
我们可以调用std下的swap函数，这是一个模板函数：既可以：
```cpp
    int a = 1;
    int b = 2;
    std::swap(a,b);
    cout<<"a = "<<a<<" b = "<<b<<endl;
```
也可以（前提这个类型支持复制构造函数和赋值构造函数）：
```cpp
class Test
{
public:
    Test(int i):val(i){}
    int getVal(){return val;}
private:
    int val;
};

    Test a(1);
    Test b(2);
    std::swap(a,b);
    cout<<"a = "<<a.getVal()<<" b = "<<b.getVal()<<endl;
    return 0;
```
这个函数是是同通过类似```int tmp = a; a = b; b = tmp```的方法实现的，所以，如果类中的数据成员较多，这样的交换缺乏效率。
相比之下，“以指针指向一个对象，内含真正的数据”的方法更受欢迎。比如pimpl（pointer to implementation）。然后交换它们的指针。按照这种方法，我们应该这样设计我们的类：
```cpp
//类的具体实现
class TestImpl
{
public:
    TestImpl(int i):ival(i){}
    int getVal(){return ival;}
    
private:
    int ival;
};

//指针
class Test
{
public:
    Test(int i):p(new TestImpl(i)){}
    ~Test(){delete p;}
    Test operator=(const Test rhs)
    {
        *p = *(rhs.p);
    }
    int getVal()
    {
        return this->p->getVal();
    }
    void swap(Test& other)
    {
        using std::swap;
        swap(p,other.p);
    }
private:
    TestImpl *p;
};
```
我们在Test类中，同过调用std::swap完成了指针的交换。为了是得我们的swap更像是std中的swap函数，我们将std中的swap特化：
```cpp
namespace std
{
    template<>
    void swap<Test>(Test &a,Test &b)
    {
        a.swap(b);
    }
}
```
特化版本调用的就是类成员函数中的swap。


但是，如果Test和TestImpl都是类模板
```cpp
//类的具体实现
template <typename T1>
class TestImpl
{
public:
    TestImpl(T1 i):ival(i){}
    virtual T1 getVal(){return ival;}
    
private:
    T1 ival;
};

//指针
template <typename T1>
class Test
{
public:
    Test(T1 i):p(new TestImpl(i)){}
    ~Test(){delete p;}
    Test operator=(const Test rhs)
    {
        *p = *(rhs.p);
    }
    T1 getVal()
    {
        return this->p->getVal();
    }
    void swap(Test& other)
    {
        using std::swap;
        swap(p,other.p);
    }
private:
    TestImpl *p;
};
```
那么我们似乎需要这么改写原先的交换函数：
```cpp
namespace std
{
    template<typename T1>
    void swap<Test<T1>>(Test<T1> &a,Test<T1> &b)
    {
        a.swap(b);
    }
}
```
但这并不合法，因为C++规定，不能偏特化一个函数模版。而这里却将swap的类型特化为了Test<T1> &。

有没有好的办法呢？其实很简单，只要把原来的函数重载就行了。
```cpp
    template<typename T>
    void swap(Test<T>& a, Test<T>& b)
    {
        a.swap(b);
    }
```

剩下的问题就是吧这个函数放在哪里了？首先，设为全局函数是非常不好的，因为我们很有可能会经常调用swap函数的“平凡”版本。所以放在命名空间中是一 个不错的选择。但是有两点需要注意：1.这个命名空间中也必须包括我们定义的模板类。2.不要放在std空间内。虽然放进去也能使用，但是std是C++ 标准委员会定义的，为了方便别人的使用，咱们还是放在咱们自己定义的空间中吧。


现在的考虑另一种情况：假如你在一个函数模板中需要调用swap函数，该怎么做呢？首先，你希望的情况是：最好调用专属的swap，如果不存在，那么调用std下的swap：
```cpp
template <typename T>
void doSomething(T& obj1, T& obj2)
{
    //其他操作省略
    using std::swap;
    swap(obj1,obj2);
}

```
那么，根据名字查找规则，则会通过argument-dependent look先找出命名空间内的重载的swap，如果找不到，则再调用std内的。这里的using声明的作用只是让这个函数“曝光”，至于用不用，则是另一 码事。但是如果你写成了```using std::swap(obj1,obj2);```就表明你肯定是要用std下的swap了。

## 总结
- 当std::swap对你的类型效率不高时，提供一个swap成员函数，并确定函数不抛出异常
- 如果你提供一个member swap， 也该提供一个non-member swap用来调用前者。
- 调用swap时应针对std::swap使用using 声明式， 然后调用swap并且不带任何"命名空间资格修饰"
- 为"用户定义类型"进行std template全特化时好的，但千万不要尝试在std内加入某些std而言全新的东西。
