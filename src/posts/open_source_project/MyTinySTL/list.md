
# list的实现

mystl::list<int> l1;



## 迭代器

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
