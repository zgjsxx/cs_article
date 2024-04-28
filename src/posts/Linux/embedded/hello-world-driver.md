
```c
#include <linux/init.h>
#include <linux/kernel.h>
#include <linux/module.h>
MODULE_LICENSE("GPL");
MODULE_VERSION("4.15.0-133-generic");
static int __init start(void)
{
        printk(KERN_INFO "Loading module....\n");
        printk(KERN_INFO "Hello World....\n");
        return 0;
}

static void __exit end(void)
{
        printk(KERN_INFO "Bye World....\n");
}
module_init(start);
module_exit(end);
```


```makefile
obj-m += learn.o
all:
        make -C /lib/modules/$(shell uname -r)/build M=$(PWD) modules
```


```shell
make

sudo insmod learn.ko
lsmod | grep learn
rmmod learn.ko
```