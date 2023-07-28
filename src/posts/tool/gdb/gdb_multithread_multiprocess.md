---
category: 
- C++
- gdb
tag:
- C++
---

# gdb的多进程多线程调试技巧

前面我们了解过了gdb使用过程中的一些基础指令，在实际的开发过程中，程序通常都是多进程，多线程的。本节就将针对多线程和多进程场景下，如何使用gdb进行调试进行总结。

## 多线程

## 多线程调试常用命令

|命令|效果|
|--|--|
|```info threads```|显示当前可调试的所有线程，每个线程会有一个id，带有*标记的是当前调试的线程。|
|```thread <ID>```|切换当前调试线程为指定的线程|
|```set scheduler-locking off```|不锁定任何线程，也就是所有线程都执行，这是默认值|
|```set scheduler-locking on```| 只有当前被调试程序会执行|
|```set scheduler-locking on step```|在单步的时候，除了next过一个函数的情况(熟悉情况的人可能知道，这其实是一个设置断点然后continue的行为)以外，只有当前线程会执行|
|```thread apply all command```| 让所有被调试线程执行GDB命令command|
|```thread apply ID1 ID2 command```	|让一个或者多个线程执行GDB命令command|
|```break thread_test.c:123``` thread all|在所有线程中相应的行上设置断点|
|```set print thread-events```| 控制是否打印线程启动、退出消息|

在GNU/Linux操作系统上，当GDB检测到有一个新的线程时，你可能会看到下面这样的语句：

[New Thread 0x41e02940 (LWP 25582)]


```c

#include <stdio.h>
#include <pthread.h>

void* thread1(void* arg)
{
    printf("i am thread1, my tid is : %lu \n", pthread_self());
    return NULL;
}

void* thread2(void* arg)
{
    printf("i am thread2, my tid is : %lu \n", pthread_self());
    return NULL;
}

int main()
{
    pthread_t tid1, tid2;

    //创建两个线程
    pthread_create(&tid1, NULL, thread1, NULL);
    pthread_create(&tid2, NULL, thread2, NULL);

    //等待进程
    pthread_join(tid1, NULL);
    pthread_join(tid2, NULL);

    return 0;
}


```