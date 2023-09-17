---
category: 
- C++
---

# std::optional的使用与实现

## 使用



## 实现原理

Optional为任意的数据类型添加了空的语义。实际就是对原始的类型进行包装，为其添加一个bool变量，表明是否已经初始化。一个最直接的想法就是下面的形式：

```cpp
template<typename T>
class Optional
{
private:
    bool m_hasInit{false};
    T data_;
}
```

上面的Optional类中已经包含了一个m_hasInit表明是否初始化。但是目前的问题是```T data_```无法表示一个还没有初始化的数据类型。

一个改进的想法是使用char数组申请一个内存大小为N的内存区域，然后使用placement new进行对象构建。

```cpp
template<typename T, std::size_t N>
class Optional
{
private:
    bool m_hasInit{false};
    char data_[N];
}
```

但是这里还有一个问题，由于```char data_[N]```的有效对齐值为1，与T的对齐值可能不一致，这可能与造成一些效率问题。

```cpp
char data_[N];
new [&data] T()
```

基于上述问题的思考， optional的一个可能的形式如下所示，这里使用```std::aligned_storage```去申请一块大小为sizeof(T)的栈内存storage_，并且storage_的对齐值与T相同。

```cpp
template <typename T>
class optional {
    // ...
private:
    bool has_value_;
    std::aligned_storage<sizeof(T), std::alignment_of<T>::value> storage_;
}
```

有了这些，Optional就可以构建出来，下面是实现了一个简易的Optional。

```cpp
#include<type_traits>
#include<iostream>
#include<string>
#include<map>
using namespace std;
template<typename T>
class Optional
{
    using data_t = typename std::aligned_storage<sizeof(T), std::alignment_of<T>::value>::type;
public:
    Optional() : m_hasInit(false) {}
    Optional(const T& v)
    {
        Create(v);
    }
 
    Optional(T&& v) : m_hasInit(false)
    {
        Create(std::move(v));
    }
 
    ~Optional()
    {
        Destroy();
    }
 
    Optional(const Optional& other) : m_hasInit(false)
    {
        if (other.IsInit())
            Assign(other);
    }
 
    Optional(Optional&& other) : m_hasInit(false)
    {
        if (other.IsInit())
        {
            Assign(std::move(other));
            other.Destroy();
        }
    }
 
    Optional& operator=(Optional &&other)
    {
        Assign(std::move(other));
        return *this;
    }
 
    Optional& operator=(const Optional &other)
    {
        Assign(other);
        return *this;
    }
 
    template<class... Args>
    void emplace(Args&&... args)
    {
        Destroy();
        Create(std::forward<Args>(args)...);
    }
 
    bool IsInit() const { return m_hasInit; }
 
    explicit operator bool() const {
        return IsInit();
 
    }
 
    T& operator*()
    {
        if (IsInit())
        {
            return *((T*)(&m_data));
        }
 
        throw std::logic_error("is not init");
    }
 
    T const& operator*() const
    {
        if (IsInit())
        {
            return *((T*)(&m_data));
        }
 
        throw std::logic_error("is not init");
    }
 
    bool operator == (const Optional<T>& rhs) const
    {
        return (!bool(*this)) != (!rhs) ? false : (!bool(*this) ? true : (*(*this)) == (*rhs));
    }
 
    bool operator < (const Optional<T>& rhs) const
    {
        return !rhs ? false : (!bool(*this) ? true : (*(*this) < (*rhs)));
    }
 
    bool operator != (const Optional<T>& rhs)
    {
        return !(*this == (rhs));
    }
private:
    template<class... Args>
    void Create(Args&&... args)
    {
        new (&m_data) T(std::forward<Args>(args)...);
        m_hasInit = true;
    }
 
    void Destroy()
    {
        if (m_hasInit)
        {
            m_hasInit = false;
            ((T*)(&m_data))->~T();
        }
    }
 
    void Assign(const Optional& other)
    {
        if (other.IsInit())
        {
            Copy(other.m_data);
            m_hasInit = true;
        }
        else
        {
            Destroy();
        }
    }
 
    void Assign(Optional&& other)
    {
        if (other.IsInit())
        {
            Move(std::move(other.m_data));
            m_hasInit = true;
            other.Destroy();
        }
        else
        {
            Destroy();
        }
    }
 
    void Move(data_t&& val)
    {
        Destroy();
        new (&m_data) T(std::move(*((T*)
 
            (&val))));
    }
 
    void Copy(const data_t& val)
    {
        Destroy();
        new (&m_data) T(*((T*)(&val)));
    }
 
private:
    bool m_hasInit;
    data_t m_data;
};
 
class MyClass{
public:
    MyClass(int a, int b) :
        x_(a), y_(b){};
    void print(){
        cout << "x_ = " << x_ << endl;
        cout << "y_ = " << y_ << endl;
    }
private:
    int x_;
    int y_;
};
void TestOptional()
{
    Optional<string> a("ok");
    Optional<string> b("ok");
    Optional<string> c("aa");
    c = a;
 
    if (c<a)
        cout << '<' << endl;
 
    if (a == b)
        cout << '=' << endl;
 
    map<Optional<string>, int> mymap;
    mymap.insert(std::make_pair(a, 1));
    mymap.insert(std::make_pair(c, 2));
 
    auto it = mymap.find(a);
    cout << it->second << endl;
 
    Optional<MyClass> d;
    d.emplace(10, 20);
    (*d).print();
}
 
int main(){
    TestOptional();
    return 0;
}
```