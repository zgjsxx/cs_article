---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-42 确保```less<T>```和operator<具有相同的语义


## 分析

下面有一个类，其有重量和速度两个属性，在```operator<```中是对weight大小进行比较的。

```cpp
#include<iostream>
#include<algorithm>
#include<functional>
#include<set>

using namespace std;

class Widget
{
public:
    size_t weight() const
    {

    }
    size_t maxSpeed() const
    {

    }
    bool operator<(const Widget& w)
    {
        return this->weight() < w.weight();//这是按照重量从小到大排序
    }

private:

};
```

假设我们想建立一个按照最高速度排序Widget的```multiset<Widget>```，由于```multiset<Widget>```的默认比较函数是```less<Widget>```，这样就会调用```operator<```，因此直接使用```multiset<Widget>```将不能满足这样的需求。

于是我们想到了特化```std::less```版本。

```cpp
template<typename T>
struct std::less<Widget>:
public std::binary_function<Widget,Widget,bool>{
    bool operator()(const Widget& lhs, const Widget&rhs)
    {
        return lhs.maxSpeed() < rhs.maxSpeed();
    }
};
```
特化后，可以达到了按照速度排序的要求。

但是特化后，```std::less<Widget>``` 和```Widget::operator<```的行为就会不一致，这是不好的，会给人造成误导。

可以使用另一种方法解决该问题：

```cpp
//可以使用另一种方法来完成上边的问题
struct MaxSpeedCompare :
    public binary_function<Widget, Widget, bool>{
    bool operator()(const Widget& lhs, const Widget& rhs)const
    {
        return lhs.maxSpeed() < rhs.maxSpeed();
    }
};

int main()
{

    multiset<Widget, MaxSpeedCompare> wisgets;//使得该容器按照规定的排序方法进行排序

    multiset<Widget> wisgets2;//该容器是使用less<Widget>进行排序的
    return 0;
}
```

## 总结
- 应该尽量避免修改less的行为，因为这样做很有可能误导其他的程序员。如果使用了less，无论是显式还是隐式，你都需要确保她与operator<有相同的意义。若希望以一种特殊的方式来排序对象，那么最好创建一个特殊的函数子类，它的名字不能是less，这样做其实是很简单的。