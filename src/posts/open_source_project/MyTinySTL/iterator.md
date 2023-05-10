---
category: 
- C++
tag:
- C++
- MyTinySTL
---

# 迭代器


## 萃取器

萃取器的作用是在编译器获取一个迭代器的类型。其有三个版本。


第一个版本就是最common的场景，Iterator是一个class类型的type， 例如list类型。
```cpp
// 萃取迭代器的特性
template <class Iterator>
struct iterator_traits 
  : public iterator_traits_helper<Iterator, has_iterator_cat<Iterator>::value> {};
```

第二个版本就是针对原生指针类型的迭代器，例如```vector<int>```， 其迭代器就是```int*```，可以看到原生指针迭代器的类型是random_access_iterator_tag。

```cpp
// 针对原生指针的偏特化版本
template <class T>
struct iterator_traits<T*>
{
  typedef random_access_iterator_tag           iterator_category;
  typedef T                                    value_type;
  typedef T*                                   pointer;
  typedef T&                                   reference;
  typedef ptrdiff_t                            difference_type;
};
```

第二个版本就是针对const原生指针类型的迭代器，可以看到原生指针迭代器的类型也是random_access_iterator_tag。
```cpp
template <class T>
struct iterator_traits<const T*>
{
  typedef random_access_iterator_tag           iterator_category;
  typedef T                                    value_type;
  typedef const T*                             pointer;
  typedef const T&                             reference;
  typedef ptrdiff_t                            difference_type;
};
```

## has_iterator_cat
从名字中我们大概知道，这个类的作用是用来判断是否一个迭代器拥有Category的type。

对于一个正常的iterator类，其会拥有一个iterator_category的属性，该属性是一个类型值，暗指迭代器的类型，也就是那五种，input_iterator_tag，output_iterator_tag， forward_iterator_tag， bidirectional_iterator_tag， random_access_iterator_tag。

```cpp
// iterator 模板
template <class Category, class T, class Distance = ptrdiff_t,
  class Pointer = T*, class Reference = T&>
  struct iterator
{
    typedef Category                             iterator_category;
    typedef T                                    value_type;
    typedef Pointer                              pointer;
    typedef Reference                            reference;
    typedef Distance                             difference_type;
};

```

但是如果某个人自定义个了一个迭代器，但是这个迭代器中没有iterator_category这个类型属性，那么我们的trait_class是不能工作的，于是has_iterator_cat就派上了用场，它就是用于判断某个迭代器是否拥有该类型属性。

下面就看看has_iterator_cat是如何工作的。

这里有两个test函数，第一个test函数返回two结构体， 第二个test函数返回char类型字符。这是一个SFINAE的技巧。当类型U当中有iterator_category类型时，会匹配上第二个函数，返回char， 如果类型U中没有iterator_category类型时，匹配第一个函数，返回two。

因此当T的类型中包含了iterator_category的type时，为true。 反之，为false。

```cpp
template <class T>
struct has_iterator_cat
{
private:
    struct two { char a; char b; };
    template <class U> static two test(...);
    template <class U> static char test(typename U::iterator_category* = 0);
public:
    static const bool value = sizeof(test<T>(0)) == sizeof(char);
};
```

## iterator_traits_helper

has_iterator_cat首先帮我们进行最基本的判断，看迭代器有否含有iterator_category的类型。

接着，iterator_traits_helper帮我们判断这个类型是否是从input_iterator_tag或者output_iterator_tag派生而来的。因为STL的迭代器都是从这两种类型派生而来。

这里使用了is_convertible，用来判断From是否可隐式转换为To。

```cpp
template <class From, class To> 
struct is_convertible
```

所以iterator_traits_helper就是判断```Iterator::iterator_category```算否可以隐式转换为输入迭代器或输入迭代器。如下所示：


```cpp
/*! 没有迭代器类型 */
template <class Iterator, bool>
struct iterator_traits_helper {};

/*! 有迭代器类型 判断是否能隐式转换为input_iterator_tag或output_iterator_tag */
template <class Iterator>
struct iterator_traits_helper<Iterator, true> : public iterator_traits_impl<Iterator,
	std::is_convertible<typename Iterator::iterator_category, input_iterator_tag>::value ||
	std::is_convertible<typename Iterator::iterator_category, output_iterator_tag>::value> {};
```

## iterator_traits_impl
经过has_iterator_cat和iterator_traits_helper帮助我们进行校验，到这里我们就可以进行编译器的if-else判断了。

如果iterator_traits_impl的模板参数中第二个参数是false，代表该迭代器中不含有iterator_category的类型或者iterator_category的类型不是从input_iterator_tag或者output_iterator_tag继承而来，属于一种自定义的状态，那这种状态就无法进行萃取。

反之，iterator_traits_impl的模板参数中第二个参数是true时，代表该迭代器是我们可以萃取的类型。

```cpp
template <class Iterator, bool>
struct iterator_traits_impl {};

template <class Iterator>
struct iterator_traits_impl<Iterator, true>
{
  typedef typename Iterator::iterator_category iterator_category;
  typedef typename Iterator::value_type        value_type;
  typedef typename Iterator::pointer           pointer;
  typedef typename Iterator::reference         reference;
  typedef typename Iterator::difference_type   difference_type;
};
```


## 参考文章
https://blog.csdn.net/zp126789zp/article/details/127887498