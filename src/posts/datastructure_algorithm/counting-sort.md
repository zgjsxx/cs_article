---
category: 
- data structure
tag:
- data structure
---


# 计数排序分析

# 算法描述
- 1.找出待排序的数组中最大和最小的元素；
- 2.统计数组中每个值为i的元素出现的次数，存入数组C的第i项；
- 3.对所有的计数累加（从C中的第一个元素开始，每一项和前一项相加）；
- 4.反向填充目标数组：将每个元素i放在新数组的第C(i)项，每放一个元素就将C(i)减去1。

![counting-sort](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/datastructure_algorithm/counting-sort/countingSort.gif)


计数排序虽然快，但是缺点也很明显，其只适合整形的数据。

## 代码

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

void print_arr(int *arr, int n) {
    int i;
    printf("%d", arr[0]);
    for (i = 1; i < n; i++)
            printf(" %d", arr[i]);
    printf("\n");
}

void counting_sort(int *ini_arr, int *sorted_arr, int n) {
    int *count_arr = (int *) malloc(sizeof(int) * 100);
    int i, j, k;
    for (k = 0; k < 100; k++)
            count_arr[k] = 0;
    for (i = 0; i < n; i++)
            count_arr[ini_arr[i]]++;
    for (k = 1; k < 100; k++)
            count_arr[k] += count_arr[k - 1];
    for (j = n; j > 0; j--)
            sorted_arr[--count_arr[ini_arr[j - 1]]] = ini_arr[j - 1];
    free(count_arr);
}

int main(int argc, char **argv) {
    int n = 10;
    int i;
    int *arr = (int *) malloc(sizeof(int) * n);
    int *sorted_arr = (int *) malloc(sizeof(int) * n);
    srand(time(0));
    for (i = 0; i < n; i++)
            arr[i] = rand() % 100;
    printf("ini_array: ");
    print_arr(arr, n);
    counting_sort(arr, sorted_arr, n);
    printf("sorted_array: ");
    print_arr(sorted_arr, n);
    free(arr);
    free(sorted_arr);
    return 0;
}
```

## 稳定性分析

稳定性分析：

https://blog.csdn.net/weixin_42559610/article/details/105919165#:~:text=%E8%AE%A1%E6%95%B0%E6%8E%92%E5%BA%8F%E6%98%AF%E4%B8%80%E4%B8%AA%E7%A8%B3%E5%AE%9A%E7%9A%84%E6%8E%92%E5%BA%8F%E7%AE%97%E6%B3%95%E3%80%82