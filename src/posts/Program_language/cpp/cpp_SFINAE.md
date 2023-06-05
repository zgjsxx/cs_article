---
category: 
- C++
---

# C++模板之SFINAE规则

## 概念

SFINAE是Substitution Failure Is Not An Error的缩写，翻译过来的意思是替换失败并不是一个错误。

**SFINAE**是**模板元编程**中常见的一种技巧，如果模板实例化后的某个模板函数（模板类）对该调用无效，那么将继续寻找其他重载决议，而不是引发一个编译错误。

因此一句话概括SFINAE，就是模板匹配过程中会尝试各个模板，直到所有模板都匹配失败，才会认为是真正的错误。

这个点是c++模板匹配的一个规则，通常情况下，使用该规则，我们可以判断某个类是否有否定义了内嵌类型。下面通过例子来进行讲解。

## 例子

下面的这个例子便是在编译过程中检验T是否有一个```T::iterator_category```的类型定义。

```cpp
#include <iostream>
#include <vector>

template <typename T>
struct has_iterator_category {
    struct two { char a; char b; };

    template <typename C>
    static two& test(typename C::iterator_category*);

    template <typename>
    static char& test(...);

    static const bool value = sizeof(test<T>(nullptr)) == sizeof(two);
};

struct input_iterator_tag {};
struct output_iterator_tag {};
struct forward_iterator_tag : public input_iterator_tag {};
struct bidirectional_iterator_tag : public forward_iterator_tag {};
struct random_access_iterator_tag : public bidirectional_iterator_tag {};


struct ListIterator {
    typedef forward_iterator_tag iterator_category;
};

int main() {
    std::cout << has_iterator_category<ListIterator>::value << std::endl;//true
    std::cout << has_iterator_category<int>::value << std::endl;//false
    return 0;
}
```

输出结果：
```
true
false
```

[have a try](https://godbolt.org/z/6GG9YWjWq)

上面的这个例子实际上取自于[MyTinySTL](https://github.com/Alinshans/MyTinySTL)中关于iterator_traits的实现。

iterator_traits 只能萃取符合MyTinySTL设计的迭代器, MyTinySTL的迭代器中都会内置定义iterator_category这个类型，这个类型就代表了迭代的类型。因此iterator_traits想要萃取出迭代器类型，必须要确保迭代器有这个类型，于是就使用了SFINAE实现了这个点。

has_iterator_category有两个test函数，第一个test函数```static two& test(typename C::iterator_category*)```，其要求模板T拥有iterator_category的嵌套类型，如果满足将返回two类型的值。第二个test函数```test(...)```接受任意类型的参数，这是一个default匹配，第一个test匹配不上时，将匹配该函数，该函数返回char类型的值。

当我们传入ListIterator类型进入has_iterator_category，```has_iterator_category<ListIterator>```将匹配第一个test函数，其value就是true。

当我们传入int类型进入has_iterator_category，```has_iterator_category<int>```将匹配第二个test函数，其value就是false。

在c++20中，引入了concept的概念，利用concept可以实现SFINAE相同的功能，但是语法上大大简化，如果项目中使用了c++20，可以考虑使用concept。