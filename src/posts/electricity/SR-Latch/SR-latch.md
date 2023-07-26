# SR锁存器

由或非门组成的锁存器：

![SR锁存器](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/SR-latch/SR-latch.png)

其真值表和Q先前的值有关系：

|${S}_{D}$| ${R}_{D}$|$Q$|${Q}^{*}$ | 
|--|--|--|--|
|0 | 0| 0 | 0|
|0 | 0| 1 | 1|
|1 | 0| 0 | 1|
|1 | 0| 1 | 1|
|0 | 1| 0 | 0|
|0 | 1| 1 | 0|
|1 | 1| 0 | 0|
|1 | 1| 1 | 0|