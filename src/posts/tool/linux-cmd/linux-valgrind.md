---
category: 
- Linux
- tool
- valgrind
---

# Valgrind

## 1.什么是Valgrind? 如何运行Valgrind

Valgrind是一个用于检测内存问题的工具，尤其擅长处理**内存泄漏**问题和非法内存访问的问题。**内存泄漏**是指通过申请内存的方法(例如malloc)申请了内存确没有使用释放内存的方法(例如free)释放内存而导致的问题。非法的内存访问可能会引起程序的段错误(Segmentaion fault)。 Valgrind工具可以有效的帮助你分析出问题的产生的原因。

注意：
- 为了使得Valgrind可以给出具体详细的信息，你需要在编译c程序时添加-g的选项。

Valgrind使用非常简单，你只需要在原本需要执行的可执行程序的前面加上Valgrind就可以。

```shell
./a.out
valgrind ./a.out
```

假设你的代码没有任何内存的问题或者内存泄漏， Valgrind将打印出类似于下面的内容。如果你的代码存在一些问题，将会在下面的输出中增加一些问题的输出。

```shell
==30173== Memcheck, a memory error detector
==30173== Copyright (C) 2002-2017, and GNU GPL’d, by Julian Seward et al.
==30173== Using Valgrind-3.14.0 and LibVEX; rerun with -h for copyright info
==30173== Command: ./a.out
==30173==
==30173==
==30173== HEAP SUMMARY:
==30173== in use at exit: 0 bytes in 0 blocks
==30173== total heap usage: 1 allocs, 1 frees, 4 bytes allocated
==30173==
==30173== All heap blocks were freed -- no leaks are possible
==30173==
==30173== For counts of detected and suppressed errors, rerun with: -v
==30173== ERROR SUMMARY: 0 errors from 0 contexts (suppressed: 0 from 0)
```

上面的输出的内容中，最重要的便是**HEAP SUMMARY**和**ERROR SUMMARY**。

如果你的程序没有任何问题，在**HEAP SUMMARY**你就会看见 in use at exit: 0 bytes in 0 blocks。在**ERROR SUMMARY**， 你就会看见0 errors from 0 contexts (suppressed: 0 from 0)。

## 2.何时应该需要使用Valgrind

需要在下面的场景下使用Valgrind:
- 你的程序在运行时发生了未定义的行为，例如运行程序多次，得到的结果每次都不相同，且不是符合预期的。
- 你的程序产生了段错误。
- 运行 C 可执行文件后，您会看到诡异的内存输出。
- 你的程序不允许有memory leak或者非法访问。

在工作中，应该尽可能的使用Valgrind对代码进行检查，因为人人都有可能犯一些低级错误。

## 3.调用堆栈

Valgrind给出的一个重要信息就是调用堆栈(Backtrace)。调用堆栈会按照调用顺序打印出出错时一系列函数的名称。下面通过一个简单的例子来理解其工作原理。

```shell
==2797== at 0x400555: f1 (example_file.c:7)
==2797== by 0x400572: f2 (example_file.c:12)
==9892== by 0x40053E: main (main_file.c:4)
```

这个调用堆栈告诉我们：
- 错误发生在example_file.c的第7行，这个错误发生在f1方法中。
- f1方法在example_file.c的第12行被调用，这个调用发生在f2方法中。
- f2方法在main_file.c的第4行被调用，这个调用发生在main方法中。

注意调用堆栈的底部一定是main方法，因此c程序的入口都是main。

接下来将通过实际的例子来详解的解析Valgrind程序所检测到错误的含义。


## 4.使用Valgrind修复内存泄漏

```c
#include <stdlib.h>

int *f1() {
    int *ip = malloc(sizeof(int));
    *ip = 3;
    return ip;
}

int f2() {
    int *internal = f1();
    return *internal;
}

int main() {
    int i = f2();
    return i;
}
```

编译上面的程序使用Valgrind运行，你会获得下面的输出。

