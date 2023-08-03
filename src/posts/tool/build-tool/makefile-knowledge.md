---
category: 
- Linux
- Makefile
---
# makefile案例学习
很多时候， 我们在```git clone```完一个project之后，就会让我们使用```make```命令进行项目的构建。这个make命令的背后就是按照了Makefile文件定义的格式去完成项目构建。

因此Makefile的作用就是帮助程序员进行项目的构建，它按照项目的需求个性化的定义自己的构建过程。Makefile并不限定编程语言，但是在c/c++项目中使用相对较多。其他的一些构建工具，例如qmake，也是将*.pro文件转化为Makefile，再进行构建。

可以看出Makefile的应用面还是非常广泛的， 下面将一步一步的讲解Makefile最常使用的语法， 并通过案例进行实践， 一步一步深入Makefile， 本文的案例主要使用了C++语言。

## makefile的基本规则
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

其中，targets为目标文件， prerequisites为依赖文件， command为如果使用依赖文件构建出目标文件的命令。

格式一中，command不与"target:prerequisites"在一行，必须以Tab键开头。

格式二中, command和prerequisites在一行，那么可以用分号做为分隔。

通常情况下， **一般使用格式一**， 命令和依赖分开， 比较清晰。

构建的逻辑如下所示：

(1)如果发现**目标文件不存在**，但是**依赖文件存在**，就会执行命令集构建生成目标文件。

(2)如果发现目**标文件不存在**，但是**依赖文件也不存在**，那么就会寻找依赖文件的构建模块， 尝试构建依赖文件， 然后再构建目标文件。

(3)如果发现**目标文件已经存在**，**依赖文件也存在**，make指令会自动去比较两者的修改时间：
- 依赖文件的最后修改时间晚于目标文件，就会执行指令集合。

- 依赖文件的最后修改时间早于目标文件，就不会执行指令集合。同时会提示目标文件已经是最新的。

(4)如果发现**目标文件已经存在**， **依赖文件不存在**，那么makefile将会寻找依赖文件的构建模块，并尝试构建依赖模块， 由于依赖模块生成时间晚于目标文件， 因此目标文件将会重新构建。

下面我们用过一些demo，一步一步的深入Makefile。

下面是demo1， 通过demo1来熟悉makefile的基本语法。
## demo1：第一个Makefile
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
int main () 
{
    cout << "Hello World" << endl;
}
```

为其编写的Makefile如下：
```makefile
main:main.o
        g++ main.o -o main
main.o:main.cpp
        g++ -c main.cpp main.o
.PHONY : clean
clean:
        rm -rf *.o main
```
首先看构建main对象，main对象依赖于main.o对象```main:main.o```， 因此需要完成main.o对象的构建。

接着看到main.o对象依赖于main.cpp文件， 该文件存在与当前目录中， 因此执行相应的命令```g++ -c main.cpp```。
```makefile
main.o:main.cpp
        g++ -c main.cpp
```
如此之后， main.o对象构建成功，这样就可以构建main对象，于是执行了main对象的命令```g++ main.o -o main```。

至此main对象的构建完毕。

makefile的最后一部分是一个clean对象， 用于清理生成的文件， 使用make clean即可构建clean对象。 关于关键字```.PHONY```将在下面的例子中讲解。
```makefile
.PHONY : clean
clean:
        rm -rf *.o main
```

## 使用$@ $< $^符号简化编写
在Makefile中，可以使用一些预定好的符号来简化书写， 例如$@ $< $^，其含义如下所示：

$@  表示目标文件

$^  表示所有的依赖文件

$<  表示第一个依赖文件

例如：
main: main.cpp add.cpp

```$@```指的就是main，```$<```指的就是main.cpp, ```$^```指的就是main.cpp add.cpp

下面我们就使用它们来改动demo1中的makefile。

## demo2：使用$@ $< $^ 简化书写
demo2的文件结构如下所示：
```text
.
├── main.cpp
└── Makefile
```

main.cpp如下：
```cpp
#include <iostream>
using namespace std;
int main () 
{
    cout << "Hello World" << endl;
}
```

Makefile内容如下:
```makefile
main:main.o
        g++ $< -o $@
