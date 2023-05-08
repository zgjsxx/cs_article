---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 14 资源管理类中小心copying行为


## 总结
- 复制RAII对象必须一并复制它所管理的资源，所以资源的copying行为决定RAII对象的copying行为。
- 普遍而常见的RAII class的copying行为是：抑制copying，施行引用计数法。不过其他行为也可能被实现。
- 
