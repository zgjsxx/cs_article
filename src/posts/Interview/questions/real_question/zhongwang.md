
- [中望软件在线笔试真题](#中望软件在线笔试真题)
  - [题目1：树上最长单色路径](#题目1树上最长单色路径)

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