---
category: 
  - 分布式系统
tag:
  - 分布式系统
---

- [GFS](#gfs)

# GFS

**GFS追加写文件**

1.client向master发送请求，告知要追加的文件名，master需要找到该文件最后一个chunk的位置

如果Master发现是新文件，会创建新的chunk handle和chunk data，并分配三个chunk server

2.Master 查询primary Chunk，如果没有，需要先指定一个最新的副本为primary Chunk。版本号与 Master 一致的即为最新副本

- 读文件可以从任何最新的Chunk副本读，但是写文件必须通过Primary Chunk来写入。

- Master 指定Primary Chunk即租约过程，租约有个期限（60秒），到期后失去Primary Chunk 身份。租约的作用就是将与客户端交互、更新Chunk的能力授权给Primary Chunk 服务器，客户端不需要再与 Master 交互。租约可以确保没有多个Primary Chunk 出现。

- Master 每次指定新的Primary Chunk后，就会加一次版本号并写入磁盘，然后通知 Chunk server谁主谁备，并告知最新的版本号，Chunk server更新版本号并保存到磁盘。写入磁盘是为了故障恢复

- Master 为何不直接将 Chunk 最大版本号作为最新版本号？因为有可能拥有最新版本号的 Chunk 故障未恢复。Master 定期询问 Chunk 持有的版本号，如果没找到和 Master 一致的版本号，Master 会等待不响应客户端请求

- Master 可能在租约时崩溃，重启后有Chunk上报一个比本地更大的版本号，Master 会知道租约时发生了错误，选这个最大的版本号作为最新版本号

3.client直接与Primary 和 Secondary Chunk server通信，将数据发送给他们。Chunk Server先将数据写到临时位置，此时还不会立即追加到文件中。直到所有 SecondaryChunk Server写完，会发送ack给Primary，Primary 写完文件后再回复client，写完成。

如果client收到错误，client就会重新向master发送请求，重复上面的过程
Master 发现无法联系到 Primary，会等待租约到期再指定新的 Primary，防止出现脑裂的情况

参考文章：

好文章：https://zhuanlan.zhihu.com/p/354450124

系列：https://mit-public-courses-cn-translatio.gitbook.io/mit6-824

https://zhuanlan.zhihu.com/p/694368973

https://zhuanlan.zhihu.com/p/424677701