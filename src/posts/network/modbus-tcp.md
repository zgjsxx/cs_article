---
category: 
- network
---

# modbus-TCP

1996年施耐德公司推出基于以太网TCP/IP的modbus协议：modbus-TCP。

MODBUS-TCP使MODBUS-RTU协议运行于以太网，MODBUS-TCP使用TCP/IP以太网在站点间传送MODBUS报文，MODBUS-TCP结合了以太网物理网络和网络标准TCP/IP以及以MODBUS作为应用协议标准的数据表示方法。MODBUS-TCP通信报文包在以太网TCP/IP数据包中。与传统的串口方式，MODBUS-TCP插入一个标准的MODBUS报文到TCP报文中，不再带有数据校验和地址。

## MODBUS报文解析

| MBAP Header | Function code | Data |
|    Header   |          PDU         |

MBAP header包含下面几个部分：
- Transaction ID
- Protocol ID
- Length
- UnitID

|id|名称|长度|说明|
|--|--|--|--|
|1|Transaction ID 事务处理标识 | 2字节| 报文的序列号，一般每次通讯加1，用于区别不同的报文 | 
|2|Protocol ID 协议标识| 2字节 | 00 00 代表modbus-Tcp |
|3|Length |2字节| Unit长度 + PDU的长度|
|4|UnitID| 单元标识符 | 1| 设备地址 |


下面的这一串MBAP header|00 01| 00 00|00 06| 01 |， 其含义如下：

事务标识为1，协议是modbus-tcp协议，数据长度是：6，从站号是1。

需要注意的是MODBUS协议是一个**大端**的协议，前两个byte 00 01代表0x1 , 因此Transaction ID=1。而长度字段00 06代表0x6， 即UnitID和PDU的长度总和为6。

PDU部分相对复杂一些，主要是对一些寄存器进行读写操作。

modbus的操作对象有四种：**线圈寄存器**、**离散输入寄存器**、**输入寄存器**、**保持寄存器**。

|寄存器种类|数据类型|访问类型|功能码|
|--|--|--|--|
|线圈寄存器|bit|读写|01H 05H 0FH|
|离散输入寄存器|bit|只读|02H|
|输入寄存器|2 bytes(word)|只读|04H|
|保持寄存器|2 bytes(word)|读写|03H 06H 10H|

线圈寄存器和离散输入寄存器是以bit为单位的寄存器，只能存储开关量，线圈寄存器可读可写，而离散输入寄存器只可读。

输入寄存器和保持寄存器以为2个byte为单位的寄存器，可以存储离散的变量， 保持寄存器可读可写， 输入寄存器只读。

常用的功能码作用如下：
|功能码|功能|
|--|--|
|0x01|读单个或者多个线圈寄存器|
|0x02|读离散量输入寄存器|
|0x03|读保持寄存器|
|0x04|读输入寄存器|
|0x05|写单个线圈寄存器|
|0x06|写单个保持寄存器|
|0x10|写多个保持寄存器|
|0x0F|写多个线圈寄存器|


## 常用功能码详解

### 功能码0x1：读线圈寄存器

每个线圈寄存器可以存储一个bit的信息， 功能码0x01就是用于读取slave中线圈寄存器的状态，可以是**单个线圈寄存器**，也可以是**多个连续的线圈寄存器**。

**发送报文**

发送报文由下面几个部分组成，总共12字节：

MBAP header(7字节) + 功能码(1字节) + 线圈寄存器起始地址的高位（1字节） + 线圈寄存器起始地址的低位（1字节） + 线圈寄存器数量的高位（1字节） + 线圈寄存器数量的低位（1字节）

下面是一个用Modbus-Poll和Modbus-Slave测试的实际的例子，其含义是读取线圈寄存器的起始地址是0x0， 读取数量为 0x0a（十进制10）个。

![0x1-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x1-request.png)


|MBAP header|功能码|起始地址高字节|起始地址低字节|寄存器数量的高位|寄存器数量的低位|
|--|--|--|--|--|--|
|01 66 00 00 00 06 01 | 01 | 00 | 00 | 00 | 0a |

