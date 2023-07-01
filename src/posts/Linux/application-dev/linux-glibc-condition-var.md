---
category: 
- Linux
---


# 深入了解glibc的条件变量

条件变量是日常开发中多线程同步的一个重要手段，使用条件变量，可以使得我们可以构建处生产者-消费者这样的模型。

本文将从glibc条件变量的源码出发，讲解其背后的实现原理。

## pthread_cond_t的结构

pthread_cond_t是glibc的条件变量的结构，其___data字段比较重要，进一步我们查看```__pthread_cond_s```的定义。

```c
typedef union
{
  struct __pthread_cond_s __data;
  char __size[__SIZEOF_PTHREAD_COND_T];
  __extension__ long long int __align;
} pthread_cond_t;
```

```__pthread_cond_s```的定义如下所示，字段很多，至少比之前的互斥锁复杂了很多。

```c

struct __pthread_cond_s
{
  __extension__ union
  {
    __extension__ unsigned long long int __wseq;
    struct
    {
      unsigned int __low;
      unsigned int __high;
    } __wseq32;
  };
  __extension__ union
  {
    __extension__ unsigned long long int __g1_start;
    struct
    {
      unsigned int __low;
      unsigned int __high;
    } __g1_start32;
  };
  unsigned int __g_refs[2] __LOCK_ALIGNMENT;
  unsigned int __g_size[2];
  unsigned int __g1_orig_size;
  unsigned int __wrefs;
  unsigned int __g_signals[2];
};

```
其各个字段的解释如下所示：

- __wrefs: G1和G2所有等待的线程数，是按照8的倍数来的，1个线程为8，2个线程是16，以此类推。
- __g1_start: G1的起点的在历史waiter中的序号。
- __g1_orig_size: G1的原始长度。低2位代表条件变量的内部的锁。
- __wseq32：等待的序列号。
- __g_refs: 表示G1和G2futex waiter的引用计数，例如{2，2}表示G1和G2各有一个waiter。
- __g_signals：可以被消费的信号数
- __g_size：G1和G2在切换之后，G1里面剩余的waiter数量。
  
这些字段是比较复杂的，下面将会对pthread_cond_signal和pthread_cond_wait两个函数进行详解，届时将会理解这些字段的含义。
## pthread_cond_signal

pthread_cond_signal是条件变量发送信号的方法，其过程如下所示：

- 1. 检查 cond __wrefs, 若没有waiter则直接返回
- 2. 有waiter, 检查是否需要切换组(G1为空，G2有一个等待者，则需要将 G2 切换为 G1)
- 3. 唤醒G1中剩余的waiter。

下面通过源码分析其执行过程。

pthread_cond_signal首先将读取条件变量的等待任务的数量。 ```__wref >> 3``` 等同于```__wref/8```，wref每次是按照8递增的，在pthread_conf_wait函数中有相应实现。

__wref按照8递增的原因，在注释中也给出了,因为低3位有了其它用途。

>__wrefs: Waiter reference counter.
>    * Bit 2 is true if waiters should run futex_wake when they remove the
>    last reference.  pthread_cond_destroy uses this as futex word.
>    * Bit 1 is the clock ID (0 == CLOCK_REALTIME, 1 == CLOCK_MONOTONIC).
>    * Bit 0 is true iff this is a process-shared condvar.

如果没有waiter，就不用发送信号，于是直接返回。所谓waiter就是调用了pthread_cond_wait而陷入wait的任务。

```c
  unsigned int wrefs = atomic_load_relaxed (&cond->__data.__wrefs);
  if (wrefs >> 3 == 0)
    return 0;
```

这里获取条件变量中的序列号，通过序列号来获取现在的G1数组的下标（0或者1）。

刚开始时wseq为偶数，因此G1的index为1。

```c
  unsigned long long int wseq = __condvar_load_wseq_relaxed (cond);
  unsigned int g1 = (wseq & 1) ^ 1;
  wseq >>= 1;
  bool do_futex_wake = false;
```

接着检查G1中是否有waiter，如果有，向G1组中发送信号值（对应的signals+2），并将G1中剩余的waiter减去1。

