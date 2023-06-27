---
category: 
- Linux
---

# 深入了解glibc的互斥锁

互斥锁是多线程同步时常用的手段，本文以glibc中mutex的实现为例，讲解其背后的实现原理。

## glibc mutex

pthread_mutex_t变量有四种属性

- PTHREAD_MUTEX_TIMED_NP： 普通锁
- PTHREAD_MUTEX_RECURSIVE_NP: 可重入锁
- PTHREAD_MUTEX_ERRORCHECK_NP: 检错锁
- PTHREAD_MUTEX_ADAPTIVE_NP: 自适应锁

本文使用的源码是glibc-2.34版本，http://mirror.keystealth.org/gnu/libc/glibc-2.34.tar.gz。

看看最简单的类型PTHREAD_MUTEX_TIMED_NP：
```cpp
  if (__builtin_expect (type & ~(PTHREAD_MUTEX_KIND_MASK_NP
				 | PTHREAD_MUTEX_ELISION_FLAGS_NP), 0))
    return __pthread_mutex_lock_full (mutex);

  if (__glibc_likely (type == PTHREAD_MUTEX_TIMED_NP))
    {
      FORCE_ELISION (mutex, goto elision);
    simple:
      /* Normal mutex.  */
      LLL_MUTEX_LOCK_OPTIMIZED (mutex);
      assert (mutex->__data.__owner == 0);
    }
```

```c
#ifndef LLL_MUTEX_LOCK
/* lll_lock with single-thread optimization.  */
static inline void
lll_mutex_lock_optimized (pthread_mutex_t *mutex)
{
  /* The single-threaded optimization is only valid for private
     mutexes.  For process-shared mutexes, the mutex could be in a
     shared mapping, so synchronization with another process is needed
     even without any threads.  If the lock is already marked as
     acquired, POSIX requires that pthread_mutex_lock deadlocks for
     normal mutexes, so skip the optimization in that case as
     well.  */
  int private = PTHREAD_MUTEX_PSHARED (mutex);
  if (private == LLL_PRIVATE && SINGLE_THREAD_P && mutex->__data.__lock == 0)
    mutex->__data.__lock = 1;
  else
    lll_lock (mutex->__data.__lock, private);
}

# define LLL_MUTEX_LOCK(mutex)						\
  lll_lock ((mutex)->__data.__lock, PTHREAD_MUTEX_PSHARED (mutex))
```

```c
#define __lll_lock(futex, private)                                      \
  ((void)                                                               \
   ({                                                                   \
     int *__futex = (futex);                                            \
     if (__glibc_unlikely                                               \
         (atomic_compare_and_exchange_bool_acq (__futex, 1, 0)))        \
       {                                                                \
         if (__builtin_constant_p (private) && (private) == LLL_PRIVATE) \
           __lll_lock_wait_private (__futex);                           \
         else                                                           \
           __lll_lock_wait (__futex, private);                          \
       }                                                                \
   }))
#define lll_lock(futex, private)	\
  __lll_lock (&(futex), private)
```

```c
void
__lll_lock_wait_private (int *futex)
{
  if (atomic_load_relaxed (futex) == 2)
    goto futex;

  while (atomic_exchange_acquire (futex, 2) != 0)
    {
    futex:
      LIBC_PROBE (lll_lock_wait_private, 1, futex);
      futex_wait ((unsigned int *) futex, 2, LLL_PRIVATE); /* Wait if *futex == 2.  */
    }
}
libc_hidden_def (__lll_lock_wait_private)

void
__lll_lock_wait (int *futex, int private)
{
  if (atomic_load_relaxed (futex) == 2)
    goto futex;

  while (atomic_exchange_acquire (futex, 2) != 0)
    {
    futex:
      LIBC_PROBE (lll_lock_wait, 1, futex);
      futex_wait ((unsigned int *) futex, 2, private); /* Wait if *futex == 2.  */
    }
}
```


