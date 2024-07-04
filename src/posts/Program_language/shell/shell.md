
- [shell](#shell)
  - [shell命令中的分号， \&\& 和 ||的区别](#shell命令中的分号--和-的区别)
  - [变量的定义](#变量的定义)
  - [正则表达式](#正则表达式)

# shell

## shell命令中的分号， && 和 ||的区别

分号： 顺序地独立执行各条命令，彼此不关心是否失败，所有命令都会执行。

&&： 顺序执行各条命令，只有当前一个命令执行成功的时候，才执行后面的。

||： 顺序的执行各条命令，只有当前门的一个命令执行失败的时候，才执行后面的。

## 变量的定义

Shell变量名以字母或者下划线开头，可包含任意数量的字母，数字或下划线。变量名中的字符数量没有限制。Shell变量保存的数据类型是字符串类型。

如下所示，变量赋值的方法是写入变量名，紧接着写入=和新值，中间不留空格。当需要访问Shell变量时，要在变量名前加上$字符。

```shell
$ myvar=this_is_a_long_string_that_does_not_mean_much Assign a value
$ echo $myvar Print the value
this_is_a_long_string_that_does_not_mean_much
```
当字符串中包含空格时，需要使用引号。

```shell
first=isaac middle=bashevis last=singer #Multiple assignments allowed on one line
fullname="isaac bashevis singer" #Use quotes for whitespace in value
oldname=$fullname #Quotes not needed to preserve spaces in value
```

## 正则表达式

|正则表示符号|含义|
|--|--|
|\||
|.|匹配除换行符\n之外的任何单字符|
|*|匹配前门的子表达式0次或者多次|
|{n,m}|匹配子表达式出现n到m次|

"^" 和 "$" 可以一起使用，此时括起来的正则表达式必须完全匹配整个字符串（或行）。有时候使用简单的正则表达式 "^$" 也很有用，它匹配空字符串或空行。结合 grep 的 "-v" 选项，该选项用于打印所有不匹配模式的行，可以用来过滤掉文件中的空行。

```shell
cat test.txt | grep -v "^$" # remove empty lines
```