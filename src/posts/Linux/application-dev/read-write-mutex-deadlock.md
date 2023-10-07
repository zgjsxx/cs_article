---
category: 
- Linux
tags:
- 操作系统面试题
---

# Linux读写锁的容易犯的问题

**读写锁**是互斥锁之外的另一种用于多线程之间同步的一种方式。

多线程对于一个共享变量的**读操作**是安全的， 而**写操作**是不安全的。如果在一个读很多而写很少的场景之下，那么使用互斥锁将会阻碍大量的线程安全的读操作的进行。在这种场景下，读写锁这样一种设计便诞生了。

读写锁的特性如下表所示， 总结起来就是**读读不互斥**， **读写互斥**， **写写互斥**。

||读|写|
|--|--|--|
|读|不互斥|互斥|
|写|互斥|互斥|

看似这样好的一个设计在实际的使用中确存在诸多的使用误区，陈硕大神在他的```<<Linux多线程服务端编程>>```一书中曾给出他的建议，不要使用读写锁。 为什么如此呢？ 下面一一道来。


## 读写锁使用的正确性

读写锁第一个容易出错的地方就是可能在持有读锁的地方修改了共享数据。对于一些比较简单的方法可能是不容易出错的，但是对于嵌套调用的场景下，也是容易犯错的。例如下面的例子，read方法持有了读锁，但是operator4会修改共享变量。由于operator4的调用深度较深，因此可能容易犯错。

```cpp
//operator4会修改共享变量
void operation4();
{
    //...
}

void operation3()
{
    operation4();
}

void operation2()
{
    operation3();
}

void read() {
    std::shared_lock<std::shared_mutex> lock(mtx);
    operation1();
}
```

## 读写锁性能上的开销

**读写锁**从设计上看是比**互斥锁**要复杂一些，因此其内部加锁和解锁的逻辑也要比互斥锁要复杂。

下面是glibc读写锁的数据结构，可以推测在加锁解锁过程中要**更新reader和writers的数目**，而互斥锁是无需这样的操作的。

```cpp
struct __pthread_rwlock_arch_t
{
  unsigned int __readers;
  unsigned int __writers;
  unsigned int __wrphase_futex;
  unsigned int __writers_futex;
  unsigned int __pad3;
  unsigned int __pad4;
  int __cur_writer;
  int __shared;
  unsigned long int __pad1;
  unsigned long int __pad2;
  /* FLAGS must stay at this position in the structure to maintain
     binary compatibility.  */
  unsigned int __flags;
};
```

下面的一个例子使用互斥锁和读写锁分别对一个临界区进行反复的加锁和解锁。因为临界区没有内容，因此开销基本都在锁的加锁和解锁上。

```cpp
//g++ test1.cpp -o test1
#include <pthread.h>
#include <iostream>
#include <unistd.h>

pthread_mutex_t mutex;
int i = 0;

void *thread_func(void* args) {
        int j;
        for(j=0; j<10000000; j++) {
                pthread_mutex_lock(&mutex);
                // test
                pthread_mutex_unlock(&mutex);
        }
        pthread_exit((void *)0);
}

int main(void) {
        pthread_t id1;
        pthread_t id2;
        pthread_t id3;
        pthread_t id4;
        pthread_mutex_init(&mutex, NULL);
        pthread_create(&id1, NULL, thread_func, (void *)0);
        pthread_create(&id2, NULL, thread_func, (void *)0);
        pthread_create(&id3, NULL, thread_func, (void *)0);
        pthread_create(&id4, NULL, thread_func, (void *)0);
        pthread_join(id1, NULL);
        pthread_join(id2, NULL);
        pthread_join(id3, NULL);
        pthread_join(id4, NULL);
        pthread_mutex_destroy(&mutex);
}
```


```cpp
//g++ test2.cpp -o test2
#include <pthread.h>
#include <iostream>
#include <unistd.h>

pthread_rwlock_t rwlock;
int i = 0;

void *thread_func(void* args) {
        int j;
        for(j=0; j<10000000; j++) {
                pthread_rwlock_rdlock(&rwlock);
                //test2
                pthread_rwlock_unlock(&rwlock);
        }
        pthread_exit((void *)0);
}

int main(void) {
        pthread_t id1;
        pthread_t id2;
        pthread_t id3;
        pthread_t id4;
        pthread_rwlock_init(&rwlock, NULL);
        pthread_create(&id1, NULL, thread_func, (void *)0);
        pthread_create(&id2, NULL, thread_func, (void *)0);
        pthread_create(&id3, NULL, thread_func, (void *)0);
        pthread_create(&id4, NULL, thread_func, (void *)0);
        pthread_join(id1, NULL);
        pthread_join(id2, NULL);
        pthread_join(id3, NULL);
        pthread_join(id4, NULL);
        pthread_rwlock_destroy(&rwlock);
}
```

