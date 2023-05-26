---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 52 写了placement new也要写placement delete

本文主要介绍了关于在类中自定义placement new和placement delete需要注意的一些点。该条款已经属于比较进阶的条款，在日常开发中使用频率不高，但是了解该条款也许有助于你去理解一些三方库或者是解一些比较隐匿的bug。

## 分析

**placement new**通常是专指指定了位置的```new(std::size_t size, void *mem)```，用于vector申请capacity剩余的可用内存。 但广义的**placement new**指的是拥有额外参数的operator new(重载版本)。

new和delete是要成对的，因为当构造函数抛出异常时用户无法得到对象指针，因而delete的责任在于C++运行时。 运行时需要找到匹配的delete并进行调用。因此当我们编写了**placement new**时，也应当编写对应的**placement delete**， 否则会引起内存泄露。在编写自定义new和delete时，还要避免不小心隐藏它们的正常版本。

### 成对的delete

当构造函数抛出异常时，C++会调用与new同样签名的delete来撤销new。但如果我们没有声明对应的delete，例如下面这个例子

```cpp
class Widget{
public:
    static void* operator new(std::size_t size, std::ostream& log) throw(std::bad_alloc);
    Widget(){ throw 1; }
};

try{
Widget *p = new(std::cerr) Widget;
}catch(...){ }
```

构造函数抛出了异常，C++运行时尝试调用```delete(void *mem, std::ostream& log)```， 但Widget没有提供这样的delete，于是C++不会调用任何delete，这将导致内存泄露。 所以在Widget中需要声明同样签名的delete，即在类中需要添加下面的签名：

```cpp
static void operator delete(void *mem, std::ostream& log);
```

下面的例子演示了这个点，在使用placement new构造的对象，在执行到构造函数抛出异常时，系统会调用对应签名的placement delete回收内存。

```cpp
#include <iostream>

class Widget{
public:
    int a;
    static void* operator new(std::size_t size, std::ostream& logstream) {
        std::cout << "call placement new func" << std::endl;
        return ::operator new(size);;
    }
    static void operator delete(void* pM) {
        ::operator delete(pM);
        std::cout << "call operator delete" << std::endl;
    }
    static void operator delete(void* pM, std::ostream& logstream){
        ::operator delete(pM);
        std::cout << "call placement delete" << std::endl;
    }
    Widget()
    {
        throw 1;
    }
};

int main(){
    Widget *p1 = nullptr;
    try{
        p1 = new(std::cerr) Widget();
    }catch(...){

    }

    return 0;
}
```

执行结果：
```
call placement new func
call placement delete
```

除此以外，用户还可能直接调用delete p，这时C++运行时不会把它解释为**placement delete**，这样的调用会使得Widget抛出异常。 所以在Widget中不仅要声明**placement delete**，还要声明一个正常的delete。

```cpp
class Widget{
public:
    static void* operator new(std::size_t size, std::ostream& log) throw(std::bad_alloc);
    static void operator delete(void *mem, std::ostream& log);
    static void operator delete(void *mem) throw();
    Widget(){ throw 1; }
};
```

这样，无论是构造函数抛出异常，还是用户直接调用delete p，内存都能正确地回收了。

总结下来，在类中自定义了placement new，也要自定义placement delete，二者需要成对出现。另外由于delete p这样的形式手动销毁对象绝对不会调用placement delete，因此如果自定义了placement new和placement delete，还要声明一个最原始的```delete(void* mem)```版本。

### 名称隐藏

在Item 33中提到，类中的名称会隐藏外部的名称，子类的名称会隐藏父类的名称。 所以当你声明一个**placement new**时：

```cpp
class Base{
public:
    static void* operator new(std::size_t size, std::ostream& log) throw(std::bad_alloc);
};
Base *p = new Base;     // Error!
Base *p = new (std::cerr) Base;     // OK
```

普通的new将会抛出异常，因为**placement new**隐藏了外部的**normal new**。同样地，当你继承时：

```cpp
class Derived: public Base{
public:
    static void* operator new(std::size_t size) throw(std::bad_alloc);
};

Derived *p = new (std::clog) Derived;       // Error!
Derived *p = new Derived;       // OK
```

这是因为子类中的**normal new**隐藏了父类中的**placement new**，虽然它们的函数签名不同。 但Item 33中提到，按照C++的名称隐藏规则会隐藏所有同名（name）的东西，和签名无关。

### 最佳实践

为了避免全局的"new"被隐藏，先来了解一下C++提供的三种全局"new"：

```cpp
void* operator new(std::size_t) throw(std::bad_alloc);      // normal new
void* operator new(std::size_t, void*) throw();             // placement new
void* operator new(std::size_t, const std::nothrow_t&) throw();     // 见 Item 49
```

为了避免隐藏这些全局"new"，你在创建自定义的"new"时，也分别声明这些签名的"new"并调用全局的版本。 为了方便，我们可以为这些全局版本的调用声明一个父类StandardNewDeleteForms：

```cpp
class StandardNewDeleteForms {
public:
  // normal new/delete
  static void* operator new(std::size_t size) throw(std::bad_alloc) { return ::operator new(size); }
  static void operator delete(void *pMemory) throw() { ::operator delete(pMemory); }

  // placement new/delete
  static void* operator new(std::size_t size, void *ptr) throw() { return ::operator new(size, ptr); }
  static void operator delete(void *pMemory, void *ptr) throw() { return ::operator delete(pMemory, ptr); }

  // nothrow new/delete
  static void* operator new(std::size_t size, const std::nothrow_t& nt) throw() { return ::operator new(size, nt); }
  static void operator delete(void *pMemory, const std::nothrow_t&) throw() { ::operator delete(pMemory); }
};
```

然后在用户类型Widget中```using StandardNewDeleteForms::new/delete```即可使得这些函数都可见：

```cpp
class Widget: public StandardNewDeleteForms {           // inherit std forms
public:
   using StandardNewDeleteForms::operator new;         
   using StandardNewDeleteForms::operator delete;     

   static void* operator new(std::size_t size, std::ostream& log) throw(std::bad_alloc);   // 自定义 placement new
   static void operator delete(void *pMemory, std::ostream& logStream) throw();            // 对应的 placement delete
};
```

## 总结

- 当你写一个placement operator new，请确定也写出了对应的placement operator delete。如果没有这样做，你的程序可能会发生隐微而时断的内存泄漏。
- 当你声明placement new和placement delete，请确定不要无意识地遮掩了它们的正常版本。