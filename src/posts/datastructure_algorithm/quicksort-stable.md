---
category: 
- data structure
tag:
- data structure
---

# 快速排序及其稳定性分析

## 快速排序代码

c代码：

```c
#include <stdio.h>
 
//将Int数组a中的第i个元素和第j个元素互换
void swap(int a[],int i,int j)
{
	int tmp = a[i];
	a[i] = a[j];
	a[j]  =tmp;
}
 
//以第一个元素作为划分，将它放入中间
int partition(int a[],int start,int end)
{
	int i = start;
	int j = end + 1;
	int x = a[start];
	while (1)
	{
		while (a[++i]<x);
		while (a[--j]>x);
		if (i>=j)
			break;
		swap(a,i,j);
	}
	a[start] = a[j];
	a[j] = x;
	return j;
 
}
 
void quickSort(int a[],int start,int end)
{
	if (start<end)
	{
		int q = partition(a,start,end);
		quickSort(a,start,q-1);
		quickSort(a,q+1,end);
	}
}
 
int main()
{
	int a[] = {4,2,1,5,3};
	quickSort(a,0,4);
	for (int i=0;i<5;i++)
	{
		printf("%d ",a[i]);
	}
}
```

c++代码

```cpp
#include <iostream>
#include <vector>

using namespace std;

// 函数：交换两个元素
void swap(int &a, int &b) {
    int temp = a;
    a = b;
    b = temp;
}

// 函数：分区操作
int partition(vector<int> &arr, int low, int high) {
    int pivot = arr[low]; // 选择第一个元素作为基准
    int i = low + 1; // 标记小于基准元素的子数组的最后一个元素的位置

    for (int j = low + 1; j <= high; j++) {
        if (arr[j] < pivot) {
            swap(arr[i], arr[j]); // 将小于基准的元素移到左侧
            i++;
        }
    }

    swap(arr[low], arr[i - 1]); // 将基准元素移到正确的位置
    return i - 1; // 返回基准元素的位置
}

// 函数：快速排序
void quickSort(vector<int> &arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high); // 获取分区点

        quickSort(arr, low, pi - 1); // 对基准左侧进行排序
        quickSort(arr, pi + 1, high); // 对基准右侧进行排序
    }
}

// 主函数
int main() {
    vector<int> arr = {10, 7, 8, 9, 1, 5};
    int n = arr.size();

    cout << "Original array: ";
    for (int num : arr) {
        cout << num << " ";
    }
    cout << endl;

    quickSort(arr, 0, n - 1);

    cout << "Sorted array: ";
    for (int num : arr) {
        cout << num << " ";
    }
    cout << endl;

    return 0;
}
```
## 稳定性分析

![quick_sort1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/quick-sort/quicksort1.png)

6A和6B在排序过程中发生了位置变换，因此快速排序并不是一个稳定的排序。


