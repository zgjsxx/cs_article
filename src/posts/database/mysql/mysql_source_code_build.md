---
category: 
- Mysql
---

# mysql 8.0.33源码编译及调试记录

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

注意**bison**依赖如果没有，只会有一个warning提示。但是这里是需要安装的，否则将会出现下面的错误：

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

检查编译后的mysqld文件中是否有debug信息，可以使用readelf命令进行查看。从下面的输出可以看到，**mysqld**文件中拥有了调试符号。

```shell
[root@localhost bin]# readelf -S mysqld|grep debug
  [32] .debug_aranges    PROGBITS         0000000000000000  086bb4ac
  [33] .debug_info       PROGBITS         0000000000000000  08f2606c
  [34] .debug_abbrev     PROGBITS         0000000000000000  1f73872e
  [35] .debug_line       PROGBITS         0000000000000000  1ffdc331
  [36] .debug_str        PROGBITS         0000000000000000  21fdea2c
  [37] .debug_line_str   PROGBITS         0000000000000000  2955deee
  [38] .debug_rnglists   PROGBITS         0000000000000000  2959b809
  ```

在下面的步骤中，将尝试运行mysql，并对其进行调试。

## 运行mysql

mysql的server文件名是mysqld。如果直接使用mysqld运行可能会遇到下面的错误。

```shell
[root@localhost bin]# ./mysqld
2023-07-10T07:20:18.057441Z 0 [System] [MY-010116] [Server] /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/runtime_output_directory/mysqld (mysqld 8.0.33-debug) starting as process 82471
2023-07-10T07:20:18.066237Z 0 [Warning] [MY-010091] [Server] Can't create test file /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/data/mysqld_tmp_file_case_insensitive_test.lower-test
2023-07-10T07:20:18.066251Z 0 [Warning] [MY-010159] [Server] Setting lower_case_table_names=2 because file system for /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/data/ is case insensitive
2023-07-10T07:20:18.067139Z 0 [ERROR] [MY-010123] [Server] Fatal error: Please read "Security" section of the manual to find out how to run mysqld as root!
2023-07-10T07:20:18.067249Z 0 [ERROR] [MY-010119] [Server] Aborting
2023-07-10T07:20:18.071351Z 0 [System] [MY-010910] [Server] /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/runtime_output_directory/mysqld: Shutdown complete (mysqld 8.0.33-debug)  Source distribution.
```

注意，mysql如果要使用root用户启动，需要增加```--user=root```，如下所示：

```shell
./mysql --user=root
```

除此以外，在运行之前可能需要初始化data目录，使用下面的语句可以完成初始化操作。

```shell
./mysqld --initialize --console
```

初始化的过程中，会打印出默认的root密码，这里记下来。

```shell
2023-07-10T10:17:45.487502Z 0 [System] [MY-013169] [Server] /home/work/cpp_proj/mysql-server-mysql-8.0.33/build/runtime_output_directory/mysqld (mysqld 8.0.33-debug) initializing of server in progress as process 144794
2023-07-10T10:17:45.502792Z 1 [System] [MY-013576] [InnoDB] InnoDB initialization has started.
2023-07-10T10:17:46.365687Z 1 [System] [MY-013577] [InnoDB] InnoDB initialization has ended.
2023-07-10T10:17:54.519035Z 6 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: Ywcl7uFuSy/f
```

初次登录时，可以使用该密码进行登录。

```shell
./mysql -uroot -p'Ywcl7uFuSy/f'
```

初次登录后，可以使用```mysqladmin```对密码进行修改。

```./mysqladmin -uroot -p'Jxp)CLWqW9,-'  password 111111```

到此位置，已经可以成功的启动mysql，下面尝试调试mysql。

## gdb 调试

本节中尝试使用gdb对mysql进行调试。

在Inodb的行记录中，有一个字段是heap_no，占用 13 比特，表示当前记录在页面堆中的相对位置。其中0和1有特殊用途，因此页面中的第一条记录heap_no为2， 第二条记录heap_no为3，以此类推。

下面使用gdb进行验证这一点。

首先做一些初始化工作，建立一个demo的database，并且创建一张user_tbl的表，这个表比较简单，仅仅有两个字段，一个字段是user_id，一个字段是user_name。

```shell
create database demo;
CREATE TABLE IF NOT EXISTS `user_tbl`(
   `user_id` INT UNSIGNED AUTO_INCREMENT,
   `user_name` VARCHAR(40) NOT NULL,
   PRIMARY KEY ( `user_id` )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
insert into user_tbl values(1,'zhangsan1');
insert into user_tbl values(2,'zhangsan2')；

```

如果建表成功，此时表中应该有这样2条数据。

```shell
mysql> select * from user_tbl;
+---------+-----------+
| user_id | user_name |
+---------+-----------+
|       1 | zhangsan1 |
|       2 | zhangsan1 |
+---------+-----------+
2 rows in set (0.00 sec)
```

