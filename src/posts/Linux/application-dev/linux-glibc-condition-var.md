---
category: 
- Linux
---


# 深入了解glibc的条件变量

## pthread_cond_t

```c
typedef union
{
  struct __pthread_cond_s __data;
  char __size[__SIZEOF_PTHREAD_COND_T];
  __extension__ long long int __align;
} pthread_cond_t;
```

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

- __wrefs: 等待的线程数，是按照8的倍数来的，1个线程为8，2个线程是16，以此类推。
- __g1_start: G1的开始位置
- __g1_orig_size: G1的原始长度。低2位代表条件变量的内部的锁。
- __wseq32：等待的序列号
- __g_refs: futex waiter的引用计数
- __g_signals：可以被消费的信号数
- __g_size：g1和g2在产生切换时，里面剩余的waiter数量。
- 
## pthread_cond_signal

pthread_cond_signal是条件变量发送信号的方法，其过程如下所示：

- 1. 检查 cond __wrefs, 若没有waiter则直接返回
- 2. 有waiter, 检查是否需要切换组(例如首次调用 wait 后 G1 为空，G2有一个等待者，则首次调用 signal 后需要将 G2 切换为 G1)
- 3. 递增 __g_signals, 递减__g_size(未唤醒的waiters个数)，再调用futex_wake

首先读取条件变量的等待任务的数量。 ```wref >> 3``` 等同于```wref/8```，wref每次是按照8递增的，在pthread_conf_wait函数中有相应实现。

如果没有waiter，就不用发送信号，于是直接返回。所谓waiter就是调用了pthread_cond_wait而陷入wait的任务。

```c
  unsigned int wrefs = atomic_load_relaxed (&cond->__data.__wrefs);
  if (wrefs >> 3 == 0)
    return 0;
```

这里获取条件变量中的序列号，通过序列号来获取现在的g1数组的下标（0或者1）。

刚开始时wseq为偶数，因此g1为1。

```c
  unsigned long long int wseq = __condvar_load_wseq_relaxed (cond);
  unsigned int g1 = (wseq & 1) ^ 1;
  wseq >>= 1;
  bool do_futex_wake = false;
```

这里首先检查G1的是否有waiter，如果有，向G1组中发送信号值（对应的signals+2），并将G1中剩余的waiter减去1。

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

__condvar_quiesce_and_switch_g1首先检查g2是否有waiter，如果没有waiter，则不进行操作。即G1和G2不需要进行调整，新的waiter仍然记录在G2中。

```c
  unsigned int old_orig_size = __condvar_get_orig_size (cond);
  uint64_t old_g1_start = __condvar_load_g1_start_relaxed (cond) >> 1;
  if (((unsigned) (wseq - old_g1_start - old_orig_size)
	  + cond->__data.__g_size[g1 ^ 1]) == 0)
	return false;
```

下面将g1的signal值和1进行与操作，标记此时g1已经被close。因为程序的并发性，这个时候可能还会有新的线程加入到旧的G1中。于是就给他们发送特殊的信号值，使得这些waiter可以感知。

```c
  atomic_fetch_or_relaxed (cond->__data.__g_signals + g1, 1);
```

接下来，将G1中剩下的waiter全部唤醒。__g_refs和已经调用futex_wait进行睡眠的waiter数量相关。

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

下面这里就将对G1和G2进行切换。由于signal调用只能唤醒一个waiter，于是还需要计算新的G1还多少waiter没有唤醒。

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

1. 注册waiter到cond 的 _wseq 队列 （分为G1 G2两个组）
2. 释放互斥锁
3. 自旋等待，检查 __g_signals，自旋次数结束，进入 futex_wait_cancelable，休眠
4. 完成后，需要对mutex进行加锁

![glic-cond-var](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/cond-var/cond-var.png)



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

首先自旋检查```cond->__data.__g_signals+ g```group中的信号数量，如果有信号，意味着不用进入内核态，而直接唤醒。

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

接下来，如果signal的值是低位为1，意味着当前的组已经被closed，直接跳出wait方法。

如果signals的值低位不是1，并且大于0，则认为获取到了有效的信号。跳过下面的逻辑。

```c
    if (signals & 1)
    goto done;

    /* If there is an available signal, don't block.  */
    if (signals != 0)
    break;
```

如果逻辑没有走到这里，意味着自旋过程中，没有收到信号，于是尝试开始进行阻塞的动作。	  

首先将引用计数增加2。

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

下面是进行一些清理工作。

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


## gdb观察条件变量的内部值的变化

```cpp
//g++ test.cpp -g -lpthread
#include <stdio.h>
#include <semaphore.h>
#include <pthread.h>
#include <unistd.h>
pthread_t t1;
pthread_t t2;
pthread_mutex_t mutex;
pthread_cond_t cond;
int i=0;

void* Process1(void* arg)
{
    while(1)
    {
        pthread_mutex_lock(&mutex);
        i++;
        if(i%2 == 0)
        {
            pthread_cond_signal(&cond);
        }
        else
        {
            printf("this is Process1\n");
        }
        pthread_mutex_unlock(&mutex);
        sleep(1);
    }
}

void* Process2(void* arg)
{
    while(1)
    {
        pthread_mutex_lock(&mutex);
        pthread_cond_wait(&cond,&mutex);
        printf("this is Process2,i=%d\n",i);
        pthread_mutex_unlock(&mutex);
        sleep(2);
   }
}

int main(){
    pthread_cond_init(&cond,NULL);
    pthread_mutex_init(&mutex,NULL);
    pthread_create(&t1,NULL,Process1,NULL);
    pthread_create(&t2,NULL,Process2,NULL);
    pthread_join(t1,NULL);
    pthread_join(t2,NULL);
    return 0;
}

```

