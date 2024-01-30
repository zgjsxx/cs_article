---
category: 
- Linux
- tool
- valgrind
---

# Valgrind

## 什么是Valgrind? 如何运行Valgrind

Valgrind是一个用于检测内存问题的工具，尤其擅长处理**内存泄漏**问题和非法内存访问的问题。**内存泄漏**是指通过申请内存的方法(例如malloc)申请了内存确没有使用释放内存的方法(例如free)释放内存而导致的问题。非法的内存访问可能会引起程序的段错误(Segmentaion fault)。 Valgrind工具可以有效的帮助你分析出问题的产生的原因。




```shell
valgrind --tool=memcheck --leak-check=full  ./main_c
```