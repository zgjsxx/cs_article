---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 22 将成员变量声明为private


## 总结
- 切记将成员变量声明为private， 这可赋予客户访问数据的一致性，可细微划分访问控制、允诺约束条件获得保证，并提供class作者以充分的实现弹性。
- protected并不比public更具封装性。