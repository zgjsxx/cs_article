---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 53-不要忽略编译器的警告

这一节所讲解的道理是很简单的，主要就是告诉大家要利用好编译器给出的warning信息，不要轻易忽视。但是在日常开发中，很多人都对warnging的警告不太重视。在编程方法中的很多优化方法都是将运行态的错误转移到编译态，可以如果在编译器给出的信息的重要性，因此我们不能忽略它，并且在日常开发中需要非常重视。

## 分析

下面将会给出一些常见的warning，并给出一些解决办法。

### vector容器遍历的warning

下面是一段遍历vector容器的代码，再普遍不过的代码了。

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<std::string> v;
    v.push_back("test1");
    v.push_back("test2");
    for(int i = 0; i < v.size(); ++i){
        std::cout << v[i] << std::endl;
    }
}
```
此时如果采用```g++ main.cpp  -Wall```进行编译，将报出以下的warning：

```shell
main.cpp: In function ‘int main()’:
main.cpp:9:22: warning: comparison of integer expressions of different signedness: ‘int’ and ‘std::vector<std::__cxx11::basic_string<char> >::size_type’ {aka ‘long unsigned int’} [-Wsign-compare]
     for(int i = 0; i < v.size(); ++i){
```

其含义是v.size()返回的是一个无符号的整形信息，而我们遍历时使用的是```int i```整形数据。如果vector的长度非常大，上述代码就可能出现问题。

例如下面的代码：
```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<std::string> v;
    v.resize(100000);
    short i = 0;
    for(; i < v.size(); ++i){
        v[i] = "demo";
    }
    std::cout << "i = " << i << std::endl;
}
```
这里为了演示方便，使用了short而不是int，但是道理是一样的。

short的最大值是32767，这个时候再加1就变成了-32768。

而-32768(有符号)和100000(无符号)的比较是非常令人难以捉摸的，事实上-32768(有符号) 会大于100000(无符号)。因此会退出循环。

推荐修改方法：

```cpp
#include <iostream>
#include <vector>

int main()
{
    std::vector<std::string> v;
    v.push_back("test1");
    v.push_back("test2");
    auto len = v.size();
    for(size_t i = 0; i < len; ++i){
        std::cout << v[i] << std::endl;
    }
}
```


## 总结

- 平常开发过程中，一定要重视编译器给出的警告。除非你有十足的理由，不然不要忽略任何编译器给出的warning信息。
- 平常开发过程中还是要牢记一些开发的原则，不要完全依赖编译器， 每个编译器的warning信息并不相同。