```shell
==14132== HEAP SUMMARY:
==14132== in use at exit: 4 bytes in 1 blocks
==14132== total heap usage: 1 allocs, 0 frees, 4 bytes allocated
==14132==
==14132== LEAK SUMMARY:
==14132== definitely lost: 4 bytes in 1 blocks
==14132== indirectly lost: 0 bytes in 0 blocks
==14132== possibly lost: 0 bytes in 0 blocks
==14132== still reachable: 0 bytes in 0 blocks
==14132== suppressed: 0 bytes in 0 blocks
==14132== Rerun with --leak-check=full to see details of leaked memory
```

从上面的输出中，可以非常明显的看出我们产生了一个内存泄漏。我们产生了4个byte的内存泄漏，因为我们使用malloc申请了一个int大小的内存，但是之后指向该内存的指针丢失了，产生了泄漏。 按照输出中最后一行的建议```. valgrind --leak-check=full ./a.out```， 你可以获取更加详细的堆栈。

```shell
==3601== 4 bytes in 1 blocks are definitely lost in loss record 1 of 1
==3601== at 0x4C29E63: malloc (vg_replace_malloc.c:309)
==3601== by 0x40053E: f1 (example_file.c:4)
==3601== by 0x400572: f2 (example_file.c:12)
==3601== by 0x400590: main (example_file.c:18)
```
从这个堆栈信息，我们知道：
- 我们申请了4个byte大小的memory，用于存储一个int类型的变量。
- malloc方法申请了4个byte的内存， 在我们代码中的第一行进行的调用。
- f1是被f2进行的调用。

回顾我们的代码，在f1中申请了4个byte的内存，并将指向该内存的指针进行返回。再看看f2函数，f2方法忘记将该内存进行free。这便是一个内存泄漏问题。


## 5.使用Valgrind修复非法内存方法

```c
#include <stdlib.h>

int *f1() {
    int *ip = malloc(sizeof(int));
    *ip = 3;
    return ip;
}

int f2() {
    int *internal = f1();
    int left = internal[0];
    int right = internal[2];
    free(internal);
    return left + right / 2;
}

int main() {
    int i = f2();
    return i;
}
```

编译运行上面的代码，使用Valgrind运行，将会得到下面的输出。

```shell
==12751== Invalid read of size 4
==12751== at 0x4005C6: f2 (example_file.c:14)
==12751== by 0x4005FE: main (example_file.c:21)
==12751== Address 0x5205048 is 4 bytes after a block of size 4 alloc'd
==12751== at 0x4C29F73: malloc (vg_replace_malloc.c:309)
==12751== by 0x40058E: f1 (example_file.c:4)
==12751== by 0x4005B4: f2 (example_file.c:11)
==12751== by 0x4005FE: main (example_file.c:21)
```

我们把错误信息划分为两部分，第一部分是前三行，第二部分是后面几行。

首先看前三行。错误的信息是"Invalid read of size 4"， 即我们正在读一个4个byte大小的内存。此外，它告诉了我们出错的位置在example_file.c的第14行。

错误信息的后半部分提供了一些额外的有效信息。它告诉我们要读取的位置在我们申请的内存块的末尾处后面的4个字节。这意味着我们正在读取的位置超过了我们申请的内存的大小。

回顾我们的代码，我们看的这些错误信息正确的指出了问题，我们非法的访问了```internal[2]```。我们只申请了一个int的大小的内存，并没有申请一个int数组。 因此```internal[2]```的方法是非法的。

## 6.非法free

```c
#include <stdlib.h>

int *f1() {
    int *ip = malloc(sizeof(int));

    *ip = 3;
    return ip;
}

int f2() {
    int *internal = f1();
    void *other = (void*)internal;

    int result = *internal;
    int *result2 = &result;

    free(internal);
    free(other);
    free(result2);

    return result;
}

int main() {
    int i = f2();
    return i;
}
```

