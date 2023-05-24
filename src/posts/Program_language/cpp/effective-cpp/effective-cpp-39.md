---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 39 明智而审慎地使用private继承

什么是private继承？

下面例子中，我们称类Student private继承类Person。

```cpp
class Person {...};
class Student : private Person {...}; // private继承
```

根据条款32，public继承意味着is-a关系，那么private继承意味着什么？

两点：
1）编译器不会自动将一个derived class对象转换为base class对象；

2）由private base class继承而来的所有成员，在derived class中都会变成private属性，即使它们在base class中原本是protected或public属性；

对于2）不过多解释，对于1），我们看下面的例子：
```cpp
void eat(const Person& p);
void study(cosnt Student& s);

Person p;  // p是人
Student s; // s是学生

eat(p); // OK：p是人，会吃
eat(s);     // 编译器报错：因为Student私有继承自Person，编译器不会将Student
```
对象自动转换为Person对象
我们会看到，编译器并不会将一个private继承关系中的derived 对象自动转换为base对象。

private继承与implemented-in-terms-of（根据某物实现）
如果让class D以private继承class B，用意是为了采用class B内已经准备妥当的某些特性，不是因为B对象和D对象在存在任何观念上的关系。private继承纯粹是一种实现技术，根据条款34，private继承意味着只有实现部分被继承，接口部分应略去。
如果D private继承B，i.e. D对象根据B对象实现而得，没有其他意涵。private继承在软件“设计”层面没有意义，只存在软件实现层面。

既然private意味着implemented-in-terms-of（根据某物实现），条款38复合（composition）也是如此，那么如何选择？
答：尽可能使用复合，必要时才使用private继承。什么时候才是必要？主要是当protected成员或virtual函数牵扯进来的时候，因为通过复合只能访问public成员函数和变量，除非降低类封装性（使用友元或者添加public接口）。下文提到的极端情况，也适用private继承。

如何使用private继承？

假设我们要修改Widget class，让它记录每个成员函数被调用次数。运行期间，将周期性审查这些信息（被调用次数、运行时间等）。为了完成这项工作，需要设定某种定时器，使我们知道收集统计数据的时候是否到了。

我们发现有个Timer class，可以复用既有代码
```CPP
class Timer {
public:
    explicit Timer(int tickFrequency);
    virtual void onTick() const; // 定时器每滴答一次, 就调用一次该函数
    ...
};
```
1）使用private继承

为了让Widget重新定义Timer内的virtual函数，Widget可以继承自Timer。由于Widget并不是Timer，因此不能使用public继承，只能使用private继承。
```cpp
class Widget: private Timer {
private:
virtual void onTick() const; // 周期性执行， 查看Widget数据等
};
```
2）使用复合

然而该设计有一个缺陷：无法阻止derived class重新定义onTick（不论private继承，还是public继承）。改用复合+public继承的方法，在Widget内声明一个嵌套private class，后者以public形式继承Timer并重新定义onTock。

```cpp
class Widget {
private:
    class WidgetTimer: public Timer { // 内嵌类public继承Timer
    public:
        virtual void onTick() const;
        ...
    };
    WidgetTimer timer;
    ...
};
```

这样设计有2个优点：
（1）能解决private继承无法解决的derived class重新定义onTick问题；
（2）如果想要将Widget编译依存性降至最低，可以将WidgetTimer移除Widget类外，在Widget类内只需要一个指针指向WidgetTimer即可，头文件中不再需要include Timer或者WidgetTimer，而只需要class声明。

极端情况

当一个类是空类时（没有任何non-static成员变量，virtual函数）。如果一个类含有一个Empty，可能会导致占用的内存空间变大。比如：
```cpp
class Empty { }; // 空类占用1byte空间
class HoldsAnInt {
private:
    int x; // 4byte
    Empty e; // 1byte，实际可能占用4byte（对齐）
};
```
理论上，空类应该不占用空间，但实际上C++实现，空类占用1byte，即sizeof(Empty) = 1。这样，HoldsAnInt原本只应该占用4byte，实际上可能占用5byte或者8byte（如果有4byte对齐要求）。

如果是private继承，就能解决这个问题。下面例子中，sizeof(HoldsAnInt) = 4。

```CPP
class HoldsAnInt: private Empty { // private继承
private:
    int x; // 4byte
};

```

## 总结
- private继承意味着根据某物实现（is-implemented-in-terms-of）。它通常比组合的级别低。但是当derived class需要访问protected base class成员，或者需要重新定义继承而来的virtual函数时，这么设计是合理的。
- 和复合不同，private继承可以造成empty base最优化。这对致力于对象尺寸最小化的程序库开发者而言，可能很重要。

