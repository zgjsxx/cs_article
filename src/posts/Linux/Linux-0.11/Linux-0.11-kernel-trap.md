---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理trap.c详解

## 函数详解

### die
```c
static void die(char * str,long esp_ptr,long nr)
```

### do_double_fault
```c
void do_double_fault(long esp, long error_code)
```

### do_general_protection
```c
void do_general_protection(long esp, long error_code)
```


### do_divide_error
```c
void do_divide_error(long esp, long error_code)
```

### do_int3
```c
void do_int3(long * esp, long error_code,
		long fs,long es,long ds,
		long ebp,long esi,long edi,
		long edx,long ecx,long ebx,long eax)
``` 

### do_nmi
```c
void do_nmi(long esp, long error_code)
```

### do_debug
```c
void do_debug(long esp, long error_code)
```

### do_overflow
```c
void do_overflow(long esp, long error_code)
```
### do_bounds
```c
void do_bounds(long esp, long error_code)
```

### do_invalid_op
```c
void do_invalid_op(long esp, long error_code)
```

### do_device_not_available
```c
void do_device_not_available(long esp, long error_code)
```

### do_coprocessor_segment_overrun
```c
void do_coprocessor_segment_overrun(long esp, long error_code)
```

### do_invalid_TSS
```c
void do_invalid_TSS(long esp,long error_code)
```

### do_segment_not_present
```c
void do_segment_not_present(long esp,long error_code)
```

### do_stack_segment
```c
void do_stack_segment(long esp,long error_code)
```

### do_coprocessor_error
```c
void do_coprocessor_error(long esp, long error_code)
```

### do_reserved
```c
void do_reserved(long esp, long error_code)
```

### trap_init
```c
void trap_init(void)
```

## Q & A