编译运行上面的代码，使用Valgrind运行，将会得到下面的输出。

```shell
==31964== Invalid free() / delete / delete[] / realloc()
==31964== at 0x4C2B06D: free (vg_replace_malloc.c:540)
==31964== by 0x4005E9: f2 (example_file.c:18)
==31964== by 0x40060C: main (example_file.c:25)
==31964== Address 0x5205040 is 0 bytes inside a block of size 4 free’d
==31964== at 0x4C2B06D: free (vg_replace_malloc.c:540)
==31964== by 0x4005DD: f2 (example_file.c:17)
==31964== by 0x40060C: main (example_file.c:25)
==31964== Block was alloc’d at
==31964== at 0x4C29F73: malloc (vg_replace_malloc.c:309)
==31964== by 0x40058E: f1 (example_file.c:4)
==31964== by 0x4005B4: f2 (example_file.c:11)
==31964== by 0x40060C: main (example_file.c:25)
==31964==
==31964== Invalid free() / delete / delete[] / realloc()
==31964== at 0x4C2B06D: free (vg_replace_malloc.c:540)
==31964== by 0x4005F5: f2 (example_file.c:19)
==31964== by 0x40060C: main (example_file.c:25)
==31964== Address 0x1ffefff474 is on thread 1’s stack
==31964== in frame #1, created by f2 (example_file.c:10)
```

上面的输出内容比较多，我们一部分一部分的来看。

第一个error告诉我们第18行的调用是非法的。其详细的信息是"0 bytes inside a block of size 4 free’d"。说的直白一点，这句话的含义是我们尝试free同一个指针两次。

什么时候进行的第一次free，在下面的输出中也可以轻易的找到。可以看到第一次free的位置在程序的第17行。

```shell
==31964== at 0x4C2B06D: free (vg_replace_malloc.c:540)
==31964== by 0x4005DD: f2 (example_file.c:17)
==31964== by 0x40060C: main (example_file.c:25)
```

## 7.未进行初始化
```c
#include <stdlib.h>
2 3
int *f1() {
4 int *ip = malloc(sizeof(int));
5 6
return ip;
67 }
8 9
int f2() {
10 int *internal = f1();
11 int other = 3;
12
13 if(*internal < 5) {
14 other = *internal;
15 }
16
17 free(internal);
18
19 return other;
20 }
21
22 int main() {
23 int i = f2();
24 return i;
25 }
```

```shell
==27751== Conditional jump or move depends on uninitialised value(s)
==27751== at 0x4005BF: f2 (example_file.c:13)
==27751== by 0x4005EC: main (example_file.c:23)
==27751==
==27751== Syscall param exit_group(status) contains uninitialised byte(s)
==27751== at 0x4EFCC09: _Exit (in /usr/lib64/libc-2.17.so)
==27751== by 0x4E70CAA: __run_exit_handlers (in /usr/lib64/libc-2.17.so)
==27751== by 0x4E70D36: exit (in /usr/lib64/libc-2.17.so)
==27751== by 0x4E5955B: (below main) (in /usr/lib64/libc-2.17.so)
```


## 8.错误的权限
```c
1 #include <stdlib.h>
2 #include <stdio.h>
3 #include <string.h>
4 5
char *f1() {
6 char *sp = "Hello";
7 return sp;
8 }
9
10 int main() {
11 char *s1 = f1();
12 printf("Received String: %s\n", s1);
13 s1[0] = ’C’;
14 printf("Changed String: %s\n", s1);
15 return 0;
16 }
```

## 9.处理很长的Valgrind输出

