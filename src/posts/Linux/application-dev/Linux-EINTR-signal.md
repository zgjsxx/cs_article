---
category: 
- Linux
---

# socket编程中的EINTR是什么?

在socket编程中，我们时常在accept/read/write等接口调用的异常处理的部分看到对于EINTR的处理，例如下面这样的语句：

```cpp
repeat:
if(read(fd, buff, size) < 0)
{
    if(errno == EINTR)
        goto repeat;
    else
        printf("read failed");
}
```

那么EINTR是什么呢？为什么要对它进行处理呢？ 本文将对EINTR做一些讨论。

## 慢系统调用

如果想要解释**EINTR**，首先得对**慢系统调用**有个了解。

**慢系统调用**(slow system call)指不会立即返回的系统调用, 可能**永远阻塞**而无法返回。 例如支持网络的调用, 包括read/write, connect, accept等, 都属于这一类。

慢系统调用, 主要分为以下类别:

- 读写"慢"设备。 包括pipe, fifo, 终端设备, 网络连接等. 读时, 数据不存在, 需要等待缓冲区有数据输入; 写时, 缓冲区满, 需要等待缓冲区有空闲位置。注意: 读写磁盘文件一般不会阻塞， 网络磁盘除外。
- 打开某些特殊文件时, 需要等待某些条件才能打开。如打开终端设备, 需要等待连接设备的modern响应, 才能打开
- pause和wait系统调用。
  - pause阻塞进程, 直到收到信号唤醒;
  - wait等待任意子进程终止;
- 某些ioctl操作
- 某些IPC操作。如pipe, fifo, 没有指定NON_BLOCKING选项时的写操作, 如果管道缓冲区满, write阻塞;互斥锁, 条件变量, 信号量, 记录锁等等.

## 慢系统调用与EINTR

如果进程在一个**慢系统调用**(slow system call)中阻塞时，当捕获到某个信号且相应信号处理函数返回时，这个系统调用被中断，调用返回错误，设置errno为EINTR（相应的错误描述为"Interrupted system call"）。

因此EINTR错误的产生是**慢系统调用**和**信号处理函数**组合使用会产生的问题。

回过头来再看开头所提到的这一段的代码，其含义是当程序通过read读取数据，当目前fd对应的缓冲区没有数据可读时，进程将被阻塞。此时如果向该进程发送了信号，那么read函数将会返回-1，并且此时errno为EINTR，代表read方法被中断了。对于这样的情况，我们就需要人为的对read进行"重启"， 即重新的进行read。

```cpp
repeat:
if(read(fd, buff, size) < 0)
{
    if(errno == EINTR)
        goto repeat;
    else
        printf("read failed");
}
```

到此，我们了解到了EINTR的产生原因，下面将介绍如何处理EINTR，以避免一些不必要的系统问题。

## 如何避免EINTR带来的问题。

既然系统调用会被中断，那么就需要处理被中断的系统调用。

- 人为重启被中断的系统调用
- 安装信号时设置 SA_RESTART属性（该方法对有的系统调用无效）

其实人为重启被中断的系统调用，上面已经提到过了

```cpp
repeat:
if(read(fd, buff, size) < 0)
{
    if(errno == EINTR)
        goto repeat;
    else
        printf("read failed");
}
```

这里着重来看一下第二种方法，为信号处理函数设置```SA_RESTART```。

下面是一个使用socket编程所建立的一个TCP server，进程在没有连接进入的时候将会卡在accept调用上。 同时，对于该进程，安装了SIGINT的信号处理函数，并且为该信号设置了SA_RESTART的属性。

```cpp
//g++ main.cpp -o main
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <sys/socket.h>
#include <unistd.h>
#define PORT 8080
void  handler_func(int sig){
    printf("test\n");
}
int main(int argc, char const* argv[])
{
    int server_fd, new_socket;
    ssize_t valread;
    struct sockaddr_in address;
    int opt = 1;
    socklen_t addrlen = sizeof(address);
    char buffer[1024] = { 0 };
    char* hello = "Hello from server";

    struct sigaction action;

    action.sa_handler = handler_func;
    sigemptyset(&action.sa_mask);
    action.sa_flags = 0;
    /* 设置SA_RESTART属性 */
    action.sa_flags |= SA_RESTART;
    sigaction(SIGINT, &action, NULL);

    // Creating socket file descriptor
    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
            perror("socket failed");
            exit(EXIT_FAILURE);
    }

    // Forcefully attaching socket to the port 8080
    if (setsockopt(server_fd, SOL_SOCKET,
                            SO_REUSEADDR | SO_REUSEPORT, &opt,
                            sizeof(opt))) {
            perror("setsockopt");
            exit(EXIT_FAILURE);
    }
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    // Forcefully attaching socket to the port 8080
    if (bind(server_fd, (struct sockaddr*)&address,
                    sizeof(address))
            < 0) {
            perror("bind failed");
            exit(EXIT_FAILURE);
    }
    if (listen(server_fd, 3) < 0) {
            perror("listen");
            exit(EXIT_FAILURE);
    }
    if ((new_socket
            = accept(server_fd, (struct sockaddr*)&address,
                            &addrlen))
            < 0) {
            perror("accept");
            exit(EXIT_FAILURE);
    }
    valread = read(new_socket, buffer,
                            1024 - 1); // subtract 1 for the null
                                                    // terminator at the end
    printf("%s\n", buffer);
    send(new_socket, hello, strlen(hello), 0);
    printf("Hello message sent\n");

    // closing the connected socket
    close(new_socket);
    // closing the listening socket
    close(server_fd);
    return 0;
}
```
程序运行后，使用ctrl+c 向进程发送SIGINT信号，可以看到程序输出了test的打印，但是程序仍然阻塞在了accept的系统调用上，等待客户端连接。

