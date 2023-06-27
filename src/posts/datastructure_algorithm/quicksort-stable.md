---
category: 
- data structure
tag:
- data structure
---

# 快速排序及其稳定性分析

## 快速排序代码

```cpp
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

## 稳定性分析

![quick_sort1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/quick-sort/quicksort1.png)

6A和6B在排序过程中发生了位置变换，因此快速排序并不是一个稳定的排序。


