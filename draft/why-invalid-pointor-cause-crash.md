---
title: 为什么野指针会导致进程crash?
category: 
- Linux
---

# 为什么野指针会导致进程crash

SIGSEGV： SIG 是信号名的通用前缀， SEGV 是segmentation violation，也就是存储器区段错误。

**free较大的内存块后,再试图访问该内存**
```cpp
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main () {
    char* a = NULL;
    a = (char*)malloc(130*1024);
    a[0] = 'a';
    printf ("%c\n", a[0]);
    free(a);
    printf ("%c\n", a[0]);
}
```

[点击运行](https://godbolt.org/z/14exh5xr7)

产生了SEGSEGV信号

**free较小的内存块后,再试图访问该内存**
```cpp
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main () {
    char* a = NULL;
    a = (char*)malloc(130*1024);
    a[0] = 'a';
    printf ("%c\n", a[0]);
    free(a);
    printf ("%c\n", a[0]);
}
```
没有产生SEGSEGV信号，free()后的内存不一定就立即归还给了操作系统

# 参考文章
http://gauss.ececs.uc.edu/Courses/e4022/code/memory/understanding.pdf
page=457,page=458

https://blog.csdn.net/a2025131311/article/details/113099752

MMU产生缺页中断
https://cloud.tencent.com/developer/article/1807351