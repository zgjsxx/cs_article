# mitmproxy


设置上游代理，并且只对目的地址为```127.0.0.1:443```的流量进行解密

```shell
mitmdump --mode upstream:http://127.0.0.1:1081 --allow-hosts 127.0.0.1:443
```