```shell
[root@localhost test1]# time ./test1

real    0m2.531s
user    0m5.175s
sys     0m4.200s
[root@localhost test1]# time ./test2

real    0m4.490s
user    0m17.626s
sys     0m0.004s
```

可以看出，单纯从加锁和解锁的角度看，互斥锁的性能要好于读写锁。

当然这里测试时，临界区的内容时空的，如果临界区较大，那么读写锁的性能可能会优于互斥锁。

不过在多线程编程中，我们总是会尽可能的减少临界区的大小，因此很多时候，读写锁并没有想象中的那么高效。

## 读写锁容易造成死锁

前面提到过读写锁这样的设计就是在**读多写少**的场景下产生的，然而这样的场景下，很容易造成写操作的饥饿。因为读操作过多，写操作不能拿到锁，造成写操作的阻塞。

因此，写操作获取锁通常拥有高优先级。

这样的设定对于下面的场景，将会造成死锁。假设有线程A、B和锁，按如下时序执行：
- 1、线程A申请读锁；
- 2、线程B申请写锁；
- 3、线程A再次申请读锁；

第2步中，线程B在申请写锁的时候，线程A还没有释放读锁，于是需要等待。第3步中，因此线程B正在申请写锁，于是线程A申请读锁将会被阻塞，于是陷入了死锁的状态。

下面使用c++17的shared_mutex来模拟这样的场景。

```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <shared_mutex>

void print() {
    std::cout << "\n";
}
template<typename T, typename... Args>
void print(T&& first, Args&& ...args) {
    std::cout << first << " ";
    print(std::forward<Args>(args)...);
}

std::shared_mutex mtx;
int step = 0;
std::mutex cond_mtx;
std::condition_variable cond;

void read() {
    //step0: 读锁
    std::shared_lock<std::shared_mutex> lock(mtx);

    std::unique_lock<std::mutex> uniqueLock(cond_mtx);
    print("read lock 1");
    //通知step0结束
    ++step;
    cond.notify_all();
    //等待step1: 写锁 结束
    cond.wait(uniqueLock, []{
        return step == 2;
    });
    uniqueLock.unlock();

    //step2: 再次读锁
    std::shared_lock<std::shared_mutex> lock1(mtx);

    print("read lock 2");
}

void write() {
    //等待step0: 读锁 结束
    std::unique_lock<std::mutex> uniqueLock(cond_mtx);
    cond.wait(uniqueLock, []{
        return step == 1;
    });
    uniqueLock.unlock();

    //step1: 写锁
    std::lock_guard<std::shared_mutex> lock(mtx);

    uniqueLock.lock();
    print("write lock");
    //通知step1结束
    ++step;
    cond.notify_all();
    uniqueLock.unlock();
}

int main() {
    std::thread t_read{read};
    std::thread t_write{write};
    t_read.join();
    t_write.join();
    return 0;
}
```

可以使用下面的在线版本进行测试。

