---
category: 
- 编译原理
- Linux
---

# 深入了解GOT,PLT和动态链接

我们使用一个简单的例子来了解动态链接库的链接过程，以及在这个过程中使用到的GOT和PLT的作用是什么。

## 文件准备
代码结构如下所示：
```
[root@localhost test]# tree .
.
├── main.c
└── symbol.c
```

symbol.c的内容如下：
```c
// symbol.c
int my_var = 42;
int my_func(int a, int b) {
    return a + b;
}
```

使用如下脚本进行编译：
```shell
gcc -g -m32 -masm=intel -shared -fPIC symbol.c -o libsymbol.so
```

如果编译不成功，使用如下命令安装32位的版本的c/c++库。
```shell
yum install glibc-devel.i686
yum install libstdc++-devel.i686
```

另一个文件是main.c, 调用该动态链接库，代码如下：
```c
// main.c
int var = 10;
extern int my_var;
extern int my_func(int, int);

int main() {
    int a, b;
    a = var;
    b = my_var;
    return my_func(a, b);
}
```
使用下面的代码进行编译。
```shell
# 位置相关
gcc -g -m32 -masm=intel -L. -lsymbol -no-pie -fno-pic main.c libsymbol.so -o main
# 位置无关
gcc -g -m32 -masm=intel -L. -lsymbol main.c libsymbol.so -o main_pi
```

当目录中生成了main、main_pi、libsymbol.so时，准备工作结束。

## 动态链接分析
我们使用```readelf -S main |egrep '.plt|.got'```查看可执行文件中的plt和got相关的段。

```shell
[Nr] Name              Type            Addr     Off    Size   ES Flg Lk Inf Al
[12] .plt              PROGBITS        080483d0 0003d0 000030 04  AX  0   0 16
[21] .got              PROGBITS        08049ff4 000ff4 00000c 04  WA  0   0  4
[22] .got.plt          PROGBITS        0804a000 001000 000014 04  WA  0   0  4
```

这里需要对.got.plt的地址**0804a000**有个印象。

进入gdb调用该程序：
```shell
(gdb) disass main
Dump of assembler code for function main:
   0x0804853d <+0>:     lea    0x4(%esp),%ecx
   0x08048541 <+4>:     and    $0xfffffff0,%esp
   0x08048544 <+7>:     pushl  -0x4(%ecx)
   0x08048547 <+10>:    push   %ebp
   0x08048548 <+11>:    mov    %esp,%ebp
   0x0804854a <+13>:    push   %ecx
   0x0804854b <+14>:    sub    $0x14,%esp
   0x0804854e <+17>:    mov    0x804a018,%eax
   0x08048553 <+22>:    mov    %eax,-0xc(%ebp)
   0x08048556 <+25>:    mov    0x804a01c,%eax
   0x0804855b <+30>:    mov    %eax,-0x10(%ebp)
   0x0804855e <+33>:    sub    $0x8,%esp
   0x08048561 <+36>:    pushl  -0x10(%ebp)
   0x08048564 <+39>:    pushl  -0xc(%ebp)
   0x08048567 <+42>:    call   0x80483e0 <my_func@plt>
   0x0804856c <+47>:    add    $0x10,%esp
   0x0804856f <+50>:    mov    -0x4(%ebp),%ecx
   0x08048572 <+53>:    leave
   0x08048573 <+54>:    lea    -0x4(%ecx),%esp
   0x08048576 <+57>:    ret
End of assembler dump.
```

我们在```call   0x80483e0 <my_func@plt>```这一句上下一个断点。
```shell
(gdb) b *0x08048567
Breakpoint 1 at 0x8048567: file main.c, line 9.
```

使用run运行程序到断点处。
```shell
(gdb) r
Starting program: /home/work/cpp_proj/test/main
Missing separate debuginfos, use: yum debuginfo-install glibc-2.28-164.el8.i686

Breakpoint 1, 0x08048567 in main () at main.c:9
9           return my_func(a, b);
```


查看一下main，确实停在了断点处：
```shell
(gdb) disass main
Dump of assembler code for function main:
   0x0804853d <+0>:     lea    0x4(%esp),%ecx
   0x08048541 <+4>:     and    $0xfffffff0,%esp
   0x08048544 <+7>:     pushl  -0x4(%ecx)
   0x08048547 <+10>:    push   %ebp
   0x08048548 <+11>:    mov    %esp,%ebp
   0x0804854a <+13>:    push   %ecx
   0x0804854b <+14>:    sub    $0x14,%esp
   0x0804854e <+17>:    mov    0x804a018,%eax
   0x08048553 <+22>:    mov    %eax,-0xc(%ebp)
   0x08048556 <+25>:    mov    0x804a01c,%eax
   0x0804855b <+30>:    mov    %eax,-0x10(%ebp)
   0x0804855e <+33>:    sub    $0x8,%esp
   0x08048561 <+36>:    pushl  -0x10(%ebp)
   0x08048564 <+39>:    pushl  -0xc(%ebp)
=> 0x08048567 <+42>:    call   0x80483e0 <my_func@plt>
   0x0804856c <+47>:    add    $0x10,%esp
   0x0804856f <+50>:    mov    -0x4(%ebp),%ecx
   0x08048572 <+53>:    leave
   0x08048573 <+54>:    lea    -0x4(%ecx),%esp
   0x08048576 <+57>:    ret
```

