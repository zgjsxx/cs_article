---
category: 
- Mysql
---

# mysql ibd文件格式

数据页结构图

File Header(38 字节)
Page Header(56 字节)
Infimum + Supermum 26字节
User Records(不确定大小)
Free Space(不确定大小)
Paga Directory(不确定大小)
File Trailer(8字节)

![mysql](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/database/mysql/mysql-data-page/page-format.png)


https://link.zhihu.com/?target=https%3A//github.com/happieme/py_innodb_page_info

因为主键索引B+树的根页在整个表空间文件中的第3个页开始

https://ost.51cto.com/posts/11646

https://developer.aliyun.com/article/1151155

https://zhuanlan.zhihu.com/p/580906303

http://www.miaozhouguang.com/?p=261

https://blog.csdn.net/u010647035/article/details/105009979

https://www.baiyp.ren/MySQL%E8%A1%A8%E7%A9%BA%E9%97%B4%E8%AF%A6%E8%A7%A3.html

https://www.modb.pro/db/139052

https://www.modb.pro/db/139052(参考这个写)