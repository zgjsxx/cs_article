---
category: 
- 编译原理
- Linux
- ELF文件
---


# 链接 - 重定位

重定位的元素(Entries)的定义如下所示，英文中使用entries来表示表中的一行记录。

```c
typedef struct {
    Elf32_Addr   r_offset;
    ELF32_Word   r_info;
} Elf32_Rel;

typedef struct {
    Elf32_Addr   r_offset;
    ELF32_Word   r_info;
    Elf32_Sword  r_addend;
} Elf32_Rela;
```

每个成员的含义如下：

- r_offset：给出了需要进行重定位的元素的位置。
- r_info： 
- r_addend: 给出了一个数字，用于计算重定位后的位置是加上该数字


|名称| 值| 域| 计算方式 |
|--|--|--|--|
|R_386_NONE|0| none| none|

R_386_GOT32: 该重定位类型计算符号的全局偏移表的条目到全局偏移表(GOT)的其实位置的距离。它会提示链接器构建全局偏移表(GOT)。个人理解这里指的就是动态链接的全局变量的重定位。

R_386_PLT32: 该重定位类型计算了符号的过程链接表(PLT)条目的地址，它指示链接器构建过程链接表(PLT)。个人理解这里指的就是动态链接的函数的重定位。

R_386_COPY：

关于relocation的类型，可以在[amd64 ABI](https://gitlab.com/x86-psABIs/x86-64-ABI/-/jobs/artifacts/master/raw/x86-64-ABI/abi.pdf?job=build)中找到所有的定义。


A： 代表用于计算relocation 位置的加数
L： 代表PLT表中条目的位置
P： 代表被重定位的元素的位置(使用r_offset进行计算)

|Name| Value| Field| Calculation|
|--|--|--|--|
|R_X86_64_NONE|0|none|none|
|R_X86_64_64|1|word64|S + A|
|R_X86_64_PC32|2|word32|S + A -P|
|R_X86_64_PLT32|4|word32|L + A - P|
|R_X86_64_32|10|word32|S + A|
|R_X86_64_16|12|word16|S + A|
|R_X86_64_PC16|13|word32|S + A -P|
|R_X86_64_8|14|word8|S + A|
|R_X86_64_PC8|15|word8|S + A -P|
|R_X86_64_PC64|24|word64|S + A -P|
|R_X86_64_GOTPCRELX|41|word32|G + GOT + A -P|
|R_X86_64_REX_GOTPCRELX|42|word32|G + GOT + A -P|
|R_X86_64_CODE_4_GOTPCRELX|43|word32|G + GOT + A -P|
|R_X86_64_CODE_5_GOTPCRELX|46|word32|G + GOT + A -P|
|R_X86_64_CODE_6_GOTPCRELX|49|word32|G + GOT + A -P|

R_X86_64_* 系列代表使用绝对位置进行地址修正。
R_X86_64_PC* 系列用于表示依照相对于PC指针的偏移进行地址修正。
R_X86_64_PLT32 代表使用PLT表中元素的位置进行地址修正。

R_X86_64_GOTPCRELX* 系列相对复杂，这里首先需要了解x86-64的RIP-relative寻址。

x86-64的rip相对数据寻址之前系统不支持数据的相对寻址,不能像指令寻址的方式一样,获取变量i= 1只需要一个偏移量然后赋值就可以了,获取数据地址需要call拿到指令地址，再加上偏移地址来获得变量的地址代码举例
```c
#include<stdio.h>
static int i;
void test()
{
     i=110;
}
```

接着进行编译：

```shell
gcc -fPIC -shared -m32 hello.c  -o  test32.so
```

反汇编可以看出,先call   3e6 <__i686.get_pc_thunk.cx>,再添加偏移量,最后再加上0x1c然后将110给这个地址(变量i)
```s
000003cc <test>:
 3cc:	55                   	push   %ebp
 3cd:	89 e5                	mov    %esp,%ebp
 3cf:	e8 12 00 00 00       	call   3e6 <__i686.get_pc_thunk.cx>//获取pc地址
 3d4:	81 c1 58 11 00 00    	add    $0x1158,%ecx //添加偏移量
 3da:	c7 81 1c 00 00 00 6e 	movl   $0x6e,0x1c(%ecx)//在加0x1c偏移量,最后拿到1这个值
 3e1:	00 00 00 
 3e4:	5d                   	pop    %ebp
 3e5:	c3                   	ret    
```

现在x86-64有rip了就直接可以通过偏移得到数据地址,由代码看出movl   $0x6e,0x20029e(%rip) 就可以将110送入变量i的地址了,少了一次call跟偏移相加gcc -fPIC -shared  hello.c  -o  test64.so
```s
000000000000052c <test>:
 52c:	55                   	push   %rbp
 52d:	48 89 e5             	mov    %rsp,%rbp
 530:	c7 05 9e 02 20 00 6e 	movl   $0x6e,0x20029e(%rip)        # 2007d8 <i>
 537:	00 00 00 
 53a:	c9                   	leaveq 
 53b:	c3                   	retq   
 53c:	90                   	nop
 53d:	90                   	nop
 53e:	90                   	nop
 53f:	90                   	nop
```

其次还需要理解REX
https://staffwww.fullcoll.edu/aclifton/cs241/lecture-instruction-format.html

R_X86_64_GOTPCRELX：汇编指令在重定位的偏移量之前的2个字节处。
R_X86_64_REX_GOTPCRELX：汇编指令在重定位的偏移量之前的3个字节处。
R_X86_64_CODE_4_GOTPCRELX：汇编指令在重定位的偏移量之前的4个字节处。
R_X86_64_CODE_5_GOTPCRELX：汇编指令在重定位的偏移量之前的5个字节处。
R_X86_64_CODE_6_GOTPCRELX：汇编指令在重定位的偏移量之前的6个字节处。


```shell
[root@localhost test1]# cat test.cpp
#include<stdio.h>
extern int i;
void test()
{
     i = 2;
}

[root@localhost test1]# g++ -c -fPIC test.cpp
[root@localhost test1]# objdump -d test.o

test.o:     file format elf64-x86-64


Disassembly of section .text:

0000000000000000 <_Z4testv>:
   0:   55                      push   %rbp
   1:   48 89 e5                mov    %rsp,%rbp
   4:   48 8b 05 00 00 00 00    mov    0x0(%rip),%rax        # b <_Z4testv+0xb>
   b:   c7 00 02 00 00 00       movl   $0x2,(%rax)
  11:   90                      nop
  12:   5d                      pop    %rbp
  13:   c3                      retq
[root@localhost test1]# objdump -r test.o

test.o:     file format elf64-x86-64

RELOCATION RECORDS FOR [.text]:
OFFSET           TYPE              VALUE
0000000000000007 R_X86_64_REX_GOTPCRELX  i-0x0000000000000004


RELOCATION RECORDS FOR [.eh_frame]:
OFFSET           TYPE              VALUE
0000000000000020 R_X86_64_PC32     .text

```

例如这里的offset是7， 指令开始的位置是4，指令在offset前面的3个字节。因此重定位类型是```R_X86_64_REX_GOTPCRELX```。


https://staffwww.fullcoll.edu/aclifton/courses/cs241/syllabus-21842-mw-sp23.html

# 参考文献
- RIP相对寻址 https://www.zhihu.com/question/270485830


https://staffwww.fullcoll.edu/aclifton/courses 课程