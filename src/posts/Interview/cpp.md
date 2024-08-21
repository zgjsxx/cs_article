---
category: 
- 面经
tag:
- c++面经
---

- [c++面经](#c面经)
  - [c++基础](#c基础)
    - [const关键字的作用](#const关键字的作用)
    - [const成员的初始化方法](#const成员的初始化方法)
    - [const成员引用如何初始化](#const成员引用如何初始化)
    - [委托构造和继承构造是什么？](#委托构造和继承构造是什么)
    - [const成员函数内部需要修改成员变量如何解决？](#const成员函数内部需要修改成员变量如何解决)
    - [虚函数的返回值可以不一样吗？](#虚函数的返回值可以不一样吗)
    - [dynamic\_cast失败会怎么样？](#dynamic_cast失败会怎么样)
    - [多重继承时，指向子类的指针转化为基类，指针会变吗?](#多重继承时指向子类的指针转化为基类指针会变吗)
    - [带有虚函数的多重继承的内存分布](#带有虚函数的多重继承的内存分布)
    - [static方法可以是const吗?](#static方法可以是const吗)
    - [请实现一个strcpy方法](#请实现一个strcpy方法)
    - [内存堆栈对比，分别有什么特点？它们的分配效率如何？](#内存堆栈对比分别有什么特点它们的分配效率如何)
    - [++i和i++哪个效率更高？](#i和i哪个效率更高)
    - [如何禁用拷贝构造函数](#如何禁用拷贝构造函数)
    - [std::future和std::promise的作用](#stdfuture和stdpromise的作用)
    - [位域是什么？有哪些注意点](#位域是什么有哪些注意点)
    - [c++11的新特性有哪些？](#c11的新特性有哪些)
  - [类和对象](#类和对象)
    - [什么是RTTI](#什么是rtti)
  - [STL](#stl)
    - [map和unordered\_map的区别? 各自使用场景是什么？](#map和unordered_map的区别-各自使用场景是什么)
  - [参考](#参考)

# c++面经

## c++基础

### const关键字的作用

const 关键字在C++中用于定义常量。它是一个非常重要的关键字，主要用于声明不可修改的变量、指针、引用和成员函数。使用 const 可以帮助防止意外修改数据，提高代码的安全性和可维护性。

**const 的主要用法和作用**

**1.常量变量:**

使用 const 声明的变量在初始化后不可被修改。这对于定义不可改变的值（如数学常量）特别有用。
```cpp
const int MAX_SIZE = 100;、
// MAX_SIZE 不能被修改
```

**2.常量指针**:

**指向常量的指针**: const 用于指针声明中，表示指针指向的数据不可修改。

```cpp
const int* ptr;
// *ptr 不能被修改，但 ptr 可以指向不同的地址
```

**常量的指针**: const 也可以放在指针前面，表示指针本身是常量，不可修改。

```cpp
int* const ptr;
// ptr 不能被修改，但 *ptr 可以被修改
```

**常量指针和常量数据**: 可以将 const 关键字应用于指针和指向的数据，表示指针和数据都不可修改。

```cpp
const int* const ptr;
// ptr 和 *ptr 都不能被修改
```

**3.常量参数**:

使用 const 可以保证函数参数在函数内部不会被修改，提高函数的安全性和可读性。

```cpp
void processData(const std::string& data) {
    // data 不能被修改
}
```

**4.常量成员函数:**

在类中，常量成员函数是不会修改类成员的函数，声明为 const 的成员函数可以保证不会改变对象的状态。

```cpp
class MyClass {
public:
    void display() const {
        // 不能修改类的成员变量
    }
private:
    int value;
};
```

**5.常量返回值:**

函数返回 const 值，表示返回的值不能被修改。这通常用于防止修改返回对象的成员。

```cpp
const std::string& getName() const {
    return name;
}
```

**使用 const 的好处**
- 提高安全性: const 关键字可以防止数据被意外或错误地修改，从而提高代码的稳定性。
- 增强可读性: 明确表明某些数据或对象不应该被修改，使代码更易于理解和维护。
- 优化编译: 编译器可以利用 const 信息进行优化，因为它知道某些数据在代码运行期间不会变化。

**总结**

const 是C++中的一个重要关键字，广泛用于定义常量、常量指针、常量引用、常量成员函数等。它不仅有助于防止数据的意外修改，还提高了代码的安全性和可读性。在设计类和函数接口时合理使用 const 可以帮助创建更可靠和维护友好的代码。

### const成员的初始化方法

- 构造函数的初始化列表中初始化

```cpp
class MyClass {
private:
    const int myConst;

public:
    // 构造函数的初始化列表中初始化const成员
    MyClass(int value) : myConst(value) {
        // 构造函数体中不能再对myConst赋值
    }

    void display() const {
        std::cout << "The value of myConst is: " << myConst << std::endl;
    }
};
```

- 直接在成员定义时初始化(c++11)

```c
class MyClass {
private:
    const int myConst = 42;  // 直接在类定义中初始化

public:
    MyClass() {
        // 构造函数中不需要再初始化myConst
    }

    void display() const {
        std::cout << "The value of myConst is: " << myConst << std::endl;
    }
};
```


### const成员引用如何初始化

在C++中，const成员引用必须在构造函数的初始化列表中进行初始化。这是因为引用一旦绑定到某个对象或变量上，就不能再指向别的对象或变量，因此必须在对象创建时明确绑定到某个对象上。

```cpp
#include <iostream>

class MyClass {
private:
    const int& ref;  // const成员引用

public:
    // 构造函数，使用初始化列表初始化ref
    MyClass(const int& r) : ref(r) {
    }

    void display() const {
        std::cout << "The value of ref is: " << ref << std::endl;
    }
};

int main() {
    int value = 42;
    MyClass obj(value);  // 创建对象时传入引用的变量
    obj.display();  // 输出：The value of ref is: 42

    return 0;
}
```

### 委托构造和继承构造是什么？

在C++中，委托构造和继承构造是两种与构造函数相关的技术，它们用于简化代码和提高代码复用性，尤其是在处理构造函数链时。

**1. 委托构造（Delegating Constructors）**

委托构造是指一个构造函数调用同一个类中另一个构造函数来完成对象的初始化。这在C++11标准中引入，是为了减少重复代码并简化构造函数的实现。

示例代码

```cpp
class MyClass {
public:
    MyClass(int x, int y) : a(x), b(y) {
        // 初始化其他成员或执行其他操作
    }

    // 委托构造函数，只接受一个参数
    MyClass(int x) : MyClass(x, 0) { // 委托给另一个构造函数
        // 这里可以添加额外的初始化代码
    }

private:
    int a, b;
};
```

在上面的例子中，MyClass(int x)构造函数委托给MyClass(int x, int y)构造函数。通过这种方式，MyClass(int x)可以复用已有的初始化逻辑，而不必重复编写代码。

**优点**

- 减少重复代码：如果多个构造函数具有相同或类似的初始化逻辑，可以通过委托构造减少代码重复。
- 简化维护：逻辑集中在一个地方，使得代码更容易维护。

**2. 继承构造（Inherited Constructors）**

继承构造是指在派生类中使用基类的构造函数，而不需要在派生类中重新定义这些构造函数。C++11引入了这一特性，使得派生类可以直接继承基类的构造函数，从而简化派生类的代码。

示例代码

```cpp
class Base {
public:
    Base(int x) : a(x) {}
    Base(int x, int y) : a(x), b(y) {}

private:
    int a, b;
};

class Derived : public Base {
public:
    using Base::Base;  // 继承基类的构造函数
};

int main() {
    Derived obj1(10);      // 使用 Base(int x) 构造函数
    Derived obj2(10, 20);  // 使用 Base(int x, int y) 构造函数
}
```

在这个例子中，Derived类继承了Base类的构造函数，这意味着可以像使用Base构造函数一样来创建Derived对象，而不需要在Derived中手动定义这些构造函数。

**优点**
- 代码复用：派生类无需重新实现基类的构造函数，直接复用基类已有的构造函数逻辑。
- 简化代码：减少在派生类中定义构造函数的代码量。

**3. 委托构造和继承构造的区别**

- 委托构造：是同一个类内部构造函数之间的调用。它允许一个构造函数委托另一个构造函数来执行部分或全部初始化工作。
- 继承构造：是派生类直接使用基类的构造函数。它允许派生类无需重新实现基类的构造函数，而直接使用它们。

**总结**
- 委托构造：用于在同一个类中，减少构造函数间的重复代码，使得构造函数可以相互调用。
- 继承构造：用于在派生类中，直接复用基类的构造函数，简化派生类的代码编写。

这两种技术都为代码复用和简化提供了有效的手段，在实际开发中能够显著提高代码的可读性和可维护性。

### const成员函数内部需要修改成员变量如何解决？

- 使用mutable关键字

mutable关键字可以用于类的成员变量，使得这个变量即使在const成员函数中也可以被修改。

例子：使用mutable在const成员函数中修改成员变量

```cpp
#include <iostream>

class MyClass {
private:
    mutable int mutableCounter;  // 可变成员，即使在const函数中也可以修改
    int normalCounter;

public:
    MyClass() : mutableCounter(0), normalCounter(0) {}

    void incrementCounters() const {
        mutableCounter++;  // 可以修改，因为mutableCounter是mutable的
        // normalCounter++;  // 错误：不能修改非mutable的成员
    }

    void displayCounters() const {
        std::cout << "Mutable Counter: " << mutableCounter << std::endl;
        std::cout << "Normal Counter: " << normalCounter << std::endl;
    }
};

int main() {
    MyClass obj;
    obj.incrementCounters();  // 调用const成员函数
    obj.displayCounters();  // 输出：Mutable Counter: 1, Normal Counter: 0

    return 0;
}
```

- 使用const_cast进行类型转换

const_cast是C++中的一种类型转换操作符，它可以用于去除对象的const属性，从而允许修改const对象的成员。但这种方法应该谨慎使用，因为它可能破坏const的语义，导致代码的可维护性和可读性下降。

示例：使用const_cast去除const属性

```cpp
#include <iostream>

class MyClass {
private:
    int counter;

public:
    MyClass() : counter(0) {}

    void incrementCounter() const {
        // 使用const_cast去除this指针的const属性，允许修改counter
        const_cast<MyClass*>(this)->counter++;
        // 使用一个指针指向该成员，使用const_cast去除const属性
        int* temp =const_cast<int*>(&counter);
        (*temp)++;
    }

    void displayCounter() const {
        std::cout << "Counter: " << counter << std::endl;
    }
};

int main() {
    MyClass obj;
    obj.incrementCounter();  // 调用const成员函数
    obj.displayCounter();  // 输出：Counter: 1

    return 0;
}
```

在这个例子中，incrementCounter 是一个 const 成员函数，但通过 const_cast，我们可以去除 this 指针的 const 属性，从而修改 counter 成员变量。

注意：这种方法应谨慎使用，只有在明确知道这样做是安全的情况下才使用 const_cast。如果滥用它，可能会导致难以发现的错误和未定义行为。

### 虚函数的返回值可以不一样吗？

在C++中，虚函数的返回值可以有所不同，但只能在特定情况下实现。通常情况下，虚函数在基类和派生类中的返回类型必须是相同的，但有一个例外：协变返回类型（covariant return types）。

协变返回类型
协变返回类型允许派生类中的虚函数返回类型与基类中的虚函数返回类型不同，但前提是派生类的返回类型必须是基类返回类型的派生类。换句话说，派生类中的返回类型必须是基类中返回类型的“子类型”。

示例：协变返回类型

```cpp
#include <iostream>

class Base {
public:
    virtual Base* clone() const {
        std::cout << "Base clone" << std::endl;
        return new Base(*this);
    }

    virtual ~Base() = default;
};

class Derived : public Base {
public:
    // 返回类型是Base*的派生类型Derived*
    Derived* clone() const override {
        std::cout << "Derived clone" << std::endl;
        return new Derived(*this);
    }
};

int main() {
    Base* base = new Base();
    Base* derived = new Derived();

    Base* baseClone = base->clone();  // 调用Base的clone方法
    Base* derivedClone = derived->clone();  // 调用Derived的clone方法

    delete base;
    delete derived;
    delete baseClone;
    delete derivedClone;

    return 0;
}
```

在这个例子中，基类 Base 有一个虚函数 clone，它返回一个指向 Base 类型的指针（Base*）。派生类 Derived 重写了 clone 函数，并将返回类型更改为 Derived*，这是允许的，因为 Derived* 是 Base* 的派生类型。

**关键点总结**
- 协变返回类型允许派生类中的虚函数返回类型与基类中的不同，但前提是派生类中的返回类型必须是基类返回类型的派生类型。
- 返回类型之间的关系必须是基类与派生类的关系，即派生类中的返回类型必须是基类返回类型的派生类。
- 除了协变返回类型之外，虚函数在基类和派生类中的返回类型必须严格相同。
- 使用协变返回类型可以在面向对象编程中实现更灵活的多态性，尤其是在需要返回派生类对象的场景中。

### dynamic_cast失败会怎么样？

在C++中，dynamic_cast 是一种类型转换运算符，用于在多态类型（即带有虚函数的类）之间进行安全的向下转换（downcasting）。dynamic_cast 在运行时检查类型的有效性，如果转换失败，会有两种不同的行为，具体取决于转换的目标类型：

- 转换为指针类型
如果 dynamic_cast 转换的是指针类型（例如，从 Base* 转换为 Derived*），并且转换失败（即目标类型与实际对象的类型不匹配），那么返回值将是 nullptr。

```cpp
#include <iostream>

class Base {
public:
    virtual ~Base() = default;  // 必须有虚函数以使dynamic_cast正常工作
};

class Derived : public Base {
};

int main() {
    Base* base = new Base();
    Derived* derived = dynamic_cast<Derived*>(base);  // 尝试将Base*转换为Derived*

    if (derived == nullptr) {
        std::cout << "dynamic_cast failed, returned nullptr." << std::endl;
    }

    delete base;
    return 0;
}
```

在这个例子中，由于 base 实际上是 Base 类型的对象，而不是 Derived 类型，dynamic_cast<Derived*>(base) 将返回 nullptr。

- 转换为引用类型
  
如果 dynamic_cast 转换的是引用类型（例如，从 Base& 转换为 Derived&），并且转换失败，dynamic_cast 会抛出 std::bad_cast 异常。

```cpp
#include <iostream>
#include <typeinfo>  // 需要包含这个头文件来处理std::bad_cast异常

class Base {
public:
    virtual ~Base() = default;  // 必须有虚函数以使dynamic_cast正常工作
};

class Derived : public Base {
};

int main() {
    try {
        Base base;
        Derived& derived = dynamic_cast<Derived&>(base);  // 尝试将Base&转换为Derived&
    } catch (const std::bad_cast& e) {
        std::cout << "dynamic_cast failed, caught exception: " << e.what() << std::endl;
    }

    return 0;
}
```

在这个例子中，base 是一个 Base 类型的对象，dynamic_cast<Derived&>(base) 试图将其转换为 Derived& 类型的引用，但是由于类型不匹配，转换失败并抛出了 std::bad_cast 异常。

**关键点总结**

- 指针类型转换失败：dynamic_cast 返回 nullptr。
- 引用类型转换失败：dynamic_cast 抛出 std::bad_cast 异常。
- 前提条件：dynamic_cast 只能用于多态类型，即类必须有至少一个虚函数（通常是虚析构函数）。
- dynamic_cast 是一种运行时类型检查机制，用于安全的向下转换，以避免未定义行为。如果转换可能失败，使用 dynamic_cast 是一种安全的选择。

### 多重继承时，指向子类的指针转化为基类，指针会变吗?

```cpp

在C++中，使用多重继承时，将指向子类对象的指针转换为基类指针时，指针的值可能会改变。这个变化取决于基类在子类中的位置，因为多重继承可能会导致不同的基类在子类对象中的存储位置不同。

详细解释
1. 单一继承的情况
如果只有单一继承，指向子类的指针转换为基类指针时，指针的值不会发生改变。这是因为在内存布局中，子类对象的基类子对象通常位于子类对象的开头。

2. 多重继承的情况
在多重继承的情况下，子类对象中不同的基类子对象可能在不同的内存地址上。将指向子类的指针转换为某个基类指针时，指针的值可能会发生变化，以正确指向该基类在子类对象内的地址。

```cpp
#include <iostream>

class Base1 {
public:
    virtual void show() { std::cout << "Base1" << std::endl; }
};

class Base2 {
public:
    virtual void show() { std::cout << "Base2" << std::endl; }
};

class Derived : public Base1, public Base2 {
public:
    virtual void show() { std::cout << "Derived" << std::endl; }
};

int main() {
    Derived d;
    Derived* derivedPtr = &d;

    Base1* base1Ptr = derivedPtr;  // 转换为Base1指针
    Base2* base2Ptr = derivedPtr;  // 转换为Base2指针

    std::cout << "Derived pointer: " << derivedPtr << std::endl;
    std::cout << "Base1 pointer: " << base1Ptr << std::endl;
    std::cout << "Base2 pointer: " << base2Ptr << std::endl;

    return 0;
}
```

输出示例（实际输出可能会因编译器和内存布局而异）：

```shell
Derived pointer: 0x7fffd738abc0
Base1 pointer: 0x7fffd738abc0
Base2 pointer: 0x7fffd738abc8
```

derivedPtr：指向整个 Derived 对象。
base1Ptr：指向 Base1 的子对象。由于 Base1 是第一个继承的基类，base1Ptr 和 derivedPtr 指向相同的地址。
base2Ptr：指向 Base2 的子对象。由于 Base2 在 Derived 对象中可能位于不同的位置，base2Ptr 的值可能不同于 derivedPtr 和 base1Ptr。

**关键点总结**
- 单一继承时，指向子类的指针转换为基类指针，指针的值通常不会改变。
- 多重继承时，指向子类的指针转换为基类指针，指针的值可能会改变，以正确指向该基类子对象在内存中的位置。

这种变化是由于内存布局中不同基类的存储位置不同导致的。

### 带有虚函数的多重继承的内存分布

当类结构中引入虚函数时，内存布局会变得更复杂，因为需要引入虚函数表（vtable）和虚函数表指针（vptr）来支持动态多态性。为了说明这一点，以下是一个带有虚函数的多重继承的例子，基于C++。

假设有以下类定义：

```cpp
class Base1 {
public:
    int a;
    virtual void func1() {};
};

class Base2 {
public:
    int b;
    virtual void func2() {};
};

class Derived : public Base1, public Base2 {
public:
    int c;
    virtual void func3() {};
};
```

在这个例子中：

- Base1 有一个整数成员 a 和一个虚函数 func1()。
- Base2 有一个整数成员 b 和一个虚函数 func2()。
- Derived 类从 Base1 和 Base2 继承，有一个额外的整数成员 c，并定义了一个新的虚函数 func3()。

**内存分布**

在这种情况下，内存布局包括：

- 每个类的成员变量。
- 每个类的虚函数表指针（vptr）。

假设 int 占 4 字节，指针（vptr）占 8 字节（64位系统），内存布局如下：

```shell
Derived 对象内存分布:
+-------------------+
| vptr(Base1)       |  <- 虚函数表指针，指向 Base1 的虚函数表
+-------------------+
| Base1::a          |
+-------------------+
| vptr(Base2)       |  <- 虚函数表指针，指向 Base2 的虚函数表
+-------------------+
| Base2::b          |
+-------------------+
| Derived::c        |
+-------------------+
```

**具体内存分布**

Base1 的部分：

- vptr(Base1) 指针占用前 8 字节，指向 Base1 的虚函数表。
- Base1::a 紧接着占用 4 字节。

Base2 的部分：

-  vptr(Base2) 指针紧随其后，占用 8 字节，指向 Base2 的虚函数表。
- Base2::b 紧接着占用 4 字节。

Derived 的部分：

- Derived::c 紧接着占用 4 字节。

内存布局图示

```shell
+-------------------+  <- Offset 0
| vptr(Base1)       |  (指向 Base1 的虚函数表)
+-------------------+  <- Offset 8
| Base1::a          |
+-------------------+  <- Offset 12
| vptr(Base2)       |  (指向 Base2 的虚函数表)
+-------------------+  <- Offset 20
| Base2::b          |
+-------------------+  <- Offset 24
| Derived::c        |
+-------------------+
```

虚函数表的影响
- Derived 类实际上有两个虚函数表，一个是为 Base1 服务的，另一个是为 Base2 服务的。
- 每个 vptr 指针指向相应类的虚函数表，当调用虚函数时，程序会通过这个指针找到合适的函数实现。

**虚拟继承的影响**

- 如果使用虚拟继承，情况会更复杂。虚拟继承通常引入额外的开销，例如共享基类的指针或偏移量来确保单一实例化。

**总结**

虚函数使得每个类的对象需要存储虚函数表指针 vptr，并且在多重继承的情况下，每个父类都会有自己的虚函数表指针。这样，内存布局不仅包含数据成员的顺序，还包含指向虚函数表的指针，这些指针在动态多态中起到关键作用。

### static方法可以是const吗?

在C++中，static方法不能被声明为const。这是因为const成员函数是用来保证该成员函数不会修改其所属对象的状态。而static方法属于类本身，而不是某个具体的对象实例，因此它们不能访问任何非静态成员变量，也不存在修改对象状态的问题。

**详细解释**
- const成员函数：
  - const成员函数是指函数的声明中有一个const关键字，通常放在函数声明的末尾。
  - 该关键字表示该函数不会修改对象的成员变量，适用于实例方法。

例如：

```cpp
class MyClass {
public:
    int x;

    void myMethod() const {
        // This method cannot modify the member variable x.
        // x = 10; // This would be an error.
    }
};
```

static成员函数：

static成员函数属于整个类，而不是某个具体的对象实例。

它们不能访问非静态成员变量和非静态成员函数，因为它们不依赖于对象的this指针。

例如：

```cpp
class MyClass {
public:
    static void myStaticMethod() {
        // This method cannot access non-static members.
        // x = 10; // This would be an error if x were non-static.
    }
};
```

**为什么static方法不能是const**

- static成员函数没有this指针：

  - const关键字在成员函数中使用是为了修饰隐含的this指针，使其指向的对象是const的。
  - 由于static成员函数不依赖于任何对象实例，因此没有this指针，也就没有可以修饰的对象。

- const关键字对static成员函数无意义：
- 因为static成员函数不与任何特定的对象实例关联，不可能修改对象状态，所以将static成员函数声明为const是没有意义的。

因此，C++不允许static方法被声明为const。


### 请实现一个strcpy方法

```cpp
#include <stdio.h>

// 实现 strcpy 函数
char* my_strcpy(char* destination, const char* source) {
    char* ptr = destination;

    // 复制源字符串中的每一个字符到目标字符串
    while (*source != '\0') {
        *ptr++ = *source++;
    }

    // 确保目标字符串以 '\0' 结尾
    *ptr = '\0';

    return destination;
}

int main() {
    char source[] = "Hello, World!";
    char destination[50];  // 目标字符串的大小应足够容纳源字符串

    // 使用自定义的 strcpy 函数
    my_strcpy(destination, source);

    // 输出复制后的目标字符串
    printf("Copied string: %s\n", destination);

    return 0;
}
```

这里函数需要返回```char*```，主要是因为：
- 链式调用（Chaining）：

由于strcpy返回destination，可以在一条语句中进行多个操作。例如：

```c
char destination[50];
printf("%s\n", strcpy(destination, "Hello, World!"));
```

- 一致的函数接口设计：

在C标准库中，许多字符串处理函数（例如strcat、strncpy等）都会返回目标字符串指针。这种设计提供了一种一致的接口，使得函数的行为和使用方式更具一致性和可预测性。

- 增强代码的灵活性：

返回目标字符串指针可以增强代码的灵活性，使调用者可以在需要时使用返回值，或忽略它。例如：

```c
char destination[50];
char *result = strcpy(destination, "Hello, World!");
printf("Copied string: %s\n", result);
```

### 内存堆栈对比，分别有什么特点？它们的分配效率如何？

**栈（Stack）**

特点：

- 内存分配方式：栈是一个连续的内存区域，内存分配和释放遵循后进先出（LIFO，Last In First Out）原则。
- 管理方式：由编译器自动管理，无需手动控制。函数调用时，栈帧会自动分配，函数返回时，栈帧会自动释放。
- 生命周期：变量的生命周期与其所在的作用域一致，当作用域结束时，变量的内存会自动释放。
- 内存大小：栈的大小通常较小，并且在程序启动时确定。大多数系统的栈大小限制在几MB至几十MB之间。

分配效率：

- 高效率：由于栈是由编译器自动管理的，内存分配和释放速度非常快，通常只需增加或减少栈指针即可完成。
- 低开销：栈上的内存分配不需要复杂的内存管理算法，开销极低。

**堆（Heap）**

特点：

- 内存分配方式：堆是一个不连续的内存区域，通过动态内存分配函数（如malloc、calloc、realloc、free）进行分配和释放。
- 管理方式：需要程序员手动管理内存分配和释放，容易发生内存泄漏（忘记释放内存）或内存碎片（频繁分配和释放导致）。
- 生命周期：变量的生命周期由程序员控制，分配的内存在手动释放前一直有效。
- 内存大小：堆的大小通常较大，可以根据系统的物理内存和操作系统的限制进行扩展。

分配效率：

- 较低效率：堆内存的分配和释放涉及复杂的算法和数据结构（如自由链表、二叉树、位图等），因此速度较慢。
- 较高开销：由于需要维护内存管理的数据结构，分配和释放内存的操作开销较高。

总结
- 栈：
  - 优点：分配和释放速度快、开销低、自动管理内存、不容易发生内存泄漏。
  - 缺点：内存空间有限、灵活性差，不能用于需要大量内存或动态调整大小的情况。
- 堆：
  - 优点：内存空间大、灵活性高，可以分配任意大小的内存块，适合需要动态内存分配的场景。
  - 缺点：分配和释放速度慢、开销高、需要手动管理内存、容易发生内存泄漏和碎片化。

### ++i和i++哪个效率更高？

对于**内建数据类型**，效率没有区别。

对于**自定义的数据类型**， 前缀式(++i)可以返回对象的引用，而后缀式(i++)必须返回对象的值，存在复制开销。因此++i效率更高。


### 如何禁用拷贝构造函数

- 如果你的编译器支持 C++11，直接使用 delete

- 可以把拷贝构造函数和赋值操作符声明成private同时不提供实现。

- 可以通过一个基类来封装第二步，因为默认生成的拷贝构造函数会自动调用基类的拷贝构造函数，如果基类的拷贝构造函数是private，那么它无法访问，也就无法正常生成拷贝构造函数


### std::future和std::promise的作用

**1.std::promise 和 std::future 的设计原理**

**std::promise**

- std::promise 是一个模板类，表示一个值的“承诺”（promise），它允许我们在未来某个时刻设置一个值或传递一个异常。
- promise 对象内部维护了一个共享状态，这个状态可以包含一个值或异常。
- std::promise 的主要操作是 set_value（设置值）和 set_exception（设置异常）。设置完成后，这个共享状态会被标记为“就绪”。

**std::future**
- std::future 是与 std::promise 配对的对象，用于检索 promise 设置的值或异常。
- future 对象也持有相同的共享状态。通过调用 get() 方法，future 可以访问该状态中的值或捕获的异常。
- 如果 future 的 get() 在共享状态未就绪时调用，它会阻塞调用线程，直到状态就绪。

**2. promise 和 future 的基本原理**

1.共享状态:

- promise 和 future 之间共享同一个状态。promise 是生产者，可以设置共享状态的值或异常；future 是消费者，可以等待并获取这个状态的值或异常。

2.一次性:

- promise 的 set_value 或 set_exception 只能调用一次；相应地，future 的 get() 也只能调用一次。调用 get() 后，future 不再持有共享状态。
- 如果多次调用 get() 会抛出 std::future_error 异常。

3.线程安全:

- promise 和 future 的实现保证了它们在不同线程之间操作时的线程安全性。这使得它们非常适合多线程环境下的同步操作。

**3. 典型使用场景**

单一任务的异步结果获取
- 场景: 你有一个耗时操作需要在后台线程中完成，但你希望在主线程中等待其结果。
- 解决方案: 创建一个 std::promise，启动线程执行耗时任务，并在任务完成时通过 promise.set_value() 设置结果。主线程通过 std::future 的 get() 方法获取结果。

```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

std::thread t([&p]() {
    // 执行耗时操作
    int result = some_long_running_task();
    p.set_value(result);
});

int result = f.get();  // 阻塞直到 result 就绪
t.join();
```

异常传递
- 场景: 如果后台任务在执行过程中发生异常，你希望在主线程中处理这个异常。
- 解决方案: 在后台线程中捕获异常并通过 promise.set_exception() 传递给主线程。主线程在调用 future.get() 时会捕获到这个异常。

```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

std::thread t([&p]() {
    try {
        int result = some_potentially_throwing_task();
        p.set_value(result);
    } catch (...) {
        p.set_exception(std::current_exception());
    }
});

try {
    int result = f.get();
} catch (const std::exception& e) {
    std::cerr << "Exception: " << e.what() << std::endl;
}

t.join();
```

**4.std::async 和 std::shared_future**
std::async

- 作用: std::async 是一个高层的工具，用于启动异步任务，并返回一个 std::future。它可以在后台线程或当前线程中执行任务，取决于传递的标志（std::launch::async 或 std::launch::deferred）。
- 内部实现: std::async 内部会创建一个 promise，并启动任务。在任务完成时，将结果通过 promise 设置，从而使得返回的 future 可以获取这个结果。

```
std::future<int> f = std::async(std::launch::async, [] {
    return some_long_running_task();
});

int result = f.get();  // 阻塞直到结果就绪
```

std::shared_future
- 作用: std::future 是一次性的，不能被多次调用 get()。为了实现结果的多次访问，C++ 提供了 std::shared_future，它允许多个线程共享同一个 future 的结果。
- 用法: 可以通过 future.share() 方法将 std::future 转换为 std::shared_future。

```cpp
std::promise<int> p;
std::shared_future<int> sf = p.get_future().share();

std::thread t1([&sf]() { int result = sf.get(); });
std::thread t2([&sf]() { int result = sf.get(); });

p.set_value(10);

t1.join();
t2.join();
```
**5. promise 和 future 的高级用法**

链式任务执行
- 场景: 有时一个任务的输出需要作为另一个任务的输入，这种情况下可以通过 future 的链式调用来实现任务的依赖管理。

```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

auto chained_future = f.then([](std::future<int> result) {
    int val = result.get();
    return val * 2;
});

p.set_value(21);
int final_result = chained_future.get();  // final_result = 42
```

**并行任务处理**
场景: 你有多个独立的任务，希望它们同时执行，并在所有任务完成后获取结果。
解决方案: 可以启动多个线程，每个线程处理一个任务并使用 promise 来设置结果。使用多个 future 来等待所有任务的完成。
```cpp
std::vector<std::future<int>> futures;
for (int i = 0; i < 10; ++i) {
    futures.push_back(std::async(std::launch::async, [i]() {
        return i * i;
    }));
}

for (auto& f : futures) {
    std::cout << "Result: " << f.get() << std::endl;
}
```

小结
- std::promise: 用于在多线程环境中设置一个值或异常，并将其传递给 future。
- std::future: 用于等待和获取 promise 设置的值或异常。get() 方法在值就绪之前阻塞调用线程。
- std::async: 提供了一个简单的接口来启动异步任务，并返回一个 future。
- std::shared_future: 允许多个线程共享同一个 future 的结果。

通过合理地使用 promise 和 future，可以有效地管理多线程任务的结果传递和异常处理，从而实现复杂的异步编程模式。

### 位域是什么？有哪些注意点

**位域**（Bit-field）是在C语言、C++等编程语言中，允许程序员定义占用特定位数的变量，这些变量被称为位域成员。位域通常用于高效地管理硬件寄存器、实现压缩的数据结构或传输数据时节省空间。

**位域的定义**

在结构体中定义位域时，可以指定某个成员仅占用特定位数的存储空间。其语法如下：

```c
struct {
    type member_name : number_of_bits;
};
```
- type：成员的类型，通常是int或unsigned int。
- member_name：位域成员的名称。
- number_of_bits：该位域成员占用的位数。

示例

```c
struct Flags {
    unsigned int isOn : 1;      // 占用1位
    unsigned int hasError : 1;  // 占用1位
    unsigned int value : 6;     // 占用6位
};
```

在上面的例子中，结构体Flags有三个成员，分别占用1位、1位和6位，总共占用8位（1字节）。

**位域的注意点**
- 平台依赖性：位域的实现是与平台相关的。例如，位域的布局顺序（高位在前还是低位在前）、对齐方式和最大位宽等特性可能在不同编译器或平台上有所不同。

- 对齐：位域通常会被编译器对齐到某个字节边界（例如4字节或8字节）。如果位域成员无法完全填满一个存储单元（如一个字节），编译器可能会自动填充空余位，从而导致结构体占用更多的存储空间。

- 不可跨越字节边界：位域成员一般不能跨越存储单元（如字节）的边界。如果一个位域成员不能在一个字节内存储，通常会移至下一个存储单元开始。

- 读取与写入：由于位域通常不能按位访问（直接访问位），它们的读取和写入操作可能比普通变量慢一些，因为这些操作需要执行额外的位运算。

- 不可取地址：不能获取位域成员的地址，这意味着&操作符不能应用于位域成员。

- 移植性：由于位域的实现细节因编译器和平台而异，代码的可移植性会受到影响。在不同平台之间移植代码时，必须谨慎处理位域结构。

- 最大位宽限制：位域的位宽不能超过基础类型的大小，例如，如果类型为int且int为32位，那么位宽最大只能是32。

- 位域数据的合法数据范围

**使用场景**

位域通常用于嵌入式系统编程、硬件寄存器的映射和数据压缩等领域，因为这些领域对空间和性能有较高的要求。

总结来说，位域在节省存储空间方面非常有用，但在使用时需要注意其平台相关性、对齐方式等特性，以避免潜在的移植问题和性能问题。

对于，位域数据的合法数据范围这个注意点，下面的例子可以很好的说明。

```cpp
#include <iostream>

struct MixedBitFields {
    int a : 4;    // 4位的 unsigned int 类型位域
    int b : 4;    // 4位的 unsigned int 类型位域
    char c : 4;            // 4位的 char 类型位域
    unsigned char d : 4;   // 4位的 unsigned char 类型位域
};

int main() {
    MixedBitFields fields = { 15, 7, 9, 10};

    std::cout << "a: " << fields.a << std::endl;
    std::cout << "b: " << fields.b << std::endl;
    std::cout << "c: " << static_cast<int>(fields.c) << std::endl; // 需要将 char 转换为 int
    std::cout << "d: " << static_cast<int>(fields.d) << std::endl; // 需要将 unsigned char 转换为 int
    return 0;
}
```

输出结果是：

```shell
a: -1
b: 7
c: -7
d: 10
Size of MixedBitFields: 4 bytes
```

a成员的类型为4个bit的有符号整形数据，那么其合法区间就是```[-8，7]```。因此这里给a赋15就会超过其合法区间。

### c++11的新特性有哪些？

一、语法和语言特性

**1. auto类型推导**

auto关键字允许编译器自动推导变量的类型，简化了代码编写。

```cpp
auto i = 5; // i被推导为int类型
auto d = 3.14; // d被推导为double类型
auto s = std::string("Hello"); // s被推导为std::string类型
```
**2. 范围for循环（Range-based for Loop）**

引入了一种简化的for循环语法，用于遍历容器中的元素。

示例：
```cpp
std::vector<int> vec = {1, 2, 3, 4, 5};
for (auto& value : vec) {
    std::cout << value << " ";
}
```
**3. Lambda表达式**

Lambda表达式（匿名函数）提供了一种在代码中定义内联函数的方法，特别适用于需要将函数作为参数传递的场景。

示例：

```cpp
auto add = [](int a, int b) -> int {
    return a + b;
};
std::cout << add(3, 4); // 输出7
```
**4. nullptr**

引入了新的空指针常量nullptr，替代传统的NULL，提供了类型安全的空指针表示。

示例：

```cpp
int* p = nullptr;
```

**5. 强类型枚举（Scoped Enum）**

通过enum class定义强类型枚举，避免了传统枚举类型的作用域和类型安全问题。

示例：

```cpp
复制代码
enum class Color { Red, Green, Blue };
Color c = Color::Red;
```

**6. 委托构造函数（Delegating Constructors）**

允许一个构造函数调用同一类中的另一个构造函数，简化了构造函数的实现。

示例：

```cpp
class MyClass {
public:
    MyClass(int x) : value(x) {}
    MyClass() : MyClass(0) {} // 委托构造函数
private:
    int value;
};
```

**7. 默认和删除函数（Defaulted and Deleted Functions）**

可以使用= default和= delete来显式指定默认函数的生成或禁止函数的使用。

示例：

```cpp
class MyClass {
public:
    MyClass() = default; // 使用默认构造函数
    MyClass(const MyClass&) = delete; // 禁止拷贝构造函数
};
```

**8. constexpr**

constexpr关键字用于声明在编译时可计算的常量表达式，提高程序的性能。

示例：

```cpp
constexpr int square(int x) {
    return x * x;
}
int array[square(5)]; // 等同于int array[25];
```

**9. 右值引用和移动语义（Rvalue References and Move Semantics）**

引入了右值引用（&&）和std::move，优化了对象的转移，减少了不必要的拷贝，提高了程序性能。

示例：

```cpp
std::string str1 = "Hello";
std::string str2 = std::move(str1); // 移动构造，str1变为空
```

**10. 变长模板（Variadic Templates）**

支持模板参数的可变长度，使得编写通用代码更加灵活。

示例：

```cpp
template<typename... Args>
void print(Args... args) {
    (std::cout << ... << args) << std::endl;
}
print(1, 2, 3, "hello"); // 输出：123hello
```

二、库增强

**1. 智能指针**

引入了std::unique_ptr、std::shared_ptr和std::weak_ptr，用于自动管理动态分配的内存，避免内存泄漏。

示例：

```cpp
std::unique_ptr<int> ptr(new int(5));
std::shared_ptr<int> sptr = std::make_shared<int>(10);
```
**2. 多线程支持**

标准库中增加了对多线程的支持，包括std::thread、std::mutex、std::lock_guard等，方便进行并发编程。

示例：

```cpp
#include <thread>
void func() {
    std::cout << "Thread is running" << std::endl;
}
std::thread t(func);
t.join();
```

**3. 新的容器**

添加了无序容器，如std::unordered_map、std::unordered_set，提供了基于哈希表的高效查找。

示例：

```cpp
std::unordered_map<std::string, int> umap;
umap["one"] = 1;
umap["two"] = 2;
```

**4. 正则表达式**

引入了正则表达式库，支持模式匹配和字符串操作。

示例：

```cpp
#include <regex>
std::string s = "hello world";
std::regex e("(\\w+)\\s(\\w+)");
std::smatch sm;
if (std::regex_match(s, sm, e)) {
    std::cout << sm[1] << " " << sm[2] << std::endl;
}
```

**5. 时间库（Chrono）**

提供了高精度的时间测量和处理功能。

示例：

```cpp
#include <chrono>
auto start = std::chrono::high_resolution_clock::now();
// 进行一些操作
auto end = std::chrono::high_resolution_clock::now();
auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
std::cout << "Elapsed time: " << duration.count() << "ms" << std::endl;
```

**6. 元组（Tuple）**

std::tuple允许存储多个不同类型的值。

示例：

```cpp
std::tuple<int, std::string, double> t(1, "hello", 3.14);
int i = std::get<0>(t);
std::string s = std::get<1>(t);
double d = std::get<2>(t);
```

**7. 数组（Array）**

std::array是一个定长的数组封装，替代传统的C风格数组。

示例：

```cpp
std::array<int, 5> arr = {1, 2, 3, 4, 5};
for (const auto& elem : arr) {
    std::cout << elem << " ";
}
```

**8. 随机数库**

提供了更强大的随机数生成功能，包括多种随机数引擎和分布。

示例：

```cpp

#include <random>
std::random_device rd;
std::mt19937 gen(rd());
std::uniform_int_distribution<> dis(1, 6);
int random_number = dis(gen);
```

三、其他改进

**1. 统一的初始化列表（Uniform Initialization）**

引入了统一的花括号{}初始化语法，适用于所有类型的初始化。

示例：

```cpp
int arr[] = {1, 2, 3, 4, 5};
std::vector<int> vec{1, 2, 3, 4, 5};
struct Point { int x; int y; };
Point p{3, 4};
```

**2. 原子操作（Atomic Operations）**

提供了std::atomic类型，支持线程安全的原子操作。

示例：

```cpp
#include <atomic>
std::atomic<int> atomic_counter(0);
atomic_counter++;
```

**3. 静态断言（Static Assertions）**

static_assert允许在编译时检查条件是否满足，提高代码的健壮性。

```cpp
复制代码
static_assert(sizeof(int) == 4, "int size is not 4 bytes");
```

**4. 用户自定义字面量（User-defined Literals）**

允许用户定义自定义的字面量，增强代码的可读性。

示例：

```cpp
复制代码
long double operator"" _kg(long double x) {
    return x * 1000;
}
auto weight = 3.5_kg; // weight = 3500
```

**5. 新的字符串字面量**

支持原始字符串（Raw String）和UTF-8、UTF-16、UTF-32字符串字面量。

示例：

```cpp
复制代码
std::string raw_str = R"(Line1
Line2
Line3)";
```

**6. 类型推导（decltype）**

decltype关键字用于获取表达式的类型。

示例：

```cpp
复制代码
int a = 5;
decltype(a) b = 10; // b的类型被推导为int
```

**总结**

C++11作为C++语言的重大更新，引入了众多新特性，提升了语言的表达能力、性能和安全性。这些新特性使得C++编程更加高效、简洁和现代化。熟练掌握C++11的新特性对于提高开发效率和代码质量具有重要意义。

## 类和对象

### 什么是RTTI

RTTI（Run-Time Type Information，运行时类型信息）是一种在程序运行时提供对象类型信息的机制。它允许在运行时检查对象的类型，通常用于以下几个方面：

- 类型识别：确定一个对象是否属于特定的类，或者确定对象的实际类型。
- 动态转换：安全地将基类指针或引用转换为派生类指针或引用。
- 调试和日志记录：在调试和日志记录过程中获取对象的类型信息。

在C++中，RTTI主要通过以下两个操作符实现：

- typeid：用于获取对象的类型信息。例如，typeid(object)会返回一个表示object类型的std::type_info对象。

- dynamic_cast：用于将基类指针或引用安全地转换为派生类指针或引用。只有在转换是合法的情况下，dynamic_cast才会成功，否则会返回nullptr（对于指针）或抛出std::bad_cast异常（对于引用）。
- 
使用RTTI需要在编译时启用支持RTTI的选项，因为某些编译器可能默认禁用RTTI以优化性能和减小代码大小。RTTI机制在C++的多态性（polymorphism）中非常有用，特别是在处理继承层次结构复杂的情况下。

以下是一个简单的示例，展示了RTTI的使用：

```cpp
#include <iostream>
#include <typeinfo>

class Base {
public:
    virtual ~Base() {}
};

class Derived : public Base {};

int main() {
    Base* b = new Derived;
    
    // 使用typeid操作符
    std::cout << "Type of b: " << typeid(*b).name() << std::endl;

    // 使用dynamic_cast进行安全的向下转换
    Derived* d = dynamic_cast<Derived*>(b);
    if (d) {
        std::cout << "b is of type Derived." << std::endl;
    } else {
        std::cout << "b is not of type Derived." << std::endl;
    }

    delete b;
    return 0;
}
```
在这个示例中，```typeid```用于获取对象的类型信息，而```dynamic_cast```用于安全地将基类指针转换为派生类指针。

## STL

### map和unordered_map的区别? 各自使用场景是什么？

**1.底层实现**

- map: 是基于红黑树（一种自平衡二叉搜索树）实现的。这使得 map 中的元素是按照键的顺序自动排序的。
- unordered_map: 是基于哈希表实现的，元素的存储顺序是无序的，取决于哈希函数的结果。

**2. 时间复杂度**
- map: 由于是平衡二叉搜索树，插入、删除和查找操作的平均时间复杂度为 O(log n)。
- unordered_map: 由于是基于哈希表实现的，插入、删除和查找操作的平均时间复杂度为 O(1)。但在最坏情况下，可能会退化到 O(n)（例如，当哈希冲突严重时）。
**3. 元素的存储顺序**
- map: 元素按键的顺序存储和遍历。
- unordered_map: 元素没有特定的顺序，遍历顺序是不可预测的。
**4. 内存消耗**
- map: 由于红黑树结构的原因，通常需要额外的内存来维持树的平衡。
- unordered_map: 由于使用哈希表，其内存使用量主要取决于负载因子和哈希冲突的处理方式。
**5. 使用场景**

- map:
  - 当需要对键值进行排序或按顺序遍历时，选择 map。
  - 例如，需要按字母顺序存储和检索学生姓名及其成绩的情况。
  - 适合需要较稳定的时间复杂度和有序数据访问的场景。
- unordered_map:
  - 当主要关注查找速度而不关心键的顺序时，选择 unordered_map。
  - 例如，用于统计单词频率或存储哈希表以快速查找的情况。
  - 适合数据量大且对性能要求高的场景，特别是需要高效的查找、插入和删除操作时。

**总结**

- 使用 map 当你需要有序的数据或者需要比较稳定的性能时。
- 使用 unordered_map 当你更关注查找、插入和删除操作的性能，并且不需要数据顺序时。

## 参考

https://zhuanlan.zhihu.com/p/629336564(含答案)