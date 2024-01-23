设置https 代理

Git代理有两种设置方式，分别是全局代理和只对Github代理，建议只对github 代理。
代理协议也有两种，分别是使用http代理和使用socks5代理，建议使用socks5代理。
注意下面代码的端口号需要根据你自己的代理端口设定，比如我的代理socks端口是51837。


全局设置（不推荐）

使用http代理 

```shell
git config --global http.proxy http://127.0.0.1:58591
git config --global https.proxy https://127.0.0.1:58591
```

使用socks5代理

```shell
git config --global http.proxy socks5://127.0.0.1:51837
git config --global https.proxy socks5://127.0.0.1:51837
```

只对Github代理（推荐）

使用socks5代理（推荐）

```shell
git config --global http.https://github.com.proxy socks5://127.0.0.1:51837
```

使用http代理（不推荐）

```shell
git config --global http.https://github.com.proxy http://127.0.0.1:58591
```

取消代理
当你不需要使用代理时，可以取消之前设置的代理。

```shell
git config --global --unset http.proxy git config --global --unset https.proxy
```

设置ssh代理（终极解决方案）

https代理存在一个局限，那就是没有办法做身份验证，每次拉取私库或者推送代码时，都需要输入github的账号和密码，非常痛苦。
设置ssh代理前，请确保你已经设置ssh key。可以参考在 github 上添加 SSH key 完成设置
更进一步是设置ssh代理。只需要配置一个config就可以了。

# Linux、MacOS
vi ~/.ssh/config
# Windows 
到C:\Users\your_user_name\.ssh目录下，新建一个config文件（无后缀名）

将下面内容加到config文件中即可

```
Host github.com
  User git
  Port 22
  Hostname github.com
  # 注意修改路径为你的路径
  IdentityFile "C:\Users\<User Name>\.ssh\id_rsa"
  TCPKeepAlive yes
  ProxyCommand "C:\Users\<User Name>\E\Git\mingw64\bin\connect" -S 127.0.0.1:1080 -a none %h %p

Host ssh.github.com
  User git
  Port 443
  Hostname ssh.github.com
  # 注意修改路径为你的路径
  IdentityFile "C:\Users\<User Name>\.ssh\id_rsa"
  TCPKeepAlive yes
  ProxyCommand "C:\Users\<User Name>\E\Git\mingw64\bin\connect" -S 127.0.0.1:1080 -a none %h %p
```

对于windows用户，代理会用到connect.exe，你如果安装了Git都会自带connect.exe，如我的路径为C:\APP\Git\mingw64\bin\connect

如果不知道自己的机器上是否有connect.exe， 可以使用everything去进行检索。

#Windows用户，注意替换你的端口号和connect.exe的路径
ProxyCommand "C:\APP\Git\mingw64\bin\connect" -S 127.0.0.1:51837 -a none %h %p
  
#MacOS用户用下方这条命令，注意替换你的端口号
#ProxyCommand nc -v -x 127.0.0.1:51837 %h %p


# 测试是否设置成功
ssh -T git@github.com