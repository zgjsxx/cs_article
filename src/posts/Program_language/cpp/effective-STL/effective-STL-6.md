---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-06 警惕C++最令人恼怒的解析

假设有一个int文件，将这些int拷贝到一个list中

```cpp
ifstream dataFile("ints.dat");
list<int> data(istream_iterator<int>(dataFile), istream_iterator<int>());
//list<int> 是类型，声明名为data的函数
//不要在参数内递临时构建对象再来传入，而是先构建，再传入
```

解决办法是在数据声明中从使用匿名istream_iterator对象后退一步，仅仅给迭代器名字

```cpp
ifstream dataFile("ints.dat");
istream_iterator<int> dataBegin(dataFile);
istream_iterator<int> dataEnd;//不能加括号，否则又是函数声明了
list<int> data(dataBegin, dataEnd);
```