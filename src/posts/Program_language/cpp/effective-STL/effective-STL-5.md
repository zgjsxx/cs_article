---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-05 用区间成员函数代替单元素操作


区间成员函数：

区间构造： container::container

```cpp
vector<int> v2(v1.begin(), v1.end());
```

区间插入： insert

```cpp
 v1.insert(v1.end(),5,0);
```

区间删除： erase

```cpp
vector<int> v1;
v1.erase(v1.begin()+4);
```

区间赋值： assign

```cpp
vector <int> v3;
v3.assign(v1.begin(),v1.end());
```