---
category: 
- C++
- gdb
tag:
- C++
---

# gdb的使用

gdb是c/c++程序的调试利器，在日常工作中，十分有利，本文就将总结其使用方法。

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
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-60.el9.x86_64 libgcc-11.3.1-4.3.el9.x86_64 libstdc++-11.3.1-4.3.el9.x86_64
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