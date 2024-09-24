
- [中望软件在线笔试真题](#中望软件在线笔试真题)
  - [题目1：树上最长单色路径](#题目1树上最长单色路径)
  - [题目2：判断一个点是否在一个多边形内部](#题目2判断一个点是否在一个多边形内部)

# 中望软件在线笔试真题

## 题目1：树上最长单色路径

题目描述如下：

对于一棵由黑白点组成的二叉树，我们需要找到其中最长的单色简单路径，其中简单路径的定义是从树上的某点开始沿树边走不重复的点到树上的另一点结束而形成的路径，而路径的长度就是经过的点的数量(包括起点和终点)。而这里我们所说的单色路径自然就是只经过一种颜色的点的路径。你需要找到这棵树上最长的单色路径。

给定一棵二叉树的根节点(树的点数小于等于300，请做到O(n)的复杂度)，请返回最长单色路径的长度。这里的节点颜色由点上的权值表示，权值为1的是黑点，为0的是白点。

该题目基本和**687. 最长同值路径**相同，因此以最长相同路径进行解答。

**注意**：687是以边的数量作为最长路径的，如果题目要求以点的数量最为最长路径，则需要进行加1。

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int longestUnivaluePath(TreeNode* root) {
        if (!root) return 0; // 空树返回0
        int maxLength = 0;
        dfs(root, maxLength);
        return maxLength;
    }
    int dfs(TreeNode* node, int& maxLength) {
        if (!node) return 0;

        int leftLength = dfs(node->left, maxLength);
        int rightLength = dfs(node->right, maxLength);

        // Check paths
        int leftPath = 0, rightPath = 0;
        if (node->left && node->left->val == node->val) {
            leftPath = leftLength + 1;
        }
        if (node->right && node->right->val == node->val) {
            rightPath = rightLength + 1;
        }

        // Update the maximum length found
        maxLength = std::max(maxLength, leftPath + rightPath);
        
        // Return the longest path including this node
        return std::max(leftPath, rightPath);
    }
};
```


## 题目2：判断一个点是否在一个多边形内部

经典的判断方法是射线法，就是以判断点作为端点，朝着任意方向绘制一条射线。如果射线与多边形交点为奇数个，就说明此点在多边形内部。如果交点为偶数个，就说明此点在多边形外部。虽然射线的方向可以任意，但我们平时为了计算方便，可以采用水平射线正方向。

这其中需要注意一些特殊情况：交点的 Y 坐标，需要**大于**线段的其中一个端点，**小于等于**另一个端点。使用这个原则来处理与顶点相交的场景。

![pointInPolygon](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/question/real_question/zhongwang/point.png)

```cpp
#include <iostream>
#include <vector>
using namespace std;

// 定义二维平面上的点
struct Point {
    double x, y;
};

// 定义多边形
struct Polygon {
    vector<Point> vertices;  // 存储多边形顶点的数组
};

// 判断一个点是否在多边形内部的函数
bool isPointInPolygon(Point p, const Polygon& polygon) {
    int n = polygon.vertices.size(); // 顶点数
    int intersectCount = 0;          // 交点计数
    for (int i = 0; i < n; i++) {
        // 取多边形的一条边
        Point p1 = polygon.vertices[i];
        Point p2 = polygon.vertices[(i + 1) % n]; // 循环获取多边形的边

        // 确保 p1.y <= p2.y
        if (p1.y > p2.y) swap(p1, p2);

        // 判断射线是否穿过这条边
        if (p.y > p1.y && p.y <= p2.y && (p.x < p1.x || p.x < p2.x)) {
            // 计算交点的 x 坐标
            double xIntersect = (p.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
            if (p.x < xIntersect) {
                intersectCount++;
            }
        }
    }

    // 判断交点数是否为奇数
    return (intersectCount % 2 == 1);
}

int main() {
    // 定义多边形
    Polygon polygon = {
        {{0, 0}, {4, 0}, {4, 4}, {0, 4}}  // 一个矩形
    };

    // 测试点
    Point p = {2, 2};

    // 判断点是否在多边形内部
    if (isPointInPolygon(p, polygon)) {
        cout << "点在多边形内部" << endl;
    } else {
        cout << "点在多边形外部" << endl;
    }

    return 0;
}
```