main.o:main.cpp
        g++ -c $< -o $@
.PHONY : clean
clean:
        rm -rf *.o main
```

首先看main目标的command，```g++ $< -o $@```, $<代表第一个依赖项，即main.o， $@代表构建目标，即main， 因此该语句可以翻译成```g++ main.o -o main```。

main.o可以以此类推。

## vpath和VPATH
vpath和VPATH主要作用是通过指定文件的搜索路径自动寻找源文件，但是这种自动推导需要你将vpath/VPATH与```$<```,```$^```结合使用。

VPATH是一个变量， 其格式如下所示：
```makefile
VPATH = PATH1:PATH2:PATH3
```
将需要搜索的目录按照冒号分割。

vpath是一个关键字， 有三种格式：

1、```vpath <pattern> <directories>```

为符合模式```<pattern>```的文件指定搜索目录```<directories>```。

```makefile
vpath %.c path1:path2
```
其表示搜索.c结尾的文件，先在path1目录搜索，接着在path2目录搜索。

2、```vpath <pattern>```

清除符合模式```<pattern>```的文件的搜索目录。

3、vpath

清除所有已被设置好了的文件搜索目录。

第一个格式用于添加搜索路径， 后两个格式用于清除搜索路径。

下面需要注意vpath/VPATH的一个使用误区， 即vpath没有和```$<```,```$^```结合使用， 会有什么结果。

看下面的一个目录结构,
```text
.
├── Makefile
└── src
    └── main.cpp
