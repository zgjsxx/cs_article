---
title: Fork之前创建了互斥锁，Fork之后是否可以保护临界区？
tags:
---

<!-- # Fork之前创建了互斥锁，Fork之后是否可以保护临界区？-->

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