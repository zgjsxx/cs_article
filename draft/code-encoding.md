# 编码那些事

# Unicode
这一标准的 2 字节形式通常称作 UCS-2。然而，受制于 2 字节数量的限制，UCS-2 只能表示最多 65536 个字符。Unicode 的 4 字节形式被称为 UCS-4 或 UTF-32，能够定义 Unicode 的全部扩展，最多可定义 100 万个以上唯一字符。



UTF: UCS Transformation Format

# UCS-2
http://www.columbia.edu/kermit/ucs2.html
仅使用第一个数据平面
U+0000至U+FFFF
65536

# UTF-16

0x000000 - 0x10FFFFF


0001D306

D834DF06


C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
  = (0xD834 - 0xD800) * 0x400 + (0xDF06 - 0x0xDC00) + 0x10000
  = 0x1D306

https://juejin.cn/post/7168115637884026894


# UTF-32
固定长度，4字节

https://www.qqxiuzi.cn/bianma/zifuji.php



# UCS-4
0x0 - 0x7FFFFFFF