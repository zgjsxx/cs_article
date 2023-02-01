---
category: 
- Linux
- Makefile
---
# makefile简介
Makefile 是一个管理项目的配置文件，它主要有 2 个作用：

- 组织工程文件，编译成复杂的程序
- 安装及卸载程序

# makefile规则
Makefile的格式通常有如下两种：

格式一：
```makefile
targets : prerequisites
    command
    ...
```

格式二：
```makefile
targets : prerequisites ; command
    command
    ...
```

格式一，command是命令行，其不与"target:prerequisites"在一行，必须以Tab键开头

格式二如果和prerequisites在一行，那么可以用分号做为分隔。

通常情况下， 一般使用格式一。

下面我们用过一些demo，一步一步的深入Makefile。
# demo1：第一个Makefile
demo1的目录结构如下所示：

```text
.
├── main.cpp
└── Makefile
```

其中main.cpp如下：
```cpp
#include <iostream>
using namespace std;
int main () {
    cout << "Hello World" << endl;
}
```

为其编写的Makefile如下：
```makefile
main:main.o
        g++ main.o -o main
main.o:main.cpp
        g++ -c main.cpp main.o
.PHONY clean:
        rm -rf *.o main
```
首先看构建main对象，main对象依赖于main.o对象```main:main.o```， 因此需要完成main.o对象的构建。

接着看到main.o对象依赖于main.cpp文件， 该文件存在与当前目录中， 因此执行相应的command```g++ -c main.cpp```
```makefile
main.o:main.cpp
        g++ -c main.cpp
```
如此之后， main.o对象构建成功，这样就可以构建main对象，于是执行了main对象的command，```g++ main.o -o main```

至此main对象的构建完毕。

makefile的最后一部分是一个clean对象， 用于清理生成的文件， 使用make clean即可构建clean对象。 关于关键字```.PHONY```将在下面的例子中讲解。
```make
.PHONY clean:
        rm -rf *.o main
```

# demo2：使用$@ $< $^ 简化书写
在Makefile中， 可以使用$@ $< $^来简化书写，其含义如下所示：

$@  表示目标文件

$^  表示所有的依赖文件

$<  表示第一个依赖文件

例如：
main: main.cpp add.cpp

$@指的就是main，$<指的就是main.cpp, $^指的就是main.cpp add.cpp

下面我们就使用它们来改动demo1中的makefile
文件结构如下所示：
```text
.
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
main:main.o
        g++ $< -o $@
main.o:main.cpp
        g++ -c $< -o $@
.PHONY clean:
        rm -rf *.o main
```

首先看main目标的command，```g++ $< -o $@```, $<代表第一个依赖项，即main.o， $@代表构建目标，即main， 因此该语句可以翻译成```g++ main.o -o main```

main.o可以以此类推。

# demo3：使用vpath和VPATH指定依赖文件搜索路径
demo3的文件目录结构如下所示：
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

组合使用VPATH和$<之后， makefile自动推导出了语句，在main.cpp前加上了src前缀。

```shell
g++ -c src/main.cpp -I inc/
g++ -c src/add.cpp -I inc/
g++ -o main main.o add.o
```

需要注意的是**VPATH必须要和$<, $^等结合使用**才可以完成自动推导。

# demo4:使用wildcard，patsubst等函数
$(wildcard *.c) 可以获取工作目录下的所有.c文件列表

```makefile
$(patsubst %.c,%.o,$(wildcard *.c))
```
首先使用“wildcard”函数获取工作目录下的.c文件列表；之后将列表中所有文件名的后缀.c替换为.o。这样我们就可以得到在当前目录可生成的.o文件列表。

# 静态模式
```makefile
<targets ...> : <target-pattern> : <prereq-patterns ...>
    <commands>
    ...
```


```makefile
objects = foo.o bar.o

all: $(objects)

$(objects): %.o: %.c
    $(CC) -c $(CFLAGS) $< -o $@
```

```makefile
foo.o : foo.c
    $(CC) -c $(CFLAGS) foo.c -o foo.o
bar.o : bar.c
    $(CC) -c $(CFLAGS) bar.c -o bar.o
```


目录结构
```
.
├── add.cpp
├── main.cpp
└── Makefile
```

我们使用wildcard，patsubst函数以及静态模式来书写makefile

```makefile
OBJS = $(patsubst %.cpp,%.o,$(wildcard *.cpp))

all: $(OBJS)

$(OBJS): %o : %cpp
        g++ -c $< -o $@
```


```
g++ -c add.cpp -o add.o
g++ -c main.cpp -o main.o
```


# demo4: makefile自动生成依赖








# demo5: 综合运用上述技巧

在最后的这个例子中， 我们将综合运用上述的一些技巧去完成模块的构建。

该目录中有inc和src两个子目录， 其中inc目录中包含了add.hpp和sub.hpp两个头文件。

在src目录中， 包含一个main.cpp的入口函数所在的文件， 还包含一个math子目录，math子目录中包含了add.cpp和sub.cpp两个文件。


```shell
.
├── inc
│   ├── add.hpp
│   └── sub.hpp
├── Makefile
└── src
    ├── main.cpp
    └── math
        ├── add.cpp
        └── sub.cpp
```

以下是这些文件中的内容， 案例主要关注Makefile的编写， 因此源文件的代码都较为简单。

add.hpp
```cpp
int my_add(int a, int b);
```

