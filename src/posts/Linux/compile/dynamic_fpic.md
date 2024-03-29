---
category: 
- 编译原理
- Linux
- ELF文件
---


# 地址无关代码fPIC

- 1.模块内部的函数调用、跳转
- 2.模块内部的数据访问，例如本模块中定义的全局变量
- 3.模块外部的函数调用、跳转
- 4.模块外部的数据访问，例如访问其他模块中定义的全局变量

```c
static int a;
extern int b;
extern void ext();

void bar()
{
    a = 1;//类型2
    b = 2;//类型4
}

void foo()
{
    bar()；//类型1
    ext(); //类型3
}
```


## 类型1 模块内部调用或跳转

第一种场景是最为简单的。因为被调用的函数和调用者在同一个模块。因为它们之间的相对位置是固定的，所以这种情况比较简单。

对于现在的系统来讲，模块内部的跳转、函数调用都可以是相对地址调用，或者是基于寄存器的相对调用， 所以对于这种指令是不需要重定位的。


```c
8048344 <bar>:
8048344:  55       push %ebp
8048345:  89 e5    mov %esp, %ebp
8048347:  5d       pop %ebp
8048348:  c3       ret
8048349: <foo>:
...
8048357: e8 e8 ff ff ff   call 8048344 <bar>
804835c: b8 00 00 00 00   mov $0x0, %eax
```

foo中对bar的调用实际上是一条相对地址的调用指令， ```e8 e8 ff ff ff```。

这条指令中的后4个字节是目的地址相对于当前指令的吓一跳指令的偏移。

当前指令的下一条指令是```b8 00 00 00 00```，其地址是0x804835c, ```e8 ff ff ff```是-24的补码形式， 因此bar的位置在```0x804835c-24 = 0x8048344```。那么只要bar和foo的相对位置不变。这条指令是地址无关的。


## 类型二 模块内部的数据访问

指令中不能包含数据的绝对位置， 唯一的方法就是使用相对寻址。任何一条指令与它需要访问的模块内部的数据之间的相对位置是固定的。

```c
44c <bar>:
44c: 55                     push  %ebp
44d: 89 e5                  mov  %esp, %ebp
44f: e8 40 00 00 00            call 494 <__i686.get_pc_thunk.cx>
454: 81 c1 8c 11 00 00      add $0x118c, %ecx
45a: c7 81 28 00 00 00 01   movl $0x1, 0x28(%ecx)      // a = 1
461: 00 00 00
464: 8b 81 f8 ff ff ff      mov 0xfffffff8(%ecx), %eax
46a: c7 00 02 00 00 00      movl  $0x2, (%eax)         // b = 2
470: 5d                     pop  %ebp
471: c3                     ret

000000494 <__i686.get_pc_thunk.cx>:
494: 8b 0c 24               mov  (%esp), %ecx
497: c3                     ret
```


## .interp段

```shell
objdump -s a.out |grep -C 5 .interp
```

这个就是可执行文件所需要的动态链接器的路径。

```shell
readelf -l a.out |grep  interpretrer
```


R_X86_64_PC32：重定位用 32 位 PC 相对地址的引用
R_X86_64_PLT32：过程连接表延迟绑定

R_X86_64_PC32：重定位公式为S+A-P。

S:符号链接后的最终的虚拟地址。
A:加数，也称修正值。
P:需要被重定位处在链接后最终的虚拟地址。
R_X86_64_PLT32：重定位公式为L+A-P。

L:符号的实际虚拟地址或在PLT表中的地址。当函数符号定义在目标文件中时，L则为符号的实际虚拟地址；
当函数符号定义动态库中时，L则为PLT表中的地址。很明显，swap属于前者。在后续章节中，我们再深入讨论第二种情况。

VALUE列：表示符号与修正值。比如shared-0x0000000000000004,表示对应符号表中shared符号，修正值为-0x0000000000000004。


rand.cpp
```cpp
extern int rand2();
int rand(){
    rand2();
    return 4;
}
```
rand2.cpp
```cpp
int rand2(){
    return 4;
}
```

g++ -c -fPIC rand.cpp


## objdump 和 readelf 的常用命令

**readelf**

1.查看elf文件中的section表(节表，一些文章也称为段表)。

```shell
readelf -S <ELF>
readelf --sections <ELF>
readelf --section-headers <ELF>
```

2.查看elf文件的符号

```shell
readelf -s <ELF>
readelf --symbols <ELF>
readelf --syms  <ELF>
```

3.查看elf文件的依赖(查看.dynamic段的内容)

```shell
readelf -d <ELF>
readelf --dynamic <ELF>
```

4.查看ELF文件中relocation section的内容
```shell
readelf -r  <ELF>
readelf --relocs <ELF>
```

5.查看ELF文件文件头

```shell
readelf -h <ELF>
readelf --file-header <ELF>
```

6.查看ELF文件的segment表

```shell
readelf -l <ELF> 
readelf --program-headers <ELF> 
readelf --segments <ELF> 
```


**objdump**


1.查看ELF文件的汇编代码。 本选项只对那些包含指令的section进行反汇编。

```shell
objdump -d <ELF>
objdump --disassemble <ELF>
```

2.objdump显示全部的Header信息

```shell
objdump -x <ELF>
```

3.显示obj文件各个sections的头部摘要信息。

```shell
objdump -h <ELF>
objdump --section-headers <ELF>
objdump --headers <ELF>
```

4.显示文件的重定位入口。

```shell
objdump -r <ELF>
objdump --reloc <ELF>
```

5.显示文件的符号表
```shell
objdump -t <ELF>
objdump --syms <ELF>
```

# 参考文章

https://blog.werner.wiki/elf-plt-got-static-analysis/

https://segmentfault.com/a/1190000022859599

https://www.cnblogs.com/shuqin/p/12012906.html#pic(好文)

https://stackoverflow.com/questions/64424692/how-does-the-address-of-r-x86-64-plt32-computed(好问题)

https://hansimov.gitbook.io/csapp/part2/ch07-linking/7.7-relocation