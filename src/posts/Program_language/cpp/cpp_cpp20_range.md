---
category: 
- C++
tag:
- C++
---

# c++20 ranges

c++20四大特性为coroutine， module，concept和range。本文将对range进行探索。

## 什么是range

首先看看range的定义， range其实是一个concept，concept用于对模板的参数进行一定的约束，而range的约束就是要求```ranges::begin(t)```和```ranges::end(t)```可以被正常的解析。

```cpp
template< class T >
concept range = requires( T& t ) {
    ranges::begin(t); // equality-preserving for forward iterators
    ranges::end  (t);
};
```

```ranges::begin(t)```和```ranges::end(t)```可以正常被解析的话，T需要具备哪些条件呢？

这里阅读了下面网站的解析，https://eel.is/c++draft/range.access.begin， 得到的结论是，T可能在下面几种条件下是合法的：
- T是一个数组类型
- T拥有begin和end方法，即t.begin()和t.end()是有效的， 并且返回值是input_or_output_iterator。
- T是一个class类型，然后begin(t)和end(t)是有效的， 并且返回值是input_or_output_iterator。

这里又引出了一个概念input_or_output_iterator，其定义如下，阅读了一下，大概意思就是其可以被解引用*，并且支持++操作。（解释并不严谨，但是便于理解）

```cpp
template <class I>
concept input_or_output_iterator =
  requires(I i) {
    { *i } -> /*can-reference*/;
  } &&
  std::weakly_incrementable<I>;
```

到此为止，我们基本了解了什么样的内容可以称之为一个range，把上面的语句重新解释一下，

对于模板类型T，当T满足下面的条件时，是一个range：
- T是一个数组类型
- T拥有begin和end方法，即t.begin()和t.end()是有效的， 其返回值需要支持使用解引用运算符(*)，也需要支持++运算符。
- T是一个class类型，然后begin(t)和end(t)是有效的， 其返回值需要支持使用解引用运算符(*)，也需要支持++运算符。

本文并不是一个学术论文，上面的总结可能不能很严谨地囊括所有方面，但是足以让你对range的概念有了相对全面的认识。

例如STL中的vector，对于表达式```vector<int> v```， v.begin()和v.end()是合法的，并且v.begin()和v.end()返回的值支持使用解引用和++操作符。

## range可以用来干什么？

ranges可以帮我们简化代码的书写:

### 使用```ranges::sort```简化排序的写法

```cpp
#include <iostream>
#include <vector>
#include <ranges>
#include <algorithm>

int main()
{
    std::vector<int> vec{2,7,4,10,5,1};
    std::ranges::sort(vec);//std::sort(vec.begin(), vec.end());
    for(auto it = vec.cbegin(); it != vec.cend();++it){
        std::cout << *it << std::endl;
    }
}
```

### 结合ranges::view简化反向，过滤，取值等操作

下面的例子使用了ranges::view::reverse帮助我们对vector进行反向。

```cpp
#include <iostream>
#include <vector>
#include <ranges>
#include <algorithm>

using namespace std::ranges;

int main()
{
    std::vector<int> a{1, 2, 3, 4, 5};
    for (int i : (a | views::reverse))
    {
        std::cout << i;
    }
}
```

这里出现了管道类似于shell指令中的管道运算符|，其作用也是类似的，将前一个表达式的输出作为下一个表达式的输入。

例如下面的例子，对range首先进行adapter1操作，再进行adapter2操作。语法1和语法2是等同的，但是语法2更好理解。

```cpp
adapter2(adaptor1(range, args...), args...)//（1）

range | adaptor1(args...) | adaptor2(args...) //（2）
```

所以上述代码中的```a | views::reverse```的含义就更好理解了，就是将a作为```views::reverse```的输入，将就可以得到一个a反向版本的range。再对这个反向版本的range进行遍历。


看懂了上面的简单的例子，我们再看下面的复杂一点的例子：

```cpp
#include <iostream>
#include <vector>
#include <ranges>
#include <algorithm>

using namespace std::ranges;

int main() {
    std::vector<int> v{1,2,3,4,5,6,7,8};
    auto res = v | views::filter([](int a) { return a%2;}) | views::take(3);
    for(const auto& i : res) {
        std::cout << i << std::endl;
    }
}
```

在这个例子中，首先将v传递给filter函数，filter函数的作用是过滤出v中奇数的元素，再将这个中间结果传递给下一层的take方法，取出前三个元素。


## 如何定义自己的range？

从上面的例子中我们大概对range有了认识，range实际上是一种泛化，是对具有相同接口的数据结构的一种抽象。有人也形象的称之为STL2.0。

下面我们就看看如何自定义一个range类型。

在下面的例子中，我们定义了MyRange的类型，提供了相应的begin和end方法。由于我们私有数据类型是vector，因此begin和end返回的是迭代器类型，也是满足要求的。

```cpp
//g++ main.cpp -std=c++20
#include <array>
#include <iostream>
#include <list>
#include <ranges>
#include <vector>
 

using namespace std::ranges;

template<typename T>
class MyRange
{
public:
    MyRange(){

    }
    ~MyRange()
    {

    }
public:
    typedef std::vector<T>::iterator Iterator;
    Iterator begin()
    {
        return v_.begin();
    }

    Iterator end()
    {
        return v_.end();
    }

    void push_back(T t){
        v_.push_back(t);
    }
private:
    std::vector<T> v_;    
};

int main()
{
    MyRange<int> myRange;
    myRange.push_back(5);
    myRange.push_back(2);
    myRange.push_back(3);
    myRange.push_back(7);
    myRange.push_back(9);

    for (int i : (myRange | views::reverse))
    {
        std::cout << i;
    }
}
```

## 总结

通过上面的例子，我们对range有了一个认识，ranges库提供的功能不仅仅局限于此，有关ranges的更多作用，可以去下面的地址进行了解。https://en.cppreference.com/w/cpp/ranges。

对于range，总结如下：
- range是一种泛化，是具有begin和end属性的物体的抽象
- 使用range和view可以实现各种需求，可以简化代码的编写。

