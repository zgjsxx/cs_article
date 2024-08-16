---
category: 
- 面经
tag:
- 数据库面经
---

- [数据库](#数据库)
  - [什么是关系型数据库范式？](#什么是关系型数据库范式)
  - [MySQL索引有哪些？](#mysql索引有哪些)
  - [全文索引怎么使用？解决什么问题](#全文索引怎么使用解决什么问题)
  - [你对binlog日志和redolog日志了解吗？解释以下这两个日志的作用以及两阶段提交](#你对binlog日志和redolog日志了解吗解释以下这两个日志的作用以及两阶段提交)
  - [列举MySQL的四个隔离级别，并解释每个级别的区别以及可能产生的问题](#列举mysql的四个隔离级别并解释每个级别的区别以及可能产生的问题)
  - [MySQL可重复读完全解决了幻读问题吗？](#mysql可重复读完全解决了幻读问题吗)


# 数据库

## 什么是关系型数据库范式？

数据库范式（Normalization）是数据库设计中的一套规则，用于组织数据库中的数据，以**减少数据冗余**，提高数据的完整性和一致性。范式提供了一种系统化的方法来设计数据库结构，使得数据冗余最小化，并避免某些常见的数据库操作问题，如插入异常、删除异常和更新异常。

**1.第一范式（1NF）**

要求：数据库表中的所有字段值必须是不可再分的原子值。换句话说，**每一列**中的数据应当是不可分割的单一值。

示例：

假设有一张表 Student：

|StudentID|	Name|	PhoneNumber|
|--|--|--|
|1	|Alice|	123-4567|
|2	|Bob	|234-5678, 345-6789|

在这里，PhoneNumber列包含多个电话号码（234-5678, 345-6789），这不符合第一范式。要将其转换为1NF，应将每个电话号码分成单独的记录。

转换后：

|StudentID|	Name|	PhoneNumber|
|--|--|--|
|1	|Alice|	123-4567|
|2	|Bob	|234-5678|
|2	|Bob	|345-6789|

**2.第二范式（2NF）**

要求：在满足第一范式的基础上，数据库表中的每个非主属性必须完全依赖于整个主键，而不能依赖主键的一部分。适用于复合主键的表。

示例：

假设有一张表 OrderDetail，主键是由 OrderID 和 ProductID 组成：

|OrderID|	ProductID	|Quantity	|ProductName|
|--|--|--|--|
|101|	1	|10|	Laptop|
|101|	2	|5	|Mouse|

在这个表中，ProductName依赖于ProductID而不是整个复合主键（OrderID + ProductID），这违反了第二范式。

解决方法：将表拆分为两个表，使得每个非主属性完全依赖于主键。

转换后：

OrderDetail 表：

|OrderID|	ProductID	|Quantity|
|--|--|--|
|101|	1	|10|
|101|	2	|5 |

Product 表：

|ProductID	|ProductName |
|--|--|
|1	|Laptop|
|2	|Mouse |

**3.第三范式（3NF）**

要求：在满足第二范式的基础上，表中的非主属性不应相互依赖，即任何非主属性都不依赖于其他非主属性。

示例：

假设有一张表 Employee：

|EmployeeID	|Name	|DepartmentID	|DepartmentName|
|--|--|--|--|
|1	|John	|101	|HR|
|2	|Jane	|102	|IT|

在这个表中，DepartmentName依赖于DepartmentID，而DepartmentID又依赖于EmployeeID，因此DepartmentName间接依赖于主键EmployeeID，这违反了第三范式。

解决方法：将表进一步拆分。

转换后：

Employee 表：

|EmployeeID	|Name	|DepartmentID|
|--|--|--|
|1	|John	|101|
|2	|Jane	|102|

Department 表：

|DepartmentID	|DepartmentName|
|--|--|
|101	|HR|
|102	|IT|


## MySQL索引有哪些？


MySQL数据库中的索引有以下几种类型：

**1. 普通索引（Normal Index）**

**特点**：普通索引是最基本的索引类型，没有任何限制条件。

**作用**：加速查询速度。

**创建方式**：

```sql
CREATE INDEX index_name ON table_name
(column_name);
```

**2. 唯一索引（Unique Index）**

**特点**：唯一索引要求索引列中的所有值都是唯一的，但允许有一个空值 (NULL)。

**作用**：确保数据唯一性，同时也能加速查询。

```sql
CREATE UNIQUE INDEX index_name ON table_name(column_name);
```

**3. 主键索引（Primary Key Index）**

**特点**：主键索引是一种特殊的唯一索引，不允许有空值 (NULL)，一个表只能有一个主键索引。

**作用**：唯一标识表中的每一行数据，同时加速查询。

创建方式：
```sql
ALTER TABLE table_name ADD PRIMARY KEY (column_name);
```

或在创建表时定义：
```sql
CREATE TABLE table_name (
    column_name data_type PRIMARY KEY
);
```

**4. 全文索引（Full-Text Index）**

**特点**：全文索引用于加速对大文本的搜索，适用于 CHAR、VARCHAR 和 TEXT 字段。

**作用**：用于全文搜索功能，主要用于查找文本字段中的关键词。

创建方式：
```sql
CREATE FULLTEXT INDEX index_name ON table_name(column_name);
```

注意：MySQL的全文索引用于MyISAM和InnoDB引擎，且从MySQL 5.6版本开始支持InnoDB引擎。

**5. 复合索引(联合索引)（Composite Index）**

**特点**：复合索引是指在多个列上创建的索引。

**作用**：用于加速基于多个列的查询，遵循“最左前缀”原则。

```sql
CREATE INDEX index_name ON table_name(column1, column2);
```

**6. 空间索引（Spatial Index）**

**特点**：空间索引用于加速地理空间数据的查询，适用于MySQL的 Geometry 数据类型。

**作用**：主要用于地理信息系统（GIS）应用中的位置数据查询。

**创建方式**：

```sql
CREATE SPATIAL INDEX index_name ON table_name(column_name);
```

注意：空间索引仅适用于MyISAM表，并且从MySQL 5.7开始支持InnoDB。

**7. 哈希索引（Hash Index）**

**特点**：哈希索引用于加速精确匹配查询，不能用于范围查询。

**作用**：提高等值查询的速度。

**注意**：MySQL并没有直接创建哈希索引的语法，但在某些存储引擎中，如Memory引擎中，哈希索引是默认的。

```cpp
CREATE TABLE my_table (
    id INT PRIMARY KEY,
    name VARCHAR(50)
) ENGINE=MEMORY;

CREATE INDEX idx_name ON my_table(name);
```

不同类型的索引有不同的适用场景，合理使用可以极大提升数据库的查询性能。

## 全文索引怎么使用？解决什么问题

全文索引（Full-Text Index）是MySQL中的一种特殊索引类型，专门用于处理文本字段的复杂搜索需求，特别是在长文本中查找特定单词或短语。它主要解决的问题是高效地进行全文搜索，即在大量文本数据中快速找到包含某个关键词的记录。

**1. 全文索引的适用场景**
长文本搜索：用于在包含大量文本数据的字段中查找特定的词或短语，如博客文章、产品描述、用户评论等。
模糊匹配：适合用于需要搜索关键词而非精确匹配的场景，如搜索含有“database”和“mysql”这两个词的所有记录。
多关键词搜索：可以搜索多个关键词，并根据相关性排序结果，如搜索含有“mysql”和“optimization”的记录，并根据这些词在文本中的出现频率和位置排序。

**2. 全文索引的创建**
MySQL的全文索引通常应用于 CHAR、VARCHAR 和 TEXT 数据类型的列。要使用全文索引，首先需要在相关列上创建全文索引。

```sql
CREATE TABLE articles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    body TEXT,
    FULLTEXT (title, body)
);
```

也可以在已经存在的表上添加全文索引：

```sql
ALTER TABLE articles ADD FULLTEXT(title, body);
```
1. 全文搜索查询
2. 
MySQL提供了 MATCH ... AGAINST 语法来执行全文搜索。

**基本搜索**：

```sql
SELECT * FROM articles 
WHERE MATCH(title, body) AGAINST('database');
```

**布尔模式搜索**：

布尔模式允许使用布尔运算符，如+（必须包含）、-（必须不包含）、*（通配符）等：

```sql
SELECT * FROM articles 
WHERE MATCH(title, body) AGAINST('+mysql -optimization' IN BOOLEAN MODE);
```

**自然语言模式**：

自然语言模式是默认的搜索模式，MySQL根据关键词的相关性返回匹配结果：

```sql
SELECT * FROM articles 
WHERE MATCH(title, body) AGAINST('mysql optimization');
```

带有查询扩展的自然语言模式：
查询扩展模式在给定的查询词之外，还考虑全文索引中其他相关的词来扩展查询：

```sql
SELECT * FROM articles 
WHERE MATCH(title, body) AGAINST('mysql optimization' WITH QUERY EXPANSION);
```
**3. 全文索引解决的问题**

提高搜索效率：全文索引使得在大量文本数据中查找关键词的速度显著提高，相比LIKE操作符的模糊匹配更加高效。
支持自然语言查询：能够根据关键词在文本中的相关性对结果进行排序，适用于搜索引擎类型的查询需求。
支持复杂搜索逻辑：通过布尔模式支持复杂的查询逻辑，如必须包含某些词语或排除某些词语。

**4 注意事项**

最低词长度：默认情况下，MySQL的全文索引忽略长度少于4个字符的单词。这可以通过更改MySQL配置文件中的 ft_min_word_len 参数来调整。

停止词：MySQL会忽略一些常见的“停止词”（如"a", "the", "is"等），这些词通常在搜索中没有意义。这可以通过调整配置来禁用或修改。
存储引擎：全文索引在MyISAM和InnoDB引擎上都可以使用，但在InnoDB上支持是从MySQL 5.6版本开始的。

**总结**

全文索引是MySQL中用于处理复杂文本搜索需求的强大工具。它能够快速、高效地在大规模文本数据中查找特定关键词，并根据关键词在文本中的相关性对结果进行排序。这在构建搜索引擎、内容管理系统和其他需要文本搜索功能的应用中非常有用。


## 你对binlog日志和redolog日志了解吗？解释以下这两个日志的作用以及两阶段提交

**Binlog日志**

作用：

- 复制：Binlog（Binary Log）是MySQL的二进制日志文件，主要用于数据库复制（replication）。它记录了对数据库执行的所有修改操作（如INSERT、UPDATE、DELETE），以便在主从复制中从库可以重放这些操作，从而保持与主库的一致性。
- 数据恢复：在灾难恢复时，可以通过重放Binlog日志来恢复数据。备份恢复后，可以使用Binlog日志将数据库状态恢复到特定时间点，确保数据完整性和一致性。

**Redo日志**

作用：

- 数据持久化：Redo Log是InnoDB存储引擎的重做日志，用于记录事务的修改操作。这些操作会首先写入Redo Log，然后再写入数据文件。即使在系统崩溃时，也可以通过Redo Log将未完成的事务重做，从而保证数据的持久性。
- 性能优化：由于Redo Log采用顺序写入的方式，相对于随机写入的磁盘操作速度更快。这种方式提高了数据库的写入性能，因为修改操作可以先写入Redo Log，再批量刷新到数据文件中。

**两阶段提交（Two-Phase Commit）**

两阶段提交是用来保证事务在分布式系统或多个存储引擎之间的一致性的方法。MySQL使用两阶段提交来协调Binlog和Redo Log的写入，以确保在系统崩溃后，数据仍然保持一致。两阶段提交过程如下：

1.预提交阶段（Prepare Phase）：

- 事务执行过程中，所有的修改操作首先写入Redo Log的缓存区，但此时并不会提交。
- Redo Log的状态设置为准备提交（prepare）。
- 同时，事务的修改操作记录在Binlog缓存中，但不立即写入磁盘。

2.提交阶段（Commit Phase）：

- 确认所有参与的存储引擎（或分布式系统的节点）都准备好提交。
- 将Binlog缓存中的日志刷新到磁盘，确保Binlog记录持久化。
- 将Redo Log的状态从准备提交修改为已提交，并刷新到磁盘，完成实际的数据提交操作。

两阶段提交的作用

两阶段提交的主要作用是保证数据的一致性和持久性。通过在两个独立的日志系统（Binlog和Redo Log）之间协调提交操作，可以确保即使在系统崩溃的情况下，也能通过重放日志恢复数据，从而保持数据库的一致性。具体来说：

- 数据一致性：两阶段提交确保了在Binlog和Redo Log之间的原子性操作，即要么两者都成功，要么都失败，从而防止数据不一致的情况。
- 持久性保证：通过先将Redo Log写入磁盘，再写入Binlog，保证了在系统崩溃后可以通过Redo Log进行恢复，而不会丢失数据。
- 
这种机制在数据库系统中非常重要，因为它有效地解决了数据在分布式系统或多存储引擎环境中的一致性问题。


## 列举MySQL的四个隔离级别，并解释每个级别的区别以及可能产生的问题

MySQL 的事务隔离级别定义了事务之间的可见性和一致性，决定了在并发环境中事务的行为。MySQL 支持四种标准的隔离级别，每种级别在数据一致性和并发性之间有所权衡。以下是这四个隔离级别的详细解释以及它们可能产生的问题：

**1.读未提交（READ UNCOMMITTED）**

描述：

- 这是最低的隔离级别。在这个级别下，一个事务可以读取其他事务未提交的数据。

可能产生的问题：

- 脏读（Dirty Read）：事务 A 修改了数据但还未提交，事务 B 可以读取到这些未提交的数据。若事务 A 回滚，事务 B 读取到的数据就是无效的。

适用场景：

- 对数据一致性要求不高，且需要最大限度的并发性。例如，日志记录或缓存数据的应用场景。

**2.读已提交（READ COMMITTED）**

描述：

- 在这个隔离级别下，一个事务只能读取其他事务已提交的数据。即使其他事务已经提交，事务在读取数据时也不能读取到其他事务尚未提交的数据。

可能产生的问题：

- 不可重复读（Non-repeatable Read）：事务 A 在执行某个查询时读取了一些数据，随后事务 B 对这些数据进行了修改并提交。事务 A 再次执行相同的查询时会得到不同的结果。

适用场景：

- 数据一致性要求较高但仍需保持较高的并发性。适用于对数据读操作一致性有一定要求的场景。

**3.可重复读（REPEATABLE READ）**

描述：

- 在这个隔离级别下，事务在开始后读取的数据在事务期间内不会被其他事务修改，保证了每次查询的数据都是一致的。

可能产生的问题：

- 幻读（Phantom Read）：事务 A 执行一个范围查询时读取到的数据在事务 A 内部是稳定的。但如果事务 B 在事务 A 执行期间插入或删除了数据，这会导致事务 A 再次执行相同的查询时发现结果集有所不同。

适用场景：

- 需要保证在事务内对数据的读操作具有一致性，适用于大多数需要确保读取数据一致性的业务逻辑。

**4.串行化（SERIALIZABLE）**

描述：

- 这是最高的隔离级别，事务完全隔离。事务被强制序列化执行，即事务之间没有任何交叉，确保数据的一致性。

可能产生的问题：

- 性能开销：由于事务之间完全隔离，可能会导致事务执行的性能开销显著增加，特别是在高并发环境中。

适用场景：

- 数据一致性要求极高的场景，如金融交易等关键业务流程。适用于对数据完整性和一致性要求严格的应用场景。

**总结**
- 读未提交（READ UNCOMMITTED）：最低的隔离级别，可能会产生脏读。
- 读已提交（READ COMMITTED）：避免了脏读，但可能会出现不可重复读。
- 可重复读（REPEATABLE READ）：避免了脏读和不可重复读，但可能会出现幻读。
- 串行化（SERIALIZABLE）：最高的隔离级别，避免了脏读、不可重复读和幻读，但可能会导致性能降低。
根据实际的业务需求，可以选择适当的隔离级别来平衡数据一致性和系统性能。

## MySQL可重复读完全解决了幻读问题吗？

MySQL InnoDB引擎的默认隔离级别是可重复读， 根据不同的查询方式，分别提出了避免幻读的方案：
- 针对**快照读**， 通过MVCC方式解决
- 针对**当前读**， 通过next-key lock(记录锁+间隙锁)方式解决了幻读。

但是，可重复读不能彻底解决幻读，但是可以很大程度上避免幻读发生。例如事务A更新了一条事务B插入的记录，那么事务A前后两次查询到的记录条目就不一样了，所以就会发生幻读。