如果G1已经没有剩余的waiter，那么就需要从G2中取waiter。实际上__condvar_quiesce_and_switch_g1是将G1和G2的身份做了调换。

```c
  if ((cond->__data.__g_size[g1] != 0)
      || __condvar_quiesce_and_switch_g1 (cond, wseq, &g1, private))
    {
      /* Add a signal.  Relaxed MO is fine because signaling does not need to
	 establish a happens-before relation (see above).  We do not mask the
	 release-MO store when initializing a group in
	 __condvar_quiesce_and_switch_g1 because we use an atomic
	 read-modify-write and thus extend that store's release sequence.  */
      atomic_fetch_add_relaxed (cond->__data.__g_signals + g1, 2);
      cond->__data.__g_size[g1]--;
      /* TODO Only set it if there are indeed futex waiters.  */
      do_futex_wake = true;
    }
```

下面详细看看__condvar_quiesce_and_switch_g1都做了哪些事情，其定义在了```nptl/pthread_cond_common.c```文件中。

__condvar_quiesce_and_switch_g1首先检查G2是否有waiter，如果没有waiter，则不进行操作。即G1和G2不需要进行调整，新的waiter仍然记录在G2中。计算方法可以参考下图进行理解：

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/cond-var2.png)

```c
  unsigned int old_orig_size = __condvar_get_orig_size (cond);
  uint64_t old_g1_start = __condvar_load_g1_start_relaxed (cond) >> 1;
  if (((unsigned) (wseq - old_g1_start - old_orig_size)
	  + cond->__data.__g_size[g1 ^ 1]) == 0)
	return false;
```

下面将G1的signal值和1进行与操作，标记此时g1已经被close。因为程序的并发性，在G1和G2切换的时候可能还会有新的线程加入到旧的G1中。于是就给他们发送特殊的信号值，使得这些waiter可以感知。从这个点，也能联想到为什么条件变量会存在**虚假唤醒**。

```c
  atomic_fetch_or_relaxed (cond->__data.__g_signals + g1, 1);
```

接下来，将G1中剩下的waiter全部唤醒。实际上进入__condvar_quiesce_and_switch_g1方法时，G1的长度已经为0，这里G1又出现了waiter就是由于程序的并发生可能导致的问题。因此这里将G1剩下的waiter进行唤醒。这里__g_refs和已经调用futex_wait进行睡眠的waiter数量相关。

```c
unsigned r = atomic_fetch_or_release (cond->__data.__g_refs + g1, 0); 
while ((r >> 1) > 0)
{
    for (unsigned int spin = maxspin; ((r >> 1) > 0) && (spin > 0); spin--)
    {
        r = atomic_load_relaxed (cond->__data.__g_refs + g1);
    }
    if ((r >> 1) > 0)
    {
        r = atomic_fetch_or_relaxed (cond->__data.__g_refs + g1, 1) | 1;

        if ((r >> 1) > 0)
            futex_wait_simple (cond->__data.__g_refs + g1, r, private);
        r = atomic_load_relaxed (cond->__data.__g_refs + g1);
    }
}
```

接下来，开始对G1和G2进行切换。换的过程很简单，就是将G1的index和G2的index做了切换。

切换之后，为了知道当前G1的一些信息，会计算其起始下标和长度。这个起始下标的含义起始时针对历史上所有的waiter而言的。

```c
    wseq = __condvar_fetch_xor_wseq_release (cond, 1) >> 1;
    g1 ^= 1;
    *g1index ^= 1;

    unsigned int orig_size = wseq - (old_g1_start + old_orig_size);
    __condvar_set_orig_size (cond, orig_size);
    /* Use and addition to not loose track of cancellations in what was
        previously G2.  */
    cond->__data.__g_size[g1] += orig_size;//计算还有多少waiter没有唤醒

    //如果waiter cacel了wait，可能会走到这个if语句中。
    if (cond->__data.__g_size[g1] == 0)
        return false;

    return true;
```

