---
category: 
- C++
- Modern effective C++
---

# Item1：模板中的类型推导

本文主要讨论c++模板中的类型推导过程。

通常，模板的格式如下所示：

```cpp
template<typename T>
void f(ParamType param);
```

而模板的调用格式如下所示：

```cpp
f(expr);
```

所谓类型推导，就是**已知expr**， 推导出**ParamType和T**。模板类型的推导是对T和ParamType同时进行的。

推导过程需要按照ParamType的格式分别讨论：
- ParamType是一个指针或者引用, 但不是通用引用
- ParamType是一个万能引用
- ParamType既不是指针也不是引用

## ParamType是一个指针或引用，但不是通用引用

在这种情况下，类型推导会这样进行：

- 如果expr的类型是一个引用，忽略引用部分
- 然后expr的类型与ParamType进行模式匹配来决定T

我们通过例子进行理解，假设我们的模板中的ParamType是```T& param```。

```cpp
template<typename T>
void f(T& param);               //ParamType一定是一个引用
```

我们声明这些变量，

```cpp
int x=27;                       //x是int
const int cx=x;                 //cx是const int
const int& rx=x;                //rx是指向作为const int的x的引用const int&
```

在不同的调用中，对param和T推导的类型会是这样：

```cpp
f(x);                           //T是int，param的类型是int&
f(cx);                          //T是const int，param的类型是const int&
f(rx);                          //expr是const int&， 按照规则要忽略引用部分， 因此T是const int，param的类型是const int&
```

如果ParamType中包含了const，推导如下：

```cpp
template<typename T>
void f(const T& param);         //param现在是reference-to-const

int x = 27;                     //x是int
const int cx = x;               //cx是const int
const int& rx = x;              //rx是指向作为const int的x的引用const int&

f(x);                           //T是int，param的类型是const int&
f(cx);                          //T是int，param的类型是const int&
f(rx);                          ///expr是const int&T，因为ParamType里面已经有了&，因此忽略这里的引用，因此T是int，param的类型是const int&
```

当ParamType是指针时：
```cpp
template<typename T>
void f(T* param);               //param一定是一个指针

int x = 27;                     //同之前一样
const int *px = &x;             //px是指向作为const int的x的指针

f(&x);                          //T是int，param的类型是int*
f(px);                          //T是const int，param的类型是const int*
```


## ParamType是一个通用引用

- 如果expr是左值，T和ParamType都会被推导为左值引用。这非常不寻常，第一，这是模板类型推导中唯一一种T被推导为引用的情况。第二，虽然ParamType被声明为右值引用类型，但是最后推导的结果是左值引用。
  
- 如果expr是右值，就使用正常的（也就是情景一）推导规则


```cpp
template<typename T>
void f(T&& param);              //param现在是一个通用引用类型
		
int x=27;                       //如之前一样
const int cx=x;                 //如之前一样
const int & rx=cx;              //如之前一样

f(x);                           //x是左值，所以T是int&，
                                //param类型也是int&

f(cx);                          //cx是左值，所以T是const int&，
                                //param类型也是const int&

f(rx);                          //rx是左值，所以T是const int&，
                                //param类型也是const int&

f(27);                          //27是右值，所以T是int，
                                //param类型就是int&&
```


## ParamType既不是指针也不是引用(值传递)

当ParamType既不是指针也不是引用时，我们通过传值（pass-by-value）的方式处理：

```cpp
template<typename T>
void f(T param);                //以传值的方式处理param
```

- 和之前一样，如果expr的类型是一个引用，忽略这个引用部分
- 如果忽略expr的引用性（reference-ness）之后，expr是一个const，那就再忽略const。如果它是volatile，也忽略volatile。忽略cv属性。
- expr不可以是指针

因此

```cpp
int x=27;                       //如之前一样
const int cx=x;                 //如之前一样
const int & rx=cx;              //如之前一样

f(x);                           //T和param的类型都是int
f(cx);                          //T和param的类型都是int
f(rx);                          //T和param的类型都是int
```

注意即使cx和rx表示const值，param也不是const。这是有意义的。

