---
category: 
- C++
- effective Modern C++
---

# Item37：使std::thread在所有路径最后都不可结合（unjoinable）

如果一个线程没有被detach，那么必须确保线程在合适的时间都被join回收资源。而被detach过的线程，则会在线程执行完毕后自动释放资源(pthread结构体和栈)。使```std::thread```在所有路径最后都unjoinable就意味着我们需要确保线程执行完毕后释放了其占用的资源。

每个```std::thread```对象处于两个状态之一：**可结合的（joinable）**或者**不可结合的（unjoinable）**。

```std::thread```的可结合性如此重要的原因之一就是**当可结合的线程的析构函数被调用**，程序执行会终止。例如下面这个例子，func函数结束之后，th就被析构了，然后此时该线程还是joinable的，结果程序crash了。

```cpp
#include <thread>
using namespace std::chrono_literals;

void func()
{
    auto func = [](){
        std::this_thread::sleep_for(2000ms);
    };

    std::thread th(func);
}
int main()
{
    func();
}
```

下面看一个更加实际的例子，假定有一个函数doWork，使用一个过滤函数filter，一个最大值maxVal作为形参。doWork检查是否满足计算所需的条件，然后使用在0到maxVal之间的通过过滤器的所有值进行计算。如果进行过滤非常耗时，并且确定doWork条件是否满足也很耗时，则将两件事并发计算是很合理的。

我们希望为此采用基于任务的设计（参见Item35），但是假设我们希望设置做过滤的线程的优先级。Item35阐释了那需要线程的原生句柄，只能通过```std::thread```的API来完成；基于任务的API（比如future）做不到。所以最终采用基于线程而不是基于任务。

我们可能写出以下代码：

```cpp
constexpr auto tenMillion = 10000000;           //constexpr见条款15

bool doWork(std::function<bool(int)> filter,    //返回计算是否执行；
            int maxVal = tenMillion)            //std::function见条款2
{
    std::vector<int> goodVals;                  //满足filter的值

    std::thread t([&filter, maxVal, &goodVals]  //填充goodVals
                  {
                      for (auto i = 0; i <= maxVal; ++i)
                          { if (filter(i)) goodVals.push_back(i); }
                  });

    auto nh = t.native_handle();                //使用t的原生句柄
    …                                           //来设置t的优先级

    if (conditionsAreSatisfied()) {
        t.join();                               //等t完成
        performComputation(goodVals);
        return true;                            //执行了计算
    }
    return false;                               //未执行计算
}
```

在上面的代码中，如果conditionsAreSatisfied()返回true，没什么问题，但是如果返回false或者抛出异常，在doWork结束调用t的析构函数时，```std::thread```对象t会是可结合的。这造成程序执行中止。

你可能会想，为什么```std::thread```析构的行为是这样的，那是因为另外两种显而易见的方式更糟：

- 隐式join 。这种情况下，```std::thread```的析构函数将等待其底层的异步执行线程完成。这听起来是合理的，但是可能会导致难以追踪的异常表现。比如，如果```conditonAreStatisfied()```已经返回了false，doWork继续等待过滤器应用于所有值就很违反直觉。

- 隐式detach 。这种情况下，```std::thread```析构函数会分离```std::thread```与其底层的线程。底层线程继续运行。听起来比join的方式好，但是可能导致更严重的调试问题。比如，在doWork中，goodVals是通过引用捕获的局部变量。它也被lambda修改（通过调用push_back）。假定，lambda异步执行时，conditionsAreSatisfied()返回false。这时，doWork返回，同时局部变量（包括goodVals）被销毁。栈被弹出，并在doWork的调用点继续执行线程。

调用点之后的语句有时会进行其他函数调用，并且至少一个这样的调用可能会占用曾经被doWork使用的栈位置。我们调用那么一个函数f。当f运行时，doWork启动的lambda仍在继续异步运行。该lambda可能在栈内存上调用push_back，该内存曾属于goodVals，但是现在是f的栈内存的某个位置。这意味着对f来说，内存被自动修改了！想象一下调试的时候“乐趣”吧。

标准委员会认为，销毁可结合的线程如此可怕以至于实际上禁止了它（规定销毁可结合的线程导致程序终止）。

下面便是一个编译器对于thread析构的实现，如果析构时，线程还是可以join的状态，将会terminate。
```cpp
    ~thread()
    {
      if (joinable())
	    std::terminate();
    }
```

这使你有责任确保使用```std::thread```对象时，在所有的路径上超出定义所在的作用域时都是不可结合的。但是覆盖每条路径可能很复杂，可能包括自然执行通过作用域，或者通过return，continue，break，goto或异常跳出作用域，有太多可能的路径。

每当你想在执行跳至块之外的每条路径执行某种操作，最通用的方式就是将该操作放入局部对象的析构函数中。这些对象称为**RAII对象**（RAII objects），从RAII类中实例化(RAII可以参考effective c++ item13)。

幸运的是，完成自行实现的类并不难。比如，下面的类实现允许调用者指定ThreadRAII对象（一个```std::thread```的RAII对象）析构时，调用join或者detach：

```cpp
class ThreadRAII {
public:
    enum class DtorAction { join, detach };     //enum class的信息见条款10
    
    ThreadRAII(std::thread&& t, DtorAction a)   //析构函数中对t实行a动作
    : action(a), t(std::move(t)) {}

    ~ThreadRAII()
    {                                           //可结合性测试见下
        if (t.joinable()) {
            if (action == DtorAction::join) {
                t.join();
            } else {
                t.detach();
            }
        }
    }

    std::thread& get() { return t; }            //见下

private:
    DtorAction action;
    std::thread t;
};
```

