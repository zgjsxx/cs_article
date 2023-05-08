---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 11 operator= 处理自我赋值


## 总结
- 确保当对象自我赋值时operator=有良好行为。其中技术包括比较"来源对象"和"目标对象"的地址、精心周到的语句顺序，以及copy-and-swap。
- 确定任何函数做过操作一个以上的对象，而其中多个对象是同一个对象时，其行为仍然正确。