```shell
==4892== Memcheck, a memory error detector
==4892== Copyright (C) 2002-2017, and GNU GPL’d, by Julian Seward et al.
==4892== Using Valgrind-3.15.0 and LibVEX; rerun with -h for copyright info
==4892== Command: ./a.out
==4892==
Inner function called with value 10
==4892== Invalid write of size 4
==4892== at 0x4005E7: inner_fn (example_file.c:14)
==4892== by 0x40065E: main (example_file.c:24)
==4892== Address 0x5205044 is 0 bytes after a block of size 4 alloc’d
==4892== at 0x4C29F73: malloc (vg_replace_malloc.c:309)
==4892== by 0x40058E: f1 (example_file.c:5)
==4892== by 0x400644: main (example_file.c:22)
==4892==
==4892== Invalid read of size 4
==4892== at 0x400605: inner_fn (example_file.c:16)
==4892== by 0x40065E: main (example_file.c:24)
9==4892== Address 0x5205044 is 0 bytes after a block of size 4 alloc’d
==4892== at 0x4C29F73: malloc (vg_replace_malloc.c:309)
==4892== by 0x40058E: f1 (example_file.c:5)
==4892== by 0x400644: main (example_file.c:22)
==4892==
==4892== Conditional jump or move depends on uninitialised value(s)
==4892== at 0x4E81C5E: vfprintf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E8A4A8: printf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4005BC: inner_fn (example_file.c:10)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
==4892==
==4892== Use of uninitialised value of size 8
==4892== at 0x4E7F32B: _itoa_word (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E835B0: vfprintf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E8A4A8: printf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4005BC: inner_fn (example_file.c:10)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
==4892==
==4892== Conditional jump or move depends on uninitialised value(s)
==4892== at 0x4E7F335: _itoa_word (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E835B0: vfprintf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E8A4A8: printf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4005BC: inner_fn (example_file.c:10)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
==4892==
==4892== Conditional jump or move depends on uninitialised value(s)
==4892== at 0x4E835FF: vfprintf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E8A4A8: printf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4005BC: inner_fn (example_file.c:10)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
==4892==
==4892== Conditional jump or move depends on uninitialised value(s)
==4892== at 0x4E81D2B: vfprintf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E8A4A8: printf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4005BC: inner_fn (example_file.c:10)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
==4892==
==4892== Conditional jump or move depends on uninitialised value(s)
==4892== at 0x4E81DAE: vfprintf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E8A4A8: printf (in /usr/lib64/libc-2.17.so)
==4892== by 0x4005BC: inner_fn (example_file.c:10)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
10==4892==
Inner function called with value -4
==4892== Conditional jump or move depends on uninitialised value(s)
==4892== at 0x4005C6: inner_fn (example_file.c:11)
==4892== by 0x400629: inner_fn (example_file.c:18)
==4892== by 0x40065E: main (example_file.c:24)
==4892==
==4892== Syscall param exit_group(status) contains uninitialised byte(s)
==4892== at 0x4EFCC09: _Exit (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E70CAA: __run_exit_handlers (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E70D36: exit (in /usr/lib64/libc-2.17.so)
==4892== by 0x4E5955B: (below main) (in /usr/lib64/libc-2.17.so)
==4892==
==4892==
==4892== HEAP SUMMARY:
==4892== in use at exit: 8 bytes in 2 blocks
==4892== total heap usage: 2 allocs, 0 frees, 8 bytes allocated
==4892==
==4892== LEAK SUMMARY:
==4892== definitely lost: 8 bytes in 2 blocks
==4892== indirectly lost: 0 bytes in 0 blocks
==4892== possibly lost: 0 bytes in 0 blocks
==4892== still reachable: 0 bytes in 0 blocks
==4892== suppressed: 0 bytes in 0 blocks
==4892== Rerun with --leak-check=full to see details of leaked memory
==4892==
==4892== Use --track-origins=yes to see where uninitialised values come from
==4892== For lists of detected and suppressed errors, rerun with: -s
==4892== ERROR SUMMARY: 10 errors from 10 contexts (suppressed: 0 from 0)
```
https://www.cs.cmu.edu/~15122/handouts/gts/valgrind.pdf
https://www.cs.cmu.edu/~15122/handouts.shtml