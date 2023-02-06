

Linux 进程页表的加载
```c
struct mm_struct {
......
	pgd_t * pgd;
......
};
```

pgd_t定义如下：
```c
typedef unsigned long   pgdval_t;
typedef struct { pgdval_t pgd; } pgd_t;
```


以x86为例，进程页表的加载是通过将mm_struct->pgd复制到cr3寄存器中。




## 参考文献
https://draapho.github.io/2017/01/26/1704-linux-source1/