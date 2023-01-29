---
category: 
- databse
- mysql
---

# Mysql中有哪些锁?

在 MySQL 里，根据加锁的范围，可以分为全局锁、表级锁和行锁三类。

在详解mysql之前， 我们先准备一些测试数据：

prepare sql:
```sql
show databases;
create database demo;
use demo;

CREATE TABLE IF NOT EXISTS `tbl_user`(
   `id` INT NOT NULL AUTO_INCREMENT,
   `user_name` VARCHAR(64) NOT NULL,
   `age` TINYINT NOT NULL,
   `address` VARCHAR(255),
   PRIMARY KEY ( `user_id` )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `tbl_user` (user_name, age, address) VALUES ('Mike', 20, 'Beijing');
INSERT INTO `tbl_user` (user_name, age, address)  VALUES ('Nancy', 25, 'Chongqing');
```

# 全局锁

加全局锁：
```sql
FLUSH TABLES WITH READ LOCK
```

重新打开一个窗口，然后执行
```sql
update tbl_user set age = 21 where user_name = 'Mike';
```
发现该update的动作被阻塞住了。

解除全局锁：
```sql
unlock tables
```


# 行级锁
InnoDB 引擎是支持行级锁的，而 MyISAM 引擎并不支持行级锁。

前面也提到，普通的 select 语句是不会对记录加锁的，因为它属于快照读。如果要在查询时对记录加行锁，可以使用下面这两个方式，这种查询会加锁的语句称为锁定读。

//对读取的记录加共享锁
select ... lock in share mode;

//对读取的记录加独占锁
select ... for update;