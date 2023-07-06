---
category: 
- Linux
---

# 深入了解glibc的信号量


## 源码分析
```c
static int
__new_sem_wait_fast (struct new_sem *sem, int definitive_result)
{
#if __HAVE_64B_ATOMICS
    uint64_t d = atomic_load_relaxed (&sem->data);
    do
        {
        if ((d & SEM_VALUE_MASK) == 0)
            break;
        if (atomic_compare_exchange_weak_acquire (&sem->data, &d, d - 1))
            return 0;
        }
    while (definitive_result);
    return -1;
#else
    unsigned int v = atomic_load_relaxed (&sem->value);
    do
        {
        if ((v >> SEM_VALUE_SHIFT) == 0)
            break;
        if (atomic_compare_exchange_weak_acquire (&sem->value,
                &v, v - (1 << SEM_VALUE_SHIFT)))
            return 0;
        }
    while (definitive_result);
    return -1;
#endif
}
```


|高32位|低32位|
|--|--|
|waiter的数量|信号量当前的值|

```c
static int
__attribute__ ((noinline))
__new_sem_wait_slow64 (struct new_sem *sem, clockid_t clockid,
		       const struct __timespec64 *abstime)
{
    int err = 0;

#if __HAVE_64B_ATOMICS
    uint64_t d = atomic_fetch_add_relaxed (&sem->data,
        (uint64_t) 1 << SEM_NWAITERS_SHIFT);

    pthread_cleanup_push (__sem_wait_cleanup, sem);

    for (;;)
    {
        if ((d & SEM_VALUE_MASK) == 0)
        {
            err = do_futex_wait (sem, clockid, abstime);
            if (err == ETIMEDOUT || err == EINTR || err == EOVERFLOW)
            {
                __set_errno (err);
                err = -1;
                atomic_fetch_add_relaxed (&sem->data,
                -((uint64_t) 1 << SEM_NWAITERS_SHIFT));
                break;
            }
            d = atomic_load_relaxed (&sem->data);
        }
        else
        {
            if (atomic_compare_exchange_weak_acquire (&sem->data,
                &d, d - 1 - ((uint64_t) 1 << SEM_NWAITERS_SHIFT)))
            {
                err = 0;
                break;
            }
        }
    }

    pthread_cleanup_pop (0);
#else
    unsigned int v;

    atomic_fetch_add_acquire (&sem->nwaiters, 1);

    pthread_cleanup_push (__sem_wait_cleanup, sem);
    v = atomic_load_relaxed (&sem->value);
    do
        {
        do
        {
        do
            {
            if ((v & SEM_NWAITERS_MASK) != 0)
            break;
            }
        while (!atomic_compare_exchange_weak_release (&sem->value,
            &v, v | SEM_NWAITERS_MASK));

        if ((v >> SEM_VALUE_SHIFT) == 0)
            {
            err = do_futex_wait (sem, clockid, abstime);
            if (err == ETIMEDOUT || err == EINTR)
            {
            __set_errno (err);
            err = -1;
            goto error;
            }
            err = 0;

            v = atomic_load_relaxed (&sem->value);
            }
        }
        /* If there is no token, we must not try to grab one.  */
        while ((v >> SEM_VALUE_SHIFT) == 0);
        }
    while (!atomic_compare_exchange_weak_acquire (&sem->value,
        &v, v - (1 << SEM_VALUE_SHIFT)));

    error:
    pthread_cleanup_pop (0);

    __sem_wait_32_finish (sem);
#endif

    return err;
}
```

```c
int
__new_sem_post (sem_t *sem)
{
    struct new_sem *isem = (struct new_sem *) sem;
    int private = isem->private;

#if __HAVE_64B_ATOMICS
    uint64_t d = atomic_load_relaxed (&isem->data);
    do
    {
        if ((d & SEM_VALUE_MASK) == SEM_VALUE_MAX)
        {
            __set_errno (EOVERFLOW);
            return -1;
        }
    }
    while (!atomic_compare_exchange_weak_release (&isem->data, &d, d + 1));

    if ((d >> SEM_NWAITERS_SHIFT) > 0)
        futex_wake (((unsigned int *) &isem->data) + SEM_VALUE_OFFSET, 1, private);
#else

    unsigned int v = atomic_load_relaxed (&isem->value);
    do
    {
        if ((v >> SEM_VALUE_SHIFT) == SEM_VALUE_MAX)
        {
            __set_errno (EOVERFLOW);
            return -1;
        }
    }
    while (!atomic_compare_exchange_weak_release
        (&isem->value, &v, v + (1 << SEM_VALUE_SHIFT)));


    if ((v & SEM_NWAITERS_MASK) != 0)
        futex_wake (&isem->value, 1, private);
#endif

    return 0;
}
```