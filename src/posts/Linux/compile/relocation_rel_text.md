---
category: 
- 编译原理
- Linux
- ELF文件
---

# ELF文件函数重定位

## 文件准备

代码结构如下所示：
```
.
├── main.c
├── foo.c
├── makefile
```

main.c的内容如下：

```c
extern void foo(void);

int main(void)
{
    foo();
    return 0;
}
```

foo.c

```c
#include <stdio.h>

void foo()
{
    printf("foo\n");
}

```

makefile内容如下：

```makefile
all: main

main: main.o foo.o
        $(CC) -m32 -o $@ $^

main.o: main.c
        $(CC) -m32 -c -o $@ $<

foo.o: foo.c
        $(CC) -m32 -c -o $@ $<

clean:
        rm -f main main.o x.o

```

使用make进行编译。

这个时候我们使用```objdump -d main.o```查看obj1.o中的内容：

```shell
00000000 <main>:
   0:   55                      push   %ebp
   1:   89 e5                   mov    %esp,%ebp
   3:   83 e4 f0                and    $0xfffffff0,%esp
   6:   e8 fc ff ff ff          call   7 <main+0x7>
   b:   b8 00 00 00 00          mov    $0x0,%eax
  10:   c9                      leave
  11:   c3                      ret
```

注意下面这一行，这行其实就是去调用foo的地址，然而这个时候foo地址还不知道。e8就是call指令，foo是外部函数，无法得知foo的地址，所以使用了0xfffffffc这个假地址做代替，等连接时确定foo函数的地址后，再替换这个假地址。

```shell
   6:   e8 fc ff ff ff          call   7 <main+0x7>
```

这个时候我们使用```readelf -r main.o```去查看相关信息， 我门可以知道， foo函数所在位置00000007需要进行重定位。

```shell
Relocation section '.rel.text' at offset 0x160 contains 1 entry:
 Offset     Info    Type            Sym.Value  Sym. Name
00000007  00000902 R_386_PC32        00000000   foo
```

.rel.text对应的数据结构如下所示：

```c
typedef struct elf32_rel {
  Elf32_Addr	r_offset;
  Elf32_Word	r_info;
} Elf32_Rel;
```
r_offset，重定位入口的偏移，对于.o来说，是需要修正的位置的第一个字节相对于段起始的偏移；对于.so和可执行程序来说，是需要修正的位置的第一个字节的虚拟地址。

r_info，重定位入口的类型和符号，前三个字节是该入口的符号在符号表中的下标；后一个字节，表示重定位的类型，比如R_386_32、R_386_PC32。


这个时候我们使用```objdump -d main```查看main的内容：

```shell
080484ad <main>:
 80484ad:       55                      push   %ebp
 80484ae:       89 e5                   mov    %esp,%ebp
 80484b0:       83 e4 f0                and    $0xfffffff0,%esp
 80484b3:       e8 07 00 00 00          call   80484bf <foo>
 80484b8:       b8 00 00 00 00          mov    $0x0,%eax
 80484bd:       c9                      leave
 80484be:       c3                      ret

080484bf <foo>:
 80484bf:       55                      push   %ebp
 80484c0:       89 e5                   mov    %esp,%ebp
 80484c2:       83 ec 08                sub    $0x8,%esp
 80484c5:       83 ec 0c                sub    $0xc,%esp
 80484c8:       68 6c 85 04 08          push   $0x804856c
 80484cd:       e8 7e fe ff ff          call   8048350 <puts@plt>
 80484d2:       83 c4 10                add    $0x10,%esp
 80484d5:       90                      nop
 80484d6:       c9                      leave
 80484d7:       c3                      ret
 80484d8:       66 90                   xchg   %ax,%ax
 80484da:       66 90                   xchg   %ax,%ax
 80484dc:       66 90                   xchg   %ax,%ax
 80484de:       66 90                   xchg   %ax,%ax

```

可以看出，原本在main.o中无法定位的地址，现在已经有了明确的地址了：

```shell
 80484b3:       e8 07 00 00 00          call   80484bf <foo>
```

按照R_386_PC32的计算公式，其表示相对寻址修正S+A-P。

S = foo的地址，这里是080484bf

A = 保存在被修正位置的值。被修正位置为0x00000007，这个位置的值是0xfffffffc，所以A为0xfffffffc，即A为-4。

P = 被修正的位置，（相对于段开始的位置或者虚拟地址），可以通过r_offset计算得到。这里是080484ad + 7 = 80484b4

080484bf - 4 - 80484b4 = 07

这个计算结果和 我们上面通过objdump的结果是一致的。

```shell
80484b3:       e8 07 00 00 00          call   80484bf <foo>
```