# cmake set命令

https://blog.csdn.net/Jay_Xio/article/details/121033423


# cmake find_package

DemoExampleRepo\cmake\demo\find_package_module_demo1



删除make install的文件

在build的目录下，cmake会生成名叫**install_manifest.txt**的文件，这个文件记录了所有install的文件。因此可以使用下面的命令删除所有install的文件：

```shell
xargs rm < install_manifest.txt
```
