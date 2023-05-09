---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 29 为异常安全而努力是值得的

本节主要阐述了面对异常我们该做的事情。用数据库进行类比，数据库中有事务的概念，即要么都执行成功，要么都不执行。类比于异常，当异常发生时，我们最好要恢复到调用之前的状态。

## 分析

下面先看一个经典的错误案例：

```cpp
void lock(Mutex* pm);   //锁定pm所指的互斥器
void unlock(Mutex* pm); //将互斥器解锁

class PrettyMenu {
public:
    void changeBackground(std::istream& imgSrc) {
        lock(&mutex);   //取得互斥器
        delete bgImage; //删除旧图片
        ++imageChanges; //修改图像更改次数
        bgImage = new Image(imgSrc); //安装新的背景图片
        unlock(&mutex); //释放互斥器
    }
private:
    Mutex mutex;     //互斥器
    Image* bgImage;  //目前使用的背景图片
    int imageChanges;//图片被修改的次数
};
```
上面的changeBackground()成员函数不是"异常安全的"。 因为异常安全的函数应该有以下两种特性：
- 1.不泄露任何资源：上述的代码如果new Image()操作导致异常，那么就永远不会调用unlock，那么互斥器将永远被锁住。因此该成员函数没有保证这一点
- 2.不允许数据破坏：如果new Image()操作导致异常，那么bgImage已经被删除了，而且imageChanges数量也被累加了，所以资源被改变了。但是该函数没有保证这一点

我们知道了存在的问题。那么下面就谈论我们该如何解决这些问题。

首先看**解决资源泄露**的问题。

这个问题很容易解决，在条款13中讨论了如何以对象管理资源，条款14也介绍了自己设计一个名为Lock的类来管理互斥器，定义如下：
```cpp
//初始化对象时锁住互斥器，对象释放时自动解除互斥器
class Lock
{
public:
    //获得资源
    explicit Lock(Mutex* pm) :mutexPtr(pm) {
        lock(mutexPtr);
    }
 
    //释放资源
    ~Lock() { unlock(mutexPtr); }
private:
    Mutex *mutexPtr;
};

//重写修改PrettyMenu的成员函数
void PrettyMenu::changeBackground(std::istream& imgSrc) {
    Lock ml(&mutex);//将互斥器封装在类中进行管理
    delete bgImage; //删除旧图片
    ++imageChanges; //修改图像更改次数
    bgImage = new Image(imgSrc); //安装新的背景图片
}
```
上面我们RAII设计模式很好的解决资源泄漏的问题。

下面看如何**解决数据破坏**的问题。

上面介绍了资源泄漏的一般解决办法，现在来关注一下数据破坏的问题。在此之前我们先定义一些术语：
- 1.基本承诺：如果异常被抛出，程序内的任何事物都应该保持在有效状态
- 2.强烈保证：如果程序抛出异常，程序状态不应该保证。调用这样的函数应该保证：如果函数成功就是完全成功；如果函数执行失败，程序会恢复到"调用函数之前"的状态
- 3.不抛掷保证：承诺绝不抛出异常，因为它们总是能够完成它们原先承诺的功能。
  
C++提供两种异常说明：
   - throw
   - noexcept

虽然可以使用上面两种异常说明来显式说明函数不会抛出异常，但是如果函数抛出了异常还是允许的。

异常安全的代码必须提供上述三种保证之一，如果不是这样，那么代码就不是**异常安全**的。

对于```changeBackground()```函数而言，为了保证数据不被破坏，可以更改为下面的代码：

```cpp
class PrettyMenu {
//...
private:
    std::shared_ptr<Image> bgImage;
};

//重写修改PrettyMenu的成员函数
void PrettyMenu::changeBackground(std::istream& imgSrc) {
	Lock ml(&mutex);
	bgImage.reset(new Image(imgSrc));
	++imageChanges;
}
```

在上面的代码中我们使用智能指针来管理Image对象。重新排序changeBackground()函数内的语句顺序，使得更换图像之后才累加imageChanges
在changeBackground()函数内部不需要手动删除delete旧图像了，因为已经由智能指针自动管理删除了（在reset的内部被调用）。


通过上面的案例，我们知道了我们的代码需要做到是**异常安全**的。是不是听着很耳熟，更常听到的是**线程安全的代码**，这里又多了一个，哈哈。

那么异常安全有没有什么套路？

这里将介绍一个异常安全的套路： copy-and-sway。

copy and swap策略的原则是：为你打算修改的对象（原件）做一份副本，然后在副本身上做修改：

如果在副本的身上修改抛出了异常，那么原对象未改变状态。如果在副本的身上修改未抛出异常，那么就将修改过的副本与原对象进行置换（swap）
pimpl idiom手法：

看下面的例子：

```cpp
//将bgImage和imageChanges从PrettyMenu独立出来，封装到一个结构中
struct PMImpl {
    std::tr1::shared_ptr<Image> bgImage;
    int imageChanges
};

class PrettyMenu {
    //...
private:
    std::tr1::shared_ptr<PMImpl> pImpl; //创建一个该结构
};
```

现在我们重新修改changeBackground()函数：

```cpp
void PrettyMenu::changeBackground(std::istream& imgSrc) {
    using std::swap; //见条款25

    Lock ml(&mutex);
	
    //以pImpl为原件，创建一个副本，然后在副本上做修改
    std::tr1::shared_ptr<PMImpl> pNew(new PMImpl(*pImpl));
    pNew->bgImage.reset(new Image(imgSrc));
    pNew->imageChanges++;

    //如果上面副本的修改没有抛出异常，那么交换副本与原件
    swap(pImpl, pNew);
}
```

知道确保对副本的修改没有异常之后，开始交换副本和原件。

这便是异常安全代码的一个固定套路，但是也要根据场景具体问题具体分析。

## 总结
- 异常安全函数，即便发生异常也不会泄露资源或者运行任何数据结构败坏。这样的函数区分为三种可能的保证: 基本型、强烈型、不抛异常型。
- 强烈保证往往能够以copy-and-swap实现，但强烈保证并非对所有函数都可实现或者具备现实意义。
- 函数提供的异常安全保证通常最高值等于其所调用之各个函数的异常安全保证中的最弱者。
