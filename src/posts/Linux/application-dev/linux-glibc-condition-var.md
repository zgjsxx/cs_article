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
- __g1_orig_size: G1的原始长度
- __wseq32：等待的序列号
- __g_refs: futex wait的引用计数
- __g_signals：可以被消费的信号数
- __g_size：g1和g2队列的长度
- 
## ___pthread_cond_signal

 * 1. 检查 cond __wseq, 若没有waiter则直接返回
 * 2. 有waiter, 检查是否需要切换组(例如首次调用 wait 后 G1 为空，G2有一个等待者，则首次调用 signal 后需要将 G2 切换为 G1)
 * 3. 递增 __g_signals, 递减__g_size(未唤醒的waiters个数)，再调用futex_wake

首先读取条件变量的等待任务的数量。 ```wref >> 3``` 等同于```wref/8```，wref每次是按照8递增的，在pthread_conf_wait函数中有相应实现。

如果没有等待的任务，就不用发送信号，于是直接返回。

```c
  unsigned int wrefs = atomic_load_relaxed (&cond->__data.__wrefs);
  if (wrefs >> 3 == 0)
    return 0;
```

这里获取条件变量中的序列号，通过序列号来获取现在的g1数组的下标（0或者1）。
```c
  unsigned long long int wseq = __condvar_load_wseq_relaxed (cond);
  unsigned int g1 = (wseq & 1) ^ 1;
  wseq >>= 1;
  bool do_futex_wake = false;
```

这里首先检查g1的队列中是否有waiter，如果有，直接将g1对应的信号数组的值+2，并将g1对应的waiter数组减去1。

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

__condvar_quiesce_and_switch_g1将会对g1和g2做切换。单词quiesce翻译为安静。意思是条件变量安静的切换g1数组。

接下来将互斥锁进行释放，接着如果需要进入内核，则调用futex_wake对waiter进行唤醒。

```c
  __condvar_release_lock (cond, private);

  if (do_futex_wake)
    futex_wake (cond->__data.__g_signals + g1, 1, private);
```



异或操作：

```shell
0 ^ 0 = 0
0 ^ 1 = 1
1 ^ 0 = 1
1 ^ 1 = 0
```

## pthread_cond_wait

pthread_cond_wait是等待条件变量的方法，其过程如下所示：

1. 注册waiter到cond 的 _wseq 队列 （分为G1 G2两个组）
2. 释放互斥锁
3. 自旋等待，检查 __g_signals，自旋次数结束，进入 futex_wait_cancelable，休眠
4. 完成后，需要对mutex进行加锁


下面就对照源码进行解析。

pthread_cond_wait首先会获取一个等待的序列号。条件变量的结构体中有一个字段是__wseq，这个便是所谓的序列号，每次pthread_cond_wait都会将序列号加上2。

从条件变量的初始化可以知道，wseq初始值为0。而wseq每次原子地递增2，因此当前wseq是一个偶数。当g1和g2发生切换时，wseq会发生变化

```c
#define PTHREAD_COND_INITIALIZER { { {0}, {0}, {0, 0}, {0, 0}, 0, 0, {0, 0} } }
```


接下来讲wseq和1进行与操作，由于wseq为偶数，因此g等于0。于是这个时候会将waiter放在g1队列中。


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

## gdb观察条件变量的内部值的变化

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

在上文中，我们知道，pthread_cond_wait每次会首先获取一个序列号，并将该序列号加上2。从上述的打印中的内容，我们看到__wseq的值确实为2。

接下来我们使用next，使得其中一个线程进行signal操作。

signal操作的g1切换的过程中将修改__wseq的值，会将__wseq和1做异或操作。

```2 ^ 1 = 3```，因此此时cond中的__wseq的值为3。

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

## 参考文章

https://zhuanlan.zhihu.com/p/374385534

https://blog.csdn.net/weixin_34128411/article/details/88883008