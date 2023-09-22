---
category: 
- network
---

# 使用veth和bridge搭建docker网络

创建三个network namespace

```shell
ip netns add red
ip netns add blue
ip netns add green
```

查看namespace

```shell
[root@localhost ~]# ip netns ls
green
red
blue
```

创建bridge
```shell
ip link add vbridge type bridge
ip link set dev vbridge up 
```


创建3个veth pair

这里需要主义的是， Linux 内核对网络接口的名字长度有限制，不能超过15个字符。

```shell
ip link add veth-red type veth peer name veth-red-br
ip link add veth-blue type veth peer name veth-blue-br
ip link add veth-green type veth peer name veth-green-br
```


将veth-red连接到namespace red, 另一端veth-red-br连接到vbridge
将veth-blue连接到namespace blue, 另一端veth-blue-br连接到vbridge
将veth-green连接到namespace green, 另一端veth-green-br连接到vbridge

```shell
ip link set veth-red netns red
ip link set veth-red-br master vbridge
ip link set veth-blue netns blue
ip link set veth-blue-br master vbridge
ip link set veth-green netns green
ip link set veth-green-br master vbridge
```

bridge link查看

```shell
[root@localhost ~]# bridge link
21: veth-blue-br@if22: <BROADCAST,MULTICAST> mtu 1500 master vbridge state disabled priority 32 cost 2
23: veth-red-br@if24: <BROADCAST,MULTICAST> mtu 1500 master vbridge state disabled priority 32 cost 2
25: veth-green-br@if26: <BROADCAST,MULTICAST> mtu 1500 master vbridge state disabled priority 32 cost 2
```


给veth-blue与veth-red添加ip地址：

```shell
ip netns exec red ip addr add 192.168.28.1/24 dev veth-red
ip netns exec blue ip addr add 192.168.28.2/24 dev veth-blue
ip netns exec green ip addr add 192.168.28.3/24 dev veth-green
```

```shell
ip netns exec red ip link set veth-red up
ip link set dev veth-red-br up
ip netns exec blue ip link set veth-blue up
ip link set dev veth-blue-br up
ip netns exec green ip link set veth-green up
ip link set dev veth-green-br up
```

使用bridge的路由模式连通namespace与host
在上文中我们在主机里面创建了一个虚拟的私有网络192.168.15.0/24，里面具有2个网络空间blue和red，通过vbridge-0连接。这个网络对我们的主机来讲是无法连通，因为我们的主机与该网络不属于一个子网（本例中主机IP为：172.31.47.15，通过ip addr查看eth0网卡的ip地址）：

ip netns exec red ping 192.168.26.11

添加默认网关
ip addr add 192.168.28.5/24 dev vbridge

ip netns exec red ip route add default via 192.168.28.5

ip netns exec blue ip route add default via 192.168.28.5

ip netns exec green ip route add default via 192.168.28.5

ip netns exec red ping 192.168.26.11


联通外网

$ sysctl net.ipv4.ip_forward
net.ipv4.ip_forward = 0

# 开启ip forward
$ sysctl -w net.ipv4.ip_forward=1
net.ipv4.ip_forward = 1


通过iptables增加SNAT规则，将源ip为192.168.15.0/24内的数据包的源ip修改为eth0的ip：

$ iptables -t nat -A POSTROUTING -s 192.168.28.0/24 -j MASQUERADE


外网联通容器


iptables -t nat -A PREROUTING -p tcp --dport 8080 -j DNAT --to-destination 192.168.28.1:80


本文从network namespace出发，使用veth pair，bridge，NAT等虚拟网络设备和技术在一个Linux主机中搭建了一个虚拟网络，并实现了如下效果：

虚拟网络的设备直接可以互相访问；
虚拟网络的设备与主机之间可以互相访问；
虚拟网络的设备可以访问公网。