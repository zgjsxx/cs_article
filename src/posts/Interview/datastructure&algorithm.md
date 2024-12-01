
---
category: 
- 面经
tag:
- 数据结构与算法面经
---

- [数据结构与算法面经](#数据结构与算法面经)
  - [什么是跳跃表](#什么是跳跃表)
  - [哈夫曼树](#哈夫曼树)
  - [单调栈](#单调栈)

# 数据结构与算法面经

## 什么是跳跃表

跳跃表（Skip List）是一种用于有序数据存储的数据结构，它允许以对数时间复杂度进行快速查找、插入和删除操作。跳跃表是由 William Pugh 于 1989 年发明的，它在功能上类似于平衡树（如红黑树和 AVL 树），但实现和维护相对更简单。

**跳跃表的结构**

跳跃表由多层有序链表组成，每层链表中的元素是下一层链表的子集。具体来说：
- 最底层是包含所有元素的原始有序链表。
- 每一层的链表通过概率选择包含部分元素。
- 顶层通常是最稀疏的链表，包含很少的元素。

每个元素在跳跃表中的位置是通过指针相互连接的。最常见的实现中，每个元素都有一个包含多个指针的节点，这些指针指向下一层链表中的元素。

**跳跃表的操作**

**1.查找（Search）**：

- 从顶层链表的头节点开始，逐层向下进行查找。
- 在每一层，沿着链表查找比目标值小且最接近目标值的元素。
- 当无法在当前层继续查找时，转到下一层。
- 重复以上步骤，直到找到目标值或确认目标值不存在。

**2.插入（Insert）**：

- 通过查找确定新元素应该插入的位置。
- 在最底层链表中插入新元素。
- 通过随机选择的方式决定是否将新元素添加到上一层链表中。
- 重复以上步骤，直到随机选择决定停止或达到顶层。

**3.删除（Delete）**：

- 通过查找确定要删除的元素位置。
- 在所有包含该元素的链表中删除该元素的节点。

**跳跃表的优点**

- 简单性：跳跃表的实现和维护相对简单，不需要复杂的旋转操作。
- 动态性：支持动态插入和删除操作，保持数据有序。
- 高效性：查找、插入和删除操作的平均时间复杂度为 O(log n)，最坏情况下为 O(n)。
- 概率性：通过随机选择节点层数，跳跃表能够在大多数情况下提供良好的性能。

示例代码

下面是一个简单的跳跃表实现示例（C++）：

```cpp
#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>

class Node {
public:
    int value;
    std::vector<Node*> forward;
    Node(int level, int value) : value(value), forward(level + 1, nullptr) {}
};

class SkipList {
public:
    SkipList(int maxLevel, float probability);
    void insert(int value);
    bool search(int value);
    void remove(int value);
    void display();
private:
    int randomLevel();
    Node* createNode(int level, int value);
    int maxLevel;
    float probability;
    Node* header;
    int currentLevel;
};

SkipList::SkipList(int maxLevel, float probability) : maxLevel(maxLevel), probability(probability), currentLevel(0) {
    header = new Node(maxLevel, -1);
    std::srand(std::time(nullptr));
}

void SkipList::insert(int value) {
    std::vector<Node*> update(maxLevel + 1, nullptr);
    Node* current = header;
    
    for (int i = currentLevel; i >= 0; i--) {
        while (current->forward[i] != nullptr && current->forward[i]->value < value) {
            current = current->forward[i];
        }
        update[i] = current;
    }
    
    current = current->forward[0];
    
    if (current == nullptr || current->value != value) {
        int level = randomLevel();
        if (level > currentLevel) {
            for (int i = currentLevel + 1; i <= level; i++) {
                update[i] = header;
            }
            currentLevel = level;
        }
        Node* newNode = createNode(level, value);
        for (int i = 0; i <= level; i++) {
            newNode->forward[i] = update[i]->forward[i];
            update[i]->forward[i] = newNode;
        }
    }
}

bool SkipList::search(int value) {
    Node* current = header;
    for (int i = currentLevel; i >= 0; i--) {
        while (current->forward[i] != nullptr && current->forward[i]->value < value) {
            current = current->forward[i];
            std::cout << "test " << current->value << std::endl;
        }
    }
    current = current->forward[0];
    return current != nullptr && current->value == value;
}

void SkipList::remove(int value) {
    std::vector<Node*> update(maxLevel + 1, nullptr);
    Node* current = header;
    
    for (int i = currentLevel; i >= 0; i--) {
        while (current->forward[i] != nullptr && current->forward[i]->value < value) {
            current = current->forward[i];
        }
        update[i] = current;
    }
    
    current = current->forward[0];
    
    if (current != nullptr && current->value == value) {
        for (int i = 0; i <= currentLevel; i++) {
            if (update[i]->forward[i] != current) break;
            update[i]->forward[i] = current->forward[i];
        }
        delete current;
        while (currentLevel > 0 && header->forward[currentLevel] == nullptr) {
            currentLevel--;
        }
    }
}

void SkipList::display() {
    for (int i = 0; i <= currentLevel; i++) {
        Node* node = header->forward[i];
        std::cout << "Level " << i << ": ";
        while (node != nullptr) {
            std::cout << node->value << " ";
            node = node->forward[i];
        }
        std::cout << std::endl;
    }
}

int SkipList::randomLevel() {
    int level = 0;
    while ((float)std::rand() / RAND_MAX < probability && level < maxLevel) {
        level++;
    }
    return level;
}

Node* SkipList::createNode(int level, int value) {
    return new Node(level, value);
}

int main() {
    SkipList list(3, 0.5);
    list.insert(3);
    list.insert(6);
    list.insert(7);
    list.insert(9);
    list.insert(12);
    list.insert(19);
    list.insert(17);
    list.insert(26);
    list.insert(21);
    list.insert(25);
    
    std::cout << "Skip List:" << std::endl;
    list.display();
    
    std::cout << "\nSearch for 19: " << (list.search(19) ? "Found" : "Not Found") << std::endl;
    
    list.remove(19);
    std::cout << "\nAfter removing 19:" << std::endl;
    list.display();
    
    return 0;
}
```

代码说明
- Node 类：定义了跳跃表的节点，每个节点包含一个值和一个指针数组 forward，指向不同层的下一个节点。
- SkipList 类：定义了跳跃表的主要操作，包括插入、搜索、删除和显示。
- randomLevel 函数：用于生成随机层数。
- main 函数：测试插入、搜索、删除和显示操作。

## 哈夫曼树

https://oi-wiki.org/ds/huffman-tree/


## 单调栈

单调栈是一种特殊的栈结构，它的特点是栈中的元素按照一定的单调性（递增或递减）排列。换句话说，栈中的元素按照某种顺序依次进出，确保栈顶元素满足某种顺序关系。单调栈广泛应用于解决一些需要维护局部单调性的问题，比如 下一个更大元素、下一个更小元素 等。

单调栈的类型
- 1.单调递增栈：
  - 在栈中，元素按照递增的顺序排列，即栈顶的元素是当前栈中最小的元素。
  - 每次压栈时，如果栈顶元素大于当前要压入栈的元素，就会出栈，直到栈顶元素小于当前元素，保证栈内元素递增。
- 2.单调递减栈：
  - 在栈中，元素按照递减的顺序排列，即栈顶的元素是当前栈中最大的元素。
  - 每次压栈时，如果栈顶元素小于当前要压入栈的元素，就会出栈，直到栈顶元素大于当前元素，保证栈内元素递减。

单调栈的特点
  - 单调性：栈内的元素在某种意义上是有序的（递增或递减）。
  - 动态性：栈内的元素会随着元素的压入和弹出而改变，但始终保持单调性。

单调栈的应用场景

单调栈通常用于以下几种常见的算法问题：

- 下一个更大元素问题（Next Greater Element, NGE）：
  - 给定一个数组，找出数组中每个元素的“下一个更大元素”。
  - 使用单调栈可以高效地解决这个问题。
- 下一个更小元素问题（Next Smaller Element, NSE）：
  - 给定一个数组，找出数组中每个元素的“下一个更小元素”。
  - 单调栈同样能够有效地解决这一问题。
- 柱状图的最大矩形面积问题：
  - 给定一个柱状图的高度数组，求出柱状图能够容纳的最大矩形面积。这个问题可以通过单调栈来求解。
- 股票买卖问题：
  - 通过维护股价的单调递增/递减栈，可以快速找到股价的高低点。

**单调栈的实现步骤**

以 单调递增栈 为例，解释如何用单调栈解决 下一个更大元素 问题。

**问题描述：**

给定一个整数数组 nums，对于数组中的每个元素 nums[i]，找出它右边第一个比它大的元素。如果没有比它大的元素，输出 -1。

解法：
- 1.栈的初始化：使用栈来保存数组元素的索引。
- 2.遍历数组：
  - 对于当前元素 nums[i]，如果栈不为空且栈顶元素小于 nums[i]，那么栈顶元素就是 nums[i] 的“下一个更大元素”。
  - 将栈顶元素弹出，并将其索引记录为“已找到下一个更大元素”。
  - 继续遍历，直到栈为空或栈顶元素大于当前元素。
- 3.压栈：将当前元素的索引压入栈中。
- 4.最后，若栈中还有元素，说明这些元素右边没有比它们大的元素，输出 -1。

```cpp
#include <iostream>
#include <vector>
#include <stack>
using namespace std;

vector<int> nextGreaterElement(const vector<int>& nums) {
    int n = nums.size();
    vector<int> result(n, -1);  // 初始化结果数组，默认值为 -1
    stack<int> s;  // 用于保存元素的索引

    // 从右往左遍历数组
    for (int i = n - 1; i >= 0; --i) {
        // 弹出栈中所有小于等于当前元素的元素
        while (!s.empty() && nums[s.top()] <= nums[i]) {
            s.pop();
        }

        // 如果栈不为空，栈顶元素是当前元素的下一个更大元素
        if (!s.empty()) {
            result[i] = nums[s.top()];
        }

        // 将当前元素的索引压入栈中
        s.push(i);
    }

    return result;
}

int main() {
    vector<int> nums = {4, 5, 2, 10, 8};
    vector<int> result = nextGreaterElement(nums);

    for (int val : result) {
        cout << val << " ";
    }

    return 0;
}
```

解释：
- 初始化一个栈，用来存储数组元素的索引。
- 从右往左遍历数组 nums。
- 如果栈顶元素小于或等于当前元素，弹出栈顶元素，直到找到一个比当前元素大的元素。
- 当栈顶元素大于当前元素时，它就是当前元素的下一个更大元素。
- 每次访问元素后，将当前元素的索引压入栈中。
- 最终得到每个元素的下一个更大元素。

输出：

```shell
5 10 10 -1 -1
```

**单调栈的时间复杂度**

单调栈的时间复杂度为 O(n)，其中 n 是数组的长度。每个元素最多会被压入栈一次，也最多会被弹出一次。因此，单调栈的操作是线性的。

**总结**
- 单调栈是一种有序的栈结构，用于维护栈中的元素按照递增或递减顺序排列。
- 它常用于解决 下一个更大元素、下一个更小元素 等问题。
- 使用单调栈可以在 O(n) 的时间复杂度内解决这些问题，适用于处理大规模数据集。