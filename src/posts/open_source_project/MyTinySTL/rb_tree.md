---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# rb_tree


## 分析

### basic定义

定义了node的颜色类型， 红色是false，黑色是false。

```cpp
typedef bool rb_tree_color_type;

static constexpr rb_tree_color_type rb_tree_red   = false;
static constexpr rb_tree_color_type rb_tree_black = true;
```

### rb_tree_node

rb_tree是由一个一个节点组成的，关于其节点的定义主要在两个模板类种，rb_tree_node_base和rb_tree_node。

rb_tree_node_base的数据部分如下所示, 其种包含了三个指针，分别指向父节点，左子节点和右子节点。除此以外，还包含了一个节点的颜色类型。

```cpp
template <class T>
struct rb_tree_node_base
{
    typedef rb_tree_color_type    color_type;
    typedef rb_tree_node_base<T>* base_ptr;
    typedef rb_tree_node<T>*      node_ptr;

    base_ptr   parent;  // 父节点
    base_ptr   left;    // 左子节点
    base_ptr   right;   // 右子节点
    color_type color;   // 节点颜色
```


rb_tree_node的定义就比较简单，其只有一个数据单元，就是节点的值。

```cpp
template <class T>
struct rb_tree_node :public rb_tree_node_base<T>
{
  typedef rb_tree_node_base<T>* base_ptr;
  typedef rb_tree_node<T>*      node_ptr;

  T value;  // 节点值
```