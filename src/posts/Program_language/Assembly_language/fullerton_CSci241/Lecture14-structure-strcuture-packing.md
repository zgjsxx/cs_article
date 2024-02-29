---
category: 
- 汇编语言
---

## 十四讲 中期回顾 计算机组织和缓存

C/C++结构体实际上只不过是按照一定的排列方式存储在内存中的多个数据。如果我们想要与使用结构体的C/C++程序进行交互，我们需要了解如何在汇编语言中构造出等效的内容。

一个简单的结构体的例子如下所示：

```cpp
struct thing { 
    double a;  // 8 bytes
    char   b;  // 1 byte
    int    c;  // 4 bytes
    char*  d;  // 8 bytes    
};
```