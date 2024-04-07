
# cool语言语法

COOL（Classroom Object-Oriented Language）是一种用于编译器课程的教学语言，其语法相对简单，但包含了面向对象编程语言的基本特性。以下是 COOL 语言的一些基本语法规则：

## 类定义

COOL 中的类定义由以下部分组成：

```cool
class ClassName {
    feature1;
    feature2;
    // 其他特性
};
```
其中，ClassName 是类的名称，feature1、feature2 是类的特性（例如属性或方法）。每个特性以分号结尾。

## 方法定义

COOL 中的方法定义形式如下：

```cool
method MethodName(param1: Type1, param2: Type2): ReturnType {
    // 方法体
};
```

其中，MethodName 是方法的名称，param1: Type1, param2: Type2 是方法的参数列表，ReturnType 是方法的返回类型。方法体可以是一系列语句，以分号结束。

## 表达式

COOL 中支持的表达式包括变量引用、常量、算术运算、逻辑运算、函数调用等。例如：

- 变量引用：x
- 常量：5, "Hello"
- 算术运算：x + 5, y * 10
- 逻辑运算：x < y, not x
- 方法调用：object.method(param1, param2)

## 控制流

COOL 中的控制流包括条件语句和循环语句：

条件语句

```cool
if condition then
    // 条件成立时执行的代码
else
    // 条件不成立时执行的代码
fi
```

循环语句

```cool
while condition loop
    // 循环体
pool
```

## 注释

COOL 中的注释使用 -- 开始，直到行尾：

```shell
-- 这是一条注释
```

## 类型

COOL 中的类型包括基本类型和用户自定义类型。例如：

- 整数类型：Int
- 字符串类型：String
- 布尔类型：Bool
- 类型引用：TypeName

## 赋值语句

在 COOL（Classroom Object-Oriented Language）中，赋值语句的语法形式类似于其他面向对象的编程语言，例如 Java 或 C++。在 COOL 中，赋值语句用来将一个值赋给一个变量。赋值语句的一般形式是：

```shell
variable <- expression
```

其中```variable```是要赋值的变量名，而```expression```是一个表达式，它的值将被赋给变量。在 COOL 中，表达式可以是变量、常量、方法调用等。

例如，假设我们有一个变量 x，我们要将一个整数值 5 赋给它，赋值语句可以写成：

```shell
x <- 5
```

这样，变量 x 的值就被设置为 5。

另外，COOL 还支持在赋值语句中使用复杂的表达式。例如：

```shell
y <- x + 10
```

这将计算变量 x 的值加上 10，并将结果赋给变量 y。

需要注意的是，COOL 是一种教学语言，其语法和语义都被设计成相对简单易懂，以方便学生理解和实现编译器的各个组成部分。

## 比较语句

在 COOL（Classroom Object-Oriented Language）中，```=```符号通常用于比较两个值是否相等，而不是用于赋值。这是 COOL 语言设计的一个特点，旨在减少因赋值操作符和相等比较操作符混淆而导致的错误。

在 COOL 中，赋值操作符使用箭头符号 <-，而相等比较操作符使用等号 =。例如：

- 赋值操作：```x <- 5``` 表示将值 5 赋给变量 x。
- 相等比较操作：```x = 5``` 表示比较变量 x 的值是否等于 5。

这种语法设计可以帮助减少代码中的错误，因为它强制使用不同的符号来表示赋值和相等比较这两种不同的操作。


## 条件分支

在 Cool 语言中，条件语句的形式如下所示：

```cool
if <expr> then <expr> else <expr> fi
```

其中：

- ```<expr>``` 是一个布尔表达式，用于决定条件是否成立。
- 第一个 ```<expr>``` 是条件为真时执行的表达式。
- 第二个 ```<expr>``` 是条件为假时执行的表达式。

在 Cool 中，条件语句以关键字 "if" 开头，以关键字 "fi" 结尾。条件语句是控制流结构之一，用于根据条件的成立与否来执行不同的代码分支。

## let表达式

```cool
    let <id1> : <type1> [ <- <expr1> ], 
        ..., 
        <idn> : <typen> [ <- <exprn> ] 
    in <expr>
```


## case

```cool
case <expr0> of
<id1> : <type1> => <expr1>;
. . .
<idn> : <typen> => <exprn>;
esac
```