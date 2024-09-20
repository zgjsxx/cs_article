
---
category: 
- 面试
tag:
- 面试
---

- [小鹏汽车在线笔试真题](#小鹏汽车在线笔试真题)
  - [题目：字符串非空子序列(一面)](#题目字符串非空子序列一面)
  - [问题1：计算字符串非空子序列的个数(假定字符串无重复字符)](#问题1计算字符串非空子序列的个数假定字符串无重复字符)
  - [问题2：如果字符串没有重复字符，打印出所有的非空子串](#问题2如果字符串没有重复字符打印出所有的非空子串)
  - [问题3:如果字符串有重复字符，打印出所有的非空子序列](#问题3如果字符串有重复字符打印出所有的非空子序列)
  - [题目：LRU cache(二面)](#题目lru-cache二面)
  - [题目： 判断字符串能否划分为多个递增+1的整数(三面)](#题目-判断字符串能否划分为多个递增1的整数三面)

# 小鹏汽车在线笔试真题

## 题目：字符串非空子序列(一面)

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

## 题目：LRU cache(二面)

请你设计并实现一个满足  LRU (最近最少使用) 缓存 约束的数据结构。

实现 ```LRUCache``` 类：

- ```LRUCache(int capacity)``` 以 正整数 作为容量 ```capacity``` 初始化 LRU 缓存
- ```int get(int key)``` 如果关键字 ```key``` 存在于缓存中，则返回关键字的值，否则返回 ```-1``` 。
- ```void put(int key, int value)``` 如果关键字 ```key``` 已经存在，则变更其数据值 ```value``` ；如果不存在，则向缓存中插入该组 ```key-value``` 。如果插入操作导致关键字数量超过 ```capacity``` ，则应该 逐出 最久未使用的关键字。

函数 ```get``` 和 ```put``` 必须以 ```O(1)``` 的平均时间复杂度运行。

**思路**：看到要求是```get``` 和 ```put``` 必须以 ```O(1)``` 的平均时间复杂度，基本可以确定要用到```std::list```和```std::unordered_map```。用于使用了容器```std::list```而不是自动构建链表，因此```unordered_map```存储节点位置时要用迭代器而不是裸指针。```LRU```操作时需要将某个节点元素移动到链表的头部，这里最佳的办法是使用```std::list```的```splice```方法，其次可以选择先删除，再插入到头部的方法。

```cpp
#include <unordered_map>
#include <list>
#include <iostream>

// 定义一个结构体来存储键值对
struct CacheNode {
    int key;
    int value;
    CacheNode(int k, int v) : key(k), value(v) {}
};

class LRUCache {
private:
    int capacity_;  // 缓存的最大容量
    std::list<CacheNode> cacheList_;  // 双向链表，存储缓存的元素
    std::unordered_map<int, std::list<CacheNode>::iterator> cacheMap_;  // 哈希表，存储键及其在链表中的位置

public:
    LRUCache(int capacity) : capacity_(capacity) {}

    // 获取指定键的值，如果存在则返回值并将该节点移到链表头部，否则返回 -1
    int get(int key) {
        if (cacheMap_.find(key) == cacheMap_.end()) {
            return -1;  // 键不存在
        }

        // 获取节点的迭代器
        auto it = cacheMap_[key];

        // 将该节点移到链表头部（表示最近使用）
        cacheList_.splice(cacheList_.begin(), cacheList_, it);

        // 返回该节点的值
        return it->value;
    }

    // 插入键值对，若键已存在则更新值并将其移到链表头部，若缓存已满则删除最久未使用的元素
    void put(int key, int value) {
        // 如果键已经在缓存中
        if (cacheMap_.find(key) != cacheMap_.end()) {
            // 更新值
            auto it = cacheMap_[key];
            it->value = value;

            // 将该节点移到链表头部（最近使用）
            cacheList_.splice(cacheList_.begin(), cacheList_, it);
        } else {
            // 如果缓存已满，删除最久未使用的元素（链表尾部）
            if (cacheList_.size() == capacity_) {
                int oldKey = cacheList_.back().key;  // 获取最久未使用的键
                cacheList_.pop_back();  // 删除链表尾部的节点
                cacheMap_.erase(oldKey);  // 从哈希表中删除该键
            }

            // 插入新元素到链表头部
            cacheList_.emplace_front(key, value);
            // 更新哈希表中该键的位置
            cacheMap_[key] = cacheList_.begin();
        }
    }
    void print() const {
        auto it = cacheList_.begin();
        for(;it != cacheList_.end(); it++) {
             std::cout << "<" << it->key << "," << it->value << ">" ;
             if(std::next(it) != cacheList_.end() ) {
                std::cout << " -> ";
             }
        }
        std::cout << std::endl;
    }
};

// 测试用例
int main() {
    LRUCache lruCache(2);  // 容量为2的缓存
    lruCache.put(1, 1);
    lruCache.put(2, 2);
    lruCache.print();
    std::cout << lruCache.get(1) << std::endl;  // 返回 1
    lruCache.print();
    lruCache.put(3, 3);    // 移除键 2
    lruCache.print();
    std::cout << lruCache.get(2) << std::endl;  // 返回 -1 (未找到)
    lruCache.print();
    lruCache.put(4, 4);    // 移除键 1
    lruCache.print();
    std::cout << lruCache.get(1) << std::endl;  // 返回 -1 (未找到)
    std::cout << lruCache.get(3) << std::endl;  // 返回 3
    std::cout << lruCache.get(4) << std::endl;  // 返回 4

    return 0;
}
```

## 题目： 判断字符串能否划分为多个递增+1的整数(三面)

例子：

```shell
"1234" ->  1,2,3,4 OK
"201202" -> 201, 202
"201203" -> 201, 203
```

方法1： 第一个数字的长度区间是1到n/2，在第一个循环以此进行遍历。有了第一个数字以后，那第二个数字的期望值就知道了，将其转化为字符串，然后去源字符串中去寻找，看是否可以匹配上，第二个循环一直这样遍历下去直到字符串结尾。

```cpp
#include <iostream>
#include <string>
using namespace std;

// 辅助函数：将字符串的某个子串转为整数
long long toInteger(const string &s, int start, int length) {
    return stoll(s.substr(start, length));
}

// 判断是否能分割为递增的数字
bool canSplitIntoConsecutiveNumbers(const string &s) {
    int n = s.size();
    
    // 枚举第一个数字的长度
    for (int len = 1; len <= n / 2; ++len) {
        long long prev = toInteger(s, 0, len); // 第一个数字
        int idx = len; // 当前字符串中的索引

        bool valid = true;
        
        // 尝试后续的每个数字是否递增
        while (idx < n) {
            // 下一个期望的数字
            long long next = prev + 1;
            string nextStr = to_string(next);
            int nextLen = nextStr.size();
            
            // 判断字符串长度是否足够容纳下一个数字
            if (idx + nextLen > n || s.substr(idx, nextLen) != nextStr) {
                valid = false;
                break;
            }
            
            // 更新为下一个数字
            prev = next;
            idx += nextLen;
        }
        
        // 如果找到了一个有效的分割
        if (valid) {
            return true;
        }
    }
    
    // 如果所有长度的尝试都失败，返回 false
    return false;
}

int main() {
    string s = "78910";
    
    if (canSplitIntoConsecutiveNumbers(s)) {
        cout << "字符串可以划分为多个递增的整数,每个比前一个大1" << endl;
    } else {
        cout << "字符串不能划分为多个递增的整数" << endl;
    }

    return 0;
}

```


方法2：我们可以先选择第一个数字，然后尝试构建一个与字符串完全匹配的递增+1的数字序列，而不是逐步去尝试每个长度。

```cpp
#include <iostream>
#include <string>
using namespace std;

// 判断是否能分割为递增的数字
bool canSplitIntoConsecutiveNumbers(const string &s) {
    int n = s.size();
    
    // 尝试不同长度的第一个数字（最多到一半长度）
    for (int len = 1; len <= n / 2; ++len) {
        long long firstNum = stoll(s.substr(0, len)); // 第一个数字
        long long currentNum = firstNum;
        
        string expected = to_string(currentNum); // 期望的整个序列
        int idx = len;
        
        // 动态生成后续递增的数字，并和字符串做比较
        while (expected.size() < n) {
            currentNum++; // 后一个数字递增1
            expected += to_string(currentNum); // 拼接生成的序列
        }
        
        // 如果生成的序列与原字符串相等，返回true
        if (expected == s) {
            return true;
        }
    }
    
    // 如果所有长度的尝试都失败，返回 false
    return false;
}

int main() {
    string s= "12356";
    if (canSplitIntoConsecutiveNumbers(s)) {
        cout << "字符串可以划分为多个递增的整数，每个比前一个大1" << endl;
    } else {
        cout << "字符串不能划分为多个递增的整数" << endl;
    }

    return 0;
}
```