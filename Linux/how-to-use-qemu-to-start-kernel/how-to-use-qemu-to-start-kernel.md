

Rocky Linux 9
```shell
sudo dnf config-manager --set-enabled crb
sudo dnf install -y glibc-static
```

Rocky Linux 8
```shell
sudo dnf config-manager --set-enabled powertools
sudo dnf install -y glibc-static
```

https://www.frytea.com/technology/unix-like/qemu-launch-linux-kernel-and-homemade-rootfs/