使用单步，进入my_func@plt中
```shell
(gdb) si
0x080483e0 in my_func@plt ()
```

查看my_func@plt的内容：
```shell
(gdb) x/3i $pc
=> 0x80483e0 <my_func@plt>:     jmp    *0x804a00c
   0x80483e6 <my_func@plt+6>:   push   $0x0
   0x80483eb <my_func@plt+11>:  jmp    0x80483d0
```

第一步是一个地址跳转，我们查看一下0x804a00c的内容
```shell
(gdb) x/4xw 0x804a00c
0x804a00c <my_func@got.plt>:    0x080483e6      0xf7e2a0f0      0x00000000      0x0000000a
```

我们发现0x804a00c处的内容是0x080483e6，即```jmp    *0x804a00c```的下一行，即跳转到下一行执行。

接着是执行```push   $0x0```，接着又跳转到0x80483d0执行。

我们查看```jmp    0x80483d0```处的内容：

```shell
(gdb) x/2i 0x80483d0
   0x80483d0:   pushl  0x804a004
   0x80483d6:   jmp    *0x804a008
```
我们看到后面会跳转到0x804a008处执行，在这之前我们提到过0x804a000是.got.plt的地址。

.got.plt表项前三个位置, 分别是:
- got[0]: 本ELF动态段(.dynamic段)的装载地址
- got[1]: 本ELF的link_map数据结构描述符地址
- got[2]: _dl_runtime_resolve函数的地址

0x804a004则是调用该函数的参数, 且值为got1, 即本ELF的link_map的地址。

0x804a008正好是第三项got2, 即_dl_runtime_resolve函数的地址。

因此```jmp    *0x804a008```作用是跳转到_dl_runtime_resolve执行加载。

下面我们打印一下，验证一下分析。首先0x804a008处存储的是0xf7fe5090。
```shell
(gdb) x/4xw 0x804a000
0x804a000:      0x08049f04      0xf7ffd9a0      0xf7fe5090      0x080483e6
```

打印0xf7fe5090处的内容，确实是进入了_dl_runtime_resolve中。
```shell
(gdb) x/12i 0xf7fe5090
   0xf7fe5090 <_dl_runtime_resolve>:    endbr32
   0xf7fe5094 <_dl_runtime_resolve+4>:  push   %eax
   0xf7fe5095 <_dl_runtime_resolve+5>:  push   %ecx
   0xf7fe5096 <_dl_runtime_resolve+6>:  push   %edx
   0xf7fe5097 <_dl_runtime_resolve+7>:  mov    0x10(%esp),%edx
   0xf7fe509b <_dl_runtime_resolve+11>: mov    0xc(%esp),%eax
   0xf7fe509f <_dl_runtime_resolve+15>: call   0xf7fdec10 <_dl_fixup>
   0xf7fe50a4 <_dl_runtime_resolve+20>: pop    %edx
   0xf7fe50a5 <_dl_runtime_resolve+21>: mov    (%esp),%ecx
   0xf7fe50a8 <_dl_runtime_resolve+24>: mov    %eax,(%esp)
   0xf7fe50ab <_dl_runtime_resolve+27>: mov    0x4(%esp),%eax
   0xf7fe50af <_dl_runtime_resolve+31>: ret    $0xc
```

_dl_runtime_resolve实际上做了两件事:
- 解析出my_func的地址并将值填入.got.plt中
- 跳转执行真正的my_func函数.

验证前后过程，确实将0x804a00c处的值修改成了my_func的值。

我们可以在```0x80483d6:   jmp    *0x804a008```语句上下一个断点，打印0x804a00c前后的值的变化，可以看到确实发生了变化。可以看到, 在_dl_runtime_resolve之前, 0x804a00c地址的值为0x080483e6,即下一条指令。而运行之后, 该地址的值变为0xf7fb845d, 正是my_func的加载地址!

也就是说, my_func函数的地址是在第一次调用时, 才通过连接器动态解析并加载到.got.plt中的. 而这个过程, 也称之为**延时加载**或者**惰性加载**。

```shell
(gdb) x/xw 0x804a00c
0x804a00c <my_func@got.plt>:    0x080483e6
(gdb) x/xw 0x804a00c
0x804a00c <my_func@got.plt>:    0xf7fb845d
```

最后打印一下0xf7fb845d的值，看看是不是my_func。
```shell
(gdb) x/4i 0xf7fb845d
   0xf7fb845d <my_func>:        push   %ebp
   0xf7fb845e <my_func+1>:      mov    %esp,%ebp
   0xf7fb8460 <my_func+3>:      call   0xf7fb8474 <__x86.get_pc_thunk.ax>
   0xf7fb8465 <my_func+8>:      add    $0x1b9b,%eax
```

整个过程可以参考下图，对于my_func第一次执行和后续执行，行为是不一样的。

![动态链接的过程](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/compile/got_plt/got_plt.png)


这个过程是不是似曾相识，通常我们在写后台的接口时，当查询完数据后，通常会将数据以插入到redis中，以便下一次访问时可以快速访问到。这里也是这样的机制。

## 总结

动态库的加载过程相比于静态库是非常复杂的，其中使用了延迟绑定的技术确定动态库的符号的地址。

## 参考

https://evilpan.com/2018/04/09/about-got-plt/
https://www.cnblogs.com/pannengzhi/p/2018-04-09-about-got-plt.html