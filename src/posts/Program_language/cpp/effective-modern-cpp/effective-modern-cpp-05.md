---
category: 
- C++
tag:
- effective modern c++读书笔记
---
# Item5：优先考虑auto而非显式类型声明

## 总结

- auto变量必须初始化，通常它可以避免一些移植性和效率性的问题，也使得重构更方便，还能让你少打几个字。
- 正如Item2和6讨论的，auto类型的变量可能会踩到一些陷阱。