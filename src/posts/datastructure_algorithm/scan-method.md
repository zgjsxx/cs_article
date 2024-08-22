# scan算法

## Koggle-stone



## Brent-kung

```cpp
#include <iostream>
#include <vector>
#include <omp.h>

void printData(const std::vector<int>& data){
    std::cout << "current array: ";
    for (int i : data) {
        std::cout << i << " ";
    }
    std::cout << std::endl;
}
// 上升阶段（Up-Sweep）：计算每个节点的前缀和
void up_sweep(std::vector<int>& data) {
    int n = data.size();
    // 计算每层的合并
    for (int d = 1; d < n; d *= 2) {
        int start = 2*d-1;
        #pragma omp parallel for
        for (int i = start; i < n; i += 2 * d) {
            data[i] += data[i - d];
        }
        printData(data);
    }
}

// 下降阶段（Down-Sweep）：从根节点将结果分发到每个叶子节点
void down_sweep(std::vector<int>& data) {
    int n = data.size();

    // 计算每层的分发
    for (int d = n / 4; d > 0; d /= 2) {
        int start  = 2*d - 1;
        #pragma omp parallel for
        for (int i = start; i < n; i += 2 * d) {
            data[i+d] += data[i];
        }
        printData(data);
    }
}

// 并行前缀和主函数
void parallel_prefix_sum(std::vector<int>& data) {
    int n = data.size();
    if (n <= 1) return; // 如果数组元素小于等于 1，直接返回

    // 上升阶段
    up_sweep(data);

    // 下降阶段
    down_sweep(data);
}

int main() {
    // 初始化数据
    std::vector<int> data = {3, 1, 7, 0, 4, 1, 6, 3, 2};

    std::cout << "Original array: ";
    for (int i : data) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    // 执行并行前缀和计算
    parallel_prefix_sum(data);

    // 输出结果
    std::cout << "Prefix sum array: ";
    for (int i : data) {
        std::cout << i << " ";
    }
    std::cout << std::endl;

    return 0;
}
```

```shell
Original array: 3 1 7 0 4 1 6 3 2 
current array: 3 4 7 7 4 5 6 9 2 
current array: 3 4 7 11 4 5 6 14 2 
current array: 3 4 7 11 4 5 6 25 2 
current array: 3 4 7 11 4 5 6 25 2 
current array: 3 4 7 11 4 16 6 25 2 
current array: 3 4 11 11 15 16 22 25 27 
Prefix sum array: 3 4 11 11 15 16 22 25 27 
```