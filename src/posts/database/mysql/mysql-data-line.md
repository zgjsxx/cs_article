---
category: 
- Mysql
---

# mysql中的行格式之compact格式分析

## mysql行格式

所谓行格式，就是指mysql一行数据的存储格式。

InnoDB 储存引擎支持有四种行储存格式：Compact、Redundant、Dynamic 和 Compressed。

Redundant是很古老的行格式了，因为占用空间最多，导致内存碎片化最严重，比较低效，现在基本上已经不用了，

Compact是MySQL 5.0之后引入的行记录存储方式，是一种紧凑的行格式，设计的初衷就是为了让一个数据页中可以存放更多的行记录，从 MySQL 5.1 版本之后，行格式默认设置成 Compact。

Dynamic和Compressed 两个都是紧凑的行格式，它们的行格式都和 Compact 差不多，因为都是基于 Compact进行改进。从 MySQL5.7 版本之后，默认使用 Dynamic 行格式。

应该说Compact格式是一个比较经典的格式，因此本文将以Compact格式为例，详细介绍其具体的内容。

## mysql表的数据存储在哪里？

进入mysql，查看mysql的data目录在哪里，例如下面所示：

```shell
mysql> show variables like "datadir";
+---------------+-----------------+
| Variable_name | Value           |
+---------------+-----------------+
| datadir       | /var/lib/mysql/ |
+---------------+-----------------+
1 row in set (0.00 sec)
```

进入该目录中，会看到一个以database命名的目录，进入该目录中，则会看到一个以表名+.ibd的文件，该文件即是存储mysql表数据的文件。

## COMPACT 行格式长什么样？

compact行格式如下所示：

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/row-format/compact-line.png)

主要分为两个个部分
- 存储的额外数据
- 存储的真实数据

存储的额外数据中包含了**变长数据列的长度**，**NULL值的列表**，**记录头信息**。

存储的真实数据中包含了**三个隐藏列**和**真实数据**。

首先看存储的额外数据。

存储的额外数据的第一块用于**记录变长数据列的长度**，其排放顺序是**逆序排放**的。

例如下面这张表，name和city列为变长字段，由于是逆序排放的，第一条记录的变长数据列的长度的值为```07 03```

```shell
+------+-------+---------+-------+
| id   | name  | city    | level |
+------+-------+---------+-------+
|    0 | tom   | Nanjing | a     |
|    1 | kitty | Beijing | b     |
|    2 | simth | Wuhan   | c     |
+------+-------+---------+-------+
```

额外数据的第二块是**记录NULL值的列表**，它使用bit来标记列值是否为空。其低位（最右侧的位）标记第0个列是否为NULL。

例如这里的第一条记录，其city列为NULL，因此其NULL列的值为```00000100```，为04。

```shell
+------+-------+---------+-------+
| id   | name  | city    | level |
+------+-------+---------+-------+
|    0 | Nancy | NULL    | c     |
|    1 | NULL  | NULL    | c     |
```

额外数据的第三块是**记录头信息**，其格式如下所示，共5个字节：

|名称|	大小 (bit) |	描述 |
|---| --- | --- |
|预留位1	|1	|没有使用|
|预留位2	|1|	没有使用|
|delete_mask|	1	|标记该记录是否被删除|
|min_rec_mask|	1	|B+树里每一层的非叶子节点里的最小值都有这个标记|
|n_owned|	4	|表示当前记录拥有的记录数|
|heap_no	|13|	表示当前记录在记录堆的位置信息|
|record_type|	3	|标识当前记录的类型：0代表的是普通类型，1代表的是B+树非叶子节点，2代表的是最小值数据，3代表的是最大值数据。|
|next_record	|16|	表示下一条记录的相对位置|

接下来是存储的真实数据部分：

其第一部分包含三个隐藏列，其格式如下所示：
- DB_ROW_ID：该字段占6个字节，用于标识一条记录
- DB_TRX_ID：该字段占6个字节，其值为事务ID
- DB_ROLL_PTR：该字段占7个字节，其值为回滚指针

其第二部分存储的就是每个非NULL列真实的数据。

有了这些基础，下面对照ibd文件，具体分析。

## 实验分析ibd文件格式