这个时候使用```gdb attach <mysql_pid>```附加到进程中。在lock_rec_lock方法上下一个断点。至于为什么在这个函数上下断点，无需理解，仅仅要知道后面打印的rec_lock变量中含有heap_no的值。

```shell
[root@localhost bin]# gdb attach 27536
For help, type "help".
Type "apropos word" to search for commands related to "word"...
attach: No such file or directory.
Attaching to process 27536
[New LWP 27545]
[New LWP 27546]
[New LWP 27547]
[New LWP 27548]
[New LWP 27549]
[New LWP 27550]
[New LWP 27551]
[New LWP 27552]
[New LWP 27553]
[New LWP 27554]
[New LWP 27556]
[New LWP 27557]
[New LWP 27558]
[New LWP 27559]
[New LWP 27560]
[New LWP 27561]
[New LWP 27564]
[New LWP 27565]
[New LWP 27566]
[New LWP 27573]
[New LWP 27574]
[New LWP 27575]
[New LWP 27576]
[New LWP 27577]
[New LWP 27578]
[New LWP 27579]
[New LWP 27583]
[New LWP 27584]
[New LWP 27585]
[New LWP 27586]
[New LWP 27587]
[New LWP 27588]
[New LWP 27595]
[New LWP 27596]
[New LWP 27597]
[New LWP 27599]
[New LWP 28275]
[New LWP 31905]
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib64/libthread_db.so.1".
Missing separate debuginfos, use: dnf debuginfo-install glibc-2.34-28.el9_0.2.x86_64 libgcc-11.2.1-9.4.el9.x86_64 libstdc++-11.2.1-9.4.el9.x86_64 openssl-libs-3.0.7-16.el9_2.x86_64 sssd-client-2.6.2-4.el9_0.x86_64 zlib-1.2.11-31.el9_0.1.x86_64
--Type <RET> for more, q to quit, c to continue without paging--
0x00007f7c9663eedf in poll () from /lib64/libc.so.6
(gdb)
(gdb) b lock0lock.cc:1736
Breakpoint 1 at 0x4d9f25f: file /home/work/cpp_proj/mysql-server-mysql-8.0.33/storage/innobase/lock/lock0lock.cc, line 1736.
(gdb) c
Continuing.
```

在另一个窗口的mysql客户端中，输入下面的update命令更新```user_id=2```的记录。
```shell
update user_tbl set user_name = 'zhangsan1' where user_id = 2;
```

这个时候gdb窗口会停在断点上，在gdb窗口中打印rec_lock的值。可以看到m_heap_no = 3，代表该页面中的第二条记录， 0和1有特殊用途，因此3代表第2条记录。

```shell
[New Thread 0x7f7d284f6640 (LWP 33651)]
[Switching to Thread 0x7f7d284f6640 (LWP 33651)]

Thread 39 "connection" hit Breakpoint 1, lock_rec_lock_fast (impl=false, mode=1027, block=0x7f7d4bb1ab30, heap_no=3,
    index=0x7f7d40164188, thr=0x7f7d400ff428) at /home/work/cpp_proj/mysql-server-mysql-8.0.33/storage/innobase/lock/lock0lock.cc:1736
1736          trx_mutex_enter(trx);
(gdb) p rec_lock
$1 = {m_thr = 0x0, m_trx = 0x0, m_mode = 1027, m_size = 9, m_index = 0x7f7d40164188, m_rec_id = {m_page_id = {m_space = 3,
      m_page_no = 4}, m_heap_no = 3, m_hash_value = 6610858507835779226}}
(gdb) c
Continuing.
[Thread 0x7f7d286f8640 (LWP 33266) exited]
```

在另一个窗口的mysql客户端中，输入下面的update命令更新```user_id=1```的记录。

```shell
update user_tbl set user_name = 'zhangsan1' where user_id = 1;
```

这个时候gdb窗口会停在断点上，在gdb窗口中打印rec_lock的值。可以看到m_heap_no = 2，代表该页面中的第二条记录， 0和1有特殊用途，因此2代表第1条记录。

```shell
Thread 39 "connection" hit Breakpoint 1, lock_rec_lock_fast (impl=false, mode=1027, block=0x7f7d4bb1ab30, heap_no=2,
    index=0x7f7d40164188, thr=0x7f7d400ff428) at /home/work/cpp_proj/mysql-server-mysql-8.0.33/storage/innobase/lock/lock0lock.cc:1736
1736          trx_mutex_enter(trx);
(gdb) p rec_lock
$2 = {m_thr = 0x0, m_trx = 0x0, m_mode = 1027, m_size = 9, m_index = 0x7f7d40164188, m_rec_id = {m_page_id = {m_space = 3,
      m_page_no = 4}, m_heap_no = 2, m_hash_value = 6610858507835779226}}

```

到此为止，调试完毕，验证了heap_no的含义。该调试没有任何现实含义，仅仅是一个练手的记录。