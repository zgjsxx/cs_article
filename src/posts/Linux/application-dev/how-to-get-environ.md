---
category: 
- Linux
---

# c/c++如何通过代码获取到环境变量

## 方法1：通过main函数的参数

```c
#include <stdio.h>

int main(int argc, char* argv[], char* env[])
{
    for(int i = 0; env[i]; i++)
    {
        printf("env[%d]: %s\n", i, env[i]);
    }
}
```

## 方法2： 使用getenv获取指定的环境变量
```c
#include <stdio.h>
#include <stdlib.h>

int main ()
{
   printf("PATH : %s\n", getenv("PATH"));
   printf("HOME : %s\n", getenv("HOME"));

   return(0);
}
```

## 方法3： 通过第三方变量 environ 获取
```c
#include <stdio.h>

int main ()
{
    extern char **environ;
    int i = 0;
    for(;environ[i]; i++)
    {
        printf("env[%d]: %s\n", i, environ[i]);
    }

    return 0;
}
```