__condvar_quiesce_and_switch_g1到此位置就结束了，实际上就是当旧的G1中所有的waiter都唤醒时，将老的G1和G2身份对调。于是老的G2就成为了G1。后续将从G1继续唤醒waiter。

回到pthread_cond_signal，最后一部分代码则将互斥锁进行释放，接着如果需要进入内核，则调用futex_wake对waiter进行唤醒。

```c
  __condvar_release_lock (cond, private);

  if (do_futex_wake)
    futex_wake (cond->__data.__g_signals + g1, 1, private);
```


## pthread_cond_wait

pthread_cond_wait是等待条件变量的方法，其过程如下所示：

1. 申请一个新的__wseq，实际上就是老的__wseq加上2。
2. 释放互斥锁
3. 自旋等待，检查 __g_signals，自旋次数结束，进入 futex_wait_cancelable，休眠
4. 完成后，需要对mutex进行加锁


下面就对照源码进行解析。

pthread_cond_wait首先会获取一个等待的序列号。条件变量的结构体中有一个字段是__wseq，这个便是所谓的序列号，每次pthread_cond_wait都会将序列号加上2。

从条件变量的初始化可以知道，wseq初始值为0。而wseq每次原子地递增2，因此当前wseq是一个偶数。wseq的奇偶性不是一成不变的，当g1和g2发生切换时，wseq会发生变化。

```c
#define PTHREAD_COND_INITIALIZER { { {0}, {0}, {0, 0}, {0, 0}, 0, 0, {0, 0} } }
```

接下来将wseq和1进行与操作，由于wseq为偶数，因此g等于0。

```c
  uint64_t wseq = __condvar_fetch_add_wseq_acquire (cond, 2);
  unsigned int g = wseq & 1;
  uint64_t seq = wseq >> 1;
```

接下来，使用原子函数atomic_fetch_add_relaxed将增加条件变量的等待数量，注意这里一次增加了8。这里使用了relaxed的memory order已经足够了，因为我们的目的仅仅为了将cond->__data.__wrefs增加8。

```c
  unsigned int flags = atomic_fetch_add_relaxed (&cond->__data.__wrefs, 8);
```

接下来调用__pthread_mutex_unlock_usercnt释放互斥锁。

```c
  err = __pthread_mutex_unlock_usercnt (mutex, 0);
  if (__glibc_unlikely (err != 0))
    {
      __condvar_cancel_waiting (cond, seq, g, private);
      __condvar_confirm_wakeup (cond, private);
      return err;
    }
```

首先自旋检查```cond->__data.__g_signals+ g```group中的信号数量，如果有信号，意味着不用进入内核态，而直接唤醒。这里也是条件变量出现**虚假唤醒**的原因。

```c
    unsigned int spin = maxspin;
    while (signals == 0 && spin > 0)
    {
        /* Check that we are not spinning on a group that's already
        closed.  */
        if (seq < (__condvar_load_g1_start_relaxed (cond) >> 1))
    goto done;

        /* TODO Back off.  */

        /* Reload signals.  See above for MO.  */
        signals = atomic_load_acquire (cond->__data.__g_signals + g);
        spin--;
    }
```

接下来，如果signal的值是低位为1，意味着当前的组已经被closed，直接跳出wait方法。这个点和之前讲解pthread_signal是呼应的。

如果signals的值低位不是1，并且大于0，则认为获取到了有效的信号。跳过下面的逻辑。

```c
    if (signals & 1)
    goto done;

    /* If there is an available signal, don't block.  */
    if (signals != 0)
    break;
```

如果逻辑没有走到这里，意味着自旋过程中，没有收到信号，于是尝试开始进行阻塞的动作。

首先将引用计数增加2，意味着将要进入内核wait。

```c
    atomic_fetch_add_acquire (cond->__data.__g_refs + g, 2);
    if (((atomic_load_acquire (cond->__data.__g_signals + g) & 1) != 0)
        || (seq < (__condvar_load_g1_start_relaxed (cond) >> 1)))
    {
        /* Our group is closed.  Wake up any signalers that might be
        waiting.  */
        __condvar_dec_grefs (cond, g, private);
        goto done;
    }
```

