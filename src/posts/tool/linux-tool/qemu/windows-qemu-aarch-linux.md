- [Windows 11 模拟ARMv8架构安装 CentOS 7.9 操作系统](#windows-11-模拟armv8架构安装-centos-79-操作系统)
  - [1.准备cent7.9 aarch的iso](#1准备cent79-aarch的iso)
  - [2.准备qemu](#2准备qemu)
  - [3.准备UEFI](#3准备uefi)
  - [4.准备tap网卡](#4准备tap网卡)
  - [5.安装系统](#5安装系统)
  - [常见问题](#常见问题)
    - [重启qemu虚拟机后，无法连接外网(亲测)](#重启qemu虚拟机后无法连接外网亲测)
  - [参考文章](#参考文章)

# Windows 11 模拟ARMv8架构安装 CentOS 7.9 操作系统

## 1.准备cent7.9 aarch的iso

1.下载ARM版本对应的 CentOS 7.9 的ISO镜像文件

可以通过下面的链接进行下载[CentOS-7-aarch64-Minimal-2009.iso](https://vault.centos.org/altarch/7.9.2009/isos/aarch64/CentOS-7-aarch64-Minimal-2009.iso)

## 2.准备qemu

可以访问如下页面[qemu下载页](https://qemu.weilnetz.de/w64/2023/)下载所需要的版本的qemu，具体的安装过程忽略，比较简单。

安装完qemu之后需要将安装路径添加到环境变量中。

## 3.准备UEFI

直接下载[QEMU_EFI.fd](http://releases.linaro.org/components/kernel/uefi-linaro/16.02/release/qemu64/QEMU_EFI.fd)到文件夹中备用。
 
## 4.准备tap网卡

qemu里的系统若要连接互联网，需要通过tap网卡进行通信。最简单的办法可以借用openvpn的tap网卡驱动。下载并安装，[openVPN](https://build.openvpn.net/downloads/releases/OpenVPN-2.6_rc2-I001-amd64.msi)。

![tap网卡](https://github.com/zgjsxx/static-img-repo/raw/main/blog/tool/qemu/tap.png)

注意最好要将网卡的名字修改为英文的。(我的机器遇到了无法重命名的情况)

把联网的真实网卡设共享。来到控制面板->更改适配器设置，右键已联网的网卡->属性，勾选允许共享，并选择tap网卡。

![share网络给tap网卡](https://github.com/zgjsxx/static-img-repo/raw/main/blog/tool/qemu/network-share.png)

## 5.安装系统

首先创建一个空白磁盘：

```shell
qemu-img.exe create centosarm64.img 20G
```

qemu安装镜像：

```shell
qemu-system-aarch64 -m 4096 -cpu cortex-a72 -smp 4,cores=4,threads=1,sockets=1 -M virt -bios ./QEMU_EFI.fd -net nic  -net tap,ifname="OpenVPN TAP-Windows6" -device nec-usb-xhci -device usb-kbd -device usb-mouse -device VGA -drive if=none,file=./CentOS-7-aarch64-Minimal-2009.iso,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -drive if=none,file=./centosarm64.img,id=hd0 -device virtio-blk-device,drive=hd0
```

安装好之后，下次再次启动，可以使用：

```shell
qemu-system-aarch64 -m 4096 -cpu cortex-a72 -smp 4,cores=4,threads=1,sockets=1 -M virt -bios ./QEMU_EFI.fd -net nic -net tap,ifname="OpenVPN TAP-Windows6" -device nec-usb-xhci -device usb-kbd -device usb-mouse -device VGA -drive if=none,file=,id=cdrom,media=cdrom -device virtio-scsi-device -device scsi-cd,drive=cdrom -drive if=none,file=./centosarm64.img,id=hd0 -device virtio-blk-device,drive=hd0
```

安装完毕之后，需要配置IP地址，打开宿主机查看tap网卡的地址，将虚拟机的网卡设置为tap网卡的地址。

通过```ipconfig```可以在宿主机上查看tap网卡的地址。

![tap网卡地址](https://github.com/zgjsxx/static-img-repo/raw/main/blog/tool/qemu/ipSetting.png)

## 常见问题

###  重启qemu虚拟机后，无法连接外网(亲测)

此问题可能是windows网络共享的问题，在宿主机种右键物理网卡，点击“属性”按钮，在弹出的界面中选择“共享”选项，先取消共享，点击确定后，再次选择共享即可。

## 参考文章

- https://www.cnblogs.com/miracle-luna/p/17929667.html
- https://www.freebuf.com/sectool/368589.html
- https://segmentfault.com/a/1190000042853561