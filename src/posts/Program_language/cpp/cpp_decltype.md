# decltype

左值表达式有哪些?
- ++操作
```cpp
class Test
{
public:
    Test(int i): value_(i){}
    int value() {return value_};

    Test& operator++()
    {
        ++value_;
    }

    Test operator++(int){
        Test ret(value_);
        ++value_;
        return ret
    }
private:
    int value_;
}
```


decltype 推导规则
上面的例子让我们初步感受了一下 decltype 的用法，但你不要认为 decltype 就这么简单，它的玩法实际上可以非常复杂。当程序员使用 decltype(exp) 获取类型时，编译器将根据以下三条规则得出结果：
- 如果 exp 是一个不被括号( )包围的表达式，或者是一个类成员访问表达式，或者是一个单独的变量，那么 decltype(exp) 的类型就和 exp 一致，这是最普遍最常见的情况。
- 如果 exp 是函数调用，那么 decltype(exp) 的类型就和函数返回值的类型一致。
- 如果 exp 是一个左值表达式，例如被括号( )包围，那么 decltype(exp) 的类型就是 exp 的引用；假设 exp 的类型为 T，那么 decltype(exp) 的类型就是 T&。
