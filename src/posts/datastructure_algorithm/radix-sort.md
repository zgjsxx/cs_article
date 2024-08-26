category: 
- data structure
tag:
- data structure
---

# 基数排序（Radix Sort）

基数排序是一种非比较型的整数排序算法，其核心思想是通过逐位（或逐字符）排序来将数据排序。基数排序适用于整数、字符串等可以分解成"位"的数据类型。它的时间复杂度为 ```O(d * (n + k))```，其中 d 是数字的最大位数，n 是待排序元素的数量，k 是每一位的取值范围。基数排序适用于数据范围较大但每个位数较短的情况。

**基数排序的步骤**

基数排序有两种常见实现方法：LSD（Least Significant Digit）从最低有效位开始，MSD（Most Significant Digit）从最高有效位开始。这里介绍常用的 LSD 基数排序。

- 确定最大数的位数（d）：决定需要几轮处理。
- 从最低位开始排序：使用稳定的排序算法（如计数排序）对每一位进行排序，从最低有效位到最高有效位。
- 重复步骤2：逐位处理，直到处理完所有位。

C++ 示例代码

以下是使用 LSD 基数排序对一组非负整数进行排序的 C++ 实现：

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

// 获取数字的某一位上的值（从右往左第 pos 位，pos 从 0 开始）
int getDigit(int number, int pos) {
    return (number / static_cast<int>(pow(10, pos))) % 10;
}

// 基数排序的辅助函数：使用计数排序对某一位上的数值排序
void countingSort(std::vector<int>& arr, int pos) {
    int n = arr.size();
    std::vector<int> output(n);
    int count[10] = {0};

    // 统计每个数字出现的次数
    for (int i = 0; i < n; i++) {
        int digit = getDigit(arr[i], pos);
        count[digit]++;
    }

    // 计算前缀和，将 count[i] 转换为数字的位置信息
    for (int i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }

    // 按照该位数字从后往前进行排序
    for (int i = n - 1; i >= 0; i--) {
        int digit = getDigit(arr[i], pos);
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }

    // 将排序结果复制回原数组
    for (int i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}

// 基数排序的主函数
void radixSort(std::vector<int>& arr) {
    // 找到数组中最大的数，确定最大位数
    int maxNumber = *std::max_element(arr.begin(), arr.end());
    int maxDigits = 0;
    while (maxNumber > 0) {
        maxNumber /= 10;
        maxDigits++;
    }

    // 对每一位进行计数排序
    for (int pos = 0; pos < maxDigits; pos++) {
        countingSort(arr, pos);
    }
}

int main() {
    std::vector<int> arr = {170, 45, 75, 90, 802, 24, 2, 66};

    std::cout << "Original array: ";
    for (int num : arr) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    radixSort(arr);

    std::cout << "Sorted array: ";
    for (int num : arr) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

**代码解释**
- getDigit 函数：获取指定位置上的数字（个位、十位、百位等）。
- countingSort 函数：对数组中指定位上的数字进行计数排序。由于计数排序是稳定排序，所以能保证基数排序的正确性。
- radixSort 函数：计算数组中最大数的位数，然后对每个位进行计数排序，最终得到排序后的数组。
- main 函数：测试基数排序的效果，输出排序前后的数组。

输出结果

```shell
Original array: 170 45 75 90 802 24 2 66 
Sorted array: 2 24 45 66 75 90 170 802 
```

**总结**

基数排序是一个高效的排序算法，特别适合对大数据集合中的小整数排序。通过逐位进行排序，它能够以线性时间复杂度 ```O(d * n)``` 完成排序。它对输入数据的要求是：数据长度是固定的（或可以计算），每个位的数据范围是有限的（如 0-9）。