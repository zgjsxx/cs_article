---
category: 
- Linux
- tool
---


## 删除带有空格的文件

有三个文件，名字中带有空格， 如何使用通配符删除它们？

```shell
my test1.txt
my test2.txt
my test3.txt
```

```shell
rm -rf my\ test*.txt
```