---
title: Fork之前创建的互斥锁，Fork之后是否可以保护临界区？
categories: 
- Linux
tags:
- interview
---

<!-- # Fork之前创建了互斥锁，Fork之后是否可以保护临界区？-->


这个问题按照我的理解意思是，在fork之前创建一把互斥锁，在fork之后，如果子进程使用该锁lock住一段临界区，那么父进程是否需要等待子进程unlock该锁才可以进入临界区?

反之也一样，如果父进程使用该锁lock住一段临界区，那么子进程是否需要等待父进程unlock该锁才可以进入临界区?

经过一番思索，我认为该问题需要分为两个情况进行讨论， 即该互斥锁是**线程锁**还是**进程锁**两种场景进行讨论。


# fork之前创建线程锁
```cpp
#include<unistd.h>
#include<sys/mman.h>
#include<pthread.h>
#include<sys/types.h>
#include<sys/wait.h>
#include<fcntl.h>
#include<string.h>
#include<stdlib.h>
#include<stdio.h>
#include <string> 

void print(std::string name)
{
    for(int i = 0; i < 10; i++)
    {
        printf("%s start to work, index = %d\n", name.c_str(), i);
        sleep(1);
    }
}
int main(void)
{
    
    int i;
    pid_t pid;
    pthread_mutex_t mutex;
    pthread_mutex_init(&mutex, NULL);
    int num;
    
    pid = fork();
    if( pid == 0 )
    {
        pthread_mutex_lock(&mutex);
        print("child");
        pthread_mutex_unlock(&mutex);
    }
    else 
    {
        pthread_mutex_lock(&mutex);
        print("parent");
        pthread_mutex_unlock(&mutex);
        wait(NULL);
 
    }
    pthread_mutex_destroy(&mutex);
 
    return 0;
}
```

执行结果：
```shell
[root@localhost mutex]# ./a.out2
parent start to work, index = 0
child start to work, index = 0
parent start to work, index = 1
child start to work, index = 1
parent start to work, index = 2
child start to work, index = 2
parent start to work, index = 3
child start to work, index = 3
parent start to work, index = 4
child start to work, index = 4
parent start to work, index = 5
child start to work, index = 5
parent start to work, index = 6
child start to work, index = 6
parent start to work, index = 7
child start to work, index = 7
parent start to work, index = 8
child start to work, index = 8
parent start to work, index = 9
child start to work, index = 9

```


# fork之前创建进程锁
```cpp
#include <unistd.h>
#include <sys/mman.h>
#include <pthread.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <string>

void print(std::string name)
{
    for(int i = 0; i < 10; i++)
    {
        printf("%s start to work, index = %d\n", name.c_str(), i);
        sleep(1);
    }
}
 
int main(void)
{
    int i;
    pid_t pid;
    // 使用mmap 创建一把共享锁
    pthread_mutex_t* mutex = (pthread_mutex_t*)mmap(NULL,sizeof(pthread_mutex_t),PROT_READ|PROT_WRITE,MAP_SHARED|MAP_ANON,-1,0);
    memset(mutex, 0 ,sizeof(pthread_mutex_t));
    pthread_mutexattr_t mutexattr;
    pthread_mutexattr_init(&mutexattr);
    // 修改属性为进程间共享
    pthread_mutexattr_setpshared(&mutexattr, PTHREAD_PROCESS_SHARED);
    // 初始化一把 mutex 锁, 该所拥有进程间共享的特性
    pthread_mutex_init(mutex,&mutexattr);
    
    pid = fork();
    if( pid == 0 )
    {
        pthread_mutex_lock(mutex);
        print("child");
        pthread_mutex_unlock(mutex);
    }
    else 
    {
        pthread_mutex_lock(mutex);
        print("parent");
        pthread_mutex_unlock(mutex);
        wait(NULL);
 
    }
    pthread_mutexattr_destroy(&mutexattr);
    pthread_mutex_destroy(mutex);
 
    return 0;
}
```

执行结果：
```shell
[root@localhost mutex]# ./a.out
parent start to work, index = 0
parent start to work, index = 1
parent start to work, index = 2
parent start to work, index = 3
parent start to work, index = 4
parent start to work, index = 5
parent start to work, index = 6
parent start to work, index = 7
parent start to work, index = 8
parent start to work, index = 9
child start to work, index = 0
child start to work, index = 1
child start to work, index = 2
child start to work, index = 3
child start to work, index = 4
child start to work, index = 5
child start to work, index = 6
child start to work, index = 7
child start to work, index = 8
child start to work, index = 9
```

# 结论
如果在fork之前创建的互斥锁具有PTHREAD_PROCESS_SHARED属性， 也就是说如果该互斥锁是一把**进程锁**，那么其对父子进程具有保护临界区的作用。 如果在fork之前创建的互斥锁没有该属性， 也就是说如果该锁是一把**线程锁**， 那么其没有对父子进程没有保护临界区的作用。