param是一个完全独立于cx和rx的对象——是cx或rx的一个拷贝。具有常量性的cx和rx不可修改并不代表param也是一样。这就是为什么expr的常量性constness（或易变性volatileness)在推导param类型时会被忽略：因为expr不可修改并不意味着它的拷贝也不能被修改。

我们实际跑一下这个例子，
```cpp
#include <iostream>

template<typename T>
void f(T param)
{
    param = 28;
}

int main()
{
    int x = 27;
    const int cx = x;
    const int& rx = cx;
    const int& rrx = x;

    /*
    void f(int param)}
    {
        param = 28;
    }
    */
    f(rrx);

    std::cout << rrx << std::endl;
}
```

运行结果为：27。

从运行结果可以看到，rrx的值并没有被修改。并且expr含有const，但是param=28并没有const， 说明const属性被去掉了。综上，这里的T推导的是int，param的类型为int。

认识到只有在传值给形参时才会忽略const（和volatile）这一点很重要，正如我们看到的，对于reference-to-const和pointer-to-const形参来说，expr的常量性constness在推导时会被保留。但是考虑这样的情况，expr是一个const指针，指向const对象，expr通过传值传递给param：

```cpp
template<typename T>
void f(T param);                //仍然以传值的方式处理param

const char* const ptr =         //ptr是一个常量指针，指向常量对象 
    "Fun with pointers";

f(ptr);                         //传递const char * const类型的实参
```

在这里，解引用符号```（*）```的右边的const表示ptr本身是一个const：ptr不能被修改为指向其它地址，也不能被设置为null（解引用符号左边的const表示ptr指向一个字符串，这个字符串是const，因此字符串不能被修改）。当ptr作为实参传给f，组成这个指针的每一比特都被拷贝进param。像这种情况，ptr自身的值会被传给形参，根据类型推导的第三条规则，ptr自身的常量性constness将会被省略，所以param是const char*，也就是一个可变指针指向const字符串。在类型推导中，这个指针指向的数据的常量性constness将会被保留，但是当拷贝ptr来创造一个新指针param时，ptr自身的常量性constness将会被忽略。


最后需要注意的是，在本节中，**ParamType**只是定义的格式中不含有指针或者引用，但是实际推导的格式**有可能是指针**。

看下面的例子，```f(pa)```;
```cpp
#include <iostream>

template<typename T>
void f(T param)
{
    std::cout << "void f(T param)" << std::endl;
    *param = 28;                        //不好的实现
}

int main()
{
    int x = 27;
    const int cx = x;
    const int& rx = cx;
    const int& rrx = x;
    int* pa = &x;
    f(pa);//expr是int*， T是int*， param的类型是int*
    f(x);//错误
}
```

由于expr是int*，T被推导为int*，因此这里需要在f函数内部增加解引用```*param = 28```。但这里又会引入问题，就是f函数不再能传入非指针的参数，例如f(x)。

因此实际使用过程中，虽然T可以被推导为指针，但并不建议这样做，如果你需要一个指针类型，请在模板中显式声明，即定义一个指针的特化的模板：

```cpp
#include <iostream>

template<typename T>
void f(T param)
{
    std::cout << "void f(T param)" << std::endl;
    param = 28;
}

template<typename T>
void f(T* param)
{
    std::cout << "void f(T* param)" << std::endl;
    *param = 28;
}

int main()
{
    int x = 27;
    const int cx = x;
    const int& rx = cx;
    const int& rrx = x;
    int* pa = &x;
    f(pa);//expr是int*， T是int*， param的类型是int*
    f(x);
}
```
## 特别讨论：数组入参和函数入参

**数组实参**
上面的内容几乎覆盖了模板类型推导的大部分内容，但这里还有一些小细节值得注意，比如数组类型不同于指针类型，虽然它们两个有时候是可互换的。关于这个错觉最常见的例子是，在很多上下文中数组会退化为指向它的第一个元素的指针。这样的退化允许像这样的代码可以被编译：

