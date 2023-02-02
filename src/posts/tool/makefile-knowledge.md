---
category: 
- Linux
- Makefile
---
# makefile简介
很多时候， 我们在git clone完一个project之后， 就会让我们使用```make```命令进行项目的构建。 这个make命令的背后就是按照了Makefile文件定义的格式去完成项目构建。

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

下面是demo1， 通过demo1来熟悉makefile的基本语法。
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

# 使用$@ $< $^符号简化编写
在Makefile中， 可以使用$@ $< $^来简化书写，其含义如下所示：

$@  表示目标文件

$^  表示所有的依赖文件

$<  表示第一个依赖文件

例如：
main: main.cpp add.cpp

```$@```指的就是main，```$<```指的就是main.cpp, ```$^```指的就是main.cpp add.cpp

下面我们就使用它们来改动demo1中的makefile

# demo2：使用$@ $< $^ 简化书写
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

# vpath和VPATH
vpath和VPATH主要作用是通过指定文件的搜索路径自动寻找源文件， 但是这种自动推导需要你将vpath/VPATH与```$<```,```$^```结合使用。

VPATH和vpath的区别是：

VPATH是变量，更具体的说是环境变量，Makefile 中的一种特殊变量，使用时需要指定文件的路径；

vpath 是关键字，按照模式搜索，也可以说成是选择搜索。搜索的时候不仅需要加上文件的路径，还需要加上相应限制的条件。



vpath的格式：
vpath <pattern> <directories>
为符合模式<pattern>的文件指定搜索目录<directories>。

vpath <pattern>
清除符合模式<pattern>的文件的搜索目录。

vpath
清除所有已被设置好了的文件搜索目录。


vpath %.h ../headers

看下面的一个目录结构,
```text
.
├── Makefile
└── src
    └── main.cpp
```

所要编译的文件main.cpp在src目录下， 我们使用VPATH指定了搜索路径是src， 我们在command直接指定了文件名， 没有使用$<,$^， 试问这样编写Makefile能正确编译吗？

```makefile
VPATH=src
main.o:main.cpp
        g++ -c main.cpp -o main.o
```

答案是否定的， 执行结果如下：
```text
g++ -c main.cpp -o main.o
cc1plus: fatal error: main.cpp: No such file or directory
compilation terminated
```

因为此时已经手动指定了文件名称， Makefile没有能力去为这种场景做适配。

因此**VPATH想要生效，需要与\$<,\$^配合**， 当搜索相应的目录找到对应的文件时， Makefile就会将$<,$^替换为文件的相对路径。

下面看demo3案例

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
        g++ -o main $^

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


# 使用内置函数wildcard，patsubst， foreach， notdir等函数快速寻找到所有要构建的源文件

可以获取工作目录下的所有.c文件列表
```makefile
objects = $(wildcard *.c) 
```

首先使用"wildcard"函数获取工作目录下的.c文件列表；之后将列表中所有文件名的后缀.c替换为.o。这样我们就可以得到在当前目录可生成的.o文件列表。

```makefile
$(patsubst %.c,%.o,$(wildcard *.c))
```

notdir用于去掉文件的绝对路径，只保留文件名。
```makefile
file=$(notdir $(wildcard ./sub/*.c)),
```

foreach实际上是一种循环， 常用于遍历文件夹下的所有文件。

foreach函数的工作过程是：把LIST中使用空格分割的单词依次取出并赋值给变量ITEM，然后执行TEXT表达式。重复这个过程，直到遍历完LIST中的最后一个单词。函数的返回值是TEXT多次计算的结果。

```makefile
$(foreach ITEM, LIST, TEXT)
```

例如
```makefile
dirs = src src/math
srcs = $(foreach dir, $(dirs), $(wildcard $(dir)/*.cpp))
```
这段makefile就取出了src和src/math目录下所有的cpp文件



# 静态模式

静态模式可以更加容易地定义多目标的规则，可以让我们的规则变得更加的有弹性和灵活。我们还是先来看一下语法：

```makefile
<targets ...> : <target-pattern> : <prereq-patterns ...>
    <commands>
    ...
```
targets定义了一系列的目标文件，可以有通配符。是目标的一个集合。

target-pattern是指明了targets的模式，也就是的目标集模式。

prereq-patterns是目标的依赖模式，它对target-pattern形成的模式再进行一次依赖目标的定义。


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


# makefile自动生成依赖

在Makefile中，我们的依赖关系可能会需要包含一系列的头文件，比如，如果我们的main.c中有一句 #include "defs.h" ，那么我们的依赖关系应该是：

