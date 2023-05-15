---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 51 编写new和delete时需固守常规

## 总结

- operator new应该内含一个无穷循环，并在其中尝试分配内存，如果它无法满足内存需求，就应该调用new-handler。它也应该有能力处理0 bytes申请。Class专属版本则还应该处理"比正确大小更大的(错误)申请"。
- operator delete应该在收到null指针时不做任何事。Class专属版本则还应该处理"比正确大小更大的(错误)申请"。

