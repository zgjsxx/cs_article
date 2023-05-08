---
category: 
- C++
- effective Modern C++
---

# Item36：如果有异步的必要请指定std::launch::async


## 总结

- std::async的默认启动策略是异步和同步执行兼有的。
- 这个灵活性导致访问thread_locals的不确定性，隐含了任务可能不会被执行的意思，会影响调用基于超时的wait的程序逻辑。
- 如果异步执行任务非常关键，则指定std::launch::async。