其中：

TransanctionID = 358, Length = 6。

功能码为0x1，代表读取线圈寄存器。

读取的线圈寄存器的起始地址为0。

读取的线圈寄存器的数量为0xa(十进制10)个。

**响应报文**

响应报文的长度不是固定的，长度和用户请求的数据长度有关，由下面几个部分组成：

MBAP header(7字节) + 功能码(1字节) + 线圈寄存器的值

下面是一个实际的响应报文的内容:

![0x1-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x1-response.png)


|MBAP header|功能码|字节数|请求的数据1|请求的数据2|
|--|--|--|--|--|
|01 66 00 00 00 05 01 | 01 | 02 | 21 | 02 |

返回的第一个字节21，转化为二进制为00100001， 其中bit0代表00寄存器，bit7代表07寄存器。

|0x7|0x6|0x5|0x4|0x3|0x2|0x1|0x0|
|--|--|--|--|--|--|--|--|
|0|0|1|0|0|0|0|1|

返回的第二个字节02，转化为二进制为00000010， 其中bit0代表08寄存器，bit1代表09寄存器。

|0x9|0x8|
|--|--|
|1|0|

### 功能码0x5: 写单个线圈寄存器0x05：

功能码0x5的作用是对单个线圈寄存器写值ON/OFF。

**发送报文**

发送报文由下面几个部分组成，总共12字节：

MBAP header(7字节) + 功能码(1字节) + 线圈寄存器起始地址的高位（1字节） + 线圈寄存器起始地址的低位（1字节） + 要写的值的高位（1字节） + 要写的值的低位（1字节）

将从站中的一个输出写成ON或OFF，0xFF00代表为ON,0x0000代表为OFF。

下面是一个实际的例子：

![0x5-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x5-request.png)

|MBAP header|功能码|起始地址高字节|起始地址低字节|写的值的高位|写的值的低位|
|--|--|--|--|--|--|
|00 6f 00 00 00 06 01 | 05 | 00 | 04 | ff | 00 |

在这个例子中，对从站01的0x4号线圈执行ON操作。

**响应报文**

可以看到，如果写单个线圈成功，返回报文的值和发送报文的值相同：

![0x5-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x5-response.png)


### 功能码0x0F：写多个线圈寄存器

将一个从站中的多个线圈寄存器的写为ON或OFF，数据域中置1的位请求相应输出位ON，置0的位请求响应输出为OFF。

**发送报文**

发送报文由下面几部分组成：

MBAP 功能码 + 起始地址H 起始地址L + 输出数量H 输出数量L + 字节长度 + 输出值H 输出值L

