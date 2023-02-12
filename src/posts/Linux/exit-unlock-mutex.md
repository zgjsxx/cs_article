---
category: 
- Linux
tags:
- interview
---

# 如果持有互斥锁的线程没有解锁退出了，该如何处理？

## 问题引入 

看下面一段代码，两个线程将竞争互斥锁mutex而进入临界区， 线程2在竞争互斥锁之前会sleep 2秒， 因此大概率线程一将获得互斥锁。 然而线程1执行完临界区的代码之后， 没有执行解锁操作，就退出了。

这样会导致线程2将死锁，因为该锁的状态将永远是锁定状态， 它将永远都不能获得锁。

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
#include <iostream>
using namespace std;
pthread_mutex_t mutex;

void* func1(void* param)
{
    pthread_mutex_lock(&mutex);
    cout << "func1 get lock" << endl;
    pthread_exit(NULL);
}

void* func2(void* param)
{
    sleep(2);
    pthread_mutex_lock(&mutex);
    cout << "func2 get lock" << endl;
    pthread_mutex_unlock(&mutex);
    return NULL;
}

int main(void)
{
    int i;
    pthread_mutex_init(&mutex, NULL);
    pthread_t tid1, tid2;
    pthread_create(&tid1, NULL, func1, NULL);
    pthread_create(&tid2, NULL, func2, NULL);

    pthread_join(tid1,NULL);
    pthread_join(tid2,NULL);
    pthread_mutex_destroy(&mutex);
    return 0;
}
```
那么遇到这种情况该如何处理呢?

## PTHREAD_MUTEX_ROBUST 和  pthread_mutex_consistent登场了

首先给出解决方案，如果出现了上述的场景，就需要使用互斥锁的**PTHREAD_MUTEX_ROBUST属性**和**pthread_mutex_consistent函数**。

设置PTHREAD_MUTEX_ROBUST属性需要使用pthread_mutexattr_setrobust函数, 其原型如下:
```cpp
int pthread_mutexattr_setrobust(pthread_mutexattr_t *attr,
       int robust);
```

使用了该属性之后，如果某个持有互斥锁的线程还没有释放互斥锁就退出的话， 那么其他线程在进行加锁时将会收到一个**EOWNERDEAD**的错误，这就提示加锁线程， 目前持有锁的线程**已经死亡**， 可以对互斥锁的状态进行**重置**。

而重置的过程就需要使用到**pthread_mutex_consistent**方法。

```cpp
#include <pthread.h>

int pthread_mutex_consistent(pthread_mutex_t *mutex);
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
#include <iostream>
using namespace std;
pthread_mutex_t mutex;

void* func1(void* param)
{
    pthread_mutex_lock(&mutex);
    cout << "func1 get lock" << endl;
    pthread_exit(NULL);
}

void* func2(void* param)
{
    sleep(2);
    int r = pthread_mutex_lock(&mutex);
    if (r == EOWNERDEAD)
    {
        cout << "thread2 will unlock the lock" << endl;
        pthread_mutex_consistent(&mutex);
    }  

    cout << "func2 get lock" << endl;
    pthread_mutex_unlock(&mutex);
    return NULL;
}

int main(void)
{
    int i;
    pthread_mutexattr_t attr;
    int err = pthread_mutexattr_init(&attr);
    if (err != 0)
        return err;
         
    pthread_mutexattr_setrobust(&attr,PTHREAD_MUTEX_ROBUST);  
    pthread_mutex_init(&mutex, &attr);
    
    pthread_t tid1, tid2;
    pthread_create(&tid1, NULL, func1, NULL);
    pthread_create(&tid2, NULL, func2, NULL);

    pthread_join(tid1,NULL);
    pthread_join(tid2,NULL);
    pthread_mutex_destroy(&mutex);

    return 0;
}
```

需要特别注意的是，如果owner死亡后，这个锁的继任者，没有**调用pthread_mutex_consistent**恢复锁的一致性的话，那么后续对该锁的操作除了pthread_mutex_destroy以外， 其他的操作都将失败， 并且返回**ENOTRECOVERABLE错误**，意味着该锁彻底可再用了， 只有将其销毁。

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
#include <iostream>
using namespace std;
pthread_mutex_t mutex;

void* func1(void* param)
{
    pthread_mutex_lock(&mutex);
    cout << "func1 get lock" << endl;
    pthread_exit(NULL);
}

void* func2(void* param)
{
    sleep(2);
    int r = pthread_mutex_lock(&mutex);
/*    if (r == EOWNERDEAD)
    {
        cout << "thread2 will unlock the lock" << endl;
        pthread_mutex_consistent(&mutex);
    }
*/
    cout << "func2 get lock" << endl;
    pthread_mutex_unlock(&mutex);
    return NULL;
}

void* func3(void* param)
{
    sleep(10);
    int r = pthread_mutex_lock(&mutex);
    cout << "err = " << r << endl;
/*    if (r == EOWNERDEAD)
    {
        cout << "thread2 will unlock the lock" << endl;
        pthread_mutex_consistent(&mutex);
    }
*/
    cout << "func3 get lock" << endl;
    pthread_mutex_unlock(&mutex);
    return NULL;
}


int main(void)
{
    int i;
    pthread_mutexattr_t attr;
    int err = pthread_mutexattr_init(&attr);
    if (err != 0)
        return err;

    pthread_mutexattr_setrobust(&attr,PTHREAD_MUTEX_ROBUST);
    pthread_mutex_init(&mutex, &attr);

    pthread_t tid1, tid2, tid3;
    pthread_create(&tid1, NULL, func1, NULL);
    pthread_create(&tid2, NULL, func2, NULL);
    pthread_create(&tid3, NULL, func3, NULL);

    pthread_join(tid1,NULL);
    pthread_join(tid2,NULL);
    pthread_join(tid3,NULL);
    pthread_mutex_destroy(&mutex);

    return 0;
}

```


## 结论：
- 在多线程/多进程程序中，离开临界区时候一定需要释放互斥锁。 可以使用RAII的设计方法， 离开作用域的时候栈对象析构， 从而释放锁。
- 在多线程/多进程程序中,如果持有锁的owner意外退出，如果还想继续使用该锁, 那么该锁的后续的owner需要使用PTHREAD_MUTEX_ROBUST和pthread_mutex_consistent对互斥锁的状态进行恢复。