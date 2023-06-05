---
category: 
- C++
tag:
- C++
---

# c++20 concepts

concepts在c++20中被引入，其作用是对模板参数进行约束，极大地增强了c++模板的功能。

在c++20之前，如果希望获取类似的效果，使用起来并不方便。

## 没有concept时，如何实现对模板参数进行约束？

### static_assert

我们可以使用static_assert去对模板类型T进行约束。如下所示：

```cpp
#include <type_traits>
#include <iostream>

template<class T>
void test(T a)
{
    static_assert(std::is_integral<T>());
    std::cout << "T is integral" << std::endl;
}
int main()
{
    test(10);
    test<double>(12.3); 
}
```

但是该种方法不太好，因为需要将static_assert嵌入到函数的内部，这意味着即使类型不对，模板还是成功的匹配上了，只是在模板函数内部展开时出现编译错误。

### SFINAE

SFINAE是Substitution Failure Is Not An Error的缩写，翻译过来的意思是替换失败并不是一个错误。

**SFINAE**是**模板元编程**中常见的一种技巧，如果模板实例化后的某个模板函数（模板类）对该调用无效，那么将继续**寻找其他重载决议**，而不是引发一个编译错误。

因此一句话概括SFINAE，就是模板匹配过程中会尝试各个重载模板，直到所有模板都匹配失败，才会认为是真正的错误。

例如下面这个经典的例子：

```cpp
struct Test {
     typedef int foo;
};

template <typename T>
void f(typename T::foo) {}  // Definition #1

template <typename T>
void f(T) {}  // Definition #2

int main() {
    f<Test>(10);  // Call #1.
    f<int>(10);   // Call #2. Without error (even though there is no int::foo)
                // thanks to SFINAE.
}
```
```f<Test>(10)```最终将使用到第一个模板定义， 而```f<int>(10)```最终将使用到第二个模板定义。

SFINAE 原则最初是应用于上述的模板编译过程。后来被C++开发者发现可以用于做编译期的决策，配合sizeof可以进行一些判断：类是否定义了某个内嵌类型、类是否包含某个成员函数等。例如STL中迭代器中的has_iterator_category。

```cpp
template <typename T>
struct has_iterator_category {
    struct two { char a; char b; };

    template <typename C>
    static two& test(typename C::iterator_category*);

    template <typename>
    static char& test(...);

    static const bool value = sizeof(test<T>(nullptr)) == sizeof(two);
};
```

### enable_if

enable_if的出现使得SFINAE使用上更加方便，进一步扩展了上面has_xxx，is_xxx的作用。而enable_if实现上也是使用了SFINAE。

enable_if的定义简单， 即当_Test是true时，将不会有type的类型定义，而当_Test是false时，将会有type的类型定义。

```cpp
// STRUCT TEMPLATE enable_if
template <bool _Test, class _Ty = void>
struct enable_if {}; // no member "type" when !_Test

template <class _Ty>
struct enable_if<true, _Ty> { // type is _Ty for _Test
    using type = _Ty;
};
```

下面是利用enable_if去实现SFINAE的方式。

```cpp
#include <type_traits>
#include <iostream>

template <typename T>
typename std::enable_if<std::is_integral<T>::value, T>::type 
test(T value)
{
    std::cout<<"T is intergal"<<std::endl;
    return value;
}

template <typename T>
typename std::enable_if<!std::is_integral<T>::value, T>::type 
test(T value)
{
    std::cout<<"T is not intergal"<<std::endl;
    return value;
}

int main()
{
    test(100);
    test('a');
    test(100.1);
}
```

可以看到SFINAE的主要实现了is_xxx和has_xxx的语义，但是其语法并不简单，对使用者有较高要求，并且即便写正确了，可读性也相对较差。

## 有了concept之后如何使用？

### 声明concept

声明一个concept的语法如下所示：

```cpp
template < template-parameter-list >
concept concept-name = constraint-expression;
```

例如，约束T是一个整形：

```cpp
template <typename T>
concept integral = std::is_integral_v<T>;
```

也可以使用requires更加灵活地定义concept，例如下面的例子要求T类型拥有一个名字叫做print的方法，另外需要拥有一个toString方法，并且返回值是string类型。

```cpp
template <typename T>
concept printable = requires(T t) {
    t.print(); //1
    {t.toString()} -> std::same_as<std::string>; //2
};
```

### 使用concept

使用concept有三种方式：

**方法1：直接将concept嵌入模板的类型的尖括号```<>```内**
```cpp
template<Arithmetic T> 
void f(T a){/*function definition*/};
we can enforce it just after template declaration using requires:
```

**方法2：在模板声明的下方使用requires关键字**

```cpp
template<class T> 
requires Arithmetic<T>
void f(T a)
{/*function definition*/};
or after the function declaration
```

**方法3：使用后置形式，直接在函数声明的后方使用requires关键字添加约束。**

```cpp
#include<concepts>
template<class T>
void f(T a) requires integral<T> // integral is in header <concepts>	
{/*function definition*/}; 
```

此外，concept还可以使用逻辑运算符 && 和 ||。例如：

```cpp
template <class T>
concept Integral = std::is_integral<T>::value;

template <class T>
concept SignedIntegral = Integral<T> && std::is_signed<T>::value;

template <class T>
concept UnsignedIntegral = Integral<T> && !SignedIntegral<T>;
```

下面是两个完整的例子来看看concepts是如何实现了**is_xxx**和**has_xxx**的功能。

第一个例子中test模板T只能是整形或者是double。实现了is_xxx。

```cpp
#include <iostream>

template <class T>
concept Integral = std::is_integral<T>::value;

template <class T>
concept IsDouble = std::is_same<T, double>::value;


template<Integral T>
void test(T a)
{
    std::cout << "test(int) functin called" << std::endl;
}

template<IsDouble T>
void test(T a)
{
    std::cout << "test(double) functin called" << std::endl;
}

int main()
{
    test(100);
    test(10.0);
}
```


第二个例子中print函数要求t拥有print函数。实现了has_xxx。

```cpp
#include <iostream>

template <typename T>
concept Has_print = requires(T t) {
    t.print(); //1

};

class HasPrint
{
public:
    void print(){};
};

class NoPrint
{

};

template<Has_print T>
void print(T t)
{
    t.print();
}

int main()
{
    HasPrint t;
    print(t);

    NoPrint t2;
    print(t2); //将报编译错误
}
```


## 总结
- c++20的concepts增强了模板对于参数类型约束的功能，语法简单，可以提高代码的可读性。
- 如果你的项目不能使用较新的标准，那么还是要老老实实的使用SNINAE，enable_if那一套东西。