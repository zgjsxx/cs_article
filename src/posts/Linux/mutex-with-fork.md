---
category: 
- Linux
tags:
- interview
---

# Fork之前创建了互斥锁，Fork之后是否可以保护临界区？
这是一道某数通公司的面试题。

这个问题按照我的理解意思是，在fork之前创建一把互斥锁，在fork之后，如果子进程使用该锁lock住一段临界区，那么父进程是否需要等待子进程unlock该锁才可以进入临界区?

反之也一样，如果父进程使用该锁lock住一段临界区，那么子进程是否需要等待父进程unlock该锁才可以进入临界区?

经过一番思索，我认为该问题需要分为两个情况进行讨论， 即该互斥锁是**线程锁**还是**进程锁**两种场景进行讨论。

首先我们讨论线程锁。
# fork之前创建线程锁
这里我们使用pthread_mutex_t创建了一个互斥锁mutex。该mutex不设置任何其他的属性。我们在fork之后让父进程和子进程执行临界区的代码，进入临界区和离开临界区分别lock和unlock，临界区代码的功能就是去打印一些"start to work"的日志。
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
执行之前，我们先定性分析一下，父进程在其地址空间中创建了一把互斥锁进而调用了fork函数，我们知道fork函数拥有copy-on-wrtie机制，当子进程或者父进程对锁进行lock时，父子进程的内存空间分离，也就是说父子进程的锁的作用范围就被限制在了各自的进程空间中，互不干扰。所以理论上将父子进程在进入临界区时使用的是各自内存空间中的互斥锁， 应该是互不影响的，不能控制父子进程进入临界区。

那么是不是如此呢？我们执行一下。

执行结果：
```shell
[root@localhost mutex]# ./a.out
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
我们看到父子进程的日志交替输出， 并没有出现父进程的日志整体先于子进程的日志， 或者子进程的日志整体先于父进程的日志的现象。通过该实验证明了我们之前的定性分析是正确的。接下来我们来讨论进程锁。

# fork之前创建进程锁
和线程锁代码类似， 我们也创建了一把互斥锁。稍有区别的是，该锁使用mmap创建并附加了MAP_SHARED属性，这样做导致了该锁创建在了该进程的共享内存空间中。除此以外，该互斥锁还拥有一个属性PTHREAD_PROCESS_SHARED， 这意味着该锁是跨越进程的。
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
在执行之前，我们先定性分析， 由于该锁是创建在共享内存空间中，因此子进程和父进程的mutex是存放在同一块物理内存上的， 也就是同一个对象。 所以这个场景下，执行结果就会出现同步效果。 也就是子进程先打印或者父进程先打印的结果。

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
执行结果是父进程先执行完然后子进程再执行，这就说明这个时候进程锁就起到了同步的作用， 控制了子进程和父进程进入临界区的顺序。

# 设置了PTHREAD_PROCESS_SHARED属性， 在fork之后就一定可以控制执行顺序吗？
我们看下面的例子， 该锁直接创建在父进程的栈中，并设置PTHREAD_PROCESS_SHARED属性， 那么可以起到控制父子进程进入临界区吗？
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
    pthread_mutex_t mutex;
    pthread_mutexattr_t mutexattr;
    pthread_mutexattr_init(&mutexattr);
    // 修改属性为进程间共享
    pthread_mutexattr_setpshared(&mutexattr, PTHREAD_PROCESS_SHARED);
    // 初始化一把 mutex 锁, 该所拥有进程间共享的特性
    pthread_mutex_init(&mutex,&mutexattr);
    
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
    pthread_mutexattr_destroy(&mutexattr);
    pthread_mutex_destroy(&mutex);
 
    return 0;
}
```

```shell
[root@localhost mutex]# ./a.out
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
此时发现子进程和父进程交替进入了临界区， 该锁没有起到同步作用。 与实验二对比， 实验二中互斥锁创建在父进程的共享内存中， 并设置有PTHREAD_PROCESS_SHARED属性， 因此父子进程操作的是同一把锁。而在实验三中，互斥锁创建在父进程的栈中， 由于**写时复制**， 父子进程实际操作的是各自内存空间的锁，因此没有同步作用。
# 结论
如果在fork之前创建的互斥锁具有PTHREAD_PROCESS_SHARED属性，并且该锁创建在父进程的共享内存中， 也就是说如果该互斥锁是一把**进程锁**，那么其对父子进程具有保护临界区的作用。 如果在fork之前创建的互斥锁没有该属性， 也就是说如果该锁是一把**线程锁**， 那么其没有对父子进程没有保护临界区的作用。

除此以外，如果一把锁要成为进程锁，需要两个条件， 一是该锁需要创建在共享内存中， 二是该锁需要有PTHREAD_PROCESS_SHARED属性。