下面是进行一些清理工作。这里感兴趣的话可以自行研究，这里不细讲。

```c
    struct _pthread_cleanup_buffer buffer;
    struct _condvar_cleanup_buffer cbuffer;
    cbuffer.wseq = wseq;
    cbuffer.cond = cond;
    cbuffer.mutex = mutex;
    cbuffer.private = private;
    __pthread_cleanup_push (&buffer, __condvar_cleanup_waiting, &cbuffer);
    err = __futex_abstimed_wait_cancelable64 (
    cond->__data.__g_signals + g, 0, clockid, abstime, private);

    __pthread_cleanup_pop (&buffer, 0);
    if (__glibc_unlikely (err == ETIMEDOUT || err == EOVERFLOW))
    {
        __condvar_dec_grefs (cond, g, private);
        /* If we timed out, we effectively cancel waiting.  Note that
        we have decremented __g_refs before cancellation, so that a
        deadlock between waiting for quiescence of our group in
        __condvar_quiesce_and_switch_g1 and us trying to acquire
        the lock during cancellation is not possible.  */
        __condvar_cancel_waiting (cond, seq, g, private);
        result = err;
        goto done;
    }
    else
    __condvar_dec_grefs (cond, g, private);

    /* Reload signals.  See above for MO.  */
    signals = atomic_load_acquire (cond->__data.__g_signals + g);
```



```c
    uint64_t g1_start = __condvar_load_g1_start_relaxed (cond);
    if (seq < (g1_start >> 1))
    {
        if (((g1_start & 1) ^ 1) == g)
        {
            unsigned int s = atomic_load_relaxed (cond->__data.__g_signals + g);
            while (__condvar_load_g1_start_relaxed (cond) == g1_start)
            {
                if (((s & 1) != 0)
                || atomic_compare_exchange_weak_relaxed
                    (cond->__data.__g_signals + g, &s, s + 2))
                {
                    futex_wake (cond->__data.__g_signals + g, 1, private);
                    break;
            }
        }
    }
```


![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/cond-var.png)



## gdb观察条件变量的内部值的变化

### 程序源码

```cpp
//g++ test.cpp -g -lpthread
#include <stdio.h>
#include <semaphore.h>
#include <pthread.h>
#include <unistd.h>
pthread_t t1;
pthread_t t2;
pthread_t t3;
pthread_mutex_t mutex;
pthread_cond_t cond;

void* Signal(void* arg)
{
         sleep(1);
    while(1)
    {
        pthread_mutex_lock(&mutex);
            pthread_cond_signal(&cond);
            printf("Process1 signal\n");
        pthread_mutex_unlock(&mutex);
        sleep(2);
    }
}

void* Waiter(void* arg)
{
    while(1)
    {
        pthread_mutex_lock(&mutex);
        printf("Waiter start to wait\n");
        pthread_cond_wait(&cond,&mutex);
        printf("Waiter awake\n");
        pthread_mutex_unlock(&mutex);
        sleep(1);
   }
}


int main(){
    pthread_cond_init(&cond,NULL);
    pthread_mutex_init(&mutex,NULL);
    pthread_create(&t1,NULL,Signal,NULL);
    pthread_create(&t2,NULL,Waiter,NULL);
    pthread_create(&t3,NULL,Waiter,NULL);
    pthread_join(t1,NULL);
    pthread_join(t2,NULL);
    pthread_join(t3,NULL);
    return 0;
}
```

使用gdb调试上述程序，并在源码中的第17行设置一个断点。运行程序。

### 1.新的waiter加入了G2

在程序中，创建了三个线程，两个waiter线程，一个signal线程。我们在signal线程的```pthread_cond_signal```方法中下了断点。

程序开始时G2的index = 0 ， G1的index = 1。

首先我们分析__wseq，在上文的解析中知道，```pthread_cond_wait```每次会首先获取一个序列号，并将该序列号加上1。 实际操作时，因为__wseq的LSB（最低位）代表了G2的下标，因此每个waiter会将序列号加2(1 << 1)。由于有两个waiter，因此__wseq应该为4。从下面的gdb的打印中的内容，确实如此。

