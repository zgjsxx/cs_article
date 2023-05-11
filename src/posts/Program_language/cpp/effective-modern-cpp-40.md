---
category: 
- C++
- effective Modern C++
---

# Item39: 对于并发使用std::atomic，对于特殊内存使用volatile



## 总结：

- std::atomic用于在不使用互斥锁情况下，来使变量被多个线程访问的情况。是用来编写并发程序的一个工具。
- volatile用在读取和写入不应被优化掉的内存上。是用来处理特殊内存的一个工具。
