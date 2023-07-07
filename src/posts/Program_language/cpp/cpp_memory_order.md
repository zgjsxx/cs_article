---
category: 
- C++
tag:
- C++
---

# c++11原子变量与内存序

## 多线程中共享变量进行操作的问题

在多线程中，共享一个变量用于计数或者流程控制是一个很常见的需求，在这个过程中就带来了两个常见的问题：

(1)i++问题

两个线程同时对一个变量执行i++操作，结果得到的值却不是期望的，这便是i++问题。

i++的问题的原因在于岂不是一个原子操作：

|步骤|thread 1|
|--|--|
|1|读取内存的值(i)到寄存器|
|2|寄存器的值+1|
|3|将寄存器的值写回内存(i)|


在多线程下，其执行顺序可能是下面这样的：

|步骤|thread 1|thread 2|
|--|--|--|
|1|读取内存的值(i)到寄存器||
|2|寄存器的值+1||
|3||读取内存的值(i)到寄存器|
|4||寄存器的值+1|
|5|将寄存器的值写回内存(i)||
|6||将寄存器的值写回内存(i)|

如果i的初始值为0，按照上面的执行顺序，则i最终值为2，而不是期望的3。

(2)指令重排问题

有时候，我们会用一个变量作为标志位，当这个变量等于某个特定值的时候就进行某些操作。但是这样依然可能会有一些意想不到的坑，例如两个线程以如下顺序执行：

|步骤|thread 1|thread 2|
|--|--|--|
|1|a=1||
|2|flag=true||
|3||if flag == true|
|4||assert(a == 1)|

当B判断flag为true后，断言a为1，看起来的确是这样。那么一定是这样吗？可能不是，因为编译器和CPU都可能将指令进行重排（编译器不同等级的优化和CPU的乱序执行）。实际上的执行顺序可能变成这样：

|步骤|thread 1|thread 2|
|--|--|--|
|1|flag=true||
|2||if flag == true|
|3||assert(a == 1)|
|4|a=1||

这种重排有可能会导致一个线程内相互之间不存在依赖关系的指令交换执行顺序，以获得更高的执行效率。比如上面：flag 与 a 在A线程看起来是没有任何依赖关系，似乎执行顺序无关紧要。但问题在于B使用了flag作为是否读取a的依据，A的指令重排可能会导致step3
的时候断言失败。

**解决方案**

一个比较稳妥的办法就是对于共享变量的访问进行加锁，加锁可以保证对临界区的互斥访问，例如第一种场景如果加锁后再执行i++ 然后解锁，则同一时刻只会有一个线程在执行i++ 操作。另外，加锁的内存语义能保证一个线程在释放锁前的写入操作一定能被之后加锁的线程所见（即有happens before 语义），可以避免第二种场景中读取到错误的值。

## C++11的原子量
C++11标准在标准库atomic头文件提供了模版atomic<>来定义原子量：
```cpp
template< class T >
struct atomic;
```

它提供了一系列的成员函数用于实现对变量的原子操作，例如读操作load，写操作store，以及CAS操作compare_exchange_weak/compare_exchange_strong等。而对于大部分内建类型，C++11提供了一些特化：
```cpp
std::atomic_bool    std::atomic<bool>
std::atomic_char    std::atomic<char>
std::atomic_schar   std::atomic<signed char>
std::atomic_uchar   std::atomic<unsigned char>
std::atomic_short   std::atomic<short>
std::atomic_ushort  std::atomic<unsigned short>
std::atomic_int std::atomic<int>
std::atomic_uint    std::atomic<unsigned int>
std::atomic_long    std::atomic<long>
//更多类型见：http://en.cppreference.com/w/cpp/atomic/atomic
```

实际上这些特化就是相当于取了一个别名，本质上是同样的定义。而对于整形的特化而言，会有一些特殊的成员函数，例如
- 原子加fetch_add、原子减fetch_sub、原子与fetch_and、原子或fetch_or等
- 常见操作符++、--、+=、&= 等也有对应的重载版本。

