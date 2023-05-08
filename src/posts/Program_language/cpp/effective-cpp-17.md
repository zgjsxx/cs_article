---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 17 独立语句将newed对象置入智能指针

智能指针可以帮助用户更好的管理资源，避免资源泄露。但是如果使用不当，还是可能出现资源泄露。本文便是讲解了智能指针使用不当可能出现资源泄漏的一个场景。

考虑下面的函数：

```cpp
processWidget(std::tr1::shared_ptr<Widget>(new Widget), priority());
```
如果编译器的执行顺序像下面这样：
- 1. 执行"new Widget"
- 2. 调用priority(抛出异常)
- 3. 调用tr1::shared_ptr构造函数

如果第2步出现了异常，那么第三步就执行不到，资源就无法析构。

修改方法为如下:
```cpp
std::tr1::shared_ptr<Widget> pw(new Widget);
processWidget(pw, priority());
```

## 总结
- 请以独立语句将newed对象对象置于智能指针内。如果不这样做，一旦异常被抛出，有可能导致难以察觉的资源泄露。
  