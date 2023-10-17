# cmake set命令

https://blog.csdn.net/Jay_Xio/article/details/121033423


# cmake find_package

DemoExampleRepo\cmake\demo\find_package_module_demo1



删除make install的文件

在build的目录下，cmake会生成名叫**install_manifest.txt**的文件，这个文件记录了所有install的文件。因此可以使用下面的命令删除所有install的文件：

```shell
xargs rm < install_manifest.txt
```

在cmake中打印消息

```shell
 message( [STATUS|WARNING|AUTHOR_WARNING|FATAL_ERROR|SEND_ERROR]
  "message to display" ...)
```

```shell
(无) = 重要消息；
 STATUS = 非重要消息；
 WARNING = CMake 警告, 会继续执行；
 AUTHOR_WARNING = CMake 警告 (dev), 会继续执行；
 SEND_ERROR = CMake 错误, 继续执行，但是会跳过生成的步骤；
 FATAL_ERROR = CMake 错误, 终止所有处理过程；
```

例子：

```shell
message(STATUS "CMAKE_SOURCE_DIR = ${CMAKE_SOURCE_DIR}")
```