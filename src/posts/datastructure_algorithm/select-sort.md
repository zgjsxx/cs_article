---
category: 
- data structure
tag:
- data structure
---

# 直接选择排序

直接选择排序是一种很直观的排序方法。其操作是这样：先在未排序的序列中选择最小的元素（或最大的元素），把它与第一个元素交换，放在第一个位置，再在剩余未排序序列中选择第二小的，与第二个元素交换，放在第二个位置，以此类推，直到所有序列排序完毕。

这种排序方法应该是大部分人最直观的一种排序方法，下面就根据一个实际例子来看看其过程。

## 排序过程

下面以一个未排序的数组[5,1,2,3,4]为例，展示其排序过程：

![select_sort](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/select_sort/select_sort.png)


**算法效率**

**时间复杂度**: $O({n}^{2})$，因为无论数组是哪种情况，都需要进行两次for循环，都是确定数组前n-1个最小值，即使数组是本身有序的。

**空间复杂度**为$O({1})$，因为只使用有限个数的变量。

## 实现代码

```cpp
#include <stdio.h> 

void swap(int *xp, int *yp) 
{ 
	int temp = *xp; 
	*xp = *yp; 
	*yp = temp; 
} 

void selectionSort(int arr[], int n) 
{ 
	int i, j, min_idx; 

	// One by one move boundary of unsorted subarray 
	for (i = 0; i < n-1; i++) 
	{ 
		// Find the minimum element in unsorted array 
		min_idx = i; 
		for (j = i+1; j < n; j++) 
		if (arr[j] < arr[min_idx]) 
			min_idx = j; 

		// Swap the found minimum element with the first element 
		swap(&arr[min_idx], &arr[i]); 
	} 
} 

/* Function to print an array */
void printArray(int arr[], int size) 
{ 
	int i; 
	for (i=0; i < size; i++) 
		printf("%d ", arr[i]); 
	printf("\n"); 
} 

// Driver program to test above functions 
int main() 
{ 
	int arr[] = {64, 25, 12, 22, 11}; 
	int n = sizeof(arr)/sizeof(arr[0]); 
	selectionSort(arr, n); 
	printf("Sorted array: \n"); 
	printArray(arr, n); 
	return 0; 
} 
```

[have a try](https://godbolt.org/z/43exqjsrz)


## 稳定性分析

**稳定性**就是指对于两个关键字相等的记录，它们在序列中的相对位置，在排序之前和排序之后没有发生改变。通俗地讲就是有两个关键字相等的数据A、B，排序前，A的位置是 i ，B的位置是 j，此时 i < j，则如果在排序后A的位置还是在B之前，那么称它是稳定的。

直接选择排序是一个不稳定的排序，其将最小值和队头元素的交换过程可能会导致相同元素的顺序发生交换。

例如下面的例子， [3A, 2, 3B, 5, 1]， 其最终将排序成[1, 2, 3B, 3A, 5]，如下图所示：

![select_sort2](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/select_sort/select_sort2.png)

可以看出在这个过程中，相同元素的相对位置发生了改变。