接着分析__g_refs， 由于其中两个waiter线程已经调用futex_wait进行sleep，而新的waiter总是加入到G2中，且目前G2的index是0，因此__g_refs = {4, 0}。 __g_refs中元素是4而不是2的原因和__wseq是类似的。

接着分析__wrefs，其代表了waiter的总数量，目前有2个waiter，每个waiter会使得__wrefs增加8，因此__wrefs = 16。之所以增加8，是因为其低3位有了其它用途，这个点上面也提到过，这里再提及一次，下面的分析中将不再重复。

接着分析__g_size，它表示G1和G2交换后，G1中剩余的waiter数量。由于目前还没有G1和G2的切换，因此__g_size = {0,0}。

最后分析__g1_start和__g1_orig_size，这里没有出现G1和G2的切换，因此__g1_start和__g1_orig_size都还是初始值0。

此时，G1和G2的构成如下图所示：

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/demo1.png)


```shell
[root@localhost test2]# gdb a.out  -q
Reading symbols from a.out...
(gdb) b 17
Breakpoint 1 at 0x4011d6: file test.cpp, line 17.
(gdb) r
Starting program: /home/work/cpp_proj/test2/a.out
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".
[New Thread 0x7ffff7a8e640 (LWP 22121)]
[New Thread 0x7ffff728d640 (LWP 22122)]
Waiter start to wait
[New Thread 0x7ffff6a8c640 (LWP 22123)]
Waiter start to wait
[Switching to Thread 0x7ffff7a8e640 (LWP 22121)]

Thread 2 "a.out" hit Breakpoint 1, Signal (arg=0x0) at test.cpp:17
17                  pthread_cond_signal(&cond);
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-28.el9_0.2.x86_64 libgcc-11.2.1-9.4.el9.x86_64 libstdc++-11.2.1-9.4.el9.x86_64
(gdb) p cond
$1 = {__data = {{__wseq = 4, __wseq32 = {__low = 4, __high = 0}}, {__g1_start = 0, __g1_start32 = {__low = 0, __high = 0}}, __g_refs = {
      4, 0}, __g_size = {0, 0}, __g1_orig_size = 0, __wrefs = 16, __g_signals = {0, 0}},
  __size = "\004", '\000' <repeats 15 times>, "\004", '\000' <repeats 19 times>, "\020\000\000\000\000\000\000\000\000\000\000",
  __align = 4}

```

### 2.G1和G2第一次发生切换

接下来我们使用next，使得其中一个线程进行signal操作。 下面我们再一一分析条件变量的数据变化。

在Signal线程执行signal操作时，此时G1的长度为0(初始状态下，waiter都是加入G2的，G1为空），因此下面将会遇到G1和G2的切换。

首先分析__wseq。__wseq在G1和G2切换时，奇偶性会发生变化。计算方法为```4^1 = 5```。因此__wseq = 5。

接着分析__g_refs。 由于signal线程调用```pthread_cond_signal```对waiter进行了唤醒。因此__g_refs需要减去2，因此其等于{2，0}。

接着分析__g_size。因为此前G2的waiter有2个，已经唤醒了一个，还剩下一个没有唤醒，因此这里g_size = {1，0}。

接着分析__g1_start。__g1_start指的是当前的G1数组在历史waiter中的序号。毫无疑问，初始状态下，__g1_start = 1。

接着分析__g1_orig_size, __g1_orig_size指的是当前的G1在历史waiter图中的长度。之前G2的waiter数量为2，切换后G1的原始长度也为2，因此__g1_orig_size = (2 << 2) = 8。

注意此时G1的index = 0， G2的index = 1，已经发生改变。

这个过程如下图所示：

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/demo2.png)


```shell
(gdb) n
18                  printf("Process1 signal\n");
(gdb) p cond
$2 = {__data = {{__wseq = 5, __wseq32 = {__low = 5, __high = 0}}, {__g1_start = 1, __g1_start32 = {__low = 1, __high = 0}}, __g_refs = {
      2, 0}, __g_size = {1, 0}, __g1_orig_size = 8, __wrefs = 8, __g_signals = {0, 0}},
  __size = "\005\000\000\000\000\000\000\000\001\000\000\000\000\000\000\000\002\000\000\000\000\000\000\000\001\000\000\000\000\000\000\000\b\000\000\000\b\000\000\000\000\000\000\000\000\000\000", __align = 5}

```