```cpp
const char name[] = "J. P. Briggs";     //name的类型是const char[13]

const char * ptrToName = name;          //数组退化为指针
```
在这里```const char*```指针ptrToName会由name初始化，而name的类型为```const char[13]```，这两种类型（```const char*```和```const char[13]```）是不一样的，但是由于数组退化为指针的规则，编译器允许这样的代码。

但要是一个数组传值给一个模板会怎样？会发生什么？
```cpp
template<typename T>
void f(T param);                        //传值形参的模板

f(name);                                //T和param会推导成什么类型?
```
我们从一个简单的例子开始，这里有一个函数的形参是数组，是的，这样的语法是合法的，

```cpp
void myFunc(int param[]);
```
但是数组声明会被视作指针声明，这意味着myFunc的声明和下面声明是等价的：

```cpp
void myFunc(int* param);                //与上面相同的函数
```
数组与指针形参这样的等价是C语言的产物，C++又是建立在C语言的基础上，它让人产生了一种数组和指针是等价的的错觉。

因为数组形参会视作指针形参，所以传值给模板的一个数组类型会被推导为一个指针类型。这意味着在模板函数f的调用中，它的类型形参T会被推导为const char*：

```cpp
f(name);                        //name是一个数组，但是T被推导为const char*
```
但是现在难题来了，虽然函数不能声明形参为真正的数组，但是可以接受指向数组的引用！所以我们修改f为传引用：

```cpp
template<typename T>
void f(T& param);                       //传引用形参的模板
```
我们这样进行调用，
```cpp
f(name);                                //传数组给f
```
T被推导为了真正的数组！这个类型包括了数组的大小，在这个例子中T被推导为const char[13]，f的形参（对这个数组的引用）的类型则为const char (&)[13]。是的，这种语法看起来简直有毒，但是知道它将会让你在关心这些问题的人的提问中获得大神的称号。

有趣的是，可声明指向数组的引用的能力，使得我们可以创建一个模板函数来推导出数组的大小：

```cpp
//在编译期间返回一个数组大小的常量值（//数组形参没有名字，
//因为我们只关心数组的大小）
template<typename T, std::size_t N>                     //关于
constexpr std::size_t arraySize(T (&)[N]) noexcept      //constexpr
{                                                       //和noexcept
    return N;                                           //的信息
}                                                       //请看下面
```
在Item15提到将一个函数声明为constexpr使得结果在编译期间可用。这使得我们可以用一个花括号声明一个数组，然后第二个数组可以使用第一个数组的大小作为它的大小，就像这样：

```cpp
int keyVals[] = { 1, 3, 7, 9, 11, 22, 35 };             //keyVals有七个元素

int mappedVals[arraySize(keyVals)];                     //mappedVals也有七个
```
当然作为一个现代C++程序员，你自然应该想到使用std::array而不是内置的数组：

```cpp
std::array<int, arraySize(keyVals)> mappedVals;         //mappedVals的大小为7
```
至于arraySize被声明为noexcept，会使得编译器生成更好的代码，具体的细节请参见Item14。

**函数实参**
在C++中不只是数组会退化为指针，函数类型也会退化为一个函数指针，我们对于数组类型推导的全部讨论都可以应用到函数类型推导和退化为函数指针上来。结果是：

```cpp
void someFunc(int, double);         //someFunc是一个函数，
                                    //类型是void(int, double)

template<typename T>
void f1(T param);                   //传值给f1

template<typename T>
void f2(T & param);                 //传引用给f2

f1(someFunc);                       //param被推导为指向函数的指针，
                                    //类型是void(*)(int, double)
f2(someFunc);                       //param被推导为指向函数的引用，
                                    //类型是void(&)(int, double)
```
这个实际上没有什么不同，但是如果你知道数组退化为指针，你也会知道函数退化为指针。

## 总结

- 在模板类型推导时，有引用的实参会被视为无引用，他们的引用会被忽略
- 对于通用引用的推导，左值实参会被特殊对待
- 对于传值类型推导，const和/或volatile实参会被认为是non-const的和non-volatile的
- 在模板类型推导时，数组名或者函数名实参会退化为指针，除非它们被用于初始化引用