接下来以int类型为例，解决我们的前面提到的i++ 场景中的问题。先定义一个int类型的原子量：
```cpp
std::atomic<int> i;
```
由于int型的原子量重载了++ 操作符，所以i++ 是一个不可分割的原子操作，我们用多个线程执行i++ 操作来进行验证，测试代码如下:

```cpp
#include <iostream>
#include <atomic>
#include <vector>
#include <functional>
#include <thread>
 
std::atomic<int> i;
const int count = 100000;
const int n = 10;
 
void add()
{
    for (int j = 0; j < count; ++j)
        i++;
}
 
int main()
{
    i.store(0);
    std::vector<std::thread> workers;
    std::cout << "start " << n << " workers, "
              << "every woker inc " << count  << " times" << std::endl;
 
    for (int j = 0; j < n; ++j)
        workers.push_back(std::move(std::thread(add)));
 
    for (auto & w : workers)
        w.join();
 
    std::cout << "workers end "
              << "finally i is " << i << std::endl;
 
    if (i == n * count)
        std::cout << "i++ test passed!" << std::endl;
    else
        std::cout << "i++ test failed!" << std::endl;
 
    return 0;
}
```

在测试中，我们定义了一个原子量i，在main函数开始的时候初始化为0，然后启动10个线程，每个线程执行i++操作十万次，最终检查i的值是否正确。执行的最后结果如下：
```shell
start 10 workers, every woker inc 100000 times
workers end finally i is 1000000
i++ test passed!
```

上面我们可以看到，10个线程同时进行大量的自增操作，i的值依然正常。假如我们把i修改为一个普通的int变量，再次执行程序可以得到结果如下：

```shell
start 10 workers, every woker inc 100000 times
workers end finally i is 445227
i++ test failed!
```

显然，由于自增操作各个步骤的交叉执行，导致最后我们得到一个错误的结果。

原子量可以解决i++问题，那么可以解决指令重排的问题吗？也是可以的，和原子量选择的内存序有关，我们把这个问题放到下一节专门研究。

上面已经看到atomic是一个模版，那么也就意味着我们可以把自定义类型变成原子变量。但是是否任意类型都可以定义为原子类型呢？当然不是，cppreference中的描述是必须为TriviallyCopyable类型。


## C++11的六种内存序
前面我们解决i++问题的时候已经使用过原子量的写操作load将原子量赋值，实际上成员函数还有另一个参数：

```cpp
void store( T desired, std::memory_order order = std::memory_order_seq_cst )
```

这个参数代表了该操作使用的内存序，用于控制变量在不同线程见的顺序可见性问题，不只load，其他成员函数也带有该参数。c++11提供了六种内存序供选择，分别为：

```cpp
typedef enum memory_order {
    memory_order_relaxed,
    memory_order_consume,
    memory_order_acquire,
    memory_order_release,
    memory_order_acq_rel,
    memory_order_seq_cst
} memory_order;
```
之前在场景2中，因为指令的重排导致了意料之外的错误，通过使用原子变量并选择合适内存序，可以解决这个问题。下面先来看看这几种内存序

### memory_order_release/memory_order_acquire
内存序选项用来作为原子量成员函数的参数，memory_order_release用于store操作，memory_order_acquire用于load操作，这里我们把使用了memory_order_release的调用称之为release操作。从逻辑上可以这样理解：release操作可以阻止这个调用之前的读写操作被重排到后面去，而acquire操作则可以保证调用之后的读写操作不会重排到前面来。听起来有种很绕的感觉，还是以一个例子来解释：假设flag为一个 atomic特化的bool 原子量，a为一个int变量，并且有如下时序的操作：

|step|	thread A	|thread B|
|--|--|--|
|1	|a = 1|	 |
|2	|flag.store(true, memory_order_release)|	| 
|3	| 	|if( true == flag.load(memory_order_acquire))|
|4	| 	|assert(a == 1)|

实际上这就是把我们上文场景2中的flag变量换成了原子量，并用其成员函数进行读写。在这种情况下的逻辑顺序上，step1不会跑到step2后面去，step4不会跑到step3前面去。这样一来，实际上我们就已经保证了当读取到flag为true的时候a一定已经被写入为1了，场景2得到了解决。换一种比较严谨的描述方式可以总结为：

