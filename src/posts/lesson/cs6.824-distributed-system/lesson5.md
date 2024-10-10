---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [cs-6.824第5讲 Go，Threads and Raft](#cs-6824第5讲-gothreads-and-raft)
  - [助教1：](#助教1)
    - [协程](#协程)
    - [闭包1](#闭包1)
    - [闭包2](#闭包2)
    - [周期性执行程序](#周期性执行程序)
    - [周期性执行程序2](#周期性执行程序2)
    - [互斥锁](#互斥锁)
    - [互斥锁2](#互斥锁2)
    - [](#)
    - [条件变量](#条件变量)

# cs-6.824第5讲 Go，Threads and Raft

在该讲中，助教推荐阅读[concurrency in Go](https://github.com/b055/books-1/blob/master/Concurrency%20in%20Go.pdf)这本书。

## 助教1：

在完成实验2时，写出易于理解的代码，使用大锁来保护大型临界区，不必过分担心CPU性能层面的表现。

### 协程



### 闭包1

首先提到了**闭包**的概念，闭包在很多编程语言中都存在，闭包可以简单理解为**函数加上其捕获的外部变量**。

闭包通常有下面一些特性：
- 函数嵌套：通常，闭包是在一个函数内部定义的另一个函数（嵌套函数）。
- 捕获变量：闭包捕获外部函数中的局部变量，使得这些变量的生命周期延长，直到闭包本身被销毁。

```go
package main

import "sync"
func main() {
    var a string
    var wg sync.WaitGroup
    wg.Add(1)
    go func(){
        a = "hello world"
        wg.Done()
    }()
    wg.Wait()
    println(a)
}
```

这个例子的主要功能是声明了一系列变量，然后通过go关键字启动go协程。这里定义了一个匿名的函数。这里其实就是一个闭包，其捕获了外部定义的字符串变量a，并且在闭包的内部修改了a的内容。

### 闭包2

下面的这个例子和闭包1中的例子类似，只不过创建了更多的协程同时执行。并行发送RPC请求就是这样的场景。例如在实验二中，候选者(candidate)请求投票的过程是同时向所有的跟随着发送投票请求，而不是逐一发送。因为RPC请求是阻塞操作，耗时较长。同样，领导者可能会同时向所有的跟随着发送附加条目的请求，而不是串行执行。

```go
package main
import "sync"

func main() {
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(x int) {
            sendRPC(x)
            wg.Done()
        }(i)
    }
    wg.Wait()
}

func sendRPC(i int) {
    println(i)
}
```

在这个例子，需要注意的是不能直接捕获外部变量i，因为i在外部是会变化的，因此这里需要将i作为函数参数进行传递。

### 周期性执行程序

```go
package main

import "time"

func main() {
    time.Sleep(1 * time.Second)
    println("started")
    go periodic()
    time.Sleep(5 * time.Second) // wait for a while so we can observe what ticker does
}

func periodic() {
    for {
        println("tick")
        time.Sleep(1 * time.Second)
    }
}
```

### 周期性执行程序2

```go
package main

import "time"
import "sync"
var done bool
var mu sync.Mutex
func main() {
    time.Sleep(1 * time.Second)
    println("started")
    go periodic()
    time.Sleep(5 * time.Second) // wait for a while so we can observe what ticker does
    mu.Lock()
    done = true
    mu.Unlock()
    println("cancelled")
    time.Sleep(3 * time.Second)
}

func periodic() {
    for {
        println("tick")
        time.Sleep(1 * time.Second)
        mu.Lock()
        if done {
            return
        }
        mu.Unlock()
    }
}
```

**学生提问**：

为什么27行没有进行```Unlock()```？

**助教回答**：

这里其实```return```之后，程序就会退出了，没有```Unlock```也不会有什么影响。不过最好还是在return之前进行```Unlock```。

```go
    mu.Lock()
    if done {
    mu.Unlock()
        return
    }
    mu.Unlock()
```

### 互斥锁

```go
package main
import "time"

func main() {
    counter := 0
    for i := 0; i < 1000; i++ {
        go func() {
            counter = counter + 1
        }()
    }
    time.Sleep(1 * time.Second)
    println(counter)
}
```

[在线运行](https://www.programiz.com/online-compiler/4I99lR5loblTn)

在这个例子中，它声明了一个计数器，并随后启动了一个goroutine，实际上启动了1000个goroutines，每个goroutines都会将计数器的值递增1。你可能希望程序可以打印出1000，但是实际上程序打印出的值往往小于1000。

解决该问题也很简单，只需要添加上锁，锁住临界区即可。

```go
package main
import "time"
import "sync"

func main() {
    counter := 0
    var mu sync.Mutex
    for i := 0; i < 1000; i++ {
        go func() {
            mu.Lock()
            defer mu.Unlock()
            counter = counter + 1
        }()
    }
    time.Sleep(1 * time.Second)
    mu.Lock()
    println(counter)
    mu.Unlock()
}
```

在Raft的实验中，RPC处理程序通常会操作RAFT结构上进行读取或者写入数据，这些更新应该要与其他并发进行的更新保持同步。因此在RPC处理程序的场景模式是：获取锁，延迟解锁，然后在内部执行一些工作。


### 互斥锁2

```go
package main

import "sync"
import "time"
import "fmt"

func main() {
    alice := 10000
    bob := 10000
    var mu sync.Mutex

    total := alice + bob
    go func() {
        for i := 0; i < 1000; i++ {
            mu.Lock()
            alice -= 1
            mu.Unlock()
            mu.Lock()
            bob += 1
            mu.Unlock()
        }
    }()
    go func() {
        for i := 0; i < 1000; i++ {
            mu.Lock()
            bob -= 1
            mu.Unlock()
            mu.Lock()
            alice += 1
            mu.Unlock()
        }
    }()

    start := time.Now()
    for time.Since(start) < 1*time.Second {
        mu.Lock()
        if alice+bob != total {
            fmt.Printf("observed violation, alice = %v, bob = %v, sum = %v\n",alice,bob,alice+bob)
        }
        mu.Unlock()
    }
}
```

这个例子所要演示的内容是，递增和递减两个操作应该要以原子方式发生。而上面的例子是原子递增加原子递减。

这个例子希望对于锁的理解是可以保护一些不变性，而不是只作用于变量。例如这里alice+bob的总数值应该是20000。

在高层次上理解锁，在访问共享数据时，需要进行加锁。另一个重要的规则时，锁会保护一些"不变量"。

### 

```go
package main
func main() {
    rand.Seed(time.Now().UnixNano())
    count := 0
    finished := 0

    for i := 0; i < 10; i++ {
        go func() {
            vote := requestVote()
            if vote {
                count++
            }
            finished++
        }()
    }
    for count < 5 && finished != 10 {

    }

    if count >= 5 {
        println("received 5+ votes!")
    } else {
        println("lost")
    }
}

func requestVote() {

}
```

```go
package main
import "sync"
import "time"
import "math/rand"
func main() {
    rand.Seed(time.Now().UnixNano())
    count := 0
    finished := 0
    var mu sync.Mutex

    for i := 0; i < 10; i++ {
        go func() {
            vote := requestVote()
            mu.Lock()
            defer mu.Unlock()
            if vote {
                count++
            }
            finished++
        }()
    }
    for {
        mu.Lock()
        if count >= 5 && finished == 10 {
            break
        }
        mu.Unlock()
    }

    if count >= 5 {
        println("received 5+ votes!")
    } else {
        println("lost")
    }
    mu.Unlock()
}

func requestVote() bool {
    return true
}
```

上述代码的问题：

下面的代码会造成CPU 100%
```go
    for {
        mu.Lock()
        if count >= 5 && finished == 10 {
            break
        }
        mu.Unlock()
    }
```

```go
    for {
        mu.Lock()
        if count >= 5 && finished == 10 {
            break
        }
        mu.Unlock()
        time.Sleep(50 * time.Millisecond)
    }
```


### 条件变量

```go
package main
import "sync"
import "time"
import "math/rand"
func main() {
    rand.Seed(time.Now().UnixNano())
    count := 0
    finished := 0
    var mu sync.Mutex
    cond := sync.NewCond(&mu)

    for i := 0; i < 10; i++ {
        go func() {
            vote := requestVote()
            mu.Lock()
            defer mu.Unlock()
            if vote {
                count++
            }
            finished++
            cond.Broadcast()
        }()
    }

    mu.Lock()
    for count < 5 && finished != 10{
        cond.Wait()
    }

    if count >= 5 {
        println("received 5+ votes!")
    } else {
        println("lost")
    }
    mu.Unlock()
}

func requestVote() bool {
    return true
}
```

条件变量使用的范式如下：

```go
mu.Lock()
cond.Broadcast()
mu.Unlock()

---

mu.Lock()
while condition == false {
    cond.Wait()
}
mu.Unlock()
```