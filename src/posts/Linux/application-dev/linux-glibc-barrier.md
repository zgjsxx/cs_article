---
category: 
- Linux
---


# 深入理解glibc barrier的实现原理

## pthread_barrier_t的结构

pthread_barrier_t的结构定义在```sysdepsnptlbitspthreadtypes.h```中，是一个联合体。联合中有两个字段，第一个字段是char类型的数组。

```c
typedef union
{
  char __size[__SIZEOF_PTHREAD_BARRIER_T];
  long int __align;
} pthread_barrier_t;
```

这个char数组各bit的定义在另一个结构体**pthread_barrier**中，定义在```sysdeps/nptl/internaltypes.h```。

这个才是barrier的真实定义，其有用5个字段。

```c
struct pthread_barrier
{
  unsigned int in;
  unsigned int current_round;
  unsigned int count;
  int shared;
  unsigned int out;
};
```
每个字段的含义如下所示：

- in：已经抵达barrier的线程数量。

- current_round:当前这轮的基数。由于barrier是可以重复使用的，例如一个屏障可以允许2个线程通过，当这个2个线程达到该屏障之后，该屏障可以继续工作，重复使用。

- count：需要抵达barrier的线程数量

- shared: 是否可以被share

- out: 输出值

## pthread_barrier_wait源码分析

首先,```pthread_barrier_wait```函数将进入屏障的线程数字段(bar->in)加1，变量i存储的就是加1后的值。注意这里使用的是acq_rel的内存序，因为下面将要根据i进行if-else判断，这里不能乱序。

除此以外，count值也读取了进来。

```c
  struct pthread_barrier *bar = (struct pthread_barrier *) barrier;

  unsigned int i;

 reset_restart:

  i = atomic_fetch_add_acq_rel (&bar->in, 1) + 1;
  /* These loads are after the fetch_add so that we're less likely to first
     pull in the cache line as shared.  */
  unsigned int count = bar->count;
```

下面这一段是用于处理IN值超过最大限制的场景。因为barrier是可以重复使用的，比如设置count为2，则可以第一轮限制2个线程通过， 第二轮还可以限制2个线程通过，一次类推。这个过程中，```bar->in```字段是不断递增的，因此可能存在溢出的场景。

```c
     unsigned int max_in_before_reset = BARRIER_IN_THRESHOLD
				   - BARRIER_IN_THRESHOLD % count;

    if (i > max_in_before_reset)
    {

        while (i > max_in_before_reset)
        {
            futex_wait_simple (&bar->in, i, bar->shared);
            i = atomic_load_relaxed (&bar->in);
        }
        goto reset_restart;
    }
```

下面读取当前这一轮的基础，如果```i > cr + count```，意味着已经有足够多的线程抵达了barrier，该线程不用wait，且需要将之前的waiter唤醒。

```c
    unsigned cr = atomic_load_relaxed (&bar->current_round);
    while (cr + count <= i)
    {
        unsigned int newcr = i - i % count;
        if (atomic_compare_exchange_weak_release (&bar->current_round, &cr,
						newcr))
        {
            cr = newcr;
            futex_wake (&bar->current_round, INT_MAX, bar->shared);
            if (i <= cr)
                goto ready_to_leave;
            else
                break;
        }
    }
```

下面这段就代表还没有足够的线程进入barrier，因此调用futex_wait进行等待。

```c
    while (i > cr)
    {
        futex_wait_simple (&bar->current_round, cr, bar->shared);
        cr = atomic_load_relaxed (&bar->current_round);
    }
```

程序的最后，要处理以下之前提到的"溢出"问题。当out值达到了阈值，则将current_round，out和in都置0。

```c
    o = atomic_fetch_add_release (&bar->out, 1) + 1;
    if (o == max_in_before_reset)
    {
        atomic_thread_fence_acquire ();
        atomic_store_relaxed (&bar->current_round, 0);
        atomic_store_relaxed (&bar->out, 0);

        int shared = bar->shared;
        atomic_store_release (&bar->in, 0);
        futex_wake (&bar->in, INT_MAX, shared);
    }
```

## gdb观察条件变量的内部值的变化

```c
//g++ test.cpp -g
#include <stdio.h>
#include <pthread.h>
#include <stdlib.h>
#include <unistd.h>
int a=0;

pthread_mutex_t numlock;
pthread_barrier_t b;

struct pthread_barrier
{
  unsigned int in;
  unsigned int current_round;
  unsigned int count;
  int shared;
  unsigned int out;
};

pthread_barrier *b_real = NULL;

void* handle(void *data)
{
    while(1)
    {
        pthread_mutex_lock(&numlock);
        a++;
        pthread_mutex_unlock(&numlock);
        printf("thread enter wait point\n");
        pthread_barrier_wait(&b);
        sleep(1);
    }
    return 0;
}


int main()
{
    pthread_t t1,t2;
    pthread_barrier_init(&b,NULL,2); //初始化屏障
    b_real = (pthread_barrier *)&b;
    pthread_mutex_init(&numlock,NULL);
    pthread_create(&t1,NULL,handle,NULL);
    pthread_create(&t2,NULL,handle,NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);

    exit(0);
}
```

在pthread_barrier_wait方法上下一个断点，在代码中是30行，运行代码，然后打印b_real的值。

目前还没有线程进入barrier，因此in=0。当前还是属于第一轮，因此current_round = 0。count在程序中设置，因此其值为2。程序并没有设置进程间共享的属性，因此shared = 0。

目前还没有完成一轮，因此out = 0。

```shell
[root@localhost test4]# gdb a.out  -q
Reading symbols from a.out...
(gdb) b 30
Breakpoint 1 at 0x401219: file test.cpp, line 30.
(gdb) r
Starting program: /home/work/cpp_proj/test4/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".
[New Thread 0x7ffff77ff640 (LWP 151331)]
[New Thread 0x7ffff6ffe640 (LWP 151332)]
in = 0
thread enter wait point
[Switching to Thread 0x7ffff77ff640 (LWP 151331)]

Thread 2 "a.out" hit Breakpoint 1, handle (data=0x0) at test.cpp:30
30              pthread_barrier_wait(&b);
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-60.el9.x86_64 libgcc-11.3.1-4.3.el9.x86_64 libstdc++-11.3.1-4.3.el9.x86_64
(gdb) p *b_real
$1 = {in = 0, current_round = 0, count = 2, shared = 0, out = 0}
(gdb)
```


