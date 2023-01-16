---
title: 
category: 
- Linux
---

# eBPF Helloworld
```shell
git clone git@github.com:libbpf/libbpf-bootstrap.git
cd libbpf-bootstrap/
git submodule update --init --recursive
```

```shell
cd examples/c
make minimal
sudo ./minimal
sudo cat /sys/kernel/debug/tracing/trace_pipe
```