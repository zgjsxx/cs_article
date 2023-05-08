---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL 总是include适当的头文件

有的时候即使漏掉了必要的头文件，程序同样可以编译，这是因为C++标准并没有规定标准库中头文件之间的相互包含关系。这就导致了某个头文件可能会包含其他头文件，

例如，A平台的STL版本中```<vector>```可能包含了```<string>```,那么下面的代码在A平台就是可以编译通过的。

```cpp
#include <vector>
std::vector<std::string> a;
```

但是B平台的STL版本中```<vector>```可能就不包含```<string>```。

那这个时候上述代码编译就会出错。

因此解决此类问题的一条原则就是总是include必要的头文件。

这就需要我们对STL常用的组件对应的头文件有一定的了解。

下面便是关于常用的STL以及对应的组件的头文件的总结。

## 总结

- 几乎所有的容器都在同名的头文件里，比如，vector在<vector>中声明，list在<list>中声明等。例外的是<set>和<map>。<set>声明了set和multiset，<map>声明了map和multimap。
- 除了四个算法外，所有的算法都在<algorithm>中声明。例外的是accumulate、inner_product、adjacent_difference和partial_sum。这些算法在<numeric>中声明。
- 特殊的迭代器，包括istream_iterators和istreambuf_iterators，在<iterator>中声明。
- 标准仿函数（比如less<T>）和仿函数适配器（比如not1、bind2nd）在<functional>中声明。