---
category: 
- C++
- Modern effective C++
---

# Item2：理解auto类型推导

本文主要讨论c++中的auto类型推导过程。

auto的类型推导和item1中模板的推导过程是很相似的，只有很少的点是不同的，下面一一说来。

当一个变量使用auto进行声明时，auto扮演了模板中T的角色，变量的类型说明符扮演了ParamType的角色。考虑这个例子：

```cpp
auto x = 27;
```

这里x的类型说明符是auto自己，另一方面，在这个声明中：

```cpp
const auto cx = x;
```

类型说明符是const auto。

另一个：

```cpp
const auto & rx=x;
```

类型说明符是```const auto&```。在这里例子中要推导x，rx和cx的类型，编译器的行为看起来就像是认为这里每个声明都有一个模板，然后使用合适的初始化表达式进行调用：
```cpp
template<typename T>            //概念化的模板用来推导x的类型
void func_for_x(T param);

func_for_x(27);                 //概念化调用：
                                //param的推导类型是x的类型

template<typename T>            //概念化的模板用来推导cx的类型
void func_for_cx(const T param);

func_for_cx(x);                 //概念化调用：
                                //param的推导类型是cx的类型

template<typename T>            //概念化的模板用来推导rx的类型
void func_for_rx(const T & param);

func_for_rx(x);                 //概念化调用：
                                //param的推导类型是rx的类型
```
下面这张图可以形象的显示这种类比过程：

![auto](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/cpp/effective-modern-cpp-02/auto.png)

auto类型推导除了一个例外，其他情况都和模板类型推导一样。

Item1基于ParamType——在函数模板中param的类型说明符——的不同特征，把模板类型推导分成三个部分来讨论。在使用auto作为类型说明符的变量声明中，类型说明符代替了ParamType，因此Item1描述的三个情景稍作修改就能适用于auto：

情景一：类型说明符是一个指针或引用但不是通用引用
情景二：类型说明符一个通用引用
情景三：类型说明符既不是指针也不是引用

我们早已看过情景一和情景三的例子：

```cpp
auto x = 27;                    //情景三（x既不是指针也不是引用）
const auto cx = x;              //情景三（cx也一样）
const auto & rx=cx;             //情景一（rx是非通用引用）
```

情景二像你期待的一样运作：
```cpp
auto&& uref1 = x;               //x是int左值，
                                //所以uref1类型为int&
auto&& uref2 = cx;              //cx是const int左值，
                                //所以uref2类型为const int&
auto&& uref3 = 27;              //27是int右值，
                                //所以uref3类型为int&&
```

Item1讨论并总结了对于non-reference类型说明符，数组和函数名如何退化为指针。那些内容也同样适用于auto类型推导：

```cpp
const char name[] =             //name的类型是const char[13]
 "R. N. Briggs";

auto arr1 = name;               //arr1的类型是const char*
auto& arr2 = name;              //arr2的类型是const char (&)[13]

void someFunc(int, double);     //someFunc是一个函数，
                                //类型为void(int, double)

auto func1 = someFunc;          //func1的类型是void (*)(int, double)
auto& func2 = someFunc;         //func2的类型是void (&)(int, double)
```

就像你看到的那样，auto类型推导和模板类型推导几乎一样的工作，它们就像一个硬币的两面。

讨论完相同点接下来就是不同点，前面我们已经说到auto类型推导和模板类型推导有一个例外使得它们的工作方式不同，接下来我们要讨论的就是那个例外。 我们从一个简单的例子开始，如果你想声明一个带有初始值27的int，C++98提供两种语法选择：

```cpp
int x1 = 27;
int x2(27);
```
C++11由于也添加了用于支持统一初始化（uniform initialization）的语法：

```cpp
int x3 = { 27 };
int x4{ 27 };
```
总之，这四种不同的语法只会产生一个相同的结果：变量类型为int值为27