下面将通过分析```.ibd```文件的方式来进一步了解。首先需要准备好环境。这里我使用的是docker环境进行环境准备的。

首先使用```docker pull```拉取最新版本的mysql的镜像。

```shell
docker pull mysql
```

再镜像拉取完毕之后启动mysql，这里我将本地目录挂载到了mysql容器中，便于后续获取ibd文件。

```shell
docker run -v /home/work/data/mysql:/var/lib/mysql/ -e MYSQL_ROOT_PASSWORD=111111 -d 镜像的id
```

进入mysql容器中，创建demo的数据库，并在demo数据库中创建user_tbl表。user_tbl表包含了四个字段，其中name和city字段为变长字段。id和level为固定长度字段。

```sql
create database demo;
use demo;
create table user_tbl (
	id int,
	name varchar(20) comment 'mutable-length',
	city varchar(20) comment 'mutable-length',
    level char(1) comment 'fix-length'
)row_format=compact;
```

进一步，向user_tbl表中添加5条测试数据。

```sql
insert into user_tbl values(0,'tom','Nanjing','a');
insert into user_tbl values(1,'kitty','Beijing','b');
insert into user_tbl values(2,'simth','Wuhan','c');
insert into user_tbl values(3,'Nancy',NULL,'c');
insert into user_tbl values(4,NULL,NULL,'c');
```

退出容器，去挂载的目录中去获取idb文件，例如，我的目录就是```/home/work/data/mysql/demo/user_tbl.ibd```。

通过二进制查看工具，例如```notepad--```可以很好的对其进行分析。通过记录中的字符串，可以很快地在二进制文件中定位到位置，例如在我的实验中，数据记录在文件中的位置如下所示：

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/row-format/data.png)

有了这些数据，就可以对其进行分析了。

我这里获取到的五条的数据记录如下所示，对照上面讲解的Compact数据行格式，是一致的。

第一条数据格式：

```c
07 03 //第三列长度为7 第二列长度为3
00 //NULL bit映射为空
00 00 10 00 2B //header info
00 00 00 00 02 00 //DB_ROW_ID 
00 00 00 00 07 19 //DB_TRX_ID
82 00 00 01 1E 01 10 //DB_ROLL_PTR 
80 00 00 00 //0
74 6F 6D    //tom 
4E 61 6E 6A 69 6E 67 //Nanjing 
61 //a
01 
```

第二条数据格式：

```c
07 05 //第三列长度为7 第二列长度为5
00 //NULL bit映射为空
00 00 18 00 2D //header info
00 00 00 00 02 01 //DB_ROW_ID 
00 00 00 00 07 1A //DB_TRX_ID
81 00 00 01 1E 01 10 //DB_ROLL_PTR 
80 00 00 01 //1
6B 69 74 74 79 //kitty
42 65 69 6A 69 6E 67 //Beijing
62 //b
01 
```

第三条数据格式：

```c
05 05 //第三列长度为5 第二列长度为5
00 //NULL bit映射为空
00 00 20 00 2A //header info
00 00 00 00 02 02 //DB_ROW_ID 
00 00 00 00 07 1F //DB_TRX_ID
82 00 00 01 0A 01 10 //DB_ROLL_PTR 
80 00 00 02 //2
73 69 6D 74 68 //simth
57 75 68 61 6E //Wuhan
63 //c
01 
```

第四条数据格式：

```c
05 //第二列长度为5
04 //NULL 00000100 第三列为NULL
00 00 28 00 24 //header info
00 00 00 00 02 03 //DB_ROW_ID 
00 00 00 00 07 20 //DB_TRX_ID
81 00 00 01 0E 01 10 //DB_ROLL_PTR 
80 00 00 03 //3
4E 61 6E 63 79 //Nancy
63 //c
01 
```

第五条数据格式：

```c
// 没有变长列的长度
06 //NULL 00000110 第二列和第二列为NULL
00 00 30 FF 49 //header info
00 00 00 00 02 04 //DB_ROW_ID 
00 00 00 00 07 25 //DB_TRX_ID
82 00 00 01 0C 01 10 //DB_ROLL_PTR 
80 00 00 04 //4 
63 //c
```


