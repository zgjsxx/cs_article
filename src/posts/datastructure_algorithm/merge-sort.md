---
category: 
- data structure
tag:
- data structure
---

## 归并排序分析

```cpp
#include <iostream>
#include <vector>

using namespace std;

// 合并两个有序子数组
void merge(vector<int>& arr, int left, int mid, int right) {
    int n1 = mid - left + 1; // 左子数组的大小
    int n2 = right - mid;    // 右子数组的大小

    // 创建临时数组
    vector<int> leftArray(n1);
    vector<int> rightArray(n2);

    // 拷贝数据到临时数组
    for (int i = 0; i < n1; i++)
        leftArray[i] = arr[left + i];
    for (int j = 0; j < n2; j++)
        rightArray[j] = arr[mid + 1 + j];

    // 合并临时数组
    int i = 0; // 左子数组的起始索引
    int j = 0; // 右子数组的起始索引
    int k = left; // 合并后数组的起始索引

    while (i < n1 && j < n2) {
        if (leftArray[i] <= rightArray[j]) {
            arr[k] = leftArray[i];
            i++;
        } else {
            arr[k] = rightArray[j];
            j++;
        }
        k++;
    }

    // 复制左子数组的剩余元素
    while (i < n1) {
        arr[k] = leftArray[i];
        i++;
        k++;
    }

    // 复制右子数组的剩余元素
    while (j < n2) {
        arr[k] = rightArray[j];
        j++;
        k++;
    }
}

// 递归归并排序函数
void mergeSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2; // 计算中间点

        // 递归排序左半部分
        mergeSort(arr, left, mid);

        // 递归排序右半部分
        mergeSort(arr, mid + 1, right);

        // 合并两个有序子数组
        merge(arr, left, mid, right);
    }
}

// 主函数
int main() {
    vector<int> arr = {12, 11, 13, 5, 6, 7};
    int n = arr.size();

    cout << "Original array: ";
    for (int num : arr) {
        cout << num << " ";
    }
    cout << endl;

    mergeSort(arr, 0, n - 1);

    cout << "Sorted array: ";
    for (int num : arr) {
        cout << num << " ";
    }
    cout << endl;

    return 0;
}
```