---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录进程管理sys.c详解

## 模块简介


## 函数详解

### sys_ftime
```c
int sys_ftime()
```

### sys_break
```c
int sys_break()
```

### sys_ptrace
```c
int sys_ptrace()
```


### sys_stty
```c
int sys_stty()
```

### sys_gtty
```c
int sys_gtty()
```

### sys_rename
```c
int sys_rename()
```

### sys_prof
```c
int sys_prof()
```

### sys_setregid
```c
int sys_setregid()
```

### sys_setgid
```c
int sys_setgid()
```

### sys_acct
```c
int sys_acct()
```

### sys_phys
```c
int sys_phys()
```

### sys_lock
```c
int sys_lock()
```


### sys_mpx
```c
int sys_mpx()
```

### sys_ulimit
```c
int sys_ulimit()
```

### sys_time
```c
int sys_time()
```

### sys_setreuid
```c
int sys_setreuid()
```

### sys_setuid
```c
int sys_setuid()
```

### sys_stime
```c
int sys_stime()
```

### sys_times
```c
int sys_times()
```

### sys_brk
```c
int sys_brk()
```

### sys_setpgid
```c
int sys_setpgid()
```

### sys_getpgrp
```c
int sys_getpgrp()
```

### sys_setsid
```c
int sys_setsid()
```

### sys_uname
```c
int sys_uname()
```

### sys_umask
```c
int sys_umask(int mask)
```
设置当前进程创建文件的属性屏蔽码为```(mask & 0777)```。

```0777```代表数字是一个八进制数字，即000111111111。

```c
int old = current->umask;

current->umask = mask & 0777;
return (old);
```


## Q & A