对于同一个原子量，**release操作前的写入，一定对随后acquire操作后的读取可见**。

这两种内存序是需要配对使用的，这也是将他们放在一起介绍的原因。还有一点需要注意的是：只有对同一个原子量进行操作才会有上面的保证，比如step3如果是读取了另一个原子量flag2，是不能保证读取到a的值为1的。


### memory_order_release/memory_order_consume
memory_order_release还可以和memory_order_consume搭配使用。memory_order_release操作的作用没有变化，而memory_order_consume用于load操作，我们简称为consume操作，comsume操作防止在其后对原子变量有依赖的操作被重排到前面去。这种情况下：

对于同一个原子变量，release操作所依赖的写入，一定对随后consume操作后依赖于该原子变量的操作可见。
这个组合比上一种更宽松，comsume只阻止对这个原子量有依赖的操作重排到前面去，而非像aquire一样全部阻止。将上面的例子稍加改造来展示这种内存序，假设flag为一个 atomic特化的bool 原子量，a为一个int变量，b、c各为一个bool变量，并且有如下时序的操作：

|step|	thread A|	thread B|
|--|--|--|
|1  |	b = true||	 
|2	|   a = 1	 ||
|3	|   flag.store(b, memory_order_release)	|| 
|4	 |	|while (!(c = flag.load(memory_order_consume)))|
|5	 |	|assert(a == 1)|
|6	 |	|assert(c == true)|
|7	 |	|assert(b == true)|

step4使得c依赖于flag，当step4线程B读取到flag的值为true的时候，由于flag依赖于b，b在之前的写入是可见的，此时b一定为true，所以step6、step7的断言一定会成功。而且这种依赖关系具有传递性，假如b又依赖与另一个变量d，则d在之前的写入同样对step4之后的操作可见。那么a呢？很遗憾在这种内存序下a并不能得到保证，step5的断言可能会失败。



### memory_order_acq_rel

这个选项看名字就很像release和acquire的结合体，实际上它的确兼具两者的特性。这个操作用于“读取-修改-写回”这一类既有读取又有修改的操作，例如CAS操作。可以将这个操作在内存序中的作用想象为将release操作和acquire操作捆在一起，因此任何读写操作的重拍都不能跨越这个调用。依然以一个例子来说明，flag为一个 atomic特化的bool 原子量，a、c各为一个int变量，b为一个bool变量,并且刚好按如下顺序执行：


|step	|thread A	|thread B|
|--|--|--|
|1	|a = 1||	 
|2	|flag.store(true, memory_order_release)	|| 
|3	 ||	b = true|
|4	 ||	c = 2|
|5	 ||	while (!flag.compare_exchange_weak(b, false, memory_order_acq_rel)) {b = true}|
|6	 	||assert(a == 1)|
|7	|if (true == flag.load(memory_order_acquire)	 ||
|8	|assert(c == 2)	 ||


### memory_order_seq_cst
这个内存序是各个成员函数的内存序默认选项，如果不选择内存序则默认使用memory_order_seq_cst。这是一个“美好”的选项，如果对原子变量的操作都是使用的memory_order_seq_cst内存序，则多线程行为相当于是这些操作都以一种特定顺序被一个线程执行，在哪个线程观察到的对这些原子量的操作都一样。同时，任何使用该选项的写操作都相当于release操作，任何读操作都相当于acquire操作，任何“读取-修改-写回”这一类的操作都相当于使用memory_order_acq_rel的操作。

### memory_order_relaxed
这个选项如同其名字，比较松散，它仅仅只保证其成员函数操作本身是原子不可分割的，但是对于顺序性不做任何保证。



参考文章：
https://blog.csdn.net/chansoncc/article/details/88186350?share_token=4b2577c7-3323-4f4d-9e94-0240bf5b640c

https://wudaijun.com/2019/04/cache-coherence-and-memory-consistency/