```shell
[root@localhost test1]# ./main
^Ctest
^Ctest
^Ctest
^Ctest
^Ctest
```

如果没有添加SA_RESTART这样的flag， 那么发送SIGINT给进程的话，accept就会报这样的错误，就需要手动进行处理。

```shell
[root@localhost test1]# ./main
^Ctest
accept: Interrupted system call
```

但是要注意的是SA_RESTART并不能解决所有的问题。

下面的这些场景当设置了SA_RESTART后，如果信号处理函数返回之后，系统调用可以自行恢复：
- read/readv/write/writev/ioctl在"慢设备"上的调用。所谓慢设备，就是在该设备上执行I/O调用时可能会造成无限时间的阻塞的一类设备， 例如管道，socket,终端。 需要注意的是，本地磁盘不属于慢设备，但是网络磁盘属于慢设备。
- open， 例如open一个FIFO。
- wait系列的方法，例如：wait(2), wait3(2), wait4(2), waitid(2), and waitpid(2).
- 没有设置超时参数的socket的操作接口。 accept(2), connect(2), recv(2), recvfrom(2), recvmmsg(2), recvmsg(2), send(2), sendto(2), and sendmsg(2).
- 文件锁接口： flock(2)，  fcntl(2)进行F_OFD_SETLKW F_SETLKW操作。
- POSIX消息队列: mq_receive(3), mq_timedreceive(3), mq_send(3), mq_timedsend(3).
- futex(2) FUTEX_WAIT。 2.6.22版本之前， 信号处理函数返回时，futex总是返回EINTR，SA_RESTART无效。
- getrandom(2).
- pthread_mutex_lock(3), pthread_cond_wait(3)
- futex(2) FUTEX_WAIT_BITSET.
- POSIX 信号量的接口 sem_wait(3) and sem_timedwait(3)。 2.6.22版本之前， 信号处理函数返回时，信号量的接口总是返回EINTR，SA_RESTART无效。
- read(2) 方法操作由 inotify(7)方法返回的文件描述符 (3.8版本之前， 信号处理函数返回时，总是返回EINTR，SA_RESTART无效。).

下面这些场景，即使使用了SA_RESTART，当系统调用被信号处理函数中断后，仍然会返回EINTR：

- 设置了超过时间的socket的输入接口。使用setsockopt方法的SO_RCVTIMEO参数可以设置timeout时间。accept(2),  recv(2),  recvfrom(2)，recvmmsg(2) recvmsg(2).
- 设置了超过时间的socket的输出接口。使用setsockopt方法的SO_SNDTIMEO参数可以设置timeout时间。connect(2), send(2), sendto(2),  sendmsg(2).
- 等待信号的接口，例如: pause(2), sigsuspend(2), sigtimedwait(2), and sigwaitinfo(2).
- 多路复用的接口，例如： epoll_wait(2), epoll_pwait(2), poll(2), ppoll(2), select(2), and pselect(2).
- System V的IPC interface， 例如：msgrcv(2), msgsnd(2), semop(2), 和semtimedop(2).
- sleep的接口， 例如: clock_nanosleep(2), nanosleep(2), and usleep(3).
- io_getevents(2).

还有一个比较特殊的是sleep(3)方法，其被信号处理函数打断后并不会返回返回EINTR， 而是将剩下需要sleep的时间作为返回值返回。

在整理资料时，我发现Linux man的界面还存在一个描述问题：

![EINTR](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/application-dev/EINTR/EINTR.png)

对于Output socket接口的描述中， **when a timeout (SO_RCVTIMEO) has been set on the socket** 描述并不正确。此时描述的是output相关的接口，因此应该是**when a timeout (SO_SNDTIMEO) has been set on the socket**。 下面的**if a send timeout (SO_SNDTIMEO) has been set**描述正确了，但是感觉又有点重复。

从上面的描述中我们知道， **SO_RESTART**并不是万能的，对于一些接口而言，仍然需要添加对EINTR的处理。 因此对于EINTR的处理需要组合上面两种方法。


# 总结
- EINTR错误的产生是**慢系统调用**和**信号处理函数**组合使用会产生的问题。
- 对于EINTR错误，安装信号处理函数时设置SA_RESTART可以解决很多系统调用被终端的问题。但是对于一些可以设置超时参数的API，即使设置SA_RESTART，仍然有可能收到EINTR错误。因此组合使用SA_RESTART和人为重启系统调用。



