
---
category: 
- 面经
tag:
- 数据结构与算法面经
---

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