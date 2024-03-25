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

### step1：打印硬件信息

下面是setup.s的30-41行：

```x86asm
entry start
start:

! ok, the read went well so we get current cursor position and save it for
! posterity.

	mov	ax,#INITSEG	! this is done in bootsect already, but...
	mov	ds,ax
	mov	ah,#0x03	! read cursor pos
	xor	bh,bh
	int	0x10		! save it in known place, con_init fetches
	mov	[0],dx		! it from 0x90000.
```

这里将```ds```设置为```INITSEG```(```0x9000```)。这个值在bootsect.s中已经设置过，Linus认为目前程序是setup.s,因此这里重新设置了```ds```寄存器的值。

接下来利用```INT 0x10```中断读取光标所在的位置，并将其存储在了0x90000处。

```0x10``` 03号功能的中断号的功能如下：
- 读光标位置，```ah=0x03```
	
  输入：
  - bh = 页号
	
  输出：
  - ch = 扫描开始线
  - cl = 扫描结束线
  - dh = 行号
  - dl = 列号

下面是setup.s的42-46行，这里利用了```0x88```中断去获取扩展内存的大小。

```x86asm
! Get memory size (extended mem, kB)

	mov	ah,#0x88
	int	0x15
	mov	[2],ax
```

```0x88```中断的功能的输出如下：
- ```ax```：从绝对地址 100000h(1M) 开始的连续KB数
- 如果出错， CF被设置， 如果成功CF被清除

这里调用```0x88```中断之后，```ax```存储了返回信息，并将该信息存在了```0x90002```处。

下面是setup.s的48-53行，用于获取显卡的显示模式。这里利用的是```0x10```中断的```af```功能码。

```x86asm
! Get video-card data:

	mov	ah,#0x0f
	int	0x10
	mov	[4],bx		! bh = display page
	mov	[6],ax		! al = video mode, ah = window width
```

```0x10```中断```0f```功能码：
输出：
- AH： 字符列
- AL： 显示模式
- BH： 当前页

在获取完信息之后，将当前页存储在```0x90004-0x90005```,将显示模式存储在```0x90006```,将字符列数存储在```0x90007```。

下面是setup.s的55-65行，主要用于检查显示方式。

```x86asm
! check for EGA/VGA and some config parameters

	mov	ah,#0x12
	mov	bl,#0x10
	int	0x10
	mov	[8],ax
	mov	[10],bx
	mov	[12],cx
```

这里用到的是0x10中断，其主功能码(AH)是```12h```，次功能码```10h```。其输出如下：
- BH：显示状态(0x00，彩色模式， I/O端口 3Dxh， 0x01， 单色模式， I/O端口 3bxh)
- BL： 安装的显示内存(00h = 64k， 01h = 128K， 02h = 192k，03h = 256k)
- CH：特征连接器位
- CL：切换设置

有关CH和CL的含义，可以参考[这里](https://www.youtube.com/watch?v=FpnGzLfIoz4&ab_channel=%E9%9F%B3%E4%B9%90%E7%A7%81%E8%97%8F%E9%A6%86)。

最终在获取完这些信息之后，将其```AH```存储在了```0x90008```(```AH```返回新的BIOS移除了该返回值),将安装的显示内存存储在了```0x9000a```,将显卡的特性参数存储在了```0x9000c```。

下面是setup.s的64-74行，这里用于获取第一块硬盘的信息。

```
! Get hd0 data

	mov	ax,#0x0000
	mov	ds,ax
	lds	si,[4*0x41]
	mov	ax,#INITSEG
	mov	es,ax
	mov	di,#0x0080
	mov	cx,#0x10
	rep
	movsb
```

第一块硬盘的参数表的首地址和```0x41```中断向量地址重合。每个中断向量的长度是4个字节，因此其地址是```0x41*4 = 0x104```。使用```lds```指令即可读出第一块硬盘的实际位置。

后面再次使用了```rep movsb```循环搬运数据， 数据的原始位置在```ds:si```中(通过lds获取)，数据的目的位置是```0x90080```。


下面是setup.s的76-86行，其用于获取第2块硬盘的信息，整个过程与上面类似，区别是第二块硬盘的信息与```0x46```中断向量重合。

```x86asm
! Get hd1 data

	mov	ax,#0x0000
	mov	ds,ax
	lds	si,[4*0x46]
	mov	ax,#INITSEG
	mov	es,ax
	mov	di,#0x0090
	mov	cx,#0x10
	rep
	movsb
```

这里检查系统是否有第2块硬盘，如果没有，则把第2个表清零。

```x86asm
! Check that there IS a hd1 :-)

	mov	ax,#0x01500
	mov	dl,#0x81
	int	0x13
	jc	no_disk1
	cmp	ah,#3
	je	is_disk1
no_disk1:
	mov	ax,#INITSEG
	mov	es,ax
	mov	di,#0x0090
	mov	cx,#0x10
	mov	ax,#0x00
	rep
	stosb
is_disk1:
```

接下来就要进入保护模式了，进入保护模式之前，会先关闭中断。

```x86asm
! now we want to move to protected mode ...
	cli			! no interrupts allowed !
```


### step2：重新搬运system的位置
此时ax = 0， 因此es = 0，

随后ax = 0x1000, ds = 0x1000。
```x86asm
! first we move the system to it's rightful place

	mov	ax,#0x0000
	cld			! 'direction'=0, movs moves forward
do_move:
	mov	es,ax		! destination segment
	add	ax,#0x1000
	cmp	ax,#0x9000
	jz	end_move
	mov	ds,ax		! source segment
	sub	di,di
	sub	si,si
	mov 	cx,#0x8000
	rep
	movsw
	jmp	do_move
```

### step3：设置IDT和GDT

因为将system模块搬运到了物理地址为0x0000处，这里原来是BIOS中断存放的位置，因此这个搬运操作实际上覆盖了BIOS中断，因此我们需要重新设置。

接下来，将加载gdt和idt的寄存器。
```x86asm
end_move:
	mov	$SETUPSEG, %ax	# right, forgot this at first. didn't work :-)
	mov	%ax, %ds
	lidt	idt_48		# load idt with 0,0
	lgdt	gdt_48		# load gdt with whatever appropriate
```

### step4：打开A20地址线

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

### step5: 切换32位保护模式

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


文中如有表达不正确之处，欢迎大家与我交流，微信号codebuilding。

![](https://github.com/zgjsxx/static-img-repo/raw/main/blog/personal/wechat.jpg)
