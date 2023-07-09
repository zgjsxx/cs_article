# mysql 8.0.33源码编译

源码地址为：

https://github.com/mysql/mysql-server/archive/refs/tags/mysql-8.0.33.tar.gz


使用cmake进行编译：

```shell
yum install ncurses-devel

yum install libtirpc-devel

dnf --enablerepo=devel install libtirpc-devel

yum install libudev-devel
```

```shell
mkdir build
cd build
cmake .. -DWITH_DEBUG=1 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/home/work/cpp_proj/mysql-server-mysql-8.0.33/build/boost
```

