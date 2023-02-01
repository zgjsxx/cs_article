内置函数：bool __atomic_compare_exchange_n (type *ptr, type *expected, type desired, bool weak, int success_memorder, int failure_memorder)


此内置函数实现了原子比较和交换操作。这会将 *ptr 的内容与 *expected 的内容进行比较。如果相等，则该操作是将 desired 写入```*ptr```。如果它们不相等，操作是读取和当前内容 *ptr ptr 写入 *expected 。 weak 对弱compare_exchange 是 true 的，它可能会虚假地失败，而为 false 对于强大的变化，它永远不会虚假地失败。许多目标仅提供强大的变化，而忽略该参数。如有疑问，请使用较大的变化。


gcc原文

https://gcc.gnu.org/onlinedocs/gcc-9.1.0/gcc/_005f_005fatomic-Builtins.html