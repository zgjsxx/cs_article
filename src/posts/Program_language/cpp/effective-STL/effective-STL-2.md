---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-02 小心对"容器无关代码"的幻想


STL是建立在泛化的基础上的。

- 数组泛化为容器，参数泛化所包含对象的类型。
- 函数泛化为算法，参数泛化所用的迭代器类型。
- 指针泛化为迭代器，参数泛化所指向的对象的类型。

不同容器是不同的，优点和缺点大不相同，不要去对它们做包装

- 序列容器支持push_front、push_back，但关联容器不支持
- 关联容器提供logN复杂度的lower_bound、upper_bound和equal_range，（N叉树）
- 不同的容器是不同的，优缺点有重大不同。它们不被设计成可互换的，而且你做不了什么包装的工作

尽量用typedef来代替冗长的```container<class>``` 以及```container<class>::iterator```代码,使用typedef的好处还有，换另一种容器方便(以及更换allocator等其他template参数的时候)

```cpp
class Widget { ... };
typedef vector<Widget> WidgetContainer; //只修改一处
typedef WidgetContainer::iterator WCIterator; //只修改一处
//using WCIterator =WidgetContainer::iterator C++11
WidgetContainer cw;
Widget bestWidget;
...
WCIterator i = find(cw.begin(), cw.end(), bestWidget);
```

如果问题的改变是简单的加上用户的allocator时特别方便
```cpp
class Widget { ... };
template<typename T> // 关于为什么这里需要一个template
SpecialAllocator { ... }; // 请参见条款10
typedef vector<Widget, SpecialAllocator<Widget> > WidgetContainer;
typedef WidgetContainer::iterator WCIterator;
WidgetContainer cw; // 仍然能用
Widget bestWidget;
...
WCIterator i = find(cw.begin(), cw.end(), bestWidget); // 仍然能用
```

2.如果不想对用户暴露所使用容器的类型，则把容器进行封装，把容器类型定义在private域，只提供相应的接口给用户
```cpp
class CustomerList {
private:
    typedef list<Customer> CustomerContainer;
    typedef CustomerContainer::iterator CCIterator;
    CustomerContainer customers;//隐藏
public: // 通过这个接口
    ... // 限制list特殊信息的可见性
};
```

参考文章：

https://www.cnblogs.com/yan1345/p/Note_of_Effective_STL.html#02-%E5%B0%8F%E5%BF%83%E5%AF%B9%E5%AE%B9%E5%99%A8%E6%97%A0%E5%85%B3%E4%BB%A3%E7%A0%81%E7%9A%84%E5%B9%BB%E6%83%B3