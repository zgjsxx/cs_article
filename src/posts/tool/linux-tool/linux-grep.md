---
category: 
- Linux
- tool
---

# grep

## -A

选项 -A（或 --after-context）允许你在匹配的行之后显示指定数量的上下文行。以下是 grep -A 的用法示例和详细说明。

```shell
grep -A [行数] [模式] [文件]
```

示例
假设我们有一个名为 ```example.txt``` 的文件，其内容如下：

```shell
line 1: This is a sample text.
line 2: The quick brown fox jumps over the lazy dog.
line 3: Lorem ipsum dolor sit amet.
line 4: Consectetur adipiscing elit.
line 5: Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
```

示例 1: 在匹配行之后显示 2 行

```shell
grep -A 2 "quick" example.txt
```

输出：

```shell
line 2: The quick brown fox jumps over the lazy dog.
line 3: Lorem ipsum dolor sit amet.
line 4: Consectetur adipiscing elit.
```

这个命令搜索包含 "quick" 的行，并显示该行以及其后的两行。