其总长度为 13 + (修改的线圈寄存器数量/8 + 1）。

下面是一个实际的例子

![0xF-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0xF-request.png)

按照协议进行对应的结果如下：

|MBAP header|功能码| 线圈寄存器起始位置| 线圈寄存器的数量 | 字节数| 第一个byte的值|第二个byte的值 | 
|--|--|--|--|--|--|--|
|01 71 00 00 00 09 01|0f |00 00 |00 0a |02 | 70 | 00|

其中第一个byte的值是0x70， 转换为二进制是01110000，其中低位bit0代表00寄存器，bit7代表07寄存器。

|0x7|0x6|0x5|0x4|0x3|0x2|0x1|0x0|
|--|--|--|--|--|--|--|--|
|0|1|1|1|0|0|0|0|

第二个byte的值是0x0， 转换为二进制是00000000，其中低位bit0代表08寄存器，bit1代表09寄存器。

|0x9|0x8|
|--|--|
|0|0|

该请求的作用起始就是将04 05 06寄存器的状态改为ON。

**返回报文**

返回的报文相对比较简单，由下面几个部分组成：

MBAP header + 功能码 + 起始地址H 起始地址L + 输出数量H 输出数量L

下面是一个实际的例子：

![0xF-response](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0xF-response.png)

按照协议对应各部分的内容如下：

|MBAP header|功能码| 线圈寄存器起始位置| 线圈寄存器的数量 
|--|--|--|--|
|01 71 00 00 00 06 01|0f|00 00|00 0a|

### 功能码0x02：读离散量输入寄存器

功能码0x2和0x1是比较类似的。只是操作的离散量输入寄存器是只读的，没有写操作的接口。

每个离散量输入寄存器可以存储一个bit的信息， 功能码0x02就是用于读取slave中离散量输入寄存器的状态，可以是**单个线圈寄存器**，也可以是**多个连续的线圈寄存器**。

**发送报文**

发送报文由下面几个部分组成，总共12字节：

MBAP header(7字节) + 功能码(1字节) + 离散量输入寄存器起始地址的高位（1字节） + 离散量输入寄存器起始地址的低位（1字节） + 离散量输入寄存器数量的高位（1字节） + 离散量输入寄存器数量的低位（1字节）

下面是一个用Modbus-Poll和Modbus-Slave测试的实际的例子，其含义是读取线圈寄存器的起始地址是0x0， 读取数量为 0x0a（十进制10）个。

![0x2-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x2-request.png)


|MBAP header|功能码|起始地址高字节|起始地址低字节|寄存器数量的高位|寄存器数量的低位|
|--|--|--|--|--|--|
|01 b9 00 00 00 06 01 | 01 | 00 | 00 | 00 | 0a |

其中：

TransanctionID = 441, Length = 6。

功能码为0x1，代表读取线圈寄存器。

读取的线圈寄存器的起始地址为0。

读取的线圈寄存器的数量为0xa(十进制10)个。

**响应报文**

响应报文的长度不是固定的，长度和用户请求的数据长度有关，由下面几个部分组成：

MBAP header(7字节) + 功能码(1字节) +  离散量输入寄存器的值

下面是一个实际的响应报文的内容:

![0x2-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x2-response.png)

|MBAP header|功能码|字节数|请求的数据1|请求的数据2|
|--|--|--|--|--|
|01 b9 00 00 00 05 01 | 01 | 02 | 12 | 02 |

返回的第一个字节12，转化为二进制为00010010， 其中bit0代表00寄存器，bit7代表07寄存器。

|0x7|0x6|0x5|0x4|0x3|0x2|0x1|0x0|
|--|--|--|--|--|--|--|--|
|0|0|0|1|0|0|1|0|

返回的第二个字节02，转化为二进制为00000010， 其中bit0代表08寄存器，bit1代表09寄存器。

|0x9|0x8|
|--|--|
|1|0|


### 功能码0x03：读保持寄存器

功能码0x03用于读取保持寄存器的值，从远程设备中读保持寄存器连续块的内容。

**发送报文**

请求报文的结构如下：

MBAP header + 功能码 +  起始地址H 起始地址L + 寄存器数量H 寄存器数量L（共12字节）

下面是一个实际的例子：

![0x3-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x3-request.png)

按照协议对照如下：

|MBAP header|功能码|起始地址|寄存器数量|
|--|--|--|--|
|05 f1 00 00 00 06 01|03|00 00|00 0a|

**响应报文**

响应报文的结构由下面几个部分组成：

MBAP header + 功能码 + 数据长度 + 寄存器数据

数据总长度 = 9 + 寄存器数量 × 2

下面是一个response的结构：

![0x3-response](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x3-response.png)

从中我们可以提取出下面的对应关系：

|MBAP header|功能码|字节数|第0byte值|第1byte值|第2byte值|第3byte值|第4byte值|第5byte值|第6byte值|第7byte值|第8byte值|第9byte值|
|--|--|--|--|--|--|--|--|--|--|--|--|--|
|05 f1 00 00 00 17 01|03|14|01 2c|00 00|00 00|00 37|00 00|00 00|00 64|00 00|00 3c|00 00|

由上面的对应关系，我们可以提取出我们想要读取的保持寄存器的值：

|第0个寄存器|第1个寄存器|第2个寄存器|第3个寄存器|第4个寄存器|第5个寄存器|第6个寄存器|第7个寄存器|第8个寄存器|第9个寄存器|
|--|--|--|--|--|--|--|--|--|--|
|300|0|0|55|0|0|100|0|60|0|

### 功能码0x04：读输入寄存器

功能码0x4用于读取输入寄存器的值，输入寄存器是只读的，因此没有功能码可以写输入寄存器。

**发送报文**

请求报文格式如下：

MBAP header + 功能码 + 起始地址H 起始地址L + 寄存器数量H 寄存器数量L（共12字节）

下面是一个实际的例子：

![0x4-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x4-request.png)

|MBAP header|功能码|起始地址|寄存器数量|
|--|--|--|--|
|0b f8 00 00 00 06 01|04|00 00|00 0a|

该请求的含义是读取0-9号寄存器的值。

**响应报文**

响应报文的结构由下面几个部分组成：

MBAP header + 功能码 + 数据长度 + 寄存器数据

数据总长度 = 9 + 寄存器数量 × 2

下面是一个response的结构：

![0x4-response](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x4-response.png)

从中我们可以提取出下面的对应关系：

|MBAP header|功能码|字节数|第0byte值|第1byte值|第2byte值|第3byte值|第4byte值|第5byte值|第6byte值|第7byte值|第8byte值|第9byte值|
|--|--|--|--|--|--|--|--|--|--|--|--|--|
|0b f8 00 00 00 17 01|04|14|00 00|00 00|00 c8|00 00|01 2c|00 00|00 00|00 00|00 42|00 00|

由上面的对应关系，我们可以提取出我们想要读取的保持寄存器的值：

|第0个寄存器|第1个寄存器|第2个寄存器|第3个寄存器|第4个寄存器|第5个寄存器|第6个寄存器|第7个寄存器|第8个寄存器|第9个寄存器|
|--|--|--|--|--|--|--|--|--|--|
|0|0|200|0|300|0|0|0|66|0|

### 功能码0x06：写单个保持寄存器

在一个远程设备中写一个保持寄存器。

**发送报文**

请求报文格式如下：

MBAP header + 功能码 + 寄存器地址H 寄存器地址L + 寄存器值H 寄存器值L（共12字节）

下面是一个实际的例子:

![0x6-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x6-request.png)

|MBAP header|功能码|保持寄存器地址 |保持寄存器的值
|--|--|--|--|
|1F 97 00 00 00 06 01|06|00 04|00 64|

该请求的含义是向地址为0x4的寄存器写入100。

**响应报文**

响应报文如下：

MBAP header + 功能码 + 寄存器地址H 寄存器地址L + 寄存器值H 寄存器值L（共12字节）

成功响应的报文与发送报文格式相同。

![0x6-response](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x6-response.png)

### 功能码0x10：写多个保持寄存器

在一个远程设备中写连续寄存器块（1~123个寄存器）

**发送报文**

请求报文格式如下：

MBAP header + 功能码 + 起始地址H 起始地址L + 寄存器数量H 寄存器数量L + 字节长度 + 寄存器值（13+寄存器数量×2）

![0x10-request](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x10-request.png)

|MBAP header|功能码|起始地址|长度|字节数|字节0数据|字节1数据|字节2数据|字节3数据|字节4数据|字节5数据|字节6数据|字节7数据|字节8数据|字节9数据|
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|00 26 00 00 00 1b 01|10|00 00|00 0a|14 00|00 00 |00 00| 00 00 | 00 00|00 c8|00 00| 00 00| 00 64| 00 00| 00 64|

**响应报文**

响应报文如下：

MBAP header + 功能码 + 起始地址H 起始地址L + 寄存器数量H 寄存器数量L（共12字节）

![0x10-response](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/network/modbus-tcp/modbus-0x10-response.png)

|MBAP header|功能码|起始地址|长度|
|--|--|--|--|
|00 26 00 00 00 1b 01|10|00 00|00 0a|


## 实用调试工具

在研究modbus的过程中， 大量的使用了modbus poll和 modbus slave软件，这个软件可以很好的帮助理解modbus-tcp协议。

modbus poll： modbus客户端工具(主站)

modbus slave: modbus服务端工具(从站)
