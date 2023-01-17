---
title: Fork之前创建的互斥锁，Fork之后是否可以保护临界区？
category: 
- Linux
tags:
- interview
---


```cpp
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
#include <sys/wait.h>
#include <string>
using std::string;
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;

void* func(void* arg)
{
    pthread_mutex_lock(&mutex);
    for(int i = 0;i < 100; ++i)
    {
        if(arg != NULL)
        {
            char* str = (char*)arg;
            printf("%s sleep 1s\n", str);
            sleep(1);
        }
        else
        {
            printf("parent sleep 1s\n");
            sleep(1);
        }
    }
    pthread_mutex_unlock(&mutex);
}

void prepare(void)
{
    pthread_mutex_lock(&mutex);
}

void parent(void)
{
    pthread_mutex_unlock(&mutex);
}

void child(void)
{
    pthread_mutex_unlock(&mutex);
}

int main(void) {
    //pthread_atfork(NULL, NULL, child);

    pthread_t tid;
    pthread_create(&tid, NULL, func, NULL);

    sleep(5);
    if (fork() == 0) {
        string str = "child";
        func((void*)str.c_str());
        printf("no deadlock\n");
        return 0;
    }
    else
    {
        pthread_join(tid, 0);
        wait(NULL);
    }

    return 0;
}

```


set detach-on-fork off
(gdb) inferior 2
https://wizardforcel.gitbooks.io/100-gdb-tips/content/set-detach-on-fork.html
https://zhuanlan.zhihu.com/p/343845048
https://github.com/lattera/glibc/blob/master/nptl/pthread_mutex_unlock.c