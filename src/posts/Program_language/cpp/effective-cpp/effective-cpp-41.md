---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 41 隐式接口和编译器多态

## 分析

面向对象编程总是以显式接口和运行期多态解决问题。举个例子，给定这样“无意义”的类
```cpp
class Widget{
public:
	Widget();
	virtual ~Widget();
	virtual std::size_t size() const;
	virtual void normalize();
	void swap(Widget& other);
};
```

和这样“无意义”的函数：

```cpp
void doProcessing(Widget & w){
	if(w.size() > 10 & w != someNestyWidget){
		Widget temp(w);
		temp.normaliza();
		temp.swap(w);
	}
}
```
我们可以这样说doProcessing内的w：

- 由于w的类型被声明为Widget，所以w必须支持Widget接口。我们可以在widget.h中找出这个接口，看看它是什么样子，所以我们称之为一个显式接口，也就是它在源码中明确可见
- 由于Widget的某些成员函数是virtual，w对那些函数的调用将表现出运行期多态，也就是将于运行期根据w的动态类型决定究竟调用哪一个函数。

模板以及泛型编程世界，与面向对象有根本的不同。在此世界中显式接口和运行期多态依旧存在，但重要性降低。隐式接口和编译期多态更重要：

```cpp
template<typename T>
void doProcessing(T & w){
	if(w.size() > 10 & w != someNestyWidget){
		Widget temp(w);
		temp.normaliza();
		temp.swap(w);
	}
}
```

我们可以这样说doProcessing内的w：

- w必须支持哪一种接口，是由模板中执行在w身上的操作来决定。上面w的类型T必须支持size、不等比较、拷贝构造、normalize、swap这几种函数。这些就是T必须支持的一组隐式接口
- 凡涉及到w的任何函数调用，比如operator!=，有可能造成模板具现化。这样的具现行为发生在编译期，“以不同的模板参数具现化函数模板”会导致调用不同的函数，这就是编译期多态

编译期多态 VS 运行期多态

编译期多态：哪一个重载函数被调用
运行期多态：哪一个虚函数被绑定

显式接口 VS 隐式接口

通常显式接口有函数的签名(也就是函数名称、参数类型、返回类型)构成。

```cpp
class Widget{
public:
	Widget();
	virtual ~Widget();
	virtual std::size_t size() const;
	virtual void normalize();
	void swap(Widget& other);
};
```
比如Widget类中public接口由构造函数、析构函数、函数size，normalize，swap及其参数类型、返回值类型、常量性组成，当然也包括编译期产生的拷贝构造函数和拷贝运算符。另外也可以包括typedef、成员变量(不建议成员变量声明为public)

隐式接口：它并不基于函数签名式，而是由有效表达式组成。

```cpp
template<typename T>
void doProcessing(T & w){
	if(w.size() > 10 & w != someNestyWidget){
```
看起来T的隐式接口必须由这些约束

- 它必须提供一个叫做size()的成员函数，该函数返回一个整数值
- 它必须支持一个叫做operator!=的函数，用来比较两个对象

实际上这个两个约束都不需要满足

- T必须支持成员函数，但是这个函数也可以从基类继承。这个函数不一定返回int，它唯一要做的是返回一个类型为X的对象，而X对象加上一个int(10的类型)必须能够调用一个operator>

- 同理，T并不需要支持operator!=

可以看出，隐式接口仅仅是由一组有效表达式组成

## 总结

- classes和template都支持接口和多态。
- 对classes而言接口时显示的explicit， 以函数签名为中心。多态则是通过虚函数发生于运行期。
- 对template参数而言，接口时隐式的，奠基于有效表达式。多态则是通过template具现化和函数重载解析发生于编译期。
