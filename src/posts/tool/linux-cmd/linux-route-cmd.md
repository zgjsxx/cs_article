---
category: 
- Linux
- tool
---


# Linux路由表详解

```shell
[root@VM_139_74_centos ~]# route
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
default         gateway         0.0.0.0         UG    0      0        0 eth0
10.0.0.10       10.139.128.1    255.255.255.255 UGH   0      0        0 eth0
10.139.128.0    0.0.0.0         255.255.224.0   U     0      0        0 eth0
link-local      0.0.0.0         255.255.0.0     U     1002   0        0 eth0
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 docker0
172.18.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-0ab63c131848
172.19.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-bccbfb788da0
172.20.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-7485db25f958
[root@VM_139_74_centos ~]# route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.139.128.1    0.0.0.0         UG    0      0        0 eth0
10.0.0.10       10.139.128.1    255.255.255.255 UGH   0      0        0 eth0
10.139.128.0    0.0.0.0         255.255.224.0   U     0      0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1002   0        0 eth0
172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 docker0
172.18.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-0ab63c131848
172.19.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-bccbfb788da0
172.20.0.0      0.0.0.0         255.255.0.0     U     0      0        0 br-7485db25f958
```


Destination:

目标网络或目标主机。Destination 为 default（0.0.0.0）时，表示这个是默认路由

Gateway:

网关地址，0.0.0.0 表示当前记录对应的 Destination 跟本机在同一个网段，通信时不需要经过网关|

Genmask:

Destination字段的网络掩码，Destination 是主机时需要设置为 255.255.255.255，是默认路由时会设置为 0.0.0.0|

Flags:

U 路由是活动的 
H 目标是个主机
G 需要经过网关
R 恢复动态路由产生的表项
D 由路由的后台程序动态地安装
M 由路由的后台程序修改
! 拒绝路由

|Metric||
|Ref||
|Use||
|Iface||

https://blog.csdn.net/kikajack/article/details/80457841