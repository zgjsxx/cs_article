
---
category: 
- Linux
tag:
- 协程
---

# 无栈协程和有栈协程的对比


## 有栈协程

## 无栈协程


### 无栈协程兼容同步代码会导致async/await关键字的传染

下面的例子是python的一个例子，由于sleep函数是一个异步函数，而sum函数调用了它，则sum函数需要添加async/await。而sum_wrapper1调用了sum函数，因此
sum_wrapper1也需要添加async/await。sum_wrapper2和sum_wrapper_final也是相同的原因，都添加上了async/await。

```py
import asyncio
import time

async def sleep():
    print(f'Time: {time.time() - start:.2f}')
    await asyncio.sleep(1)

async def sum(name, numbers):
    total = 0
    for number in numbers:
        print(f'Task {name}: Computing {total}+{number}')
        await sleep()
        total += number
    print(f'Task {name}: Sum = {total}\n')

async def sum_wrapper1(name, numbers):
    await sum(name, numbers)

async def sum_wrapper2(name, numbers):
    await sum_wrapper1(name, numbers)

async def sum_wrapper_final(name, numbers):
    await sum_wrapper2(name, numbers)

start = time.time()

loop = asyncio.get_event_loop()
tasks = [
    loop.create_task(sum_wrapper_final("A", [1, 2])),
    loop.create_task(sum_wrapper_final("B", [1, 2, 3])),
]
loop.run_until_complete(asyncio.wait(tasks))
loop.close()

end = time.time()
print(f'Time: {end-start:.2f} sec')
```
