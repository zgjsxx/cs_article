---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-03 使容器里对象的拷贝操作轻量而正确


 
STL里的容器，所有的操作，都是基于拷贝的，插入，读取，删除(导致移动)

分割问题表明把派生类对象插入基类对象的容器几乎总是错的

解决办法是是建立智能指针的容器，拷贝指针很快