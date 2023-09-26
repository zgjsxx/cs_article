```std::function```是怎样实现的？
首先必须实现一个默认的模板函数，然后根据参数个数特例化不同的实现，在没有变长参数模块语法支持时，只能根据参数个数特例化多个实现，非常繁琐。有了语法支持后，可以使用变长参数模板轻松实现任意个数参数的function。

大致实现如下：

不需要参数时：
C++
```cpp
namespace my {
  template <typename TR>
  class function{};

  template <typename TR>
  class function<TR()> {
    using PFunc = TR(*)();
    PFunc pfunc_;
  public:
    function(PFunc pfunc)
      : pfunc_(pfunc) {
    }

    TR operator()() {
      return pfunc_();
    }
  };
}
```
需要一个参数时：
C++
```cpp
namespace my {
  template <typename TR>
  class function{};

  template <typename TR, typename TArg>
  class function<TR(TArg)> {
    using PFunc = TR(*)(TArg);
    PFunc pfunc_;
  public:
    function(PFunc pfunc)
      : pfunc_(pfunc) {
    }

    TR operator()(TArg arg) {
      return pfunc_(arg);
    }
  };
}
```
当需要两个参数时：
C++
```cpp
namespace my {
  template <typename TR>
  class function{};

  template <typename TR, typename TArg1, typename TArg2>
  class function<TR(TArg1, TArg2)> {
    using PFunc = TR(*)(TArg1, TArg2);
    PFunc pfunc_;
  public:
    function(PFunc pfunc)
      : pfunc_(pfunc) {
    }

    TR operator()(TArg1 arg1, TArg2 arg2) {
      return pfunc_(arg1, arg2);
    }
  };
}
```
更多个数的参数同理增加参数就行，接下来介绍使用变长参数模板如何实现

使用变长参数模块实现
C++
```cpp
namespace my {
  template <typename>
  class function {};

  template <typename TR, typename ...TArgs>
  class function<TR(TArgs...)> {
    using PFunc = TR(*)(TArgs...);
    PFunc pfunc_;
  public:
    function(PFunc pfunc)
      : pfunc_(pfunc) {
    }

    TR operator()(TArgs... args) {
      return pfunc_(args...);
    }
  };
}

int subtraction(int a, int b) {
  return a - b;
}

int main() {
  std::function<int(int, int)> sub1 = subtraction;
  my::function<int(int, int)> sub2 = subtraction;
  printf("%d", sub1(5, 2));
  printf("%d", sub2(5, 2));

  system("pause");
  return 0;
}
```