```c
static __always_inline int
futex_wait (unsigned int *futex_word, unsigned int expected, int private)
{
  int err = lll_futex_timed_wait (futex_word, expected, NULL, private);
  switch (err)
    {
    case 0:
    case -EAGAIN:
    case -EINTR:
      return -err;

    case -ETIMEDOUT: /* Cannot have happened as we provided no timeout.  */
    case -EFAULT: /* Must have been caused by a glibc or application bug.  */
    case -EINVAL: /* Either due to wrong alignment or due to the timeout not
		     being normalized.  Must have been caused by a glibc or
		     application bug.  */
    case -ENOSYS: /* Must have been caused by a glibc bug.  */
    /* No other errors are documented at this time.  */
    default:
      futex_fatal_error ();
    }
}

```

```c
# define lll_futex_timed_wait(futexp, val, timeout, private)     \
  lll_futex_syscall (4, futexp,                                 \
		     __lll_private_flag (FUTEX_WAIT, private),  \
		     val, timeout)

# define lll_futex_syscall(nargs, futexp, op, ...)                      \
  ({                                                                    \
    long int __ret = INTERNAL_SYSCALL (futex, nargs, futexp, op, 	\
				       __VA_ARGS__);                    \
    (__glibc_unlikely (INTERNAL_SYSCALL_ERROR_P (__ret))         	\
     ? -INTERNAL_SYSCALL_ERRNO (__ret) : 0);                     	\
  })
```

INTERNAL_SYSCALL的第一个参数是系统调用名字，使用SYS_ify宏拼接出了系统调用号__NR_futex（202）。

```cpp
#define __NR_futex 202
#undef INTERNAL_SYSCALL
#define INTERNAL_SYSCALL(name, nr, args...)				\
	internal_syscall##nr (SYS_ify (name), args)

#undef SYS_ify
#define SYS_ify(syscall_name)	__NR_##syscall_name
```

internal_syscall4就是4个参数的系统调用方法，在方法内进入了内核态方法sys_futex。

```cpp
#undef internal_syscall4
#define internal_syscall4(number, arg1, arg2, arg3, arg4)		\
({									\
    unsigned long int resultvar;					\
    TYPEFY (arg4, __arg4) = ARGIFY (arg4);			 	\
    TYPEFY (arg3, __arg3) = ARGIFY (arg3);			 	\
    TYPEFY (arg2, __arg2) = ARGIFY (arg2);			 	\
    TYPEFY (arg1, __arg1) = ARGIFY (arg1);			 	\
    register TYPEFY (arg4, _a4) asm ("r10") = __arg4;			\
    register TYPEFY (arg3, _a3) asm ("rdx") = __arg3;			\
    register TYPEFY (arg2, _a2) asm ("rsi") = __arg2;			\
    register TYPEFY (arg1, _a1) asm ("rdi") = __arg1;			\
    asm volatile (							\
    "syscall\n\t"							\
    : "=a" (resultvar)							\
    : "0" (number), "r" (_a1), "r" (_a2), "r" (_a3), "r" (_a4)		\
    : "memory", REGISTERS_CLOBBERED_BY_SYSCALL);			\
    (long int) resultvar;						\
})
```

## futex

总结下futex_wait流程：

加自旋锁
检测*uaddr是否等于val，如果不相等则会立即返回
将进程状态设置为TASK_INTERRUPTIBLE
将当期进程插入到等待队列中
释放自旋锁
创建定时任务：当超过一定时间还没被唤醒时，将进程唤醒
挂起当前进程

futex_wake流程如下：

找到uaddr对应的futex_hash_bucket，即代码中的hb
对hb加自旋锁
遍历fb的链表，找到uaddr对应的节点
调用wake_futex唤起等待的进程
释放自旋锁

作者：做个好人君
链接：https://juejin.cn/post/6844903688478146574
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。


http://blog.foool.net/2021/04/futex-%E7%BB%BC%E8%BF%B0/