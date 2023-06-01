---
category: 
- git
---

# git merge和git rebase有什么区别

```git rebase```和```git merge```是在日常开发中常用的用于分支合并的命令，也是非常容易误用的两个命令。本文将通过图文的方式去详解二者之间的区别。


## git merge

```git merge```会为本次的合并过程生成一条新的commit，并将该commit添加到目的分支上。通常用于将**feature分支的内容向主分支**进行合并。

如下图所示，在main分支的c2提交后checkout了一个新分支feature。随后feature分支上提交了c3，c5和c7三个提交。于此同时，main分支也在往前推进，产生了c4，c6，c8三个提交。此时由于feture分支已经开发完毕，向main分支进行合并，在解决完冲突之后，main分支上产生了一个新的提交c9。

![git merge示例](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/git-merge-git-rebase/git-merge-git-rebase.png)


## git rebase

```git rebase```是一种变基操作。两个分支有一个最近交汇的点，就称之为"基"。而变基就是移动该"基点"，移动之后的效果就像是刚刚checkout分支一样。 该操作通常用于**从main分支向feature分支同步最近的改动**。

如下图所示，在main分支的c2提交后checkout了一个新分支feature。随后feature分支上提交了c3，c5和c7三个提交。于此同时，main分支也在往前推进，产生了c4，c6，c8三个提交。由于此时feature分支和main分支变得不一致，并且main分支有人也有修改了相同的文件，因此希望拉取到main分支的最新的改动，于是我们checkout到feature分支，然后执行rebase操作。

于是两个分支的公共交点转移到了c8，，并且生成了c3',c5',c7'三个提交。操作完毕后，就好像从main分支的c8节点开始checkout了一个新分支feature1，然后有了c3',c5',c7'三个提交。

![git rebase示例](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/git-merge-git-rebase/git-merge-git-rebase2.png)

## 在线实验

下面使用在线平台进行git的相关演练，非常推荐使用下面的在线学习平台
[git在线操作学习地址](https://learngitbranching.js.org/?locale=zh_CN&NODEMO=)，日常使用git的过程中，如果有一些不太确定的操作行为，可以使用该平台验证，这可以节约你的时间。在不知道这个平台之前，我都是去自己的github上新建一个test repo进行验证的。


**实验1：git merge**

使用下面的语句准备一些提交：

```shell
git commit -m "demo"
git checkout -b feature1
git commit -m "demo"
git commit -m "demo"
git checkout main
git commit -m "demo"
git commit -m "demo"
```
![git merge实验1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/git-merge-git-rebase/git-merge-1.png)

此时我们将feature1分支上的内容合并到main分支:

```shell
git checkout main
git merge feature1
```

![git merge实验2](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/git-merge-git-rebase/git-merge-2.png)

可以看到main分支上有了一个新的提交c7。


```实验2：git rebase```

使用下面的语句准备一些提交：

```shell
git commit -m "demo"
git checkout -b feature1
git commit -m "demo"
git commit -m "demo"
git checkout main
git commit -m "demo"
git commit -m "demo"
```
![git rebase实验1](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/git-merge-git-rebase/git-rebase-1.png)

此时我们将main分支上的改动内容合并到feature分支:

```shell
git checkout feature1
git rebase main
```

![git rebase实验2](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/git-merge-git-rebase/git-rebase-2.png)

可以看到main和feature1相交的点来到了c6，并生成了c3'和c4'两个提交。


## 总结
- merge通常用于从feature分支向main分支合并开发的内容。
- rebase通常用于feature分支拉取main分支的最新改动。