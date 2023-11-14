---
category: 
- Mysql
---


# mysql MVCC机制详解

MVCC, 是Multi Version Concurrency Control的缩写，其含义是**多版本并发控制**。这一概念的提出是为了诗的MySQL可以实现RC隔离级别和RR隔离级别。

这里回顾一下MySQL的隔离级别和各种隔离级别所存在的问题。

MySQL的四种隔离级别如下：
- 读未提交（read uncommitted）：指一个事务还没有提交时，它做的变更才能被其他事务看到；
- 读提交(read committed)，指一个事务提交之后，它所做的变更才能被其他事务看到
- 可重复度（repeated read），指一个事务执行过程中看到的数据，一直跟这个事务启动时看到的数据时一致的，这是MySQL InnoDB引擎的默认隔离级别。
- 串行化(serializable)：会对记录加上读写锁，在多个事务对这条记录进行读写操作时，如果发生了读写冲突的时候，后访问的事务必须等前一个事务执行完成，才能继续执行


读未提交级别下会遇到**脏读**的问题，所谓脏读是指在一个事务中会读取到另一个事务没有提交的改动，例如下图中所示：

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/RC.png)

A用户在第一次查询ID=1的用户时，其年龄是10。 在这之后，B用户对ID=1的用户的age进行了修改，随后就将事务进行了回滚。但是结果A用户第二次查询ID=1的用户的年龄时发现年龄修改为了20， 即读取到了脏数据。



读提交级别下会遇到**不可重复读**的问题，所谓不可重复读是指在同一个事务中多次select出的数据的值发生了变化。例如下图中所示：

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/RC.png)

A用户在第一次查询ID=1的用户时，其年龄是10。 在这之后，B用户对ID=1的用户的age进行了修改，并且提交了事务，结果A用户第二次查询ID=1的用户的年龄时发现年龄修改为了20。这样的变化就是**不可重复读**。


## undo log

对于InnoDB存储引擎，每一行记录都有两个隐藏列trx_id、roll_pointer,如果数据表中存在主键或者非NULL的UNIQUE键时不会创建row_id,否则InnoDB会自动生成单调递增的隐藏主键row_id。

|列名|是否必须|描述|
|--|--|--|
|row_id|否|单调递增的行ID，不是必需的，占用6个字节|
|trx_id|是|记录操作该行数据事务的事务ID|
|roll_pointer|是|回滚指针，指向当前记录行的undo log信息|

undo log可以理解成回滚日志,它存储的是老版本数据。在表记录修改之前，会先把原始数据拷贝到undo log里，如果事务回滚，即可以通过undo log来还原数据。或者如果当前记录行不可见，可以顺着undo log链找到满足其可见性条件的记录行版本。

在insert/update/delete(本质也是做更新，只是更新一个特殊的删除位字段)操作时，都会产生undo log。

在InnoDB里，undo log分为如下两类：

1）insert undo log : 事务对insert新记录时产生的undo log, 只在事务回滚时需要, 并且在事务提交后就可以立即丢弃。

2）update undo log : 事务对记录进行delete和update操作时产生的undo log，不仅在事务回滚时需要，快照读也需要，只有当数据库所使用的快照中不涉及该日志记录，对应的回滚日志才会被删除。

undo log有什么用途呢？

1、事务回滚时，保证原子性和一致性。
2、如果当前记录行不可见，可以顺着undo log链找到满足其可见性条件的记录行版本(用于MVCC快照读)。

版本链：

## ReadView

ReadView类似于一个snapshot(快照)， 在RC事务等级下，每次快照读都将生成一次ReadView， 而在RR等级下， 只有第一次快照读时会生成一次ReadView。

下面就来看看ReadView是如何实现的。

ReadView使用了下面一些字段：
- creator_trx_id: 创建该ReadView的事务的id
- m_ids： 创建ReadView时，当前数据库活跃且未提交的事务id列表
- up_limit_id： 创建ReadView时，当前数据库中活跃且未提交的最小事务id
- low_limit_id： 创建ReadView时，当前数据库中分配的下一个事务的id值

