---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-04 用empty来代替检查size()是否为0

事实上empty的典型实现是一个返回size是否返回0的内联函数，对所有的标准容器
- empty()总是常数时间(因为只检查有没有)

- size()不一定是常数时间(可能需要遍历所有的成员比如list)

参考文章：

https://www.cnblogs.com/yan1345/p/Note_of_Effective_STL.html#02-%E5%B0%8F%E5%BF%83%E5%AF%B9%E5%AE%B9%E5%99%A8%E6%97%A0%E5%85%B3%E4%BB%A3%E7%A0%81%E7%9A%84%E5%B9%BB%E6%83%B3