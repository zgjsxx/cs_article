---
category: 
- C++
- gdb
tag:
- C++
---

# gdb的基础命令使用

gdb是c/c++程序的调试利器，在日常工作中，十分有利。 

有人说， 有了像clion，visual studio这样的IDE工具，我们还有必要去了解gdb工具吗？

其实是有必要的，在日常的代码开发中，使用这些IDE工具确实能够很好地帮助我们进行开发，但是你很难确定所有的环境都有IDE，比如线上环境，客户环境，因此了解gdb的指令还是很有必要的，本文就一些常用的gdb指令进行梳理。

- [gdb的基础命令使用](#gdb的基础命令使用)
  - [gdb常用命令](#gdb常用命令)
  - [gdb命令案例详解](#gdb命令案例详解)
    - [run](#run)
    - [continue](#continue)
    - [next](#next)
    - [step](#step)
    - [until](#until)
    - [finish](#finish)
    - [call](#call)
    - [break](#break)
    - [watch](#watch)
    - [print](#print)
    - [display](#display)
    - [backtrace](#backtrace)
    - [info](#info)
  - [参考文献](#参考文献)

## gdb常用命令

运行

|命令名称|命令缩写|命令作用|
|--|--|--|
|run|r|运行一个程序|
|continue|c|继续执行，到下一个断点处|
|next|n|单步调试，不进入函数体|
|step|s|单步调试，进入函数体|
|until||运行程序直到退出循环体|
|until + 行号||运行至某行|
|finish||运行程序，知道当前函数返回|
|call||调用程序中可见的函数并传递参数|
|quit|q|退出gdb|

断点

|命令名称|命令缩写|命令作用|
|--|--|--|
|break n(行号)|b n |在第n行出设置断点|
|delete n(断点号)|d n|删除第n个断点|
|disable n(断点号)||禁用第n个断点|
|enable n(断点号)||开启第n个断点|
|clear n(行号)||清除第n行的断点|
|info break|info b|显示当前程序的断点情况|
|delete breakpoints||清除所有断点|


查看源代码

|命令名称|命令缩写|命令作用|
|--|--|--|
|list|l|列出程序的原代码，默认每次显示10行|
|list n(行号)|l n|将显示当前文件以行号为中心的前后10行代码|
|list 函数名|l main|将显示函数名所在函数的源代码|


打印表达式

|命令名称|命令缩写|命令作用|
|--|--|--|
|print var|p|打印变量|
|watch var||设置一个监控点，一旦被监视的表达式的值改变了|
|info locals||查看当前堆栈页的所有变量|
|info function||查询函数|
|display var||每次单步调试的时候都打印变量的值|

查询运行信息

|命令名称|命令缩写|命令作用|
|--|--|--|
|where/bt| |当前运行的堆栈列表；|
|backtrace |bt |显示当前调用堆栈|
|up/down| |改变堆栈显示的深度|
|set args| |参数:指定运行时的参数|
|show args| |查看设置好的参数|
|info program| |来查看程序的是否在运行，进程号，被暂停的原因。|

## gdb命令案例详解

### run

run命令用于启动一个程序，看下面的例子：

```cpp
//main.cpp
//g++ main.cpp -g
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
}
```

在下面的调试过程中，我们使用run命令运行该程序，由于没有任何断点，程序一直运行到了结束。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) run
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".
i = 0
i = 1
i = 2
i = 3
i = 4
i = 5
i = 6
i = 7
i = 8
i = 9
45
[Inferior 1 (process 25956) exited normally]
```

### continue

continue用于继续执行，直到下一个断点处。需要和break结合使用。看下面的例子：

```cpp
//main.cpp
//g++ main.cpp -g
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
}
```

在下面的调试过程中，我们在main.cpp的第5行和第7行下了断点，使用run命令启动程序后将在第一处断点暂停，使用continue命令将使程序继续执行，在第二处断点处暂停。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:5
Breakpoint 1 at 0x40118e: file demo.cpp, line 5.
(gdb) b main.cpp:7
Breakpoint 2 at 0x40119e: file demo.cpp, line 7.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at demo.cpp:5
warning: Source file is more recent than executable.
5           int sum = 0;
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-60.el9.x86_64 libgcc-11.3.1-4.3.el9.x86_64 libstdc++-11.3.1-4.3.el9.x86_64
(gdb) continue
Continuing.

Breakpoint 2, func () at demo.cpp:7
7               std::cout << "i = " << i << std::endl;
(gdb)
```

### next

next命令用于单步调试，对于用户定义的函数，next不会进入函数中执行，看下面这个例子：

```cpp
#include <iostream>

int add(int a, int b)
{
    int c = a + b;
    return c;
}
int main()
{
    int a = 1;
    int b = 2;
    int c = add(1, b);
    std::cout << "c = " << c << std::endl;
}
```

在下面的调试过程中，在main函数第12行下了断点,接着使用next指令一直单步执行，当执行到add函数时，直接返回了结果，并不会进入函数体。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:10
Breakpoint 1 at 0x401204: file main.cpp, line 10.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, main () at main.cpp:10
12          int a = 1;
(gdb) next
13          int b = 2;
(gdb) next
14          int c = add(1, b);
(gdb) next
15          std::cout << "c = " << c << std::endl;
(gdb) next
c = 3
16      }
```

### step

next命令也用于单步调试，对于用户定义的函数，next会进入函数中执行，这一点和next是不同的，平时使用时根据需求进行选择。看下面这个例子：

```cpp
#include <iostream>

int add(int a, int b)
{
    int c = a + b;
    return c;
}
int main()
{
    int a = 1;
    int b = 2;
    int c = add(1, b);
    std::cout << "c = " << c << std::endl;
}
```

在下面的调试过程中，在main函数第10行下了断点,接着使用step指令一直单步执行，当执行到add函数时，进入了add函数的函数体内单步执行。

```shell
[root@localhost test1]# gdb a.out  -q
Reading symbols from a.out...
(gdb) b main.cpp:10
Breakpoint 1 at 0x4011a8: file main.cpp, line 10.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, main () at main.cpp:10
10          int a = 1;
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-60.el9.x86_64 libgcc-11.3.1-4.3.el9.x86_64 libstdc++-11.3.1-4.3.el9.x86_64
(gdb) step
11          int b = 2;
(gdb) step
12          int c = add(1, b);
(gdb) step
add (a=1, b=2) at main.cpp:5
5           int c = a + b;
(gdb) step
6           return c;
(gdb) step
7       }
(gdb) step
main () at main.cpp:13
13          std::cout << "c = " << c << std::endl;
(gdb) step
c = 3
14      }
(gdb) step
0x00007ffff783feb0 in __libc_start_call_main () from /lib64/libc.so.6
(gdb) step
Single stepping until exit from function __libc_start_call_main,
which has no line number information.
[Inferior 1 (process 34464) exited normally]
```

### until

until可以用于跳出循环，或者执行到某一行。

- until用于跳出循环

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
}
```

在下面的调试过程中，我们在循环之前下了断点，然后使用next单步进入了循环体，随后使用until跳出了循环。（我这边测试，如果已进入循环就until并不能跳出循环，到第二轮循环时使用until可以跳出循环）。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:5
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
n[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:5
5           int sum = 0;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) n
7               std::cout << "i = " << i << std::endl;
(gdb) n
i = 0
8               sum += i;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) until
i = 1
i = 2
i = 3
i = 4
i = 5
i = 6
i = 7
i = 8
i = 9
11          std::cout << sum << std::endl;
(gdb)
```

- until用于执行到某一行

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
}
```

在下面的调试过程中，我使用了until + 行号的方法，使得程序直接运行到了我所指定的地点。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:5
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:5
5           int sum = 0;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) n
7               std::cout << "i = " << i << std::endl;
(gdb) until main.cpp:11
i = 0
i = 1
i = 2
i = 3
i = 4
i = 5
i = 6
i = 7
i = 8
i = 9
func () at main.cpp:11
11          std::cout << sum << std::endl;
```

### finish

finish命令的作用是将当前的函数执行完毕，返回上一层调用。有时我们不小心使用了step进入了函数内部，却发现不关心该函数内部的过程，就可以使用finish将该函数执行完毕。

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;
}
```

在下面的调试过程中，我在main.cp的第5行下了断点，该断点位于func函数中，这个时候我想跳出func函数，于是就使用了finish结束该函数。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:5
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:5
5           int sum = 0;
(gdb) finish
Run till exit from #0  func () at main.cpp:5
i = 0
i = 1
i = 2
i = 3
i = 4
i = 5
i = 6
i = 7
i = 8
i = 9
45
main () at main.cpp:18
18          std::cout << "finish" << std::endl;
(gdb) next
finish
19      }
(gdb) next
0x00007ffff783feb0 in __libc_start_call_main () from /lib64/libc.so.6
```

### call

call命令可以使得我们在程序运行时去调用某一个方法。

```cpp
#include <iostream>

int add(int a, int b)
{
    int c = a + b;
    return c;
}
int main()
{
    int a = 1;
    int b = 2;
    int c = add(1, b);
    std::cout << "c = " << c << std::endl;
}
```

在下面的调试过程中，我们在main函数下了一个断点，接着使用call命令调用了方法，并打印出了返回值。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:11
Breakpoint 1 at 0x4011af: file main.cpp, line 11.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, main () at main.cpp:11
11          int b = 2;
(gdb) call add(1,2)
$1 = 3
```


### break

break用于设置一个断点

普通断点的设置在上面已经提到过，这里看看其他的用法

- 条件断点

条件断点在条件成立的时候才会触发

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;
}
```

在下面的调试过程中，在循环体内设置了条件断点，只有当i=5的时候，断点才会生效。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:7 if i = 5
Breakpoint 1 at 0x40119e: file main.cpp, line 7.
(gdb) info b
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040119e in func() at main.cpp:7
        stop only if i = 5
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:7
7               std::cout << "i = " << i << std::endl;
(gdb) p i
$1 = 5
(gdb)
```

- 临时断点
  
在使用gdb时，如果想让断点只生效一次，可以使用tbreak命令(缩写为tb)。

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;
}
```

在下面的调试中，在循环的内部使用tb创建了一个断点，当使用continue命令时，不再会停止在该断点处。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) tb main.cpp:7
Temporary breakpoint 1 at 0x40119e: file main.cpp, line 7.
(gdb) info break
Num     Type           Disp Enb Address            What
1       breakpoint     del  y   0x000000000040119e in func() at main.cpp:7
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Temporary breakpoint 1, func () at main.cpp:7
7               std::cout << "i = " << i << std::endl;
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-60.el9.x86_64 libgcc-11.3.1-4.3.el9.x86_64 libstdc++-11.3.1-4.3.el9.x86_64
(gdb) c
Continuing.
i = 0
i = 1
i = 2
i = 3
i = 4
i = 5
i = 6
i = 7
i = 8
i = 9
45
finish
[Inferior 1 (process 81491) exited normally]
```

- 保存断点

使用save breakpoints和source命令可以导出和导入断点数据。

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;

```

在下面的调试过程中，我首先在main.cpp中设置了三个断点，随后将三个断点导出到了文件中。接着删除所有的断点，然后再通过save导入之前所有的断点。

```shell
[root@localhost test]# gdb a.out  -q
Reading symbols from a.out...
(gdb) b main.cpp:4
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) b main.cpp:5
Note: breakpoint 1 also set at pc 0x40118e.
Breakpoint 2 at 0x40118e: file main.cpp, line 5.
(gdb) b main.cpp:6
Breakpoint 3 at 0x401195: file main.cpp, line 6.
(gdb) info b
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040118e in func() at main.cpp:5
2       breakpoint     keep y   0x000000000040118e in func() at main.cpp:5
3       breakpoint     keep y   0x0000000000401195 in func() at main.cpp:6
(gdb) save b main.brk
Saved to file 'main.brk'.
(gdb) delete breakpoints
Delete all breakpoints? (y or n) y
(gdb) info break
No breakpoints or watchpoints.
(gdb) source main.brk
Breakpoint 4 at 0x40118e: file main.cpp, line 5.
Breakpoint 5 at 0x40118e: file main.cpp, line 5.
Breakpoint 6 at 0x401195: file main.cpp, line 6.
(gdb) info break
Num     Type           Disp Enb Address            What
4       breakpoint     keep y   0x000000000040118e in func() at main.cpp:5
5       breakpoint     keep y   0x000000000040118e in func() at main.cpp:5
6       breakpoint     keep y   0x0000000000401195 in func() at main.cpp:6
```

### watch

watch命令用于监控一个变量，通过前后值的变化判断程序是否存在bug。

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;
}
```

在下面的调试过程中，我在func函数上下了一个断点。随后监控sum变量的变化。

```cpp
[root@localhost test]# gdb a.out -q
Reading symbols from a.out...
(gdb) b func
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:5
warning: Source file is more recent than executable.
5           int sum = 0;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) info locals
i = -135593542
sum = 0
(gdb) watch sum
Hardware watchpoint 2: sum
(gdb) info watch
Num     Type           Disp Enb Address            What
2       hw watchpoint  keep y                      sum
(gdb) n
7               std::cout << "i = " << i << std::endl;
(gdb) n
i = 0
8               sum += i;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) n
7               std::cout << "i = " << i << std::endl;
(gdb) n
i = 1
8               sum += i;
(gdb) n

Hardware watchpoint 2: sum

Old value = 0
New value = 1
func () at main.cpp:6
6           for(int i = 0;i < 10; ++i){

```

### print

print用于打印程序中变量的值。

```cpp
#include <iostream>

int main()
{
    int a = 20;
    return 0;
}
```

在下面的例子中，我使用了print命令分别以十六进制，十进制，八进制和二进制打印了变量的值。

p/x: 十六进制

p/d: 十进制

p/o: 八进制

p/t: 二进制

```shell
[root@localhost test]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:5
Breakpoint 1 at 0x40114a: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, main () at main.cpp:5
5           int a = 20;
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-28.el9_0.2.x86_64 libgcc-11.2.1-9.4.el9.x86_64 libstdc++-11.2.1-9.4.el9.x86_64
(gdb) n
6           return 0;
(gdb) p a
$1 = 20
(gdb) p/x a
$2 = 0x14
(gdb) p/d a
$3 = 20
(gdb) p/o a
$4 = 024
(gdb) p/t a
$5 = 10100
```

### display

display和print命令比较相似，也可以用于调试阶段查看某个变量或表达式的值，它们的区别是，使用 display 命令查看变量或表达式的值，每当程序暂停执行（例如单步执行）时，GDB 调试器都会自动帮我们打印出来，而 print 命令则不会。看下面的例子：

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 1;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;
}
```

在下面的调试过程中，我们在func函数上下了一个断点，并使用display去查看sum变量的值，接着当我们每次进行单步时，都会打印sum变量的值。

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b func
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:5
5           int sum = 0;
(gdb) display sum
1: sum = 0
(gdb) n
6           for(int i = 1;i < 10; ++i){
1: sum = 0
(gdb) n
7               std::cout << "i = " << i << std::endl;
1: sum = 0
(gdb) n
i = 1
8               sum += i;
1: sum = 0
(gdb) n
6           for(int i = 1;i < 10; ++i){
1: sum = 1
(gdb) n
7               std::cout << "i = " << i << std::endl;
1: sum = 1
(gdb) n
i = 2
8               sum += i;
1: sum = 1
(gdb) n
6           for(int i = 1;i < 10; ++i){
1: sum = 3
(gdb) info display
Auto-display expressions now in effect:
Num Enb Expression
1:   y  sum
(gdb) undisplay 1
(gdb) n
7               std::cout << "i = " << i << std::endl;
```

### backtrace

backtrace用于查看函数堆栈，通常和up/down/frame等命令配合使用。

其中bt full可以打印完整的堆栈。

```cpp
#include <iostream>

int func1(int a)
{
    int b = 1;
    return b*a;
}


int func2(int a)
{
    int b = 2;
    return b*func1(a);
}

int func3(int a)
{
    int b = 3;
    return b*func2(a);
}
int main()
{
    int a = 20;
    int c = func3(a);
    return 0;
}

```

在下面的调试过程中，我们在最底层的调用函数func1中设置了断点，然后使用了bt命令查看了函数堆栈。

```shell
[root@localhost test]# gdb a.out -q
Reading symbols from a.out...
(gdb) b main.cpp:5
Breakpoint 1 at 0x40114d: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func1 (a=20) at main.cpp:5
5           int b = 1;
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-28.el9_0.2.x86_64 libgcc-11.2.1-9.4.el9.x86_64 libstdc++-11.2.1-9.4.el9.x86_64
(gdb) bt
#0  func1 (a=20) at main.cpp:5
#1  0x0000000000401179 in func2 (a=20) at main.cpp:13
#2  0x000000000040119b in func3 (a=20) at main.cpp:19
#3  0x00000000004011ba in main () at main.cpp:24
(gdb) bt full
#0  func1 (a=20) at main.cpp:5
        b = 32767
#1  0x0000000000401179 in func2 (a=20) at main.cpp:13
        b = 2
#2  0x000000000040119b in func3 (a=20) at main.cpp:19
        b = 3
#3  0x00000000004011ba in main () at main.cpp:24
        a = 20
        c = -134517304

```

- 使用up/down/frame切换堆栈

例子和上面一样，这里还是贴一下。

```cpp
#include <iostream>

int func1(int a)
{
    int b = 1;
    return b*a;
}


int func2(int a)
{
    int b = 2;
    return b*func1(a);
}

int func3(int a)
{
    int b = 3;
    return b*func2(a);
}
int main()
{
    int a = 20;
    int c = func3(a);
    return 0;
}
```

在下面的调试过程中，我使用了up命令向上切换函数栈，使用down向上切换函数栈，使用frame选择函数栈。

```shell
[root@localhost test]# gdb a.out -q
Reading symbols from a.out...
(gdb) b func1
Breakpoint 1 at 0x40114d: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func1 (a=20) at main.cpp:5
5           int b = 1;
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-28.el9_0.2.x86_64 libgcc-11.2.1-9.4.el9.x86_64 libstdc++-11.2.1-9.4.el9.x86_64
(gdb) bt
#0  func1 (a=20) at main.cpp:5
#1  0x0000000000401179 in func2 (a=20) at main.cpp:13
#2  0x000000000040119b in func3 (a=20) at main.cpp:19
#3  0x00000000004011ba in main () at main.cpp:24
(gdb) frame
#0  func1 (a=20) at main.cpp:5
5           int b = 1;
(gdb) up 1
#1  0x0000000000401179 in func2 (a=20) at main.cpp:13
13          return b*func1(a);
(gdb) up 1
#2  0x000000000040119b in func3 (a=20) at main.cpp:19
19          return b*func2(a);
(gdb) down 1
#1  0x0000000000401179 in func2 (a=20) at main.cpp:13
13          return b*func1(a);
(gdb) down 1
#0  func1 (a=20) at main.cpp:5
5           int b = 1;
(gdb) frame 2
#2  0x000000000040119b in func3 (a=20) at main.cpp:19
19          return b*func2(a);
```


### info 

info命令用于查看一些信息
常用的有

|命令|含义|
|--|--|
|info break |查看所有的断点|
|info args|打印当前函数的参数名和值|
|info locals|查看当前栈上的变量|
|info watchpoints|查看观察点|


- info break
```cpp
#include <iostream>

int func1(int a)
{
    int b = 1;
    return b*a;
}


int func2(int a)
{
    int b = 2;
    return b*func1(a);
}

int func3(int a)
{
    int b = 3;
    return b*func2(a);
}
int main()
{
    int a = 20;
    int c = func3(a);
    return 0;
}
```

在下面的调试过程中，我下了三个断点，使用info b查看了这三个断点

```shell
[root@localhost test]# gdb a.out -q
Reading symbols from a.out...
(gdb) b func1
Breakpoint 1 at 0x40114d: file main.cpp, line 5.
(gdb) b func2
Breakpoint 2 at 0x401168: file main.cpp, line 12.
(gdb) b func3
Breakpoint 3 at 0x40118a: file main.cpp, line 18.
(gdb) info b
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040114d in func1(int) at main.cpp:5
2       breakpoint     keep y   0x0000000000401168 in func2(int) at main.cpp:12
3       breakpoint     keep y   0x000000000040118a in func3(int) at main.cpp:18
```

- info args/info locals

```cpp
#include <iostream>

int add(int a, int b)
{
    int c = a + b;
    return c;
}

int main()
{
    int a = 20;
    int b = 20;
    int c = add(a, b);
    return 0;
}
```

在下面的例子中，我在add函数中下了断点，使用info args查看了add函数的入参，使用info locals查看了栈上的变量

```shell
[root@localhost test1]# gdb a.out -q
Reading symbols from a.out...
(gdb) b add
Breakpoint 1 at 0x401150: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test1/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, add (a=20, b=20) at main.cpp:5
5           int c = a + b;
(gdb) info args
a = 20
b = 20
(gdb) info locals
c = 0
(gdb)

```

- info watch

```cpp
#include <iostream>

void func()
{
    int sum = 0;
    for(int i = 0;i < 10; ++i){
        std::cout << "i = " << i << std::endl;
        sum += i;
    }

    std::cout << sum << std::endl;

}

int main()
{
    func();
    std::cout << "finish" << std::endl;
}
```

在下面的调试过程中，我在func函数上下了一个断点。随后监控sum变量的变化。使用info watch查看了我们添加的watch point。

```cpp
[root@localhost test]# gdb a.out -q
Reading symbols from a.out...
(gdb) b func
Breakpoint 1 at 0x40118e: file main.cpp, line 5.
(gdb) r
Starting program: /home/work/cpp_proj/test/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".

Breakpoint 1, func () at main.cpp:5
warning: Source file is more recent than executable.
5           int sum = 0;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) info locals
i = -135593542
sum = 0
(gdb) watch sum
Hardware watchpoint 2: sum
(gdb) info watch
Num     Type           Disp Enb Address            What
2       hw watchpoint  keep y                      sum
(gdb) n
7               std::cout << "i = " << i << std::endl;
(gdb) n
i = 0
8               sum += i;
(gdb) n
6           for(int i = 0;i < 10; ++i){
(gdb) n
7               std::cout << "i = " << i << std::endl;
(gdb) n
i = 1
8               sum += i;
(gdb) n

Hardware watchpoint 2: sum

Old value = 0
New value = 1
func () at main.cpp:6
6           for(int i = 0;i < 10; ++i){

```

## 参考文献

https://github.com/hellogcc/100-gdb-tips/blob/master/src/index.md