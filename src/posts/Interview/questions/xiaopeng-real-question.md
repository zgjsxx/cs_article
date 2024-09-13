
---
category: 
- 面试
tag:
- 面试
---

- [小鹏汽车在线笔试真题](#小鹏汽车在线笔试真题)
  - [题目：字符串非空子序列](#题目字符串非空子序列)
  - [问题1：计算字符串非空子序列的个数(假定字符串无重复字符)](#问题1计算字符串非空子序列的个数假定字符串无重复字符)
  - [问题2：如果字符串没有重复字符，打印出所有的非空子串](#问题2如果字符串没有重复字符打印出所有的非空子串)
  - [问题3:如果字符串有重复字符，打印出所有的非空子序列](#问题3如果字符串有重复字符打印出所有的非空子序列)

# 小鹏汽车在线笔试真题

## 题目：字符串非空子序列

字符串的子序列是指可以通过删除字符串中的某些字符（也可以不删除）得到的新字符串，但不改变字符的相对顺序。请解决下面的问题：
- 1.计算字符串非空子序列的个数(假定字符串无重复字符)
- 2.如果字符串没有重复字符，打印出所有的非空子序列
- 3.如果字符串有重复字符，打印出所有的非空子序列

## 问题1：计算字符串非空子序列的个数(假定字符串无重复字符)

方法1：

其实如果问题2解决，那么问题1也就自然而然的解决了，因此方法1就是直接构建出所有的子序列，然后求size。

方法2：

字符串的每一个位置的状态是保留或者删除，因此总的子序列个数是${2}^{n}$, 排除空序列，则数量为${2}^{n} - 1$。

## 问题2：如果字符串没有重复字符，打印出所有的非空子串

```cpp
#include <iostream>
#include <string>
#include <vector>

using namespace std;

// 递归函数生成所有非空子序列
void generateSubsequences(const string& str, int index, string current, vector<string>& result) {
    // 如果到达字符串的末尾
    if (index == str.length()) {
        // 如果当前字符串不为空，则将其加入结果中
        if (!current.empty()) {
            result.push_back(current);
        }
        return;
    }

    // 不选择当前字符
    generateSubsequences(str, index + 1, current, result);

    // 选择当前字符
    current.push_back(str[index]);
    generateSubsequences(str, index + 1, current, result);
}

int main() {
    string input="abc";

    vector<string> subsequences;
    generateSubsequences(input, 0, "", subsequences);

    cout << "非空子序列为:" << endl;
    for (const auto& subsequence : subsequences) {
        cout << subsequence << endl;
    }

    return 0;
}
```


## 问题3:如果字符串有重复字符，打印出所有的非空子序列

**方法1**：使用集合set

如果原始字符串中包含重复字符，并且你希望生成的子序列不包含重复的子序列（即结果中的子序列应该是唯一的），可以通过使用 集合 (set) 来去重。

我们可以对生成的子序列进行去重处理。具体做法是在递归过程中，把每一个生成的子序列存储到一个集合中，因为集合中的元素是唯一的，重复的子序列将自动被忽略。

下面是修改后的代码，使用 set 来存储唯一的子序列：

```cpp
#include <iostream>
#include <string>
#include <set>

using namespace std;

// 递归函数生成所有非空子序列
void generateSubsequences(const string& str, int index, string current, set<string>& result) {
    // 如果到达字符串的末尾
    if (index == str.length()) {
        // 如果当前字符串不为空，则将其加入结果中
        if (!current.empty()) {
            result.insert(current);
        }
        return;
    }

    // 不选择当前字符
    generateSubsequences(str, index + 1, current, result);

    // 选择当前字符
    current.push_back(str[index]);
    generateSubsequences(str, index + 1, current, result);
}

int main() {
    string input="abc";

    set<string> subsequences;
    generateSubsequences(input, 0, "", subsequences);

    cout << "非空子序列为:" << endl;
    for (const auto& subsequence : subsequences) {
        cout << subsequence << endl;
    }

    return 0;
}
```

修改点：

使用了 ```set<string>``` 来存储子序列，这样可以确保每个子序列只会被存储一次，去除了重复的子序列。
