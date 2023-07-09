
记录所的结构

```c
struct lock_rec_t {
  ulint space; // 锁的space id
  ulint page_no; // 锁的page number
  ulint n_bits; // 锁住位置的bitmap
};
```
三元组(space， page_no， n_bits)可以唯一的确定一行的位置。


ha_innodb.cc

行锁：
lock_rec_lock


主要的参数是 mode(锁类型)，block(包含该行的 buffer 数据页)，heap_no(具体哪一行)。就可以确定加什么样的锁，以及在哪一行加。

加锁流程主要是lock fast和lock slow，首先进入lock fast进行快速加锁，如果快速加锁失败则进入lock slow开始正常加锁流程，可能有锁冲突检查、死锁检查等流程

lock fast
- 1.获取需要加锁的页面上第一个record lock
- 2.判断获取的锁是不是空，是转3，否转4
- 3.如果需要加的是隐示锁直接返回成功，否则，创建一个创建一个RecLock对象然后创建一个锁返回成功
- 4.判断当前页面上是否只有一个锁，且这个锁是当前事务的，且这个锁模式和需要加的模式一样，且bitmap的大小够用，满足前述条件转5，否则转6
- 5.可以快速加锁，直接设置bitmap进行加锁，返回成功
- 6.快速加锁失败，返回失败并进入lock slow流程

lock slow
- 1.调用lock_rec_has_expl函数判断当前事务是不是有更强的锁，满足转2，不满足转3
lock_rec_has_expl函数遍历rec_hash，获取事务编号是当前事务的锁，同时满足以下五个条件就判定为有更强的锁
  - 1)不是一个插入意向锁
  - 2)不是一个等待中的锁
  - 3)根据强弱关系矩阵判断满足更强
  - 4)不是lock_rec_not_gap类型，或者要加的锁是lock_rec_not_gap类型或者heap_no是上界
  - 5)不是lock_gap类型，或者要加的锁是lock_gap类型或者heap_no是上界
- 2.有更强的锁，直接返回成功，什么都不需要做
- 3.如果没有更强的锁，调用lock_rec_other_has_conflicting判断是否有锁冲突需要等待，如果有转4，没有转5。lock_rec_other_has_conflicting函数遍历rec_hash，拿出对应行上的每一个锁，调用 lock_rec_has_to_wait 进行冲突判断

  - 1)如果当前锁和要加的锁是同一个事务的，直接返回，没有冲突
  - 2)根据兼容矩阵判断当前锁和要加的锁是否兼容，如果兼容，直接返回，没有冲突
  - 3)如果要加的是lock_gap或者heap_no是页面上界，且不是lock_insert_intention的话，可以直接返回，没有冲突，因为非插入意向锁的gap锁是不用等待的，都不冲突
  - 4)如果要加的锁不是插入意向锁lock_insert_intention，且当前锁是一个gap锁，直接返回，没有冲突
  - 5)如果要加的锁是gap锁，且当前锁是lock_rec_not_gap锁，直接返回，没有冲突
  - 6)如果当前锁是一个插入意向锁，直接返回没有冲突
  - 7)不满足上述条件，返回冲突

ps:为什么经过2步骤判断锁不兼容还需要往下走5个判断，是因为锁类型lock_mode/lock_type/rec_lock_type三种标记位同时有，如lock_x|lock_gap, lock_s|lock_rec_not_gap 这两个锁虽然lock_mode不兼容，但不冲突
- 4.调用add_to_waitq，入队一个锁等待

  - 1)调用creat，创建lock_t，高优先级事务不放入rec_hash表，非高优先级放入
  - 2)如果是高优先级事务，调用jump_queue，如果加锁成功直接返回，jump_queue大概为跳过所有优先级比当前锁低的等待锁，加入等待队列中
  - 3)调用deadlock_check进行死锁检测
- 5.判断是否是隐示锁，是的话直接返回成功，什么都不做，不是的话调用lock_rec_add_to_queue入队一个锁

  - 1)type_mode|=lock_rec，判断heap_no是否是页面上届，是的话，type_mode不能是lock_rec_not_gap
  - 2)遍历rec_hash判断当前行上是否有等待的锁，没有转3，有转4
  - 3)如果没有，且当前锁不是一个lock_wait，寻找当前页面上有没有相似的锁（当前事务的锁且锁类型和要加的锁一样），有的话直接设置标记位，没有转4
  - 4)创建一个锁lock_t，设置bit位，设置lock_type等信息，添加到rec_hash表中和事务的lock_list中



fast加锁：
lock_rec_lock_fast

slow加锁：
lock_rec_lock_slow


```c
void RecLock::lock_add(lock_t *lock) {
  ut_ad((lock->type_mode | LOCK_REC) == (m_mode | LOCK_REC));
  ut_ad(m_rec_id.matches(lock));
  ut_ad(locksys::owns_page_shard(m_rec_id.get_page_id()));
  ut_ad(locksys::owns_page_shard(lock->rec_lock.page_id));
  ut_ad(trx_mutex_own(lock->trx));

  bool wait = m_mode & LOCK_WAIT;

  hash_table_t *lock_hash = lock_hash_get(m_mode);

  lock->index->table->n_rec_locks.fetch_add(1, std::memory_order_relaxed);

  if (!wait) {
    lock_rec_insert_to_granted(lock_hash, lock, m_rec_id);
  } else {
    lock_rec_insert_to_waiting(lock_hash, lock, m_rec_id);
  }

#ifdef HAVE_PSI_THREAD_INTERFACE
#ifdef HAVE_PSI_DATA_LOCK_INTERFACE
  /* The performance schema THREAD_ID and EVENT_ID are used only
  when DATA_LOCKS are exposed.  */
  PSI_THREAD_CALL(get_current_thread_event_id)
  (&lock->m_psi_internal_thread_id, &lock->m_psi_event_id);
#endif /* HAVE_PSI_DATA_LOCK_INTERFACE */
#endif /* HAVE_PSI_THREAD_INTERFACE */

  locksys::add_to_trx_locks(lock);

  if (wait) {
    lock_set_lock_and_trx_wait(lock);
  }
}
```

参考文章：

https://cloud.tencent.com/developer/article/1799236

https://blog.csdn.net/qq_42604176/article/details/116808505

https://segmentfault.com/a/1190000017076101?utm_source=coffeephp.com