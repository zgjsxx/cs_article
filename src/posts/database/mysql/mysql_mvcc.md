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


## ReadView和MVCC
ReadView使用了一些字段
- creator_trx_id: 创建该read view的事务的id
- m_ids： 创建readview时，当前数据库活跃且未提交的事务id列表
- up_limit_id： 创建ReadView时，当前数据库中活跃且未提交的最小事务id
- low_limit_id： 创建ReadView时，当前数据库中分配的下一个事务的id值
}

在repeated read隔离等级下，

当一个事务中第一次出现select语句时，会依照Mysql当时的状况生成一个ReadView。

从undo log的最新的数据行往下进行遍历，依次进行检查：

- 如果被访问版本的 事务ID = creator_trx_id，那么表示当前事务访问的是自己修改过的记录，那么该版本对当前事务可见；
- 如果被访问版本的 事务ID < up_limit_id，那么表示生成该版本的事务在当前事务生成 ReadView 前已经提交，所以该版本可以被当前事务访问。
- 如果被访问版本的 事务ID > low_limit_id 值，那么表示生成该版本的事务在当前事务生成 ReadView 后才开启，所以该版本不可以被当前事务访问。
- 如果被访问版本的 事务ID在 up_limit_id和m_low_limit_id 之间，那就需要判断一下版本的事务ID是不是在 trx_ids 列表中，如果在，说明创建 ReadView 时生成该版本的事务还是活跃的，该版本不可以被访问；
- 如果不在，说明创建 ReadView 时生成该版本的事务已经被提交，该版本可以被访问。

通过下面的图可以更好的理解ReadView生成的原理，

在下面的图中，事务8是当前的事务，其使用了select语句查询了表中的数据，触发了readview的生成，因此creator_trx_id=8。在readview生成的时刻，当前活跃的且未提交的事务为[4,6,7,9], 因此up_limit_id=4， low_limit_id=11。

下面查看user表的id=1的undo log，其最新的改动是事务9提交的。 事务9满足下面的不等式，事务4 < 事务9 < 事务11， 因此需要查看事务9是否在trx_ids列表中。经过查看发现事务9在trx_ids中，因此在生成readview的时刻，事务9的提交对于事务8并不可见。 因此需要往下滑动，检查undo log中次新的数据。

在undo log的次新的数据中。trx_id=8， 与creator_trx_id相等，因此对于当前事务可见。因此readview中可见的最新数据已经找到。

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc2.png)

下面查看user表的id=1的undo log，其最新的改动是事务12提交的。 事务12 > low_limit_id， 事务12的提交对于事务8并不可见。 因此需要往下滑动，检查undo log中次新的数据。

在undo log的次新的数据中。trx_id=10，在 up_limit_id和m_low_limit_id 之间，且事务10不在m_ids，说明创建 ReadView 时生成事务10已经被提交，该版本可以被访问。因此因此readview中可见的最新数据已经找到。


![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc3.png)

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/MVCC/mvcc4.png)


参考文章

https://www.cnblogs.com/qdhxhz/p/15750866.html
https://www.cnblogs.com/cswiki/p/15338928.html
https://www.6hu.cc/archives/86666.html