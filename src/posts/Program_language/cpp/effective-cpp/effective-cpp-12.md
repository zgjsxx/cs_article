---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 12 复制对象时勿忘其每一个成分


## 总结
- copying函数应该确保复制"对象内的所有成员变量"以及"所有base class成分"。
- 不要尝试以一个copying 函数去实现另一个copying函数。应该将共同机能放进第三个函数中，并又两个copying函数共同调用。