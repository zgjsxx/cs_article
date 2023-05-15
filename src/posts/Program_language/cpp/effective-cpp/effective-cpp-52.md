---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 51 new与delete成对出现

## 总结

- 当你写一个placement operator new，请确定也写出了对应的placement operator delete。如果没有这样做，你的程序可能会发生隐微而时断的内存泄漏。
- 当你声明placement new和placement delete，请确定不要无意识地遮掩了它们的正常版本。