---
category: 
- 汇编语言
---

# 小组作业

## 小组作业#1

为了让你可以更加熟悉汇编语言， 这里是我们的小组作业：

> 编写一个汇编程序，提示用户输入姓名，打印 What is your name?然后接受最多255个字符的输入，然后打印出Hello，name，nice to meet you！随后是换行符。

您必须同时使用 ```SYS_WRITE``` (= 1) 和 ```SYS_READ``` (= 0) 系统调用。使用以下 ```.data``` 部分：

```x86asm
section .data

prompt:       db      "What is your name?"
prompt_len:   equ     $-prompt

buffer:       times 255 db '!'

resp1:        db      "Hello, "
resp1_len:    equ     $-resp1
resp2:        db      ", nice to meet you!", 10
resp2_len:    equ     $-resp2
```

```buffer```是传递给```SYS_READ```调用的输入缓冲区。它由 255 个组成```！```组成。请注意，```SYS_READ``` 将返回在 ```rax``` 中读取的实际字节数，然后在打印缓冲区内容时必须使用该字节数。（如果输入的长度错误，您会看到用户名被截断，或者在其末尾添加!!!!。）

```SYS_READ``` 和 ```SYS_WRITE``` 的fd参数是一个文件描述符，一个标识文件或流的数字。始终可用的标准文件描述符是：

|文件描述符|含义|
|--|--|
|0|标准输入|
|1|标准输出|
|2|标准错误|

因此，您将从 ```FD #0``` 进行 ```SYS_READ```，然后从 ```FD #1``` 进行 ```SYS_WRITE```（就像我们之前所做的那样）。

不要忘记使用 ```SYS_EXIT (= 60)``` 系统调用来结束您的程序，以优雅地结束您的程序！


## 附录

原文链接：https://staffwww.fullcoll.edu/aclifton/cs241/group_proj1.html