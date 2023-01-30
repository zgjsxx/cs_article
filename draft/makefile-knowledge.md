---
category: 
- Linux
- Makefile
---
# makefile简介

# makefile规则
```makefile
targets : prerequisites
    command
    ...
```
或者
```makefile
targets : prerequisites ; command
    command
    ...
```

command是命令行，如果其不与“target:prerequisites”在一行，那么，必须以 Tab 键开头，如果和prerequisites在一行，那么可以用分号做为分隔

# 使用$@ $< $^ 简化书写
$@  表示目标文件

$^  表示所有的依赖文件

$<  表示第一个依赖文件

例如：
main: main.cpp add.cpp

$@指的就是main，$<指的就是main.cpp, $^指的就是main.cpp add.cpp

文件结构如下所示：
```text
.
├── main
├── main.cpp
└── Makefile
```

main.cpp如下：
```cpp
#include <iostream>
using namespace std;
int main () {
    cout << "Hello World" << endl;
}
```

Makefile内容如下:
```makefile
main:main.cpp
        g++ $< -o $@
.PHONY clean:
        rm -rf main
```


# 使用vpath和VPATH指定依赖文件搜索路径
```
.
├── inc
│   └── add.hpp
├── Makefile
└── src
    ├── add.cpp
    └── main.cpp
```
main.cpp

```cpp
#include "add.hpp"

int main()
{
    int a = 1;
    int b = 2;
    int c = my_add(a, b);
    return 0;
}
```

add.cpp
```cpp
#include "add.hpp"
int my_add(int a, int b)
{
    return a + b;
}
```

add.hpp
```cpp
int my_add(int a, int b);
```

Makefile 
```makefile
VPATH = src:inc

test : main.o add.o
        g++ -o main main.o add.o

main.o : main.cpp add.hpp
        g++ -c $< -I inc/

add.o : add.cpp add.hpp
        g++ -c $< -I inc/

.PHONY: clean
clean:
        rm -rf *.o main
```

组合使用VPATH和$<之后， makefile自动推导出了语句，在main.cpp前加上了src前缀 

```shell
g++ -c src/main.cpp -I inc/
g++ -c src/add.cpp -I inc/
g++ -o main main.o add.o
```


# wildcard
$(wildcard *.c) 可以获取工作目录下的所有.c文件列表

```makefile
$(patsubst %.c,%.o,$(wildcard *.c))
```
首先使用“wildcard”函数获取工作目录下的.c文件列表；之后将列表中所有文件名的后缀.c替换为.o。这样我们就可以得到在当前目录可生成的.o文件列表。

# 伪目标