其核心思想就是记录当前事务可以看见哪些事务的提交。

对于undo log中的某一条记录，判断其是否可见的规则如下：

- 如果被访问版本的 事务ID = creator_trx_id，那么表示当前事务访问的是自己修改过的记录，那么该版本对当前事务可见；
- 如果被访问版本的 事务ID < up_limit_id，那么表示生成该版本的事务在当前事务生成 ReadView 前已经提交，所以该版本可以被当前事务访问。
- 如果被访问版本的 事务ID > low_limit_id 值，那么表示生成该版本的事务在当前事务生成 ReadView 后才开启，所以该版本不可以被当前事务访问。
- 如果被访问版本的 事务ID在 up_limit_id和m_low_limit_id 之间，那就需要判断一下版本的事务ID是不是在 trx_ids 列表中，如果在，说明创建 ReadView 时生成该版本的事务还是活跃的，该版本不可以被访问；如果不在，说明创建 ReadView 时生成该版本的事务已经被提交，该版本可以被访问。

而整个过程将从undo log的最新记录开始，逐条判断，如果判断结果是可见的，那么则返回该记录。如果判断结果是不可见的，则沿着undo log往下继续寻找。

整个寻找的过程可以参照下面的流程图：

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/readview.png)

下面通过一些案列来加深ReadView的理解，

在下面的图中，事务8是当前的事务，其使用了select语句查询了表中的数据，触发了readview的生成，因此creator_trx_id=8。在readview生成的时刻，当前活跃的且未提交的事务为[4,6,7,9], 因此up_limit_id=4， low_limit_id=11。

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc1.png)

下面查看user表的id=1的undo log，其最新的改动是事务9提交的。 事务9满足下面的不等式，事务4 < 事务9 < 事务11， 因此需要查看事务9是否在trx_ids列表中。经过查看发现事务9在trx_ids中，因此在生成readview的时刻，事务9的提交对于事务8并不可见。 因此需要往下滑动，检查undo log中次新的数据。

在undo log的次新的数据中。trx_id=8， 与creator_trx_id相等，因此对于当前事务可见。因此readview中可见的最新数据已经找到。

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc2.png)

下面查看user表的id=1的undo log，其最新的改动是事务12提交的。 事务12 > low_limit_id， 事务12的提交对于事务8并不可见。 因此需要往下滑动，检查undo log中次新的数据。

在undo log的次新的数据中。trx_id=10，在 up_limit_id和m_low_limit_id 之间，且事务10不在m_ids，说明创建 ReadView 时生成事务10已经被提交，该版本可以被访问。因此因此readview中可见的最新数据已经找到。


![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc3.png)

下面再看一个例子，在该例子中，undo log中最新的记录的事务id是6， 事务6满足下面的不等式， 事务4 < 事务6 < 事务11， 因此下面就需要检查事务6是否在m_ids中， 因为m_ids= [4， 6， 7， 9]，因此事务6在创建readview时还没有提交，因此对于当前事务而言，该条记录并不可见。 因此沿着undo log往下找。

undo log中第二新的记录的事务id是14，事务14 > low_limit_id, 显而易见， 事务14的改动对于当前事务是不可见的。因此继续undo log往下找。

undo log中第三新的记录的事务id是5，事务4 < 事务5 < 事务11, 显而易见， 因此下面就需要检查事务5是否在m_ids中， 因为m_ids= [4， 6， 7， 9]，因此事务5在创建readview时已经提交了，于是事务5对于当前事务而言是可见的， 于是找到了所需的值。

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc4.png)


参考文章

https://www.cnblogs.com/qdhxhz/p/15750866.html
https://www.cnblogs.com/cswiki/p/15338928.html
https://www.6hu.cc/archives/86666.html