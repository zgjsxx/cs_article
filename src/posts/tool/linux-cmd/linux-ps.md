

# ps命令


ps查看pid/ppid/pgid/sid

```shell
ps  xao pid,ppid,pgid,sid,comm  |head -n 1; ps  xao pid,ppid,pgid,sid,comm  |grep a.out
```