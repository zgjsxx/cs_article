---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 入口函数main.c详解

## 模块简介

## 函数详解




### time_init
```c
static void time_init(void)
```

### main
```c
void main(void)	
```
```c
if (memory_end > 16*1024*1024)
    memory_end = 16*1024*1024;
if (memory_end > 12*1024*1024) 
    buffer_memory_end = 4*1024*1024;
else if (memory_end > 6*1024*1024)
    buffer_memory_end = 2*1024*1024;
else
    buffer_memory_end = 1*1024*1024;
```

trap_init函数完成中断处理函数的设置。


### init
```c
void init(void)
```
## Q & A