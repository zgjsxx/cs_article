---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 49 了解new-handler的行为

## 总结

- set_new_handler允许客户指定一个函数，在内存分配无法获得满足时被调用。
- Nothrow new是一个颇为局限的工具，因为它只使用与内存分配，后继的构造函数调用还是可能抛出异常。
