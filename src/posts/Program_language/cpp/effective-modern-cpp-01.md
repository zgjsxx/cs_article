---
category: 
- C++
- Modern effective C++
---

#  类型推导

模板的格式通常如下所示：
```cpp
template<typename T>
void f(ParamType param);
```
其调用格式：
```cpp
f(expr);
```

模板类型的推导是对T和ParamType同时进行的。

## ParamType是一个指针或引用，但不是通用引用

在这种情况下，类型推导会这样进行：

- 如果expr的类型是一个引用，忽略引用部分
- 然后expr的类型与ParamType进行模式匹配来决定T

```cpp
template<typename T>
void f(T& param);               //param是一个引用
```
我们声明这些变量，

```cpp
int x=27;                       //x是int
const int cx=x;                 //cx是const int
const int& rx=x;                //rx是指向作为const int的x的引用
```
在不同的调用中，对param和T推导的类型会是这样：
```cpp
f(x);                           //T是int，param的类型是int&
f(cx);                          //T是const int，param的类型是const int&
f(rx);                          //T是const int，param的类型是const int&
```

如果ParamType中包含了const，推导如下：
```cpp
template<typename T>
void f(const T& param);         //param现在是reference-to-const

int x = 27;                     //如之前一样
const int cx = x;               //如之前一样
const int& rx = x;              //如之前一样

f(x);                           //T是int，param的类型是const int&
f(cx);                          //T是int，param的类型是const int&
f(rx);                          //T是int，param的类型是const int&
```

当ParamType是指针时：
```cpp
template<typename T>
void f(T* param);               //param现在是指针

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


## ParamType既不是指针也不是引用
```cpp
当ParamType既不是指针也不是引用时，我们通过传值（pass-by-value）的方式处理：

template<typename T>
void f(T param);                //以传值的方式处理param
```

- 和之前一样，如果expr的类型是一个引用，忽略这个引用部分
- 如果忽略expr的引用性（reference-ness）之后，expr是一个const，那就再忽略const。如果它是volatile，也忽略volatile（volatile对象不常见，它通常用于驱动程序的开发中。关于volatile的细节请参见Item40）


因此

```cpp
int x=27;                       //如之前一样
const int cx=x;                 //如之前一样
const int & rx=cx;              //如之前一样

f(x);                           //T和param的类型都是int
f(cx);                          //T和param的类型都是int
f(rx);                          //T和param的类型都是int
```


注意即使cx和rx表示const值，param也不是const。这是有意义的。param是一个完全独立于cx和rx的对象——是cx或rx的一个拷贝。具有常量性的cx和rx不可修改并不代表param也是一样。这就是为什么expr的常量性constness（或易变性volatileness)在推导param类型时会被忽略：因为expr不可修改并不意味着它的拷贝也不能被修改。