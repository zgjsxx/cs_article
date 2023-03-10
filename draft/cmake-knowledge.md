add_library() 指定从某些源文件创建库。

```c
add_library(hello_library STATIC
        src/hello.cpp
        )
```

此命令将使用add_library()调用中的源代码创建一个名为libhello_library.a的静态库
- add_library: 生成动态库或静态库
 - 第1个参数指定库的名字；
 - 第2个参数决定是动态还是静态，如果没有就默认静态；(SHARED |STATIC)
 - 第3个参数指定生成库的源文件