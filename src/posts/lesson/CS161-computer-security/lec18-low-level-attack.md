- [lec18 low level network attacks](#lec18-low-level-network-attacks)
  - [ARP spoofing(ARP 欺骗)](#arp-spoofingarp-欺骗)
  - [DHCP](#dhcp)
    - [**1. DHCP Discover（发现阶段）**](#1-dhcp-discover发现阶段)
    - [**2. DHCP Offer（提供阶段）**](#2-dhcp-offer提供阶段)
    - [**3. DHCP Request（请求阶段）**](#3-dhcp-request请求阶段)
    - [**4. DHCP Acknowledgment（确认阶段）**](#4-dhcp-acknowledgment确认阶段)
    - [**5. IP 配置生效**](#5-ip-配置生效)
    - [**6. DHCP 租约的更新与释放**](#6-dhcp-租约的更新与释放)
    - [**总结：DHCP 请求流程**](#总结dhcp-请求流程)
    - [**图解：DHCP 请求流程**](#图解dhcp-请求流程)
    - [**关键点总结**](#关键点总结)

# lec18 low level network attacks

## ARP spoofing(ARP 欺骗)

## DHCP

**DHCP 请求的流程** 是指一个设备（客户端）如何通过 **DHCP（动态主机配置协议）** 向 **DHCP 服务器** 请求并获取网络配置（如 IP 地址、子网掩码、网关等）的过程。整个流程可以分为以下几个步骤：

### **1. DHCP Discover（发现阶段）**
当 **DHCP 客户端** 启动并连接到网络时，它还没有配置 IP 地址，通常会使用 **0.0.0.0** 作为源地址。此时，客户端会向网络广播一个 **DHCP Discover** 消息，寻找可用的 **DHCP 服务器**。

- **消息内容**：DHCP Discover 消息会包含客户端的 MAC 地址（物理地址）以及一些其他信息（如客户端的主机名等），告诉 DHCP 服务器这是一个新的客户端设备，想要获取 IP 配置。
- **广播方式**：由于客户端没有 IP 地址，它会发送一个 **广播消息**（目标地址：255.255.255.255），因为它不知道哪个 DHCP 服务器可用。

### **2. DHCP Offer（提供阶段）**
当 **DHCP 服务器** 接收到 DHCP Discover 消息后，它会回复一个 **DHCP Offer** 消息。这个消息会包含以下信息：
- **IP 地址**：为客户端分配的 **IP 地址**。
- **子网掩码**：适用于客户端的子网掩码。
- **默认网关**：客户端的默认网关地址（如果需要）。
- **租约时间**：此 IP 地址租用的时间（租约期）。
- **其他配置**：例如 DNS 服务器地址、NTP 服务器等。

**DHCP Offer** 是由所有收到 **DHCP Discover** 消息的 DHCP 服务器发出的，因此网络中可能会有多个 DHCP Offer 消息。

### **3. DHCP Request（请求阶段）**
客户端收到一个或多个 **DHCP Offer** 后，会选择其中一个 **DHCP Offer**（通常选择第一个收到的），并向该 DHCP 服务器发送 **DHCP Request** 消息。此消息表示客户端接受该服务器提供的 IP 地址及配置，并请求使用该 IP 地址。

- **消息内容**：客户端会在 **DHCP Request** 消息中明确指定它选择的 DHCP 服务器，并附带之前收到的 **DHCP Offer** 中的 IP 地址。
- **目标地址**：此时，客户端已经知道所选 DHCP 服务器的 IP 地址，所以它将 **DHCP Request** 消息发送给该服务器，而不是广播。

### **4. DHCP Acknowledgment（确认阶段）**
当 **DHCP 服务器** 收到客户端的 **DHCP Request** 消息后，它会向客户端发送一个 **DHCP Acknowledgment**（确认消息）。这个消息包含的内容与 **DHCP Offer** 消息相同，确认客户端的 IP 地址分配有效。

- **消息内容**：此时，DHCP 服务器确认给客户端分配的 IP 地址是有效的，且租约期开始计时。
- **租约期**：服务器会开始记录这个 IP 地址的租用信息，并根据租约期对该 IP 地址进行管理。

### **5. IP 配置生效**
一旦客户端收到 **DHCP Acknowledgment** 消息，它就可以使用该 IP 地址及其他配置（如网关、DNS 服务器等）开始与网络中的其他设备进行通信。

---

### **6. DHCP 租约的更新与释放**
- **更新租约**：在租约期即将到期时，客户端会发送 **DHCP Request** 消息，向 DHCP 服务器请求续期。服务器收到后会发送 **DHCP Acknowledgment** 消息，继续延长租约。
- **释放租约**：当客户端不再需要该 IP 地址时（例如，断开网络连接），它会向 DHCP 服务器发送 **DHCP Release** 消息，释放该 IP 地址供其他设备使用。

---

### **总结：DHCP 请求流程**
1. **DHCP Discover**：客户端广播请求，寻找 DHCP 服务器。
2. **DHCP Offer**：DHCP 服务器响应，提供可用的 IP 地址和配置信息。
3. **DHCP Request**：客户端选择一个 DHCP 服务器的 Offer，发送请求确认。
4. **DHCP Acknowledgment**：DHCP 服务器确认 IP 地址分配，客户端开始使用该 IP 地址。

---

### **图解：DHCP 请求流程**

```
客户端           网络              DHCP 服务器
   |             广播（Discover）     |
   |-------------------------------->|
   |             返回（Offer）        |
   |<--------------------------------|
   |             请求（Request）      |
   |-------------------------------->|
   |             确认（Acknowledge）  |
   |<--------------------------------|
   |          配置生效，通信开始       |
```

---

### **关键点总结**
- **DHCP Discover**：客户端广播寻找 DHCP 服务器。
- **DHCP Offer**：DHCP 服务器提供 IP 地址。
- **DHCP Request**：客户端请求所选的 DHCP 服务器分配的 IP 地址。
- **DHCP Acknowledgment**：DHCP 服务器确认并分配 IP 地址。

这个过程使得设备能够自动获取网络配置，避免了手动设置 IP 地址的麻烦。