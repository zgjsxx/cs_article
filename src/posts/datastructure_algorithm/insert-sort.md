---
category: 
- data structure
tag:
- data structure
---


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