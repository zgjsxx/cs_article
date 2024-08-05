
---
category: 
- 面经
tag:
- 设计模式面经
---

- [设计模式面经](#设计模式面经)
  - [行为型模式](#行为型模式)
    - [策略模式](#策略模式)


# 设计模式面经

## 行为型模式

### 策略模式

策略模式（Strategy Pattern）是一种行为设计模式，它允许在运行时选择算法的实现方式。它通过定义一系列的算法，将每一个算法封装起来，并使它们可以互换，从而使得算法的变化不会影响使用算法的客户。

以下是一个简单的 C++ 示例，展示了如何使用策略模式来实现不同的排序算法。

示例：策略模式实现排序算法

1.定义策略接口

首先，定义一个策略接口 ```SortStrategy```，该接口声明了所有具体策略类需要实现的方法：

```c
#include <vector>
#include <iostream>

// 策略接口
class SortStrategy {
public:
    virtual ~SortStrategy() = default;
    virtual void sort(std::vector<int>& data) const = 0;
};
```
2.实现具体策略

然后，实现具体的排序策略。例如，冒泡排序和插入排序：

```c
// 冒泡排序策略
class BubbleSortStrategy : public SortStrategy {
public:
    void sort(std::vector<int>& data) const override {
        int n = data.size();
        for (int i = 0; i < n - 1; ++i) {
            for (int j = 0; j < n - i - 1; ++j) {
                if (data[j] > data[j + 1]) {
                    std::swap(data[j], data[j + 1]);
                }
            }
        }
    }
};

// 插入排序策略
class InsertionSortStrategy : public SortStrategy {
public:
    void sort(std::vector<int>& data) const override {
        int n = data.size();
        for (int i = 1; i < n; ++i) {
            int key = data[i];
            int j = i - 1;
            while (j >= 0 && data[j] > key) {
                data[j + 1] = data[j];
                --j;
            }
            data[j + 1] = key;
        }
    }
};
```

3.上下文类

定义一个 Sorter 类，它使用 SortStrategy 进行排序：

```cpp
class Sorter {
public:
    Sorter(SortStrategy* strategy) : strategy_(strategy) {}

    void setStrategy(SortStrategy* strategy) {
        strategy_ = strategy;
    }

    void sort(std::vector<int>& data) {
        strategy_->sort(data);
    }

private:
    SortStrategy* strategy_;
};
```

4.使用策略模式

在 main 函数中使用策略模式来选择不同的排序算法：

```cpp
int main() {
    // 创建数据
    std::vector<int> data = {64, 34, 25, 12, 22, 11, 90};

    // 使用冒泡排序策略
    SortStrategy* bubbleSort = new BubbleSortStrategy();
    Sorter sorter(bubbleSort);
    sorter.sort(data);

    std::cout << "Bubble Sort Result: ";
    for (int num : data) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // 更改策略为插入排序
    SortStrategy* insertionSort = new InsertionSortStrategy();
    sorter.setStrategy(insertionSort);
    data = {64, 34, 25, 12, 22, 11, 90}; // 重新定义数据
    sorter.sort(data);

    std::cout << "Insertion Sort Result: ";
    for (int num : data) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // 清理内存
    delete bubbleSort;
    delete insertionSort;

    return 0;
}
```