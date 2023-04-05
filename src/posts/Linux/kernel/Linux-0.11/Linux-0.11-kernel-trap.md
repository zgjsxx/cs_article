---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---


# Linux-0.11 kernel目录进程管理trap.c详解

## 模块简介

## 函数详解

### die
```c
static void die(char * str,long esp_ptr,long nr)
```
该函数用于在出现异常时，打印一些出错信息。

```c
long * esp = (long *) esp_ptr;
int i;

printk("%s: %04x\n\r",str,nr&0xffff);
printk("EIP:\t%04x:%p\nEFLAGS:\t%p\nESP:\t%04x:%p\n",
	esp[1],esp[0],esp[2],esp[4],esp[3]);
printk("fs: %04x\n",_fs());
printk("base: %p, limit: %p\n",get_base(current->ldt[1]),get_limit(0x17));
if (esp[4] == 0x17) {
	printk("Stack: ");
	for (i=0;i<4;i++)
		printk("%p ",get_seg_long(0x17,i+(long *)esp[3]));
	printk("\n");
}
str(i);
printk("Pid: %d, process nr: %d\n\r",current->pid,0xffff & i);
for(i=0;i<10;i++)
	printk("%02x ",0xff & get_seg_byte(esp[1],(i+(char *)esp[0])));
printk("\n\r");
do_exit(11);		/* play segment exception */
```

### do_double_fault
```c
void do_double_fault(long esp, long error_code)
```
调用die打印double fault的出错信息。
```c
{
	die("double fault",esp,error_code);
}
```
### do_general_protection
```c
void do_general_protection(long esp, long error_code)
```
调用die打印general protection的出错信息。
```c
{
	die("general protection",esp,error_code);
}
```
### do_divide_error
```c
void do_divide_error(long esp, long error_code)
```
调用die打印divide error的出错信息。
```c
{
	die("divide error",esp,error_code);
}
```

### do_int3
```c
void do_int3(long * esp, long error_code,
		long fs,long es,long ds,
		long ebp,long esi,long edi,
		long edx,long ecx,long ebx,long eax)
``` 

打印int3的信息。
```c
	int tr;

	__asm__("str %%ax":"=a" (tr):"0" (0));
	printk("eax\t\tebx\t\tecx\t\tedx\n\r%8x\t%8x\t%8x\t%8x\n\r",
		eax,ebx,ecx,edx);
	printk("esi\t\tedi\t\tebp\t\tesp\n\r%8x\t%8x\t%8x\t%8x\n\r",
		esi,edi,ebp,(long) esp);
	printk("\n\rds\tes\tfs\ttr\n\r%4x\t%4x\t%4x\t%4x\n\r",
		ds,es,fs,tr);
	printk("EIP: %8x   CS: %4x  EFLAGS: %8x\n\r",esp[0],esp[1],esp[2]);
```

### do_nmi
```c
void do_nmi(long esp, long error_code)
```
调用die打印nmi的出错信息。
```c
die("nmi",esp,error_code);
```

### do_debug
```c
void do_debug(long esp, long error_code)
```
调用die打印debug的出错信息。
```c
die("debug",esp,error_code);
```
### do_overflow
```c
void do_overflow(long esp, long error_code)
```
调用die打印overflow的出错信息。
```c
die("overflow",esp,error_code);
```

### do_bounds
```c
void do_bounds(long esp, long error_code)
```

调用die打印bounds的出错信息。
```c
die("bounds",esp,error_code);
```

### do_invalid_op
```c
void do_invalid_op(long esp, long error_code)
```
调用die打印invalid operand的出错信息。
```c
die("invalid operand",esp,error_code);
```
### do_device_not_available
```c
void do_device_not_available(long esp, long error_code)
```
调用die打印device not available的出错信息。
```c
die("device not available",esp,error_code);
```

### do_coprocessor_segment_overrun
```c
void do_coprocessor_segment_overrun(long esp, long error_code)
```
调用die打印coprocessor segment overrun的出错信息。
```c
die("coprocessor segment overrun",esp,error_code);
```
### do_invalid_TSS
```c
void do_invalid_TSS(long esp,long error_code)
```
调用die打印do_invalid_TSS的出错信息。
```c
die("invalid TSS",esp,error_code);
```

### do_segment_not_present
```c
void do_segment_not_present(long esp,long error_code)
```
调用die打印do_segment_not_present的出错信息。
```c
die("segment not present",esp,error_code);
```

### do_stack_segment
```c
void do_stack_segment(long esp,long error_code)
```
调用die打印do_stack_segment的出错信息。

```c
die("stack segment",esp,error_code);
```

### do_coprocessor_error
```c
void do_coprocessor_error(long esp, long error_code)
```

### do_reserved
```c
void do_reserved(long esp, long error_code)
```
调用die打印do_reserved的出错信息。
```c
die("reserved (15,17-47) error",esp,error_code);
```
### trap_init
```c
void trap_init(void)
```
初始化trap。

```c
	int i;

	set_trap_gate(0,&divide_error);
	set_trap_gate(1,&debug);
	set_trap_gate(2,&nmi);
	set_system_gate(3,&int3);	/* int3-5 can be called from all */
	set_system_gate(4,&overflow);
	set_system_gate(5,&bounds);
	set_trap_gate(6,&invalid_op);
	set_trap_gate(7,&device_not_available);
	set_trap_gate(8,&double_fault);
	set_trap_gate(9,&coprocessor_segment_overrun);
	set_trap_gate(10,&invalid_TSS);
	set_trap_gate(11,&segment_not_present);
	set_trap_gate(12,&stack_segment);
	set_trap_gate(13,&general_protection);
	set_trap_gate(14,&page_fault);
	set_trap_gate(15,&reserved);
	set_trap_gate(16,&coprocessor_error);
	for (i=17;i<48;i++)
		set_trap_gate(i,&reserved);
	set_trap_gate(45,&irq13);
	outb_p(inb_p(0x21)&0xfb,0x21);
	outb(inb_p(0xA1)&0xdf,0xA1);
	set_trap_gate(39,&parallel_interrupt);
```

## Q & A