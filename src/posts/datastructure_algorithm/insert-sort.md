---
category: 
- data structure
tag:
- data structure
---


# 直接插入排序分析

## 过程分析

插入排序是比较好理解的排序算法之一，其原理类似于打扑克排的理牌。

打扑克牌时，我们会依次抓牌并理牌，在理牌的过程中，我们会根据牌的大小确定在那个位置将牌插入进去。

插入排序的原理是类似的，其过程如下所示：
- 1.第一个元素可以跳过，因为单个元素始终是有序的。
- 2.取出下一个元素，向前进行扫描。
- 3.如果该元素大于向前扫描的元素，则将元素移动到下一个位置
- 4.重复步骤3，扫描到的元素小于等于新元素
- 5.将元素插入到该位置
- 6.重复步骤2-5

通过一个例子可以更好的了解这一个过程，对于数组[64，1，25，22，11]，其排序过程如下所示：

![insertsort1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/insert-sort/insert-sort1.png)


## 代码实现

```cpp
#include <stdio.h> 

void swap(int *xp, int *yp) 
{ 
	int temp = *xp; 
	*xp = *yp; 
	*yp = temp; 
} 
/* 对顺序表L作直接插入排序 */
void InsertSort(int arr[],int size)
{ 
	int i,j;
	for(i=1;i < size;i++)
	{
		if (arr[i] < arr[i-1]) 
		{
			int value = arr[i]; 
			for(j = i-1;arr[j] > value && j >= 0;j--)
				arr[j+1] = arr[j]; 
			arr[j+1] = value; 
		}
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
	int arr[] = {1, 64, 25, 12, 22, 11}; 
	int n = sizeof(arr)/sizeof(arr[0]); 
    printf("size = %d\n", n);
	InsertSort(arr, n); 
        printf("size = %d\n", n);
	printf("Sorted array: \n"); 
	printArray(arr, n); 
	return 0; 
} 
```

## 稳定性分析

在插入排序的过程中不涉及元素之间的交换，只涉及元素的整体移动，因此可以保留相对位置，因此插入排序是稳定的排序算法。