下面补充几点说明：

- 构造器只接受```std::thread```右值，因为我们想要把传来的```std::thread```对象移动进ThreadRAII。（```std::thread```不可以复制。）

- 构造器的形参顺序设计的符合调用者直觉（首先传递```std::thread```，然后选择析构执行的动作，这比反过来更合理），但是成员初始化列表设计的匹配成员声明的顺序。将```std::thread```对象放在声明最后。在这个类中，这个顺序没什么特别之处，但是通常，可能一个数据成员的初始化依赖于另一个，因为```std::thread```对象可能会在初始化结束后就立即执行函数了，所以在最后声明是一个好习惯。这样就能保证一旦构造结束，在前面的所有数据成员都初始化完毕，可以供```std::thread```数据成员绑定的异步运行的线程安全使用。

ThreadRAII提供了get函数访问内部的```std::thread```对象。这类似于标准智能指针提供的get函数，可以提供访问原始指针的入口。提供get函数避免了ThreadRAII复制完整```std::thread```接口的需要，也意味着ThreadRAII可以在需要```std::thread```对象的上下文环境中使用。

在ThreadRAII析构函数调用```std::thread```对象t的成员函数之前，检查t是否可结合。这是必须的，因为在不可结合的```std::thread```上调用join或detach会导致未定义行为。客户端可能会构造一个```std::thread```，然后用它构造一个ThreadRAII，使用get获取t，然后移动t，或者调用join或detach，每一个操作都使得t变为不可结合的。

如果你担心下面这段代码

```cpp
if (t.joinable()) {
    if (action == DtorAction::join) {
        t.join();
    } else {
        t.detach();
    }
}
```
存在竞争，因为在t.joinable()的执行和调用join或detach的中间，可能有其他线程改变了t为不可结合，你的直觉值得表扬，但是这个担心不必要。只有调用成员函数才能使```std::thread```对象从可结合变为不可结合状态，比如join，detach或者移动操作。在ThreadRAII对象析构函数调用时，应当没有其他线程在那个对象上调用成员函数。如果同时进行调用，那肯定是有竞争的，但是不在析构函数中，是在客户端代码中试图同时在一个对象上调用两个成员函数（析构函数和其他函数）。通常，仅当所有都为const成员函数时，在一个对象同时调用多个成员函数才是安全的。

在doWork的例子上使用ThreadRAII的代码如下：

```cpp
bool doWork(std::function<bool(int)> filter,        //同之前一样
            int maxVal = tenMillion)
{
    std::vector<int> goodVals;                      //同之前一样

    ThreadRAII t(                                   //使用RAII对象
        std::thread([&filter, maxVal, &goodVals]
                    {
                        for (auto i = 0; i <= maxVal; ++i)
                            { if (filter(i)) goodVals.push_back(i); }
                    }),
                    ThreadRAII::DtorAction::join    //RAII动作
    );

    auto nh = t.get().native_handle();
    …

    if (conditionsAreSatisfied()) {
        t.get().join();
        performComputation(goodVals);
        return true;
    }

    return false;
}
```

这种情况下，我们选择在ThreadRAII的析构函数对异步执行的线程进行join，因为在先前分析中，detach可能导致噩梦般的调试过程。我们之前也分析了join可能会导致表现异常（坦率说，也可能调试困难），但是在未定义行为（detach导致），程序终止（使用原生```std::thread```导致），或者表现异常之间选择一个后果，可能表现异常是最好的那个。

哎，Item39表明了使用ThreadRAII来保证在```std::thread```的析构时执行join有时不仅可能导致程序表现异常，还可能导致程序挂起。"适当"的解决方案是此类程序应该和异步执行的lambda通信，告诉它不需要执行了，可以直接返回，但是C++11中不支持可中断线程（interruptible threads）。可以自行实现，但是这不是本书讨论的主题。（关于这一点，Anthony Williams的《C++ Concurrency in Action》（Manning Publications，2012）的section 9.2中有详细讨论。）

Item17说明因为ThreadRAII声明了一个析构函数，因此不会有编译器生成移动操作，但是没有理由ThreadRAII对象不能移动。如果要求编译器生成这些函数，函数的功能也正确，所以显式声明来告诉编译器自动生成也是合适的：

```cpp
class ThreadRAII {
public:
    enum class DtorAction { join, detach };         //跟之前一样

    ThreadRAII(std::thread&& t, DtorAction a)       //跟之前一样
    : action(a), t(std::move(t)) {}

    ~ThreadRAII()
    {
        …                                           //跟之前一样
    }

    ThreadRAII(ThreadRAII&&) = default;             //支持移动
    ThreadRAII& operator=(ThreadRAII&&) = default;

    std::thread& get() { return t; }                //跟之前一样

private: // as before
    DtorAction action;
    std::thread t;
};
```

c++11的thread在析构的时候并不会自动的join， 但是在c++20中新增了jthread类型，这种类型的thread在析构时会自动join，有兴趣可以尝试探索。

## 总结

- 在所有路径上保证thread最终是不可结合的。
- 析构时join会导致难以调试的表现异常问题。
- 析构时detach会导致难以调试的未定义行为。
- 声明类数据成员时，最后声明std::thread对象。