sub.hpp
```cpp
int my_sub(int a, int b);
```

main.cpp
```cpp
#include <iostream>
#include "add.hpp"
#include "sub.hpp"
using namespace std;

int main()
{
    int a = 1;
    int b = 2;
    int c = my_add(a, b);
    cout << a << " + " << b << " = " << c << endl;
    int d = my_sub(a, b);
    cout << a << " - " << b << " = " << d << endl;

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

sub.cpp
```cpp
#include "sub.hpp"

int my_sub(int a, int b)
{
    return a - b;
}
```

以下是Makefile中的内容:

```makefile
VPATH = src:src/math:inc

CXX=g++
MODULE=demo5
SOURCE_PATH += ./src \
               ./src/math
TEMP_PATH=./tmp
TARGET=$(TEMP_PATH)/demo5

CXXFLAGS+=-I./inc
COMPILEFLAGS = $(CXXFLAGS)


CPP_SOURCES = $(foreach d,$(SOURCE_PATH),$(wildcard $(d)/*.cpp) )
CPP_OBJS += $(patsubst %.cpp, $(TEMP_PATH)/%.o, $(notdir $(CPP_SOURCES)))
CPP_DEPS += $(patsubst %.cpp, $(TEMP_PATH)/%.d, $(notdir $(CPP_SOURCES)))
OBJS = $(CPP_OBJS)


$(TARGET): $(OBJS) $(CPP_DEPS)
        @echo "generate final target"
        $(CXX) -o $@ $(OBJS)

$(CPP_OBJS): $(TEMP_PATH)/%.o : %.cpp
        -@mkdir -p $(TEMP_PATH)
        @echo [$(MODULE) CXX] $<
        $(CXX) -c  $(COMPILEFLAGS) $< -o $@

$(CPP_DEPS): $(TEMP_PATH)/%.d: %.cpp
        -@mkdir -p $(TEMP_PATH)
        -@echo -n "$(TEMP_PATH)/" > $@
        $(CXX) -MM $(COMPILEFLAGS) $< >> $@

include $(CPP_DEPS)

.PHONY: clean
clean:
        rm -rf $(TEMP_PATH)/*.o  $(TEMP_PATH)/main
```

下面一一分析。
```makefile
VPATH = src:src/math:inc
```
首先使用VPATH依赖文件存在的路径， 以便下面自动推导文件的相对路径。


```makefile
CXX=g++
MODULE=demo5
SOURCE_PATH += ./src \
               ./src/math
TEMP_PATH=./tmp
TARGET=$(TEMP_PATH)/demo5

CXXFLAGS+=-I./inc
COMPILEFLAGS = $(CXXFLAGS)
```

这里定义了一些变量，包括源文件的路径， 目标文件存放的位置， 编译参数等等。


```makefile
CPP_SOURCES = $(foreach d,$(SOURCE_PATH),$(wildcard $(d)/*.cpp) )
CPP_OBJS += $(patsubst %.cpp, $(TEMP_PATH)/%.o, $(notdir $(CPP_SOURCES)))
CPP_DEPS += $(patsubst %.cpp, $(TEMP_PATH)/%.d, $(notdir $(CPP_SOURCES)))
```

这里首先使用foreach去遍历SOURCE_PATH路径下的所有的.cpp文件

然后将.cpp文件做字符串替换， 替换为.o， 同时增加了存放的路径， 这里使用了patsubst做字符串替换， 并使用了notdir去获取文件名。


```makefile
$(TARGET): $(OBJS) $(CPP_DEPS)
        @echo "generate final target"
        $(CXX) -o $@ $(OBJS)
```

这里展开便是
```makefile
demo5: main.o sub.o add.o main.d sub.d main.d
    g++ -o demo5 main.o sub.o add.o
```


```makefile
$(CPP_OBJS): $(TEMP_PATH)/%.o : %.cpp
        -@mkdir -p $(TEMP_PATH)
        @echo [$(MODULE) CXX] $<
        $(CXX) -c  $(COMPILEFLAGS) $< -o $@
```
这里展开便是
```makefile
main.o: main.cpp
    g++ -c main.cpp -o tmp/main.o -I./inc
add.o: add.cpp
    g++ -c add.cpp -o tmp/add.o -I./inc
sub.o: sub.cpp
    g++ -c sub.cpp -o tmp/sub.o -I./inc
```
该步骤就是生成了.o文件


```makefile
$(CPP_DEPS): $(TEMP_PATH)/%.d: %.cpp
        -@mkdir -p $(TEMP_PATH)
        -@echo -n "$(TEMP_PATH)/" > $@
        $(CXX) -MM $(COMPILEFLAGS) $< >> $@
```
该步骤使用了g++ -MM参数用于自动生成依赖文件， 以便于当头文件修改时，也可以自动编译

```makefile
.PHONY: clean
clean:
        rm -rf $(TEMP_PATH)/*.o  $(TEMP_PATH)/main
```
最后这个模块用于清除生成的文件。



# makefile打印日志
$(info Hello world)



# makefile中的@和-
1、如果makefile执行的命令前面加了@符号，则不显示命令本身而只显示结果。

2、通常make执行的命令出错（该命令的退出状态非0）就立刻终止，不再执行后续命令，但是如果命令前面加上“-”，即使这条命令出错，makefile也会继续执行后续命令的。
