---
title: 关机时，如何控制systemd服务的关闭顺序?
date: 2023-01-11 11:38:40
tags:
---

# 关机时，如何控制systemd服务的关闭顺序?

在工作中，我们通常遇到的问题是，如何控制systemd服务的启动顺序，同志们第一反应就会是使用Before=或者After=去进行控制。 问题来了，如果服务启动时没有顺序要求，但是关闭时有顺序要求， 该如何操作？

通过查找如下相关文档， 我查到了这样一段话：

https://www.freedesktop.org/software/systemd/man/systemd.unit.html

> When two units with an ordering dependency between them are shut down, the inverse of the start-up order is applied. I.e. if a unit is configured with After= on another unit, the former is stopped before the latter if both are shut down.

上面这段话的意思是，如果使用After=或者Before=规定了进程的启动顺序， 那么关闭时的顺序与启动时的顺序将是相反的。

比如有A、B、C三个服务， 启动时的顺序时A->B->C, 那么服务的关闭顺序将是C->B->A。 事实是这样的吗？ 下面通过一个小实验进行验证。

# 验证systemd的关闭顺序
这里我们准备三个服务，服务在启动时候会向文件中写入相应的启动和关闭日志，通过日志我们来判断服务的启动和关闭顺序。

首先是test1.sh， 该文件接受start/stop两个命令行参数， 启动时写入日志start1， 关闭时写入日志stop1。
```shell
#!/bin/bash
case "$1" in
start)
echo "start1" >> /home/test/test.log
;;
stop)
echo "stop1" >> /home/test/test.log
;;
*)
esac
```

下面是test1服务的systemd的service文件test1.service，这里我们只需要脚本执行一次，因此使用的Type是oneshot类型，并且指定RemainAfterExit=yes，意思是该脚本只会执行一次，并且退出后， 不会意味着服务是inacive状态， 将会显示服务是active(exited)状态。

```txt
[Unit]
Description=mytest:while date service
After=network.target sshd.service

[Service]
Type=oneshot
ExecStart= /home/test/test1.sh start
ExecStop= /home/test/test1.sh stop
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

test2.sh与test1.sh类似，只是打印的日志内容不同。
```shell
#!/bin/bash
case "$1" in
start)
echo "start2" >> /home/test/test.log
;;
stop)
echo "stop2" >> /home/test/test.log
;;
*)
esac
```

test2.service同test1.service， 不同的是我在After中增加了test1.service， 这就意味着test2晚于test1启动。
```txt
[Unit]
Description=mytest:while date service
After=network.target sshd.service test1.service

[Service]
Type=oneshot
ExecStart= /home/test/test2.sh start
ExecStop= /home/test/test2.sh stop
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

test3.sh同test1.sh
```shell
#!/bin/bash
case "$1" in
start)
echo "start3" >> /home/test/test.log
;;
stop)
echo "stop3" >> /home/test/test.log
;;
*)
esac
```

test3.service同test1.service，不同的是我在After中增加了test2.service， 这就意味着test3晚于test2启动。
```txt
[Unit]
Description=mytest:while date service
After=network.target sshd.service test2.service

[Service]
Type=oneshot
ExecStart= /home/test/test3.sh start
ExecStop= /home/test/test3.sh stop
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

通过下面的命令将三个服务分别加入到systemd的目录中，并且启动它们并设为开机启动。
```shell
cp test1.service /usr/lib/systemd/system/
cp test2.service /usr/lib/systemd/system/
cp test3.service /usr/lib/systemd/system/
systemctl daemon-reload
systemctl enable test1
systemctl enable test2
systemctl enable test3
systemctl start test1
systemctl start test2
systemctl start test3
```

此时，test.log文件已经打印出了刚刚手动执行启动命令产生的日志
```shell
[root@localhost test]# cat test.log
start1
start2
start3
```

通过上述的步骤，我们构建出了三个服务，这三个服务的启动顺序是test1->test2->test3， 那么根据我们的推测， 关闭顺序应该是test3->test2->test1，是否如此呢？

下面就是到了最终验证的时刻！
```shell
reboot
```

等待一小会后，我们打印出test.log
```shell
[root@localhost test]# cat test.log
start1
start2
start3
stop3
stop2
stop1
start1
start2
start3
```

可以看到停止时依次打印出了stop3，stop2，stop1。这与我们的猜想以及文档中的说明是一致的。

# 结论
systemd通过After和Before可以指定服务的启动顺序， 在系统关闭时，服务的关闭顺序和启动顺序是相反的， 先启动的后关闭，后启动的先关闭。