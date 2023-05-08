---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 16 成对使用new和delete时采取相同形式


## 总结
- 如果你在new表达式中使用[]，必须在相应的delete表达式中也使用[]。如果你在new表达式中不使用[]，一定不要再相应的delete表达式中使用[]。