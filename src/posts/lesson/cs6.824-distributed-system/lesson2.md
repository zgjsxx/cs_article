---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [cs-6.824第2讲 RPC and Threads](#cs-6824第2讲-rpc-and-threads)
  - [为何在本课程中使用Go语言？](#为何在本课程中使用go语言)
  - [线程](#线程)
  - [多线程的挑战](#多线程的挑战)
    - [竞争](#竞争)
    - [协作(Coordination)](#协作coordination)
    - [实际案例](#实际案例)

# cs-6.824第2讲 RPC and Threads

## 为何在本课程中使用Go语言？

在过去，这门课中一直使用的是C++，其实也能很好的工作，但是现在换成了go语言，有下面一些理由：

- 对线程、锁及线程间同步有很好支持，有便捷的RPC库。而对于 C++ 等许多语言，找到方便易用的类似工具较困难。

- 类型安全，不会因错误而随机写数据导致程序出现不可预期的操作，能消除很多潜在 bug。

- 内存安全，拥有垃圾回收机制，不会出现两次释放同一块内存或释放仍在使用内存的问题。在非垃圾回收语言如 C++ 中，使用线程时确定最后一个使用共享对象的线程容易出错，程序员需编写大量代码进行手动操作，而 Go 语言的垃圾回收机制使这个问题消失

- 语法简单，比 C++ 简单得多。在 C++ 中，即使是很小的拼写错误，编译器返回的错误信息也复杂到令人费解。你可能都不愿意去看报错信息，而直接去看代码猜测问题。

总结起来就是简单易用，适合教学。

最后，如果希望深入研究go语言，可以阅读"effective go"。

## 线程

在本门课程中，会非常关注线程，原因在于线程是管理程序并发性的主要工具，在分布式编程中尤为重要。比如一个程序需要与多台其他计算机通信，客户端可能与多个服务器通信，服务器可能同时处理不同客户端的请求。我们需要一种简便的方式实现如"程序有七个不同任务在进行，因为正在和七个不同的客户端进行通讯"这样的功能，线程就是这样的工具。

在 Go 语言中被称为 go routine（go 协程），它与大家所称的线程类似。理解线程的方式是：一个程序有一个地址空间，在串行程序的地址空间内若没有线程，则只有一个线程执行代码，包括一个程序计数器、一组寄存器和一个栈来描述执行的当前状态。而多线程程序中，每一个线程代表一个独立的程序计数器，有独立的寄存器和栈，以便拥有各自的控制流并在程序不同部分执行，但从技术上讲，尽管每个线程都有自己的栈，它们仍位于同一个地址空间内，不同线程若知道正确地址可以引用对方的栈。
使用线程有以下几个理由：
- I/O concurrency：早期提出这一概念时，当一个线程在等待从磁盘读取数据时，可以启动第二个线程进行计算或在磁盘其他位置读取数据。
- parallelism：利用多核实现并行。对于需要大量 CPU 周期的计算密集型任务，若程序能利用机器上所有核心的 CPU 周期会非常棒。
- convenience：对于周期性执行的程序很方便。

**学生提问：这样的开销值得吗？**

回答：值得。如果你创建了一百万个线程，每个线程都在一个循环中等待一毫秒，然后发送网络消息，这很可能会给你的机器带来巨大的负载。但是如果你创建10个线程，它们休眠1秒后，执行少量工作，这可能完全不是问题。

**学生提问：并发编程和异步编程**

回答：异步编程，其实就是事件驱动编程。在事件驱动程序中，可能会有一个单一的控制线程，它位于一个循环内，等待输入，每当它接收到一个输入，比如一个数据包，它就会判断，这个数据包来源于哪个客户端，然后会它程序内部维护一张表，记录该客户端任何活动状态。例如，它记录了程序读到了文件的某个中间位置。相比较而言，使用多线程编写并发会简单一些，因为你可以编写顺序的代码，而事件驱动编程则需要将活动拆分为一个一个小块。事件编程还存在一个问题，它虽然可以支持IO并发，但是无法支持CPU并行处理。

**学生提问： 线程和进程的区别？**

回答：进程指的是正在运行的程序及其对应的地址空间，在一个进程的内部可以有多个线程。当你编写一个Go程序，运行Go程序会创建一个进程和一块内存区域，随后当go创建了go线程时，这些线程就位于go进程的内部。当你在计算机上运行多个进程，即运行多个程序，例如编辑器或者编译器，操作系统会使得它们互相独立，它们各自有一块内存，并且不能查看彼此的内存。在一个程序内部，你可以使用共享内存，channel和互斥锁。但是进程之间的交互并没有那么容易。

**学生提问： 当发生上下文切换时，它是针对所有线程发生吗？**

不，当发生上下文切换时，它并不一定针对所有线程发生。上下文切换是指操作系统切换 CPU 的执行上下文，包括线程切换和进程切换，它仅针对被操作系统调度选中的线程或进程。具体来说：

线程上下文切换：在多线程的情况下，操作系统调度器会根据调度策略（如时间片轮转、优先级等），选择某个特定的线程进行切换。也就是说，只有当前正在使用 CPU 的线程会发生上下文切换。其他线程不会受到直接影响，除非它们的调度状态也发生了变化。例如，当一个线程被调度为可运行状态时，它可能会在下一个时间片被调度运行。

进程上下文切换：如果操作系统决定切换到一个不同的进程，通常会先进行进程上下文切换。切换进程时会更改内存地址空间、页表、文件描述符等。然而，这种切换仍然只影响当前正在使用 CPU 的线程（通常是目标进程的主线程，或者是目标进程中的某个线程）。同样，其他线程仍然不受影响，除非操作系统决定在切换进程后再进一步切换到不同的线程。

详细说明

在单 CPU 系统中：只有一个 CPU，因此在任意时刻只会有一个线程在运行。当上下文切换发生时，它只涉及当前正在运行的线程和即将被调度执行的线程。

在多 CPU / 多核系统中：每个 CPU 核心可以独立调度线程，因此不同核心的线程调度是独立的。某个核心上的上下文切换只会影响当前在该核心上运行的线程，而不会直接影响其他核心上的线程。


## 多线程的挑战

### 竞争

一个线程创建了对象，它允许其他线程使用该对象。在线程之间共享数据是需要小心的。

一个典型的例子是，假设你有一个全局变量n, 它在不同的线程之间共享，每个线程都会去对n进行自增。如果不进行处理，则容易引入bug。对于```n = n + 1```这样一个简单的操作，在机器层面可能会拆分为几个步骤，首先将n加载到寄存器中，然后将寄存器的值加1，将寄存器的值存到n中。如果两个线程同时加载了n到寄存器中，这意味着，假设n的初始值是0，那么两者均加载了0到寄存器中，然后两者均进行自增得到1，两者再将1写回到n中，最终n的值将会是1。

学生提问：每一行汇编指令是否是原子的呢？

回答：不是，要根据具体的指令和处理器架构来进行判断。例如自增指令，即对某个内存位置进行增量操作，大概率不是原子的。

上面所提到的例子是一个常见的多线程竞争的场景，称之为竞争条件(race condition)。

解决上述问题最简单的方法就是锁机制。在Go语言中，称之为Mutex，mutex通常按照下面的模式进行。

```go
mu.Lock()
n=n+1
mu.Unlock()
```

这样无论哪些线程执行此操作，幸运地获得了锁的线程得以完成所有这些任务，另一个线程则可以继续。

锁使得多步骤的代码序列可以被视为具有原子性。

学生提问: go如何知道我们要锁定哪些变量的?

回答： 互斥锁并不关心程序员定义了哪些变量要进行锁定。一个线程获取锁之后，其余线程需要等待，这就是锁的核心。

学生提问： 将锁置于一个数据结构内部是否是好的。

回答：如果定义了一个需要加锁的数据结构，那么将锁至于数据结构内部，使该数据结构的每个方法负责获取锁，使用该数据结构的用户可能毫不知情。这是很合理的。

但是也有有不好的方面：如果程序员知道他的数据不会被共享，那可能会造成一些性能损失。另一方面，如果两个数据结构有依赖关系，各自带有锁，且它们可能互相使用，则可能带来死锁。 死锁的解决往往需要将锁从具体实现中抽离，提升至调用代码层面。总之，隐藏锁可能是一个好主意，但并不总是如此。


### 协作(Coordination)

多线程之间并不是只存在竞争这样的场景，有些时候，是希望不同的线程之间可以相互协作。例如B线程等待A线程产生一些数据，然后进行读取。

在go语言中， 通道channels， 条件变量condition， 等待组(waitGroup)是常用的协作工具。


### 实际案例

接下来以网络爬虫为例，探讨一些关于线程的内容。

关于爬虫，需要注意避免两次获取同一个页面。

同时对于不同的页面应该需要进行并发获取。

串行爬虫

```go
package main

import (
	"fmt"
	"sync"
)

//
// Several solutions to the crawler exercise from the Go tutorial
// https://tour.golang.org/concurrency/10
//

//
// Serial crawler
//

func Serial(url string, fetcher Fetcher, fetched map[string]bool) {
	if fetched[url] {
		return
	}
	fetched[url] = true
	urls, err := fetcher.Fetch(url)
	if err != nil {
		return
	}
	for _, u := range urls {
		Serial(u, fetcher, fetched)
	}
	return
}

//
// Concurrent crawler with shared state and Mutex
//

type fetchState struct {
	mu      sync.Mutex
	fetched map[string]bool
}

func ConcurrentMutex(url string, fetcher Fetcher, f *fetchState) {
	f.mu.Lock()
	already := f.fetched[url]
	f.fetched[url] = true
	f.mu.Unlock()

	if already {
		return
	}

	urls, err := fetcher.Fetch(url)
	if err != nil {
		return
	}
	var done sync.WaitGroup
	for _, u := range urls {
		done.Add(1)
    u2 := u
		go func() {
			defer done.Done()
			ConcurrentMutex(u2, fetcher, f)
		}()
		//go func(u string) {
		//	defer done.Done()
		//	ConcurrentMutex(u, fetcher, f)
		//}(u)
	}
	done.Wait()
	return
}

func makeState() *fetchState {
	f := &fetchState{}
	f.fetched = make(map[string]bool)
	return f
}

//
// Concurrent crawler with channels
//

func worker(url string, ch chan []string, fetcher Fetcher) {
	urls, err := fetcher.Fetch(url)
	if err != nil {
		ch <- []string{}
	} else {
		ch <- urls
	}
}

func master(ch chan []string, fetcher Fetcher) {
	n := 1
	fetched := make(map[string]bool)
	for urls := range ch {
		for _, u := range urls {
			if fetched[u] == false {
				fetched[u] = true
				n += 1
				go worker(u, ch, fetcher)
			}
		}
		n -= 1
		if n == 0 {
			break
		}
	}
}

func ConcurrentChannel(url string, fetcher Fetcher) {
	ch := make(chan []string)
	go func() {
		ch <- []string{url}
	}()
	master(ch, fetcher)
}

//
// main
//

func main() {
	fmt.Printf("=== Serial===\n")
	Serial("http://golang.org/", fetcher, make(map[string]bool))

	fmt.Printf("=== ConcurrentMutex ===\n")
	ConcurrentMutex("http://golang.org/", fetcher, makeState())

	fmt.Printf("=== ConcurrentChannel ===\n")
	ConcurrentChannel("http://golang.org/", fetcher)
}

//
// Fetcher
//

type Fetcher interface {
	// Fetch returns a slice of URLs found on the page.
	Fetch(url string) (urls []string, err error)
}

// fakeFetcher is Fetcher that returns canned results.
type fakeFetcher map[string]*fakeResult

type fakeResult struct {
	body string
	urls []string
}

func (f fakeFetcher) Fetch(url string) ([]string, error) {
	if res, ok := f[url]; ok {
		fmt.Printf("found:   %s\n", url)
		return res.urls, nil
	}
	fmt.Printf("missing: %s\n", url)
	return nil, fmt.Errorf("not found: %s", url)
}

// fetcher is a populated fakeFetcher.
var fetcher = fakeFetcher{
	"http://golang.org/": &fakeResult{
		"The Go Programming Language",
		[]string{
			"http://golang.org/pkg/",
			"http://golang.org/cmd/",
		},
	},
	"http://golang.org/pkg/": &fakeResult{
		"Packages",
		[]string{
			"http://golang.org/",
			"http://golang.org/cmd/",
			"http://golang.org/pkg/fmt/",
			"http://golang.org/pkg/os/",
		},
	},
	"http://golang.org/pkg/fmt/": &fakeResult{
		"Package fmt",
		[]string{
			"http://golang.org/",
			"http://golang.org/pkg/",
		},
	},
	"http://golang.org/pkg/os/": &fakeResult{
		"Package os",
		[]string{
			"http://golang.org/",
			"http://golang.org/pkg/",
		},
	},
}

```


学生提问： 锁和对象必须要绑定在一起吗?

回答：不是

学生提问： 引用传递或值传递的规则是什么?

在 Go 语言中，map本质上是一个指针，类型是引用类型，即传递的是引用，而不是值的副本。这意味着当一个 map 被传递到一个函数或被赋值给另一个变量时，实际上传递的是对同一底层数据的引用，而不是数据的副本。

```go
package main

import "fmt"

// 修改 map 的值
func modifyMap(m map[string]int) {
    m["a"] = 100
}

func main() {
    // 初始化 map
    originalMap := map[string]int{"a": 1, "b": 2}

    fmt.Println("Before modifying:", originalMap)

    // 传递 map 给函数
    modifyMap(originalMap)

    fmt.Println("After modifying:", originalMap)
}
```

而string则是一个值类型。


学生提问： 如果go线程失败了，无法达到waitGroup怎么办？

回答： 使用defer操作，确保Done()被执行。

学生提问： 为什么waitGroup的Done操作无需加锁

回答：其内部必然有互斥锁或者类似的机制进行保护。

学生提问： 第56行的u能否不用传参

回答：不可以


如果ConcurrentMutex这里去掉锁，会怎么样？

```go
func ConcurrentMutex(url string, fetcher Fetcher, f *fetchState) {
	// f.mu.Lock()
	already := f.fetched[url]
	f.fetched[url] = true
	// f.mu.Unlock()
```

可以使用--race来检测多线程之间的竞争。

```go
go run --race crawler.go
```

其原理是使用影子内存。


回答：如果未执行某些代码，那么竞态检测器对此一无所知。它并非是一种静态检测，它实际上是观察这个特定程序运行时的发生情况。如果该程序此次运行没有执行读写共享数据耳朵相关代码，那么竞态检测器将无从得知代码可能存在竞态条件。

最后一种方式是基于go channel。其思路是启动一个worker线程，在其页面抓取完整之后，通过channel将页面的url发送给master线程。master则从channel中获取url，然后启动worker线程进行获取。

这种方式下，master线程和worker线程不共享任何对象，我们不需要担心关于锁的问题。


学生提问：

回答：ch是一个通道，通道具有发送和接受功能。channel的内部必然有互斥锁。


学生提问：第89行是一个循环，如果worker程序速度过慢，还没有来得急把url塞到channel中，那么程序就会提前退出，这如何解决。

回答： 第89行的循环，当channel没有数据时，会一直阻塞，不会直接跳出循环。