### 3.G2加入新的waiter

接着我们使用continue，继续程序的运行。由于此前Signal线程唤醒了一个waiter，于是该waiter继续执行，sleep 1s后又将调用```pthread_cond_wait```陷入等待。

注意此时G1的index = 0， G2的index = 1。

首先分析__wseq。此前__wseq值为5。此时由于又加入了一个waiter，因此__wseq增加2,__wseq = 7。

接着分析__g1_start。由于没有发生G1和G2的切换，因此其值保持不变，仍为1。

接着分析__g_refs。此时G1仍然有一个waiter没有唤醒，而新的waiter会加入G2，因此其值为{2，2}。

接着分析__g_size，G1中还剩下一个waiter没有唤醒，因此其值等于{1，0}。

接着分析__g1_orig_size。由于没有发生G1和G2的切换，因此其值保持不变，仍为8。

接着分析 __wrefs，因为G1和G2总共有2个waiter，因此其值等于16。

__g_signals的值很难被捕获到，其值在pthread_cond_signal的内部发生改变。

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/demo3.png)

```cpp
(gdb) c
Continuing.
Process1 signal
Waiter awake
Waiter start to wait

Thread 2 "a.out" hit Breakpoint 1, Signal (arg=0x0) at test.cpp:17
17                  pthread_cond_signal(&cond);
(gdb) p cond
$3 = {__data = {{__wseq = 7, __wseq32 = {__low = 7, __high = 0}}, {__g1_start = 1, __g1_start32 = {__low = 1, __high = 0}}, __g_refs = {
      2, 2}, __g_size = {1, 0}, __g1_orig_size = 8, __wrefs = 16, __g_signals = {0, 0}},
  __size = "\a\000\000\000\000\000\000\000\001\000\000\000\000\000\000\000\002\000\000\000\002\000\000\000\001\000\000\000\000\000\000\000\b\000\000\000\020\000\000\000\000\000\000\000\000\000\000", __align = 7}
```

### 4.G1的剩下的waiter被唤醒

接着我们使用next，这会使得Signal线程调用pthread_cond_signal唤醒一个waiter。

首先分析__wseq。由于没有新的waiter，因此__wseq值不变，仍为7。

接着分析__g1_start。由于没有发生G1和G2的切换，因此其值保持不变，仍为1。

接着分析__g_refs。Signal线程调用了pthread_conf_signal方法唤醒了一个waiter，因此其值为{0，2}。

接着分析__g_size，Signal线程调用了pthread_conf_signal方法唤醒了一个waiter，因此其值等于{0，0}。

接着分析__g1_orig_size。由于没有发生G1和G2的切换，因此其值保持不变，仍为8。

接着分析 __wrefs，因为G1和G2总共有1个waiter，因此其值等于8。

__g_signals的值很难被捕获到，其值在pthread_cond_signal的内部发生改变。


![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/demo4.png)


```shell
(gdb) n
18                  printf("Process1 signal\n");
(gdb) p cond
$4 = {__data = {{__wseq = 7, __wseq32 = {__low = 7, __high = 0}}, {__g1_start = 1, __g1_start32 = {__low = 1, __high = 0}}, __g_refs = {
      0, 2}, __g_size = {0, 0}, __g1_orig_size = 8, __wrefs = 8, __g_signals = {0, 0}},
  __size = "\a\000\000\000\000\000\000\000\001", '\000' <repeats 11 times>, "\002", '\000' <repeats 11 times>, "\b\000\000\000\b\000\000\000\000\000\000\000\000\000\000", __align = 7}
```

### 5.G2加入新的waiter

接着我们使用continue，继续程序的运行。由于此前Signal线程唤醒了一个waiter，于是该waiter继续执行，sleep 1s后又将调用pthread_cond_wait陷入等待。

注意此时G1的index = 0， G2的index = 1

