---
category: 
- Mysql
---

# mysql 8.0.33源码编译

由于想对mysql的行锁的实现进行一些研究，于是希望自己编译mysql的debug版本进行调试，本文用于记录编译的过程。

## 编译步骤

首先需要下载源码，mysql的源码在github上可以找到，这里选择8.0.33版本进行下载，下载地址为：

https://github.com/mysql/mysql-server/archive/refs/tags/mysql-8.0.33.tar.gz

我这里使用的操作系统是rocky linux9，因为其工具链都相对较新。

接下来将使用cmake进行编译，编译之前需要安装一些依赖。

这里列举出了一些可能要安装的包，可能不全，可以根据报错提示去安装。

```shell
yum install gcc-toolset-12-gcc gcc-toolset-12-gcc-c++ gcc-toolset-12-binutils gcc-toolset-12-annobin-annocheck gcc-toolset-12-annobin-plugin-gcc -y

yum install openssl-devel -y

yum install ncurses-devel -y

dnf --enablerepo=devel install libtirpc-devel -y 

yum install rpcgen -y

yum install libudev-devel -y

yum install bison -y
```

注意**bison**依赖如果没有，只会有一个warning提示，这里是需要安装的，否则会出现下面的错误：

```shell
CMake Error at sql/CMakeLists.txt:1294 (MESSAGE):
  Cannot find /home/work/cpp_proj/mysql-server-mysql-8.0.33/sql/sql_yacc.h
```


安装完依赖项目之后，可以尝试使用cmake进行构建。执行make之后就等待就可以了，在我的虚拟机中，make步骤大约需要30min。

```shell
mkdir build
cd build
cmake .. -DWITH_DEBUG=1 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/home/work/cpp_proj/mysql-server-mysql-8.0.33/build/boost \
-DCMAKE_INSTALL_PREFIX=/home/work/cpp_proj/mysql-server-mysql-8.0.33/build/install \
-DMYSQL_DATADIR=/home/work/cpp_proj/mysql-server-mysql-8.0.33/build/install/data

make -j8
```

直到输出了下面的语句后，代表编译成功完成了。

```shell
[100%] Built target routertest_component_http_server
[100%] Built target routertest_component_logging_eventlog
[100%] Built target routertest_component_rest_mock_server
[100%] Built target routertest_component_master_key_reader_writer
[100%] Built target routertest_component_pidfile
[100%] Built target routertest_component_rest_api_enable
[100%] Built target routertest_component_sd_notify
[100%] Built target routertest_component_rest_metadata_cache
[100%] Built target routertest_component_rest_routing
[100%] Built target rest_signal
[100%] Built target routertest_integration_routing_direct
[100%] Built target routertest_integration_routing_reuse
[100%] Built target routertest_integration_routing_sharing
[100%] Built target routertest_integration_routing_sharing_constrained_pools
[100%] Built target routertest_integration_routing_sharing_restart
```

## 运行mysql

```shell
[root@localhost bin]# ./mysqld
2023-07-10T07:20:18.057441Z 0 [System] [MY-010116] [Server] /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/runtime_output_directory/mysqld (mysqld 8.0.33-debug) starting as process 82471
2023-07-10T07:20:18.066237Z 0 [Warning] [MY-010091] [Server] Can't create test file /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/data/mysqld_tmp_file_case_insensitive_test.lower-test
2023-07-10T07:20:18.066251Z 0 [Warning] [MY-010159] [Server] Setting lower_case_table_names=2 because file system for /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/data/ is case insensitive
2023-07-10T07:20:18.067139Z 0 [ERROR] [MY-010123] [Server] Fatal error: Please read "Security" section of the manual to find out how to run mysqld as root!
2023-07-10T07:20:18.067249Z 0 [ERROR] [MY-010119] [Server] Aborting
2023-07-10T07:20:18.071351Z 0 [System] [MY-010910] [Server] /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/runtime_output_directory/mysqld: Shutdown complete (mysqld 8.0.33-debug)  Source distribution.
```

```
./mysqld --initialize --console
```

```
2023-07-10T10:17:45.487502Z 0 [System] [MY-013169] [Server] /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/runtime_output_directory/mysqld (mysqld 8.0.33-debug) initializing of server in progress as process 144794
2023-07-10T10:17:45.502792Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2023-07-10T10:17:46.365687Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
2023-07-10T10:17:54.519035Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: Ywcl7uFuSy/f
```