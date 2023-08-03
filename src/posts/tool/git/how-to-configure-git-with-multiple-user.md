---
category: 
- git
---

# 如何配置git，使其支持多用户？
在多数时候， 我们使用git进行操作时，只需要在本地配置一个用户的ssh key，就可以完成基本的pull/push操作。如果现在我有两个github的账号，并需要在一台电脑中操作其中的repo，有没有什么较好的办法呢？

下面就将详解其配置过程。


## 清除全局用户配置
该步骤是必须的， 在本地设置多账户之后， 就不再使用全局的用户名和email了， 因此需要先unset掉global的用户名和邮箱。
```shell
git config --global --unset user.name
git config --global --unset user.email
```


## 生成每个用户的密钥对
我们这里以创建test1用户和test2用户为例， 演示操作过程。

这里， 我们首先查看.ssh目录,由于之前已经配置过test1用户， 因此该目录下已经有了test1用户的ssh公钥和私钥。
```shell
$ ls  ~/.ssh/
id_rsa   
id_rsa.pub
```

接下来我们生成test2用户的ssh key:
```shell
ssh-keygen -t rsa -C "test2@qq.com"
Generating public/private rsa key pair.
Enter file in which to save the key (~/.ssh/id_rsa):(这里填写一个自定义的名字)
~/.ssh/id_rsa_second
Enter passphrase(empty for on passphrase):
```

这样就在.ssh目录下生成了对应的ssh密钥。其中.pub文件就是私钥。

```shell
$ ls  ~/.ssh/
id_rsa   id_rsa_second 
id_rsa.pub   id_rsa_second.pub
```

## 在github Web console中添加SSH Keys
将上一步骤中生成的id_rsa.pub 和 id_rsa_second.pub文件中的内容，分别加入对应账户的github的SSH Keys中， 如下图所示：

![git ssh key](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/how-to-configure-git-with-multiple-user/git_ssh_key.png)

## 管理密钥
管理密钥的目的是让git知道一个repo去什么地方去查找它的ssh key。

该步骤需要在~/.ssh目录下创建一个config文件，文件格式如下所示：

```txt
Host github.com
HostName github.com
User git
IdentityFile ~/.ssh/id_rsa

Host user2.github.com
HostName github.com
User git
IdentityFile ~/.ssh/id_rsa_second
```

该文件各字段的含义如下所示：

**Host** : 主机别名

**HostName**: 服务器真实地址

**IdentityFile**: 私钥文件路径

**User** : 用户名，这里User均填写git


下面测试我们配置的项目是否正确。

测试命令格式为 ```ssh -T user@Host```。

```shell
ssh -T git@github.com
```

```shell
ssh -T git@user2.github.com
```

如果输出了下面的语句，代表你的配置已经成功了。
```shell
Hi test2! You've successfully authenticated, but GitHub does not provide shell access.
```

## 克隆仓库进行push
在配置完毕之后， 当我们使用git clone 命令时需要做一些修改。

在不需要配置多账户时， 我们clone一个仓库通常使用下面的命令:
```shell
git clone git@github.com:your_account/your_proj.git
```
而如果你仍然使用这样的格式clone时，在push时会失败。

我们需要修改clone命令为如下格式：
```shell
git clone git@user2.github.com:your_account/your_proj.git
```
为什么要这样修改呢？

我们看下面这张图：

![git ssh key](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/tool/how-to-configure-git-with-multiple-user/git_ssh_key2.png)

在我们修改了Host之后,git会通过该host去~/.ssh/config文件中寻找对应的私钥文件地址，回忆我们刚刚在config配置了test2的Host为**user2.github.com**,因此当git clone的地址修改之后， git就可以顺利地找到该repo所需要的ssh key。如果仍然用```git clone git@github.com:your_account/your_proj.git```那么git将会使用~/.ssh/config中配置的一个ssh key， 这样会导致push时失败。


最后需要注意的是， 如果有配置多用户这个需求时， 那么在执行git commit时， 设置用户名和邮箱不能使用全局账户。 

应使用：
```
git config user.name "You Name"
git config user.email name@example.com
```

而不能使用

```
git config --global user.name "You Name"
git config --global user.email name@example.com
```

# 总结
使用git配置多用户，主要需要注意以下几点：
- 需要在本地分别生成各用户的ssh密钥
- 需要为所有的用户配置密钥路径文件config
- git clone时地址需要修改， 如果是已经clone下来的仓库， 需要修改remote地址
- 不能使用global配置用户名和邮箱