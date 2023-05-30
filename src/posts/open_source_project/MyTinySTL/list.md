---
category: 
- C++
tag:
- C++
- MyTinySTL
---


# list的实现
```cpp
mystl::list<int> l1;
```

## 分析

### list数据部分的定义

```c
typedef list_iterator<T>                         iterator;
```
进行展开
```c
typedef list_iterator<int>                       iterator;
```

```cpp
struct iterator
{
  typedef mystl::bidirectional_iterator_tag    iterator_category;
  typedef int                                  value_type;
  typedef int*                                 pointer;
  typedef int&                                 reference;
  typedef ptrdiff_t                        difference_type;
};
```

```cpp
struct list_iterator : public mystl::iterator<mystl::bidirectional_iterator_tag, int>
{
  typedef int                                 value_type;
  typedef int*                                pointer;
  typedef int&                                reference;
  typedef typename node_traits<int>::base_ptr base_ptr;
  typedef typename node_traits<int>::node_ptr node_ptr;
  typedef list_iterator_int                  self;

  base_ptr node_;  // 指向当前节点

  //methods
}
```


```cpp
struct list_node_base
{
  typedef typename node_traits<int>::base_ptr base_ptr;
  typedef typename node_traits<int>::node_ptr node_ptr;

  base_ptr prev;  // 前一节点
  base_ptr next;  // 下一节点
}
```

```cpp
struct list_node : public list_node_base<int>
{
  typedef typename node_traits<int>::base_ptr base_ptr;
  typedef typename node_traits<int>::node_ptr node_ptr;

  int value;  // 数据域
}
```

```cpp
struct node_traits
{
  typedef list_node_base<int>* base_ptr;
  typedef list_node<int>*      node_ptr;
};
```


![list](https://github.com/zgjsxx/static-img-repo/raw/main/blog/open_source_project/MyTinySTL/list.png)



### fill_init

fill_init在list的构造函数中被调用，其作用是进行list的初始化。

```cpp
template <class T>
void list<T>::fill_init(size_type n, const value_type& value)
{
    node_ = base_allocator::allocate(1);
    node_->unlink();
    size_ = n;
    try
    {
        for (; n > 0; --n)
        {
        auto node = create_node(value);
        link_nodes_at_back(node->as_base(), node->as_base());
        }
    }
    catch (...)
    {
        clear();
        base_allocator::deallocate(node_);
        node_ = nullptr;
        throw;
    }
}
```