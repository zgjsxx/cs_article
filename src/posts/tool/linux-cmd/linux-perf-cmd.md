---
category: 
- Linux
- tool
---

# Linux工具之perf命令详解

## 安装

```shell
yum install perf
```


## perf工具简述


Perf 是一个包含 22 种子工具的工具集，每个工具分别作为一个子命令。

annotate 命令读取 perf.data 并显示注释过的代码;diff 命令读取两个 perf.data 文件并显示两份剖析信息之间的差异;

evlist 命令列出一个 perf.data 文件的事件名称;

inject 命令过滤以加强事件流，在其中加入额外的信 息;

kmem 命令为跟踪和测量内核中 slab 子系统属性的工具;

kvm 命令为跟踪和测量 kvm 客户机操 作系统的工具;

list 命令列出所有符号事件类型;

lock 命令分析锁事件;

probe 命令定义新的动态跟 踪点;

record 命令运行一个程序，并把剖析信息记录在 perf.data 中;

report 命令读取 perf.data 并显 示剖析信息;

sched 命令为跟踪和测量内核调度器属性的工具;

script 命令读取 perf.data 并显示跟踪 输出;

stat 命令运行一个程序并收集性能计数器统计信息;

timechart 命令为可视化某个负载在某时 间段的系统总体性能的工具;

top 命令为系统剖析工具。


CPU 性能分析
　　在 Linux 我们可以使用 perf 工具分析 CPU 的性能，它可以将消耗 CPU 时间比较大的用户程序调用栈打印出来，并生成火焰图。首先，在 Ubuntu 安装 perf 工具：


使用sudo perf list命令可以看到 perf 支持的事件，事件有三种类型：Software event、Hardware event 和 Tracepoint event。使用perf stat可以对某个操作执行期间发生的事件作统计，例如我们可以对下面的命令进行统计：

```shell
$ dd if=/dev/zero of=/dev/null count=1000000
```
　
我们可以统计这个命令执行期间的 CPU 使用率，上下文切换次数等信息：


```shell
$ perf stat dd if=/dev/zero of=/dev/null count=1000000
1000000+0 records in
1000000+0 records out
512000000 bytes (512 MB) copied, 0.332629 s, 1.5 GB/s
 Performance counter stats for 'dd if=/dev/zero of=/dev/null count=1000000':
        331.923086 task-clock (msec)         #    0.994 CPUs utilized
               107 context-switches          #    0.322 K/sec
                 0 cpu-migrations            #    0.000 K/sec
               226 page-faults               #    0.681 K/sec
   <not supported> cycles
   <not supported> stalled-cycles-frontend
   <not supported> stalled-cycles-backend
   <not supported> instructions
   <not supported> branches
   <not supported> branch-misses
       0.334055984 seconds time elapsed
```

　　另一个有用的命令是perf record，它可以对事件进行采样，将采样的数据收集在一个 perf.data 的文件中，这将会带来一定的性能开销，不过这个命令很有用，可以用来找出最占 CPU 的进程。下面的命令对系统 CPU 事件做采样，采样时间为 60 秒，每秒采样 99 个事件，-g表示记录程序的调用栈。

```shell
perf record -F 99 -a -g -- sleep 60
```

执行这个命令将生成一个 perf.data 文件：

执行sudo perf report -n可以生成报告的预览。
执行sudo perf report -n --stdio可以生成一个详细的报告。
执行sudo perf script可以 dump 出 perf.data 的内容。
也可以记录某个进程的事件，例如记录进程号为 1641 的进程：

```shell
$ sudo perf record -F 99 -p 1641 -g -- sleep 60
$ sudo perf script > out.perf   # 将 perf.data 的内容 dump 到 out.perf
```

生成火焰图

通常的做法是将 out.perf 拷贝到本地机器，在本地生成火焰图：


$ git clone --depth 1 https://github.com/brendangregg/FlameGraph.git
# 折叠调用栈
$ FlameGraph/stackcollapse-perf.pl out.perf > out.folded
# 生成火焰图
$ FlameGraph/flamegraph.pl out.folded > out.svg
　　生成火焰图可以指定参数，–width 可以指定图片宽度，–height 指定每一个调用栈的高度，生成的火焰图，宽度越大就表示CPU耗时越多。