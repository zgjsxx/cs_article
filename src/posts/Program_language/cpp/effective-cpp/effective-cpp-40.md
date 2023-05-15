---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 40 明智而审慎地使用多重继承

## 总结
- 多重继承比单一继承复杂。它可能导致新的歧义性，以及对virtual继承的需要
- virtual继承会增加大小、速度、初始化（及赋值）复杂度等等成本。如果virtual base classes不带任何数据，将是最具使用价值的情况。
- 多重继承的确有正当用途。其中一个情节设计"public继承某个Interface class"和"private继承某个协助实现的class"的两相组合。

