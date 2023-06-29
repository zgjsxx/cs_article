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

- __wrefs: 等待的线程数
- __wseq32：等待的序列号

## ___pthread_cond_signal


## 参考文章

https://zhuanlan.zhihu.com/p/374385534

https://blog.csdn.net/weixin_34128411/article/details/88883008