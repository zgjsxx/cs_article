---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理asm.s详解


## 模块简介

该模块和CPU异常处理相关，在代码结构上asm.s和traps.c强相关。 CPU探测到异常时，主要分为两种处理方式，一种是有错误码，另一种是没有错误码，对应的方法就是**error_code**和**no_error_code**。在下面的函数详解中，将主要以两个函数展开。

## 函数详解

### no_error_code


### error_code



## Q & A