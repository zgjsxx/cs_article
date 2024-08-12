---
category: 
- Linux
- tool
---

# Linux工具之lsof命令详解

## 基本概念

命令 lsof （ list opened files ）负责列出系统中已经打开的文件，包括普通文件，目录，块特殊文件，字符特殊文件，正在执行的文本引用，库，流或网络文件（例如：网络套接字，NFS文件或UNIX域套接字）。

## 常用参数
-p pid : 输出指定进程打开的文件；

-l : 输出中使用ID代替用户名；

-u userName : 输出指定用户打开的文件；

-c string : 输出 COMMAND 列中包含 string 的项；

-d fd : 输出包含指定描述符的项；

fileName : 输出打开文件 fileName 的所有项；

-i [46] [protocol][@hostname|hostaddr][:service|port] : 输出符合指定条件的项，其中：

    46 ：分别指 IPv4、IPv6；

    protocol ：指 TCP 或 UDP；

    hostname :  网络主机名；

    hostaddr : IP 地址；

    service : 包含在 /etc/services 中的名称；

    port : 端口号，可以是多个；


## 使用场景

### 无参数


### -p参数


### -I参数

### -u参数

### -c参数

### -d参数

### lsof + 文件名
执行命令 lsof /usr/lib64/ld-2.17.so，查看打开文件/usr/lib64/ld-2.17.so的进程项，如下所示：

### -i参数




## 总结

## 参考文献