[have a try](https://godbolt.org/z/rrMYGnebP)

在线版本的输出是下面这样的，程序由于死锁执行超时被杀掉了。

```shell
Killed - processing time exceeded
Program terminated with signal: SIGKILL
```

死锁的原因就是线程1与线程2相互等待导致。

![shared_mutex](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/read-write-mutex/dead-lock.png)

对于glibc的读写锁，其提供了**读优先**和**写优先**的属性。

使用**pthread_rwlockattr_setkind_np**方法即可设置读写锁的属性。其拥有下面的属性：
- PTHREAD_RWLOCK_PREFER_READER_NP,   //读者优先（即同时请求读锁和写锁时，请求读锁的线程优先获得锁） 
- PTHREAD_RWLOCK_PREFER_WRITER_NP,   //不要被名字所迷惑，也是读者优先
- PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP,  //写者优先（即同时请求读锁和写锁时，请求写锁的线程优先获得锁）     
- PTHREAD_RWLOCK_DEFAULT_NP = PTHREAD_RWLOCK_PREFER_READER_NP // 默认，读者优先          

glibc的读写锁模式是读优先的。下面分别使用**读优先**和**写优先**来进行测试。


- 写优先

```cpp
#include <iostream>
#include <pthread.h>
#include <unistd.h>

pthread_rwlock_t m_lock;
pthread_rwlockattr_t attr;

int A = 0, B = 0;

// thread1
void* threadFunc1(void* p)
{
    printf("thread 1 running..\n");
    pthread_rwlock_rdlock(&m_lock);
    printf("thread 1 read source A=%d\n", A);
    usleep(3000000); // 等待3s，此时线程2大概率会被唤醒并申请写锁

    pthread_rwlock_rdlock(&m_lock);
    printf("thread 1 read source B=%d\n", B);

    //释放读锁
    pthread_rwlock_unlock(&m_lock);
    pthread_rwlock_unlock(&m_lock);

    return NULL;
}

//thread2
void* threadFunc2(void* p)
{
    printf("thread 2 running..\n");
    pthread_rwlock_wrlock(&m_lock);
    A = 1;
    B = 1;
    printf("thread 2 write source A and B\n");

    //释放写锁
    pthread_rwlock_unlock(&m_lock);

    return NULL;
}

int main()
{

    pthread_rwlockattr_init(&attr);
    pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP);//设置写锁优先级高

    //初始化读写锁
    if (pthread_rwlock_init(&m_lock, &attr) != 0)
    {
        printf("init rwlock failed\n");
        return -1;
    }

    //初始化线程
    pthread_t hThread1;
    pthread_t hThread2;
    if (pthread_create(&hThread1, NULL, &threadFunc1, NULL) != 0)
    {
        printf("create thread 1 failed\n");
        return -1;
    }
    usleep(1000000);
    if (pthread_create(&hThread2, NULL, &threadFunc2, NULL) != 0)
    {
        printf("create thread 2 failed\n");
        return -1;
    }

    pthread_join(hThread1, NULL);
    pthread_join(hThread2, NULL);

    pthread_rwlock_destroy(&m_lock);
    return 0;
}
```

设置写优先会导致死锁。

- 读优先

```cpp
#include <iostream>
#include <pthread.h>
#include <unistd.h>

pthread_rwlock_t m_lock;
pthread_rwlockattr_t attr;

int A = 0, B = 0;

// thread1
void* threadFunc1(void* p)
{
    printf("thread 1 running..\n");
    pthread_rwlock_rdlock(&m_lock);
    printf("thread 1 read source A=%d\n", A);
    usleep(3000000); // 等待3s，此时线程2大概率会被唤醒并申请写锁

    pthread_rwlock_rdlock(&m_lock);
    printf("thread 1 read source B=%d\n", B);

    //释放读锁
    pthread_rwlock_unlock(&m_lock);
    pthread_rwlock_unlock(&m_lock);

    return NULL;
}

//thread2
void* threadFunc2(void* p)
{
    printf("thread 2 running..\n");
    pthread_rwlock_wrlock(&m_lock);
    A = 1;
    B = 1;
    printf("thread 2 write source A and B\n");

    //释放写锁
    pthread_rwlock_unlock(&m_lock);

    return NULL;
}

int main()
{

    pthread_rwlockattr_init(&attr);
    pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_READER_NP);

    //初始化读写锁
    if (pthread_rwlock_init(&m_lock, &attr) != 0)
    {
        printf("init rwlock failed\n");
        return -1;
    }

    //初始化线程
    pthread_t hThread1;
    pthread_t hThread2;
    if (pthread_create(&hThread1, NULL, &threadFunc1, NULL) != 0)
    {
        printf("create thread 1 failed\n");
        return -1;
    }
    usleep(1000000);
    if (pthread_create(&hThread2, NULL, &threadFunc2, NULL) != 0)
    {
        printf("create thread 2 failed\n");
        return -1;
    }

    pthread_join(hThread1, NULL);
    pthread_join(hThread2, NULL);

    pthread_rwlock_destroy(&m_lock);
    return 0;
}
```

读优先则没有死锁的问题，可以正常的执行下去。

```shell
thread 1 running..
thread 1 read source A=0
thread 2 running..
thread 1 read source B=0
thread 2 write source A and B
```

通过上面的实验，当reader lock需要重入时，需要很谨慎，一旦读写锁的属性是写优先，那么很有可能会产生死锁。

## 总结
- 读写锁适用于读多写少的场景，在这种场景下可能会有一些性能收益
- 读写锁的使用上存在着一些陷阱，平常尽量用互斥锁(mutex)代替读写锁。