使用gdb调试上述程序，并在源码中的第20行下一个断点。运行程序。

在程序中，创建了两个线程，一个线程wait，一个线程signal。我们在signal的方法中下了断点。


在上文中，我们知道，pthread_cond_wait每次会首先获取一个序列号，并将该序列号加上2。从上述的打印中的内容，我们看到__wseq的值确实为2。

此时还没有收到信号，因此__g_signals = {0, 0}。由于其中一个线程已经调用futex_wait进行sleep，因此__g_refs = {2, 0}。

```shell
[root@localhost test]# gdb a.out  -q
Reading symbols from a.out...done.
(gdb) b 20
Breakpoint 1 at 0x400968: file test.cpp, line 20.
(gdb) r
Starting program: /home/work/cpp_proj/test/a.out
Missing separate debuginfos, use: yum debuginfo-install glibc-2.28-164.el8.x86_64
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".
[New Thread 0x7ffff6ebb700 (LWP 17663)]
this is Process1
[New Thread 0x7ffff66ba700 (LWP 17664)]
[Switching to Thread 0x7ffff6ebb700 (LWP 17663)]

Thread 2 "a.out" hit Breakpoint 1, Process1 (arg=0x0) at test.cpp:20
20                pthread_cond_signal(&cond);
Missing separate debuginfos, use: yum debuginfo-install libgcc-8.5.0-4.el8_5.x86_64 libstdc++-8.5.0-4.el8_5.x86_64
(gdb) p cond
$1 = {__data = {{__wseq = 2, __wseq32 = {__low = 2, __high = 0}}, {__g1_start = 0, __g1_start32 = {__low = 0,
        __high = 0}}, __g_refs = {2, 0}, __g_size = {0, 0}, __g1_orig_size = 0, __wrefs = 8, __g_signals = {0, 0}},
  __size = "\002", '\000' <repeats 15 times>, "\002", '\000' <repeats 19 times>, "\b\000\000\000\000\000\000\000\000\000\000", __align = 2}
(gdb)
```

接下来我们使用next，使得其中一个线程进行signal操作。

signal操作的g1切换的过程中将修改__wseq的值，会将__wseq和1做异或操作。

```2 ^ 1 = 3```，因此此时cond中的__wseq的值为3。

此时的g1为0，因此 __g_signals = {2, 0}。

```shell
(gdb) n
26           pthread_mutex_unlock(&mutex);
(gdb) p cond
$2 = {__data = {{__wseq = 3, __wseq32 = {__low = 3, __high = 0}}, {__g1_start = 1, __g1_start32 = {__low = 1,
        __high = 0}}, __g_refs = {2, 0}, __g_size = {0, 0}, __g1_orig_size = 4, __wrefs = 8, __g_signals = {2, 0}},
  __size = "\003\000\000\000\000\000\000\000\001\000\000\000\000\000\000\000\002", '\000' <repeats 15 times>, "\004\000\000\000\b\000\000\000\002\000\000\000\000\000\000", __align = 3}

```


接下来，继续运行，其中一个线程再次进行了wait，这个时候__wseq为5。 之前__wseq为3，加上2，因此等于5。

```shell
(gdb) shell
Continuing.
this is Process2,i=2
this is Process1

Thread 2 "a.out" hit Breakpoint 1, Process1 (arg=0x0) at test.cpp:20
20                pthread_cond_signal(&cond);
(gdb) p cond
$3 = {__data = {{__wseq = 5, __wseq32 = {__low = 5, __high = 0}}, {__g1_start = 1, __g1_start32 = {__low = 1,
        __high = 0}}, __g_refs = {0, 2}, __g_size = {0, 0}, __g1_orig_size = 4, __wrefs = 8, __g_signals = {0, 0}},
  __size = "\005\000\000\000\000\000\000\000\001", '\000' <repeats 11 times>, "\002", '\000' <repeats 11 times>, "\004\000\000\000\b\000\000\000\000\000\000\000\000\000\000", __align = 5}
(gdb)

```

接下来我们使用next，使得其中一个线程进行signal操作。

原先__wseq为5，这里和1异或

```5 ^ 1 = 4```，因此此时cond中的__wseq的值为4。

signal操作可能会导致__wseq从奇数跳变为偶数，或者从偶数跳变为奇数。

```shell
(gdb) n
26           pthread_mutex_unlock(&mutex);
(gdb) p cond
$4 = {__data = {{__wseq = 4, __wseq32 = {__low = 4, __high = 0}}, {__g1_start = 2, __g1_start32 = {__low = 2,
        __high = 0}}, __g_refs = {0, 2}, __g_size = {0, 0}, __g1_orig_size = 4, __wrefs = 8, __g_signals = {0, 2}},
  __size = "\004\000\000\000\000\000\000\000\002", '\000' <repeats 11 times>, "\002", '\000' <repeats 11 times>, "\004\000\000\000\b\000\000\000\000\000\000\000\002\000\000", __align = 4}

```



## PS

### 1.异或操作

异或操作的计算如下所示，不同得1，相同得0。

```shell
0 ^ 0 = 0
0 ^ 1 = 1
1 ^ 0 = 1
1 ^ 1 = 0
```

## 参考文章

https://zhuanlan.zhihu.com/p/374385534

https://blog.csdn.net/weixin_34128411/article/details/88883008