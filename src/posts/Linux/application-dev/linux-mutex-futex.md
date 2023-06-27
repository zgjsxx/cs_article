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

看看最简单的类型PTHREAD_MUTEX_TIMED_NP：

```cpp
  if (__glibc_likely (type == PTHREAD_MUTEX_TIMED_NP))
    {
      FORCE_ELISION (mutex, goto elision);
    simple:
      /* Normal mutex.  */
      LLL_MUTEX_LOCK (mutex);
      assert (mutex->__data.__owner == 0);
    }
```

当锁的类型是最简单的类型时，会进入上面的分支，最后调用了LLL_MUTEX_LOCK方法。

LLL_MUTEX_LOCK的定义如下所示：

```cpp
#ifndef LLL_MUTEX_LOCK
# define LLL_MUTEX_LOCK(mutex) \
  lll_lock ((mutex)->__data.__lock, PTHREAD_MUTEX_PSHARED (mutex))
```

lll_lock定义在lowlevellock.h中

```C
#define lll_lock(futex, private) \
  (void)								      \
    ({ int ignore1, ignore2;						      \
       if (__builtin_constant_p (private) && (private) == LLL_PRIVATE)	      \
	 __asm __volatile (__lll_lock_asm_start				      \
			   "jz 18f\n\t"				      \
			   "1:\tleal %2, %%ecx\n"			      \
			   "2:\tcall __lll_lock_wait_private\n" 	      \
			   "18:"					      \
			   : "=a" (ignore1), "=c" (ignore2), "=m" (futex)     \
			   : "0" (0), "1" (1), "m" (futex),		      \
			     "i" (MULTIPLE_THREADS_OFFSET)		      \
			   : "memory");					      \
       else								      \
	 {								      \
	   int ignore3;							      \
	   __asm __volatile (__lll_lock_asm_start			      \
			     "jz 18f\n\t"			 	      \
			     "1:\tleal %2, %%edx\n"			      \
			     "0:\tmovl %8, %%ecx\n"			      \
			     "2:\tcall __lll_lock_wait\n"		      \
			     "18:"					      \
			     : "=a" (ignore1), "=c" (ignore2),		      \
			       "=m" (futex), "=&d" (ignore3) 		      \
			     : "1" (1), "m" (futex),			      \
			       "i" (MULTIPLE_THREADS_OFFSET), "0" (0),	      \
			       "g" ((int) (private))			      \
			     : "memory");				      \
	 }								      \
    })

```


```cpp
void
__lll_lock_wait_private (int *futex)
{
  if (*futex == 2)
    lll_futex_wait (futex, 2, LLL_PRIVATE); /* Wait if *futex == 2.  */

  while (atomic_exchange_acq (futex, 2) != 0)
    lll_futex_wait (futex, 2, LLL_PRIVATE); /* Wait if *futex == 2.  */
}
```

```cpp
void
__lll_lock_wait (int *futex, int private)
{
  if (*futex == 2)
    lll_futex_wait (futex, 2, private); /* Wait if *futex == 2.  */

  while (atomic_exchange_acq (futex, 2) != 0)
    lll_futex_wait (futex, 2, private); /* Wait if *futex == 2.  */
}
```