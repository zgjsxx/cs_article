---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录mktime.c详解

该模块较为简单，仅有一个函数，仅在内核中使用，计算系统开机时的滴答数。
## kernel_mktime
```c
long kernel_mktime(struct tm * tm)
```
该函数的作用是计算1970年以来的秒数。 其在time_init函数中调用，用于获取开机的时间。

首先计算开机时距离1970年有多少年。如果tm_year大于70， 说明年份在区间[1970-1999]中。如果tm_year小于70，说明年份在区间[2000， 2069]。依次进行判断计算出距离1970的年数year。在计算一年的秒数时使用的是365天，因此还需要加上run年的天数， 即DAY*((year+1)/4)。

```c
long res;
int year;
if (tm->tm_year >= 70) 
  year = tm->tm_year - 70;
else
  year = tm->tm_year + 100 -70; 
  res = YEAR*year + DAY*((year+1)/4);
```

接着计算出当前年份的月份所占有的秒数。同时由于month数组的2月计算的是29天，因此如果当年不是闰年，需要减去一天。
```c
res += month[tm->tm_mon];
if (tm->tm_mon>1 && ((year+2)%4))
  res -= DAY;
```

最后一步就是加上开机时的(日， 小时， 秒)对应的秒数。
```c
res += DAY*(tm->tm_mday-1);
res += HOUR*tm->tm_hour;
res += MINUTE*tm->tm_min;
res += tm->tm_sec;
return res;
```