main.o : main.c defs.h
但是，如果是一个比较大型的工程，你必需清楚哪些C文件包含了哪些头文件，并且，你在加入或删除头文件时，也需要小心地修改Makefile，这是一个很没有维护性的工作。为了避免这种繁重而又容易出错的事情，我们可以使用C/C++编译的一个功能。大多数的C/C++编译器都支持一个“-M”的选项，即自动找寻源文件中包含的头文件，并生成一个依赖关系。例如，如果我们执行下面的命令:

cc -M main.c
其输出是：

main.o : main.c defs.h
于是由编译器自动生成的依赖关系，这样一来，你就不必再手动书写若干文件的依赖关系，而由编译器自动生成了。需要提醒一句的是，如果你使用GNU的C/C++编译器，你得用 -MM 参数，不然， -M 参数会把一些标准库的头文件也包含进来。

gcc -M main.c的输出是:
```text
main.o: main.c defs.h /usr/include/stdio.h /usr/include/features.h \
    /usr/include/sys/cdefs.h /usr/include/gnu/stubs.h \
    /usr/lib/gcc-lib/i486-suse-linux/2.95.3/include/stddef.h \
    /usr/include/bits/types.h /usr/include/bits/pthreadtypes.h \
    /usr/include/bits/sched.h /usr/include/libio.h \
    /usr/include/_G_config.h /usr/include/wchar.h \
    /usr/include/bits/wchar.h /usr/include/gconv.h \
    /usr/lib/gcc-lib/i486-suse-linux/2.95.3/include/stdarg.h \
    /usr/include/bits/stdio_lim.h
```
gcc -MM main.c的输出则是:

main.o: main.c defs.h


# 伪目标
伪目标¶
最早先的一个例子中，我们提到过一个“clean”的目标，这是一个“伪目标”，

clean:
    rm *.o temp
正像我们前面例子中的“clean”一样，既然我们生成了许多文件编译文件，我们也应该提供一个清除它们的“目标”以备完整地重编译而用。 （以“make clean”来使用该目标）

因为，我们并不生成“clean”这个文件。“伪目标”并不是一个文件，只是一个标签，由于“伪目标”不是文件，所以make无法生成它的依赖关系和决定它是否要执行。我们只有通过显式地指明这个“目标”才能让其生效。当然，“伪目标”的取名不能和文件名重名，不然其就失去了“伪目标”的意义了。

当然，为了避免和文件重名的这种情况，我们可以使用一个特殊的标记“.PHONY”来显式地指明一个目标是“伪目标”，向make说明，不管是否有这个文件，这个目标就是“伪目标”。

.PHONY : clean
只要有这个声明，不管是否有“clean”文件，要运行“clean”这个目标，只有“make clean”这样。于是整个过程可以这样写：

.PHONY : clean
clean :
    rm *.o temp
伪目标一般没有依赖的文件。但是，我们也可以为伪目标指定所依赖的文件。伪目标同样可以作为“默认目标”，只要将其放在第一个。一个示例就是，如果你的Makefile需要一口气生成若干个可执行文件，但你只想简单地敲一个make完事，并且，所有的目标文件都写在一个Makefile中，那么你可以使用“伪目标”这个特性：

all : prog1 prog2 prog3
.PHONY : all

prog1 : prog1.o utils.o
    cc -o prog1 prog1.o utils.o

prog2 : prog2.o
    cc -o prog2 prog2.o

prog3 : prog3.o sort.o utils.o
    cc -o prog3 prog3.o sort.o utils.o
我们知道，Makefile中的第一个目标会被作为其默认目标。我们声明了一个“all”的伪目标，其依赖于其它三个目标。由于默认目标的特性是，总是被执行的，但由于“all”又是一个伪目标，伪目标只是一个标签不会生成文件，所以不会有“all”文件产生。于是，其它三个目标的规则总是会被决议。也就达到了我们一口气生成多个目标的目的。 .PHONY : all 声明了“all”这个目标为“伪目标”。（注：这里的显式“.PHONY : all” 不写的话一般情况也可以正确的执行，这样make可通过隐式规则推导出， “all” 是一个伪目标，执行make不会生成“all”文件，而执行后面的多个目标。建议：显式写出是一个好习惯。）

随便提一句，从上面的例子我们可以看出，目标也可以成为依赖。所以，伪目标同样也可成为依赖。看下面的例子：

.PHONY : cleanall cleanobj cleandiff

cleanall : cleanobj cleandiff
    rm program

cleanobj :
    rm *.o

cleandiff :
    rm *.diff
“make cleanall”将清除所有要被清除的文件。“cleanobj”和“cleandiff”这两个伪目标有点像“子程序”的意思。我们可以输入“make cleanall”和“make cleanobj”和“make cleandiff”命令来达到清除不同种类文件的目的。



# demo4: 一个综合案列使用内置函数+静态模式+自动生成依赖

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



