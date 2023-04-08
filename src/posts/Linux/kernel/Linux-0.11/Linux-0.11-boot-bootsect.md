---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 boot目录bootsect.s详解

搬运bootsect.s代码到0x9000:0x0000处

加载setup.s代码到0x9000:0x200处

加载system模块到0x1000:0x0000处

## 模块简介

bootsect.s是磁盘启动的引导程序，其概括起来就是代码的搬运工，将代码搬到合适的位置。

![启动中内存分布变化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/bootsect_boot.png)

## 过程详解

将ax寄存器设置为0x07c0， 接着ax寄存器的值拷贝给ds，即ds目前也为0x07c0。

将ax寄存器设置为0x9000， 接着ax寄存器的值拷贝给es，即es目前也为0x9000。
```x86asm
mov	$BOOTSEG, %ax	#将ds段寄存器设置为0x07c0
mov	%ax, %ds
mov	$INITSEG, %ax	#将es段寄存器设置为0x9000
mov	%ax, %es
```

接下来将ecx的值设置为256。接下来通过sub将si和di寄存器设置为0。

接下来使用rep和movsw从ds:si拷贝256个字(512字节)到es:si处。
```x86asm
mov	$256, %cx		#设置移动计数值256字
sub	%si, %si		#源地址	ds:si = 0x07C0:0x0000
sub	%di, %di		#目标地址 es:si = 0x9000:0x0000
rep					#重复执行并递减cx的值
movsw				#从内存[si]处移动cx个字到[di]处
```

接下来使用ljmp跳转到0x9000 偏移量为go处的代码执行。

```c
ljmp	$INITSEG, $go
```

cs寄存器的值为0x9000。接下来的操作就是将ds，es，ss都赋值为0x9000。同时将sp设置为0xFF00。
```c
go:	mov	%cs, %ax		#将ds，es，ss都设置成移动后代码所在的段处(0x9000)
	mov	%ax, %ds
	mov	%ax, %es
	mov	%ax, %ss
	mov	$0xFF00, %sp		# arbitrary value >>512
```

接下来这一部分用于加载setup.s的代码到0x9000:0200处。

这里利用了BIOS的0x13号中断。

下面是关于BIOS INT 0x13在使用时的说明:

ah = 0x02 读磁盘到内存   al = 4 读4个扇区
ch: 柱面号的低8位， cl: 0-5位代表开始扇区， 6-7位 代表磁道号的高2位代表柱面的高2位。
dh 磁头号       dl 驱动器号。

如果读取成功则执行ok_load_setup。 如果不成功，则对驱动器进行复位，再次读取。

```x86asm
load_setup:
	mov	$0x0000, %dx		# drive 0, head 0
	mov	$0x0002, %cx		# sector 2, track 0
	mov	$0x0200, %bx		# address = 512, in INITSEG
	.equ    AX, 0x0200+SETUPLEN
	mov     $AX, %ax		# service 2, nr of sectors
	int	$0x13			# read it
	jnc	ok_load_setup		# ok - continue
	mov	$0x0000, %dx
	mov	$0x0000, %ax		# reset the diskette
	int	$0x13
	jmp	load_setup
```

下面依旧是使用INT 0x13去获取一些磁盘驱动器的参数。

ah = 0x08 用于获取驱动器参数。 dl为驱动器号。


返回信息：
- 如果出错则CF置为， ah=状态码
- al = 0， al = 0 
- bl为驱动器的类型 AT/PS2
- ch 最大柱面号的低8位
- cl 0-5为每磁道最大扇区数， 6-7代表柱面号高2位
- dh最大磁头数 
- dl驱动器数量
- es:di 软驱磁盘参数表
- 
```x86asm
ok_load_setup:
	mov	$0x00, %dl
	mov	$0x0800, %ax		# AH=8 is get drive parameters
	int	$0x13
	mov	$0x00, %ch
	#seg cs
	mov	%cx, %cs:sectors+0	# %cs means sectors is in %cs
	mov	$INITSEG, %ax
	mov	%ax, %es
```

下面会使用BIOS中断0x10向终端中打印信息。

0x10中断号有多个功能

(1)读光标位置：
功能号:ah=0x03
输入：
- bh = 页号
输出：
- ch = 扫描开始线
- cl = 扫描结束线
- dh = 行号
- dl = 列号

(1)打印字符串：
功能号:ah=0x013
输入：
- al = 放置光标的方式和规定属性
- es:bp 字符串位置
- cx = 显示的字符串字符数
- bh = 显示页面号
- bl = 字符属性
- dh = 行号
- dl = 列号


```c
	mov	$0x03, %ah		# read cursor pos
	xor	%bh, %bh
	int	$0x10
	
	mov	$30, %cx
	mov	$0x0007, %bx		# page 0, attribute 7 (normal)
	#lea	msg1, %bp
	mov     $msg1, %bp
	mov	$0x1301, %ax		# write string, move cursor
	int	$0x10
```

接下来，要继续读system模块到内存中。 

ax =  0x1000, es = 0x1000
```c
	mov	$SYSSEG, %ax
	mov	%ax, %es		# segment of 0x010000
	call	read_it
	call	kill_motor
```

read_it实际上就是将system模块存放在0x1000:0x0000处。


程序的最后，通过ljmp跳转到setup位置执行setup.s中的代码。
```x86asm
	ljmp	$SETUPSEG, $0
```
## Q & A