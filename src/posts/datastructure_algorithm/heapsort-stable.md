---
category: 
- data structure
tag:
- data structure
---


# 面试题：推排序是一种稳定排序吗？

在回答该问题前，首先需要了解什么是稳定排序。

**稳定性**就是指对于两个关键字相等的记录，它们在序列中的相对位置，在排序之前和排序之后没有发生改变。通俗地讲就是有两个关键字相等的数据A、B，排序前，A的位置是 i ，B的位置是 j，此时 i < j，则如果在排序后A的位置还是在B之前，那么称它是稳定的。

那么堆排序是一个稳定排序吗？

## 堆排序的稳定性分析

直接上答案堆排序并不是一个稳定排序。

堆排序的会将原始的数组转化成一个大顶堆或一个小顶堆，在输出堆顶后，此时需要维护堆，操作如下：

（1）堆顶与堆尾交换并删除堆尾，被删除的堆尾的元素就是输出过的元素

（2）把当前堆顶向下调整，直到满足构成堆的条件，重复（1）步骤

在堆顶与堆尾交换的时候两个相等的记录在序列中的相对位置就可能发生改变，这就影响其稳定性了。

下面看一个实际的例子， [5A,6,5B,7,8] ，A和B用于区分相同元素。

数组的原始的状态如下所示：

![heapsort-stable1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable1.png)


首先调整下方的子树[6，7，8]，将8和6的位置调换。

![heapsort-stable2](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable2.png)

接着调整下方的子树[5A，8，5B]，将8和5A的位置调换。

![heapsort-stable3](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable3.png)

由于5A和8位置的调换，需要重新调整下方的子树[5A，7，6]，将5A和7的位置调换。这个时候5A和5B的顺序就出现了一次乱序。

![heapsort-stable4](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable4.png)

至此，第一轮排序完毕，将8和数组尾部元素6交换。

![heapsort-stable5](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable5.png)

接着调整顶部的子树[6，7，5B]，将7和6的位置调换。

![heapsort-stable6](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable6.png)

这个时候第二轮排序已经结束，此时可以将7和数组尾部元素5A进行调整。

![heapsort-stable7](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable7.png)

接着调整顶部的子树[5A，6，5B]，将6和5A的位置调换。

![heapsort-stable8](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable8.png)

这个时候第三轮排序已经结束，此时可以将6和数组尾部元素5B进行调整。

![heapsort-stable9](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable9.png)

剩下的元素已经满足了排序的要求，于是直接输出结果。

![heapsort-stable10](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/heapsort-stable/heapsort-stable10.png)



至此[5A,6,5B,7,8]  排序为 [5B,5A,6,7,8]。可以看到5A和5B的关系发生了变化。

通过这个例子也证明了堆排序不是一个稳定排序。