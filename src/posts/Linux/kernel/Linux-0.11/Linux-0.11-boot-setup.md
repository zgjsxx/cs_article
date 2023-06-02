---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 boot目录setup.s详解

## 模块简介

setup.s用于加载操作系统的一些信息，其主要处理了如下一些事情：

- 打印硬件信息
- 重新搬运system的位置
- 设置IDT和GDT
- 打开A20地址线
- 切换32位保护模式
- 跳转到system.s中运行

## 过程详解

### 打印硬件信息

这里将ds设置为INITSEG(0x9000)。这个值在bootsect.s中已经设置过，Linus认为目前程序是setup.s,因此这里重新设置了ds寄存器的值。

接下来利用INT 0x10中断读取光标所在的位置。

INT 0x10：
功能号ah = 0x03 作用读光标位置
输入： bh=页号
输出: ch=扫描开始线  cl=扫描结束线  dh=行号 dl=列号
```x86asm
	mov	$INITSEG, %ax	# this is done in bootsect already, but...
	mov	%ax, %ds
	mov	$0x03, %ah	# read cursor pos
	xor	%bh, %bh
	int	$0x10		# save it in known place, con_init fetches
	mov	%dx, %ds:0	# it from 0x90000.
```

```x86asm
# 获取内存信息

	mov	$0x88, %ah 
	int	$0x15
	mov	%ax, %ds:2

# 获取显卡显示模式

	mov	$0x0f, %ah
	int	$0x10
	mov	%bx, %ds:4	# bh = display page
	mov	%ax, %ds:6	# al = video mode, ah = window width

# check for EGA/VGA and some config parameters

	mov	$0x12, %ah
	mov	$0x10, %bl
	int	$0x10
	mov	%ax, %ds:8
	mov	%bx, %ds:10
	mov	%cx, %ds:12

# 获取第1块硬盘的信息

	mov	$0x0000, %ax
	mov	%ax, %ds
	lds	%ds:4*0x41, %si
	mov	$INITSEG, %ax
	mov	%ax, %es
	mov	$0x0080, %di
	mov	$0x10, %cx
	rep
	movsb

# 获取第2块硬盘的信息

	mov	$0x0000, %ax
	mov	%ax, %ds
	lds	%ds:4*0x46, %si
	mov	$INITSEG, %ax
	mov	%ax, %es
	mov	$0x0090, %di
	mov	$0x10, %cx
	rep
	movsb
```

### 重新搬运system的位置
此时ax = 0， 因此es = 0，

随后ax = 0x1000, ds = 0x1000。
```c
do_move:
	mov	%ax, %es	# destination segment
	add	$0x1000, %ax
	cmp	$0x9000, %ax
	jz	end_move
	mov	%ax, %ds	# source segment
	sub	%di, %di
	sub	%si, %si
	mov 	$0x8000, %cx
	rep
	movsw
	jmp	do_move
```

### 设置IDT和GDT

因为将system模块搬运到了物理地址为0x0000处，这里原来是BIOS中断存放的位置，因此这个搬运操作实际上覆盖了BIOS中断，因此我们需要重新设置。

接下来，将加载gdt和idt的寄存器。
```x86asm
end_move:
	mov	$SETUPSEG, %ax	# right, forgot this at first. didn't work :-)
	mov	%ax, %ds
	lidt	idt_48		# load idt with 0,0
	lgdt	gdt_48		# load gdt with whatever appropriate
```

### 打开A20地址线

下面这里是开启A20地址线。
```x86asm
	#call	empty_8042	# 8042 is the keyboard controller
	#mov	$0xD1, %al	# command write
	#out	%al, $0x64
	#call	empty_8042
	#mov	$0xDF, %al	# A20 on
	#out	%al, $0x60
	#call	empty_8042
	inb     $0x92, %al	# open A20 line(Fast Gate A20).
	orb     $0b00000010, %al
	outb    %al, $0x92
```
### 切换32位保护模式

切换到32位保护模式
```x86asm
	#mov	$0x0001, %ax	# protected mode (PE) bit
	#lmsw	%ax		# This is it!
	mov	%cr0, %eax	# get machine status(cr0|MSW)	
	bts	$0, %eax	# turn on the PE-bit 
	mov	%eax, %cr0	# protection enabled
				
				# segment-descriptor        (INDEX:TI:RPL)
	.equ	sel_cs0, 0x0008 # select for code segment 0 (  001:0 :00) 
```

### 跳转到system.s中运行
跳转到sytem模块执行。
```x86asm
	ljmp	$sel_cs0, $0
```


## Q & A


-----

欢迎大家与我交流

![](https://github.com/zgjsxx/static-img-repo/raw/main/blog/personal/chat.jpg)