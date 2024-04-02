环境搭建

https://courses.edx.org/courses/course-v1:StanfordOnline+SOE.YCSCS1+3T2020/6b750292e90d4950b895f621a5671b49/


16.04 版本莫名其妙无法使用 spim。

```x86asm
$ spim fact.s
/usr/class/cs143/cool/bin/spim: line 82: /usr/class/cs143/cool/bin/../bin/.i686/spim:  No such file or directory
whereas the spim file exists. If the operating system is a 64-bit machine then the following command might help in Ubuntu.
```

使用下面的命令可以解决该问题：

```shell
sudo apt-get install gcc-multilib
```

cs143论坛：

https://discussions.edx.org/course-v1:StanfordOnline+SOE.YCSCS1+2T2020/posts


## 参考文章

- [spim找不到](https://discussions.edx.org/course-v1:StanfordOnline+SOE.YCSCS1+2T2020/posts/5f54d519d1eb0c0a75a6dea2)