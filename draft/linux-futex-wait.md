总结下futex_wait流程：

加自旋锁
检测*uaddr是否等于val，如果不相等则会立即返回
将进程状态设置为TASK_INTERRUPTIBLE
将当期进程插入到等待队列中
释放自旋锁
创建定时任务：当超过一定时间还没被唤醒时，将进程唤醒
挂起当前进程

futex_wake流程如下：

找到uaddr对应的futex_hash_bucket，即代码中的hb
对hb加自旋锁
遍历fb的链表，找到uaddr对应的节点
调用wake_futex唤起等待的进程
释放自旋锁

作者：做个好人君
链接：https://juejin.cn/post/6844903688478146574
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。