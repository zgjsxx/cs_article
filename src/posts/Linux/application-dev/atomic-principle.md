---
category: 
- Linux
---


# 原子变量的底层实现原理


```c
//n++
type __sync_fetch_and_add (type *ptr, type value); //m + n
type __sync_fetch_and_sub (type *ptr, type value); //m - n
type __sync_fetch_and_or (type *ptr, type value);  //m | n
type __sync_fetch_and_and (type *ptr, type value); //m & n
type __sync_fetch_and_xor (type *ptr, type value); //m ^ n
type __sync_fetch_and_nand (type *ptr, type value);//(!m)& n

//++n
type __sync_add_and_fetch (type *ptr, type value); //m + n
type __sync_sub_and_fetch (type *ptr, type value); //m - n
type __sync_or_and_fetch (type *ptr, type value);  //m | n
type __sync_and_and_fetch (type *ptr, type value); //m & n
type __sync_xor_and_fetch (type *ptr, type value); //m ^ n
type __sync_nand_and_fetch (type *ptr, type value);//(!m)& n

//CAS类
bool__sync_bool_compare_and_swap(type* ptr, type oldval, type newval, ...);
type __sync_val_compare_and_swap(type* ptr, type oldval, type newval, ...);
/*
对应的伪代码
{if (*ptr == oldval) { *ptr = newval; returntrue; } else { returnfalse; }}
{if (*ptr == oldval) { *ptr = newval; }returnoldval; }
*/
```

## Lock指令


>User level locks involve utilizing the atomic instructions of processor to atomically update a memory space. 
>The atomic instructions involve utilizing a lock prefix on the instruction and having the destination operand assigned to a memory address. 
>The following instructions can run atomically with a lock prefix on current Intel processors: ADD, ADC, AND, BTC, BTR, BTS, CMPXCHG, CMPXCH8B, DEC, INC, NEG, NOT, OR, SBB, SUB, XOR, XADD, and XCHG. EnterCriticalSection utilizes atomic instructions to attempt to get a user-land lock before jumping into the kernel. On most instructions a lock prefix must be explicitly used except for the xchg instruction where the lock prefix is implied if the instruction involves a memory address.

>In the days of Intel 486 processors, the lock prefix used to assert a lock on the bus along with a large hit in performance.
>Starting with the Intel Pentium Pro architecture, the bus lock is transformed into a cache lock. 
>A lock will still be asserted on the bus in the most modern architectures if the lock resides in uncacheable memory or if the lock extends beyond a cache line boundary splitting cache lines. 

>Both of these scenarios are unlikely, so most lock prefixes will be transformed into a cache lock which is much less expensive.



## 锁总线


## 锁cache


## 参考文章  

https://www.cnblogs.com/cnblogs-wangzhipeng/p/12549179.html

https://stackoverflow.com/questions/14758088/how-are-atomic-operations-implemented-at-a-hardware-level