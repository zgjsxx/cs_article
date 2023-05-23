---
category: 
- 编译原理
- Linux
- ELF文件
---

# 动态库中包含了相同的符号，行为是怎样的？


## 分析
主程序依赖了两个库libA的funcA函数和libB的funcB函数。示意的代码(main.cpp)如下：

```cpp
#include <cstdio>

int funcA(int, int);
int funcB(int, int);

int main() {
    printf("%d,", funcA(2, 1));
    printf("%d\n", funcB(2, 1));
    return 0;
}
```

libA示意实现(libA.cpp)如下：
```cpp
int subfunc(int a, int b) {
    return a + b;
}

int funcA(int a, int b) {
    return subfunc(a, b);
}
```
libB示意实现(libB.cpp)如下：
```cpp
int subfunc(int a, int b) {
    return a - b;
}

int funcB(int a, int b) {
    return subfunc(a, b);
}
```

可见funcA调用了libA中的内部函数subfunc，funcB调用了libB中的内部函数subfunc，这两个subfunc实现不同，但不幸的是名字不小心起得一样了

这时我们尝试编译并运行：

```shell
g++ -fPIC libA.cpp -shared -o libA.so
g++ -fPIC libB.cpp -shared -o libB.so
g++ main.cpp libA.so libB.so -o main

export LD_LIBRARY_PATH=.
./main
```

我们期望的结果是3,1（funcA和funcB各自调用不同的subfunc实现），
实际得到的结果是3,3（funcA和funcB都调用了libA中的subfunc实现）

原因

我们通过readelf来查看符号：
```shell
$ readelf -a libA.so | grep subfunc
000000200a60  000200000007 R_X86_64_JUMP_SLO 0000000000000708 _Z7subfuncii + 0
     2: 0000000000000708    20 FUNC    GLOBAL DEFAULT   10 _Z7subfuncii
    45: 0000000000000708    20 FUNC    GLOBAL DEFAULT   10 _Z7subfuncii
```

```shell
$ readelf -a libB.so | grep subfunc 
000000200a60  000200000007 R_X86_64_JUMP_SLO 0000000000000708 _Z7subfuncii + 0
     2: 0000000000000708    22 FUNC    GLOBAL DEFAULT   10 _Z7subfuncii
    45: 0000000000000708    22 FUNC    GLOBAL DEFAULT   10 _Z7subfuncii
```
可见libA和libB里面都有subfunc符号，名字完全一样，而且都是GLOBAL的

GLOBAL的符号即全局的符号，同名的全局符号会被认为是同一个符号，由于main先加载了libA，得到了libA中的subfunc符号，再加载libB时，就把libB中的subfunc忽略了。

## 解决方案

这其实是符号的可见性（Symbol Visibility）问题，既然有GLOBAL符号，那自然会有LOCAL符号，LOCAL的符号只在当前lib可见，全局不可见。

如何将符号变成LOCAL的呢，最直接的就是加上visibility为hidden的标志，修改后的libA.cpp：
```cpp
__attribute__ ((visibility ("hidden"))) int subfunc(int a, int b) {
    return a + b;
}

int funcA(int a, int b) {
    return subfunc(a, b);
}
```
再重新编译执行，可以得到结果为3,1，成功！这里再查看一下libA的符号：

```shell
$ readelf -a libA.so | grep subfunc
    40: 00000000000006a8    20 FUNC    LOCAL  DEFAULT   10 _Z7subfuncii
```

可见subfunc符号已经变成了LOCAL


使用objdump对比GLOBAL和LOCAL的区别，可以看出GLOBAL走的是.plt .got.plt动态连接这条路， 而LOCAL直接写死了偏移量。
```cpp
625:   e8 06 ff ff ff          callq  530 <_Z7subfuncii@plt> //GLOBAL

5d5:   e8 cf ff ff ff          callq  5a9 <_Z7subfuncii>  //LOCAL
```


**默认LOCAL**

上面的方法可以解决问题，但是，实际情况往往是，libA里面有很多的内部函数，而暴露给外部的只有少数，能不能指定少数符号为GLOBAL，其它的都是LOCAL呢？答案是肯定的，修改libA.cpp如下：

```cpp
int subfunc(int a, int b) {
    return a + b;
}

__attribute__ ((visibility ("default"))) int funcA(int a, int b) {
    return subfunc(a, b);
}
```
这时，libA的编译参数需要加上-fvisibility=hidden：

g++ -fPIC libA.cpp -shared -fvisibility=hidden -o libA.so

就ok

原文链接：https://blog.csdn.net/qq_38350702/article/details/106128157