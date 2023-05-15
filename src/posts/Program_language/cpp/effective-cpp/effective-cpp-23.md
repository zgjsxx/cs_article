---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 23 宁以non-member、non-friend替换member函数

本章节所讲解的内容并不复杂，但是在实战中去运用才是关键。下面就通过例子来看看作者想要表达的观点。

## 分析

我们现在有一个WebBrowser的类，目前其提供了clearCache，clearHistory， removeCookies三个函数，分别用于清除缓存，清除历史记录和清除cookie。 那么我们如果需要提供一个clear所有内容的函数clearBrowser，我们是该提供一个成员函数还是提供一个全局的函数呢？

**提供一个成员函数**：

```cpp
namespace WebBrowserStuff
{
class WebBrowser
{
public:
    void clearCache() {}
    void clearHistory() {}
    void removeCookies() {}
public:
    void clearBrowser()
    {
        clearCache();
        clearHistory();
        removeCookies();
    }
};
}
```

**提供一个全局的函数**：

```cpp
namespace WebBrowserStuff
{
void clearBrowser(WebBrowser& wb)
{
    wb.clearCache();
    wb.clearHistory();
    wb.removeCookies();
}
}
```

作者的建议是提供一个非成员，非友元的函数去处理。增加一个成员函数或者友元函数，就增加了一个可以访问private成员的机会。 而目前的场景没有访问私有成员的必要，因此提供一个全局的函数更有利于类的封装性。


## 总结
- 宁可拿non-member non-friend函数替换member函数。这样做可以增加封装性，包裹弹性和机能扩充性。
  