但是Item5解释了使用auto说明符代替指定类型说明符的好处，所以我们应该很乐意把上面声明中的int替换为auto，我们会得到这样的代码：
```cpp
auto x1 = 27;
auto x2(27);
auto x3 = { 27 };
auto x4{ 27 };
```
这些声明都能通过编译，但是他们不像替换之前那样有相同的意义。前面两个语句确实声明了一个类型为int值为27的变量，但是后面两个声明了一个存储一个元素27的 ```std::initializer_list<int>```类型的变量。
```cpp
auto x1 = 27;                   //类型是int，值是27
auto x2(27);                    //同上
auto x3 = { 27 };               //类型是std::initializer_list<int>，
                                //值是{ 27 }
auto x4{ 27 };                  //同上
```
这就造成了auto类型推导不同于模板类型推导的特殊情况。当用auto声明的变量使用花括号进行初始化，auto类型推导推出的类型则为```std::initializer_list```。如果这样的一个类型不能被成功推导（比如花括号里面包含的是不同类型的变量），编译器会拒绝这样的代码：
```cpp
auto x5 = { 1, 2, 3.0 };        //错误！无法推导std::initializer_list<T>中的T
```
就像注释说的那样，在这种情况下类型推导将会失败，但是对我们来说认识到这里确实发生了两种类型推导是很重要的。一种是由于auto的使用：x5的类型不得不被推导。因为x5使用花括号的方式进行初始化，x5必须被推导为```std::initializer_list```。但是```std::initializer_list```是一个模板。```std::initializer_list<T>```会被某种类型T实例化，所以这意味着T也会被推导。 推导落入了这里发生的第二种类型推导——模板类型推导的范围。在这个例子中推导之所以失败，是因为在花括号中的值并不是同一种类型。

对于花括号的处理是auto类型推导和模板类型推导唯一不同的地方。当使用auto声明的变量使用花括号的语法进行初始化的时候，会推导出```std::initializer_list<T>```的实例化，但是对于模板类型推导这样就行不通：
```cpp
auto x = { 11, 23, 9 };         //x的类型是std::initializer_list<int>

template<typename T>            //带有与x的声明等价的
void f(T param);                //形参声明的模板

f({ 11, 23, 9 });               //错误！不能推导出T
```
然而如果在模板中指定T是```std::initializer_list<T>```而留下未知T,模板类型推导就能正常工作：
```cpp
template<typename T>
void f(std::initializer_list<T> initList);

f({ 11, 23, 9 });               //T被推导为int，initList的类型为
                                //std::initializer_list<int>
```
因此auto类型推导和模板类型推导的真正区别在于，auto类型推导假定花括号表示```std::initializer_list```而模板类型推导不会这样（确切的说是不知道怎么办）。

你可能想知道为什么auto类型推导和模板类型推导对于花括号有不同的处理方式。我也想知道。哎，我至今没找到一个令人信服的解释。但是规则就是规则，这意味着你必须记住如果你使用auto声明一个变量，并用花括号进行初始化，auto类型推导总会得出```std::initializer_list```的结果。如果你使用**uniform initialization（花括号的方式进行初始化）**用得很爽你就得记住这个例外以免犯错，在C++11编程中一个典型的错误就是偶然使用了```std::initializer_list<T>```类型的变量，这个陷阱也导致了很多C++程序员抛弃花括号初始化，只有不得不使用的时候再做考虑。（在Item7讨论了必须使用时该怎么做）

对于C++11故事已经说完了。但是对于C++14故事还在继续，C++14允许auto用于函数返回值并会被推导（参见Item3），而且C++14的lambda函数也允许在形参声明中使用auto。但是在这些情况下auto实际上使用模板类型推导的那一套规则在工作，而不是auto类型推导，所以说下面这样的代码不会通过编译：
```cpp
auto createInitList()
{
    return { 1, 2, 3 };         //错误！不能推导{ 1, 2, 3 }的类型
}
```
同样在C++14的lambda函数中这样使用auto也不能通过编译：
```cpp
std::vector<int> v;
…
auto resetV = 
    [&v](const auto& newValue){ v = newValue; };        //C++14
…
resetV({ 1, 2, 3 });            //错误！不能推导{ 1, 2, 3 }的类型

```

## 总结

- auto类型推导通常和模板类型推导相同，但是auto类型推导假定花括号初始化代表std::initializer_list，而模板类型推导不这样做
- 在C++14中auto允许出现在函数返回值或者lambda函数形参中，但是它的工作机制是模板类型推导那一套方案，而不是auto类型推导