```

所要编译的文件main.cpp在src目录下， 我们使用VPATH指定了搜索路径src， 我们在command直接指定了文件名， 没有使用```$<```,```$^```， 试问这样编写Makefile能正确编译吗？

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

下面通过demo3， 来实践一下vpath/VPATH。

## demo3：使用vpath和VPATH指定依赖文件搜索路径

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

main : main.o add.o
        g++ -o $@ $^

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

## 使用内置函数wildcard，patsubst， foreach， notdir等函数帮助我们构建

makefile提供了一些内置函数帮助我们的构建过程更加自动化。

**wilecard**:

使用格式:

```makefile
$(wildcard PATTERN...)
```

它被展开为已经存在的、使用空格分开的、匹配此模式的所有文件列表。

例如下面的语句可以获取工作目录下的所有.c文件列表。

```makefile
objects = $(wildcard *.c) 
```

**patsubst**:

```
$(patsubst <pattern>,<replacement>,<text> ) 
```

查找```<text>```中的单词（单词以"空格"、"Tab"或"回车""换行"分隔）是否符合模式```<pattern>```，如果匹配的话，则以```<replacement>```替换。

下面的例子可以快速的生成一个目录下.c文件生成的.o文件。

首先使用"wildcard"函数获取工作目录下的.c文件列表；之后将列表中所有文件名的后缀.c替换为.o。这样我们就可以得到在当前目录可生成的.o文件列表。

```makefile
$(patsubst %.c,%.o,$(wildcard *.c))
```

**notdir**:

用于去掉文件的绝对路径，只保留文件名。

下面的例子用于去除sub目录的前缀。

```makefile
file=$(notdir $(wildcard ./sub/*.c)),
```

**foreach**:

```makefile
$(foreach ITEM, LIST, TEXT)
```

实际上是一种循环， 常用于遍历文件夹下的所有文件。

foreach函数的工作过程是：把LIST中使用空格分割的单词依次取出并赋值给变量ITEM，然后执行TEXT表达式。重复这个过程，直到遍历完LIST中的最后一个单词。函数的返回值是TEXT多次计算的结果。

例如
```makefile
dirs = src src/math
srcs = $(foreach dir, $(dirs), $(wildcard $(dir)/*.cpp))
```
这段makefile就取出了src和src/math目录下所有的cpp文件


## 静态模式

静态模式可以更加容易地定义多目标的规则，可以让我们的规则变得更加的有弹性和灵活。我们还是先来看一下语法：

```makefile
<targets ...> : <target-pattern> : <prereq-patterns ...>
    <commands>
    ...
```
**targets**定义了一系列的目标文件，可以有通配符。是目标的一个集合。

**target-pattern**是指明了targets的模式，也就是的目标集模式。

**prereq-patterns**是目标的依赖模式，它对target-pattern形成的模式再进行一次依赖目标的定义。


下面的例子， 将多个构建目标合并在了一个静态模式中：

```makefile
objects = main.o add.o

all: $(objects)

$(objects): %.o: %.cpp
    $(CXX) -c $(CFLAGS) $< -o $@
```

其中：
```makefile
$(objects): %.o: %.cpp
    $(CXX) -c $(CFLAGS) $< -o $@
```
相当于

```makefile
main.o : main.c
    $(CXX) -c $(CFLAGS) main.cpp -o main.o
add.o : add.cpp
    $(CXX) -c $(CFLAGS) add.cpp -o add.o
```


## makefile自动生成依赖
在讲解makefile自动生成依赖之前,先给出本节中例子的目录结构和文件内容:

首先给出本节中例子的目录结构:

```text
.
├── add.hpp
├── main.cpp
├── Makefile
```

main.cpp内容如下:
```cpp
#include <iostream>
#include "add.hpp"

int main()
{
    int a = 1;
    int b = 2;
    int c = my_add(a, b);
    return 0;
}
```
add.hpp内容如下:
```cpp
int my_add(int a, int b)
{
    return a + b;
}
```

在Makefile中，我们的依赖关系可能会需要包含一系列的头文件，比如，如果我们的main.cpp中有一句```#include "add.hpp" ```，那么我们的依赖关系应该是：

```makefile
main.o : main.cpp add.hpp
```

但是使用一些模式匹配的方法是不能够自动将这些依赖的头文件也包含进去的， 例如下面的语句:

```makefile
%.o: %.cpp
	g++ -c $< -o $@
```

这就意味着, 如果add.hpp文件添加了内容，并不会使得main.o重新构建。这不是我们所期望的。

这里就需要我们借助gcc/g++的 -MM参数自动生成依赖
例如```g++ -MM main.cpp```的输出则是:

```makefile
main.o: main.c add.hpp
```

GNU组织建议把编译器为每一个源文件的自动生成的依赖关系放到一个文件中，为每一个.cpp的文件都生成一个.d的Makefile文件，然后再使用include将.d的依赖关系添加进来
例如：

```makefile
main: main.o main.d
    g++ $< -o $@
%.o: %.cpp
	g++ -c $< -o $@
%.d: %.cpp
    g++ -MM $<

include main.d
```

main.d的内容如下：

main.d
```makefile
main.o: main.cpp add.hpp
```

将include的内容展开， 等效的makefile文件如下所示:
```makefile
main: main.o main.d
    g++ $< -o $@
main.o: main.cpp
    g++ -c $< -o $@
main.d: main.cpp
    g++ -MM $<

main.o: main.cpp add.hpp
```

可以看出展开后，在该makefile中,出现了两个main.o的目标。

对于这种多规则同目标文件是有描述的：

在Makefile中，一个文件可以作为多个规则的目标出现。这种情况时，此目标文件的所有依赖文件将会被**合并成此目标一个依赖文件列表**，其中任何一个依赖文件比目标更新（比较目标文件和依赖文件的时间戳）时， make将会执行特定的命令来重建这个目标。

对于一个多规则的目标，重建此目标的命令**只能出现在一个规则中**（可以是多条命令）。如果多个规则同时给出重建此目标的命令，make将使用最后一个规则所以的命令，同时提示错误信息（一个特殊的例外是：使用"."开头的多规则目标文件，可以在多个规则中给出多个重建命令。这种方式只是为了和其他版本make进行兼容，一般在GNU make中应该避免使用这个功能）。

因此上述含有多目标的makefile可以转化为如下的makefile:

```makefile
main: main.o main.d
    g++ $< -o $@
main.o: main.cpp add.hpp
    g++ -c $< -o $@
main.d: main.cpp
    g++ -MM $<
```

到此, 当我们修改add.hpp时， main.o会重新构建。 这似乎已经很完美了，但是真的如此吗？

我们试想此时在add.hpp中添加新的依赖sub.hpp， 因为main.cpp依赖于add.hpp，因此main.o会重新编译。 但是由于main.d文件只依赖于main.cpp, 因此main.d不会重新生成, 因此当我们这个时候修改sub.hpp时, main.cpp并不会更新。

因此这就要求main.d 也要添加对头文件的依赖。

修改上面的makefile：

```makefile
main: main.o main.d
    g++ $< -o $@
%.o: %.cpp
	g++ -c $< -o $@
%.d: %.cpp
    @set -e; rm -f $@; \
    g++ -MM $< > $@.$$$$; \
    sed 's,\($*\)\.o[ :]*,\1.o $@ : ,g' < $@.$$$$ > $@; \
    rm -f $@.$$$$

include main.d
```
这里使用了sed去修改了gcc默认生成的依赖关系，即将```main.o: main.cpp add.hpp```转换成```main.o main.d : main.cpp add.hpp```。

也就是在main.d的依赖中增加了add.hpp的依赖。

等效的makefile如下所示：

```makefile
main: main.o main.d
    g++ $< -o $@
main.o: main.cpp add.hpp
    g++ -c $< -o $@
main.d: main.cpp add.hpp
    g++ -MM $<
```

这样, 即使在add.hpp中增加其他头文件依赖, 然后再修改其他的头文件，也会触发main.o的更新。


## 伪目标

在demo1中，我们提到过一个"clean"的目标，这是一个"伪目标"。

"伪目标"并不是一个文件，只是一个**标签**。 

假设我们不使用```.PHONY```:

```makefile
clean:
    rm *.o temp
```
当本地也有一个文件叫做clean时， 那么```rm *.o temp```的操作将不会被执行。

因此为了避免和文件重名的这种情况，我们可以使用一个特殊的标记".PHONY"来显式地指明一个目标是"伪目标"，向make说明，不管是否有这个文件，这个目标就是"伪目标"。

```makefile
.PHONY : clean
```
只要有这个声明，不管是否有"clean"文件，要运行"clean"这个目标，只有"make clean"这样。于是整个过程可以这样写：

```makefile
.PHONY : clean
clean :
    rm *.o temp
```


## demo4: 一个综合案列使用内置函数+静态模式+自动生成依赖

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
MODULE=demo4
SOURCE_PATH += ./src \
               ./src/math
TEMP_PATH=./tmp
TARGET=$(TEMP_PATH)/$(MODULE)

CPP_SOURCES = $(foreach d,$(SOURCE_PATH),$(wildcard $(d)/*.cpp) )
CPP_OBJS += $(patsubst %.cpp, $(TEMP_PATH)/%.o, $(notdir $(CPP_SOURCES)))
CPP_DEPS += $(patsubst %.cpp, $(TEMP_PATH)/%.d, $(notdir $(CPP_SOURCES)))
OBJS = $(CPP_OBJS)

CXXFLAGS+=-I./inc

$(TARGET): $(OBJS) $(CPP_DEPS)
	@echo "generate final target"
	$(CXX) -o $@ $(OBJS)

$(CPP_OBJS): $(TEMP_PATH)/%.o : %.cpp
	-@mkdir -p $(TEMP_PATH)
	@echo [$(MODULE) CXX] $<
	$(CXX) -c  $(CXXFLAGS) $< -o $@

$(CPP_DEPS): $(TEMP_PATH)/%.d: %.cpp
	-@mkdir -p $(TEMP_PATH)
	-@echo -n "$(TEMP_PATH)/" > $@
	@set -e; rm -f $@; \
    $(CXX) -MM  $(CXXFLAGS) $< > $@.$$$$; \
    sed 's,\($*\)\.o[ :]*,tmp/\1.o $@ : ,g' < $@.$$$$ > $@; \
    rm -f $@.$$$$

include $(CPP_DEPS)

.PHONY: clean
clean:
	rm -rf $(TEMP_PATH)/*.o  $(TEMP_PATH)/*.d  $(TEMP_PATH)/$(MODULE)

```

下面一一分析。
```makefile
VPATH = src:src/math:inc
```
首先使用VPATH依赖文件存在的路径， 以便下面自动推导文件的相对路径。


```makefile
CXX=g++
MODULE=demo4
SOURCE_PATH += ./src \
               ./src/math
TEMP_PATH=./tmp
TARGET=$(TEMP_PATH)/$(MODULE)

CXXFLAGS+=-I./inc
```

这里定义了一些变量，包括源文件的路径， 目标文件存放的位置， 编译参数等等。


```makefile
CPP_SOURCES = $(foreach d,$(SOURCE_PATH),$(wildcard $(d)/*.cpp) )
CPP_OBJS += $(patsubst %.cpp, $(TEMP_PATH)/%.o, $(notdir $(CPP_SOURCES)))
CPP_DEPS += $(patsubst %.cpp, $(TEMP_PATH)/%.d, $(notdir $(CPP_SOURCES)))
OBJS = $(CPP_OBJS)
```

这里首先使用foreach去遍历SOURCE_PATH路径下的所有的.cpp文件

然后将.cpp文件做字符串替换， 替换为.o， 同时增加了存放的路径， 这里使用了patsubst做字符串替换， 并使用了notdir去获取文件名。


```makefile
$(TARGET): $(OBJS) $(CPP_DEPS)
	@echo "generate final target"
	$(CXX) -o $@ $(OBJS)
```

这里展开便是:
```makefile
tmp/demo4: tmp/main.o tmp/sub.o tmp/add.o tmp/main.d tmp/sub.d tmp/main.d
    g++ -o tmp/demo4 tmp/main.o tmp/sub.o tmp/add.o
```

```makefile
$(CPP_OBJS): $(TEMP_PATH)/%.o : %.cpp
        -@mkdir -p $(TEMP_PATH)
        @echo [$(MODULE) CXX] $<
        $(CXX) -c  $(COMPILEFLAGS) $< -o $@
```
这里展开便是:
```makefile
tmp/main.o: src/main.cpp
    g++ -c src/main.cpp -o tmp/main.o -I./inc
tmp/add.o: src/math/add.cpp
    g++ -c src/math/add.cpp -o tmp/add.o -I./inc
tmp/sub.o: src/math/sub.cpp
    g++ -c src/math/sub.cpp -o tmp/sub.o -I./inc
```
该步骤就是生成了.o文件:

```makefile
$(CPP_DEPS): $(TEMP_PATH)/%.d: %.cpp
	-@mkdir -p $(TEMP_PATH)
	-@echo -n "$(TEMP_PATH)/" > $@
	@set -e; rm -f $@; \
    $(CXX) -MM  $(CXXFLAGS) $< > $@.$$$$; \
    sed 's,\($*\)\.o[ :]*,tmp/\1.o $@ : ,g' < $@.$$$$ > $@; \
    rm -f $@.$$$$
```
该步骤使用了g++ -MM参数用于自动生成依赖文件， 以便于当头文件修改时，也可以自动编译/

```makefile
.PHONY: clean
clean:
        rm -rf $(TEMP_PATH)/*.o  $(TEMP_PATH)/main
```
最后这个模块用于清除生成的文件。

至此， demo4结束。