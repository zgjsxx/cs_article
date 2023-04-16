---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 boot目录bootsect.s详解

## 模块简介

bootsect.s是磁盘启动的引导程序，其概括起来就是代码的搬运工，将代码搬到合适的位置。

![启动中内存分布变化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/bootsect_boot.png)

bootsect.s主要做了如下的三件事:
- 搬运bootsect.s代码到0x9000:0x0000处
- 加载setup.s代码到0x9000:0x200处
- 加载system模块到0x1000:0x0000处

## 过程详解

### 搬运bootsect.s代码到0x9000:0x0000处
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

### 加载setup.s代码到0x9000:0x200处


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

### 加载system模块到0x1000:0x0000处

接下来，要继续读system模块到内存中。 

ax =  0x1000, es = 0x1000
```c
	mov	$SYSSEG, %ax
	mov	%ax, %es		# segment of 0x010000
	call	read_it
	call	kill_motor
```

read_it实际上就是将system模块存放在0x1000:0x0000处。


test执行的是0x1000 & 0x0fff = 0x0000,
```x86asm
read_it:
	mov	%es, %ax
	test	$0x0fff, %ax
die:	jne 	die			# es must be at 64kB boundary
	xor 	%bx, %bx		# bx is starting address within segment
```

接下来rp_read的过程实际是逐磁道读取磁盘中system模块的过程。如下图所示共两个磁道，两个磁头，每磁道八个扇区，读取顺序如下所示，首先读取0磁头0磁道，然后读取1磁头0磁道，接着读取0磁头1磁道，最后读取1磁头1磁道。

![rp_read](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/boot_ok_read.png)

rp_read首先判断是否已经读入了所有的数据(system模块)。比较ax和ENDSEG的值，如果不相等，则跳转到ok1_read中执行。

```x86asm
rp_read:
	mov 	%es, %ax
 	cmp 	$ENDSEG, %ax		# have we loaded all yet?
	jb	ok1_read
	ret
```

在ok1_read中，则主要计算了当前磁道上还有多少扇区没有读取完。

```x86asm
ok1_read:
	#seg cs
	mov	%cs:sectors+0, %ax !获取每磁道的扇区数
	sub	sread, %ax         !减去当前磁道已读扇区数(bootsect + setup)
	mov	%ax, %cx           !cx = ax = 当前柱面未读扇区数
	shl	$9, %cx            !cx = cx * 512字节 + 段内偏移
	add	%bx, %cx
	jnc 	ok2_read       !调用ok2_read函数进行读取当前磁道上剩余扇区。
	je 	ok2_read
	xor 	%ax, %ax
	sub 	%bx, %ax
	shr 	$9, %ax
```


ok2_read实际的作用就是将**当前磁道上的所有扇区全部读完**。更具体的，就是读取开始扇区cl和需读扇区数al的数据到es:bx开始处。

```x86asm
ok2_read:
	call 	read_track   !读当前柱面上指定开始扇区和要读的扇区数
	mov 	%ax, %cx     !ax代表本次读取的扇区数，复制到cx中
	add 	sread, %ax   !ax = ax + sread
	#seg cs
	cmp 	%cs:sectors+0, %ax !如果当前磁道上还有扇区未读，则跳转到ok3_read
	jne 	ok3_read
	mov 	$1, %ax       !ax = 1
	sub 	head, %ax     !如果head = 0， ax = ax - head = 1,如果head = 1， ax = ax - head = 0, 即如果磁头号为0，则读取磁头面为1的扇区， 否则的话将读取下一个磁道上的数据。
	jne 	ok4_read
	incw    track 
```

如果当前磁道上还有扇区没有读，则会直接进入ok3_read，再次读取。否则先进入ok4_read，移动到下一个磁道或者下一个磁头进行读取。
```x86asm
ok4_read:
	mov	%ax, head        !保存当前的磁头号
	xor	%ax, %ax         !清除已读扇区数
ok3_read:
	mov	%ax, sread       !保存当前扇区已读扇区数
	shl	$9, %cx
	add	%cx, %bx
	jnc	rp_read
	mov	%es, %ax
	add	$0x1000, %ax
	mov	%ax, %es
	xor	%bx, %bx
	jmp	rp_read
```

接下来的read_track在ok2_read中被调用，其作用是读取当前磁道上的扇面到es:bx处。

回顾一下INT 0x13读取磁盘数据时的参数:
- ah = 0x02 功能号，代表读磁盘到内存   
- al = 需要读出的扇区总数
- ch = 磁道(柱面)号的低8位
- cl = 0-5位代表开始扇区， 6-7位代表磁道号的高2位代表柱面的高2位。
- dh = 磁头号       
- dl = 驱动器号
- es:bx = 指向数据缓冲区
- 如果出错，则CF标志位置位，ah中将存放出错码

```x86asm
read_track:
	push	%ax       !保存ax,bx,cx,dx寄存器
	push	%bx
	push	%cx
	push	%dx
	mov	track, %dx    !获取当前的磁道号
	mov	sread, %cx    !获取当前磁道上的已读扇区数
	inc	%cx           !cl = 开始读的扇区号
	mov	%dl, %ch      !ch = 当前磁道号
	mov	head, %dx     !dx = 当前磁头号， 目前磁头号还在dl中，后面会挪动到dh中。
	mov	%dl, %dh      !将磁头号从dl挪动到dh中
	mov	$0, %dl       !dl = 驱动器号
	and	$0x0100, %dx  !将dx与0x0100进行按位与，实际就是使得磁头号小于等于1。
	mov	$2, %ah       !ah = 2，读磁盘扇区的功能号
	int	$0x13         !0x13号中断， 读取磁盘数据。
	jc	bad_rt        !如果出错，则跳转运行bad_rt
	pop	%dx           !恢复dx,cx,bx,ax寄存器
	pop	%cx
	pop	%bx
	pop	%ax
	ret
```


看到这里，我们再回到调用read_it的地方,	注意到其中的```ljmp	$SETUPSEG, $0```，这便是跳转到了setup.s中进行执行。
```x86asm
	mov	$SYSSEG, %ax
	mov	%ax, %es		# segment of 0x010000
	call	read_it     !读取磁盘上system模块
	call	kill_motor  !关闭驱动器马达

	#seg cs
	mov	%cs:root_dev+0, %ax
	cmp	$0, %ax
	jne	root_defined
	#seg cs
	mov	%cs:sectors+0, %bx
	mov	$0x0208, %ax		# /dev/ps0 - 1.2Mb
	cmp	$15, %bx
	je	root_defined
	mov	$0x021c, %ax		# /dev/PS0 - 1.44Mb
	cmp	$18, %bx
	je	root_defined
undef_root:
	jmp undef_root
root_defined:
	#seg cs
	mov	%ax, %cs:root_dev+0

	ljmp	$SETUPSEG, $0   !跳转到SETUPSEG模块进行执行
```
## Q & A


https://github.com/Wangzhike/HIT-Linux-0.11/blob/master/1-boot/OS-booting.md