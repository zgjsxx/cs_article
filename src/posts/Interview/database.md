---
category: 
- 面经
tag:
- 数据库面经
---

# 数据库

## 你对binlog日志和redolog日志了解吗？解释以下这两个日志的作用以及两阶段提交

**binlog日志**

**作用**：记录了所有对数据库进行修改的操作

**类型**：
- Statememt-based-binlog: 记录的是执行的SQL语句
- Row-based binlog: 记录的是发生变化的具体数据行
- Mixed-based binlog: 结合了Statememt-based和Row-based的优点，对于部分操作记录语句，其他操作记录变化。

**用途**：
- 数据恢复
- 主从复制
- 数据审计