首先分析__wseq。此时又加入了一个waiter，因此__wseq值为9。

接着分析__g1_start。由于没有发生G1和G2的切换，因此其值保持不变，仍为1。

接着分析__g_refs。此时G2又加入了一个waiter，因此其值为{0，4}(G2的index=1，因此4在第二个位置上)。

接着分析__g_size。目前G1中没有waiter了，因此值等于{0，0}。

接着分析__g1_orig_size。由于没有发生G1和G2的切换，因此其值保持不变，仍为8。

接着分析 __wrefs，因为G1和G2总共有2个waiter，因此其值等于16。

__g_signals的值很难被捕获到，其值在pthread_cond_signal的内部发生改变。

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/demo5.png)


```shell
(gdb) c
Continuing.
Process1 signal
Waiter awake
Waiter start to wait

Thread 2 "a.out" hit Breakpoint 1, Signal (arg=0x0) at test.cpp:17
17                  pthread_cond_signal(&cond);
(gdb) p cond
$5 = {__data = {{__wseq = 9, __wseq32 = {__low = 9, __high = 0}}, {__g1_start = 1, __g1_start32 = {__low = 1, __high = 0}}, __g_refs = {
      0, 4}, __g_size = {0, 0}, __g1_orig_size = 8, __wrefs = 16, __g_signals = {0, 0}},
  __size = "\t\000\000\000\000\000\000\000\001", '\000' <repeats 11 times>, "\004", '\000' <repeats 11 times>, "\b\000\000\000\020\000\000\000\000\000\000\000\000\000\000", __align = 9}
```

### 6.G1和G2再一次发生切换

接着我们使用next，使得Signal线程调用pthread_conf_signal方法。这个时候由于G1为0，因此会发生G1和G2的切换。

首先分析__wseq。此时G1和G2发生了切换，__wseq的奇偶性会发生变化，计算方法为```9 ^ 1 = 8```，因此__wseq = 8。

接着分析__g1_start。由于G1和G2发生了切换，当前G2中的第一个waiter属于历史上的第三个waiter，历史值是从0开始的，因此此时G1的起始waiter的序号为2，再进行偏移，就得到了4。

接着分析__g_refs。目前G1还有一个waiter还没有被唤醒，且目前G1的index = 1，因此__g_refs =  {0, 2}。

接着分析__g_size，在G1和G2切换之前，G2有两个waiter，目前唤醒了一个，还剩下一个，因此其值等于{0, 1}。

接着分析__g1_orig_size。发生G1和G2切换前，G2有两个任务，因此__g1_orig_size=8。

接着分析 __wrefs，因为G1和G2总共有2个waiter，因此其值等于16。

__g_signals的值很难被捕获到，其值在pthread_cond_signal的内部发生改变。

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/demo6.png)

```shell
(gdb) n
18                  printf("Process1 signal\n");
(gdb) p cond
$6 = {__data = {{__wseq = 8, __wseq32 = {__low = 8, __high = 0}}, {__g1_start = 4, __g1_start32 = {__low = 4, __high = 0}}, __g_refs = {
      0, 2}, __g_size = {0, 1}, __g1_orig_size = 8, __wrefs = 8, __g_signals = {0, 0}},
  __size = "\b\000\000\000\000\000\000\000\004", '\000' <repeats 11 times>, "\002\000\000\000\000\000\000\000\001\000\000\000\b\000\000\000\b\000\000\000\000\000\000\000\000\000\000", __align = 8}
```

下面继续执行，分析的情况是类似的，不再展开。

## 总结

glibc中的条件变量的底层实现是相对复杂的，其将信号分成了两个组G1和G2，pthread_cond_wait会将waiter加入到G2组，而pthread_cond_wait将会从G1中进行唤醒，如果G1全部唤醒，将会检查G2，如果G2存在waiter，将切换G1和G2，如此循环往复。 由于需要考虑并发性的问题，程序中加入了很多的检查逻辑，因此程序理解起来是相对复杂的。除此之外，从其源码中，我们也可以更好的理解为什么条件变量会存在虚假唤醒。