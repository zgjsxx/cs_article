---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 boot目录bootsect.s详解](#linux-011-boot目录bootsects详解)
	- [模块简介](#模块简介)
	- [过程详解](#过程详解)
		- [step1：搬运bootsect.s代码到```0x9000:0x0000```处](#step1搬运bootsects代码到0x90000x0000处)
		- [step2：加载setup.s代码到```0x9000:0x200```处](#step2加载setups代码到0x90000x200处)
		- [step3：加载system模块到```0x1000:0x0000```处](#step3加载system模块到0x10000x0000处)
	- [参考文章](#参考文章)


# Linux-0.11 boot目录bootsect.s详解

## 模块简介

bootsect.s是磁盘启动的引导程序，其概括起来就是代码的搬运工，将代码搬到合适的位置。下图是对搬运过程的概括，可以有个印象，后面将详细讲解。

![启动中内存分布变化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/bootsect/bootsect_boot.png)

bootsect.s主要做了如下的三件事:
- 搬运bootsect.s代码到0x9000:0x0000处
- 加载setup.s代码到0x9000:0x200处
- 加载system模块到0x1000:0x0000处

## 过程详解

### step1：搬运bootsect.s代码到```0x9000:0x0000```处

下面是bootsect.s中开头1-50行。

```x86asm
!
! SYS_SIZE is the number of clicks (16 bytes) to be loaded.
! 0x3000 is 0x30000 bytes = 196kB, more than enough for current
! versions of linux
!
SYSSIZE = 0x3000
!
!	bootsect.s		(C) 1991 Linus Torvalds
!
! bootsect.s is loaded at 0x7c00 by the bios-startup routines, and moves
! iself out of the way to address 0x90000, and jumps there.
!
! It then loads 'setup' directly after itself (0x90200), and the system
! at 0x10000, using BIOS interrupts. 
!
! NOTE! currently system is at most 8*65536 bytes long. This should be no
! problem, even in the future. I want to keep it simple. This 512 kB
! kernel size should be enough, especially as this doesn't contain the
! buffer cache as in minix
!
! The loader has been made as simple as possible, and continuos
! read errors will result in a unbreakable loop. Reboot by hand. It
! loads pretty fast by getting whole sectors at a time whenever possible.

.globl begtext, begdata, begbss, endtext, enddata, endbss
.text
begtext:
.data
begdata:
.bss
begbss:
.text

SETUPLEN = 4				! nr of setup-sectors
BOOTSEG  = 0x07c0			! original address of boot-sector
INITSEG  = 0x9000			! we move boot here - out of the way
SETUPSEG = 0x9020			! setup starts here
SYSSEG   = 0x1000			! system loaded at 0x10000 (65536).
ENDSEG   = SYSSEG + SYSSIZE		! where to stop loading

! ROOT_DEV:	0x000 - same type of floppy as boot.
!		0x301 - first partition on first drive etc
ROOT_DEV = 0x306

entry _start
_start:
	mov	ax,#BOOTSEG
	mov	ds,ax
	mov	ax,#INITSEG
	mov	es,ax
```

其中最关键的是下面这几行：

```x86asm
	mov	ax,#BOOTSEG 
	mov	ds,ax
	mov	ax,#INITSEG
	mov	es,ax
```

这里首先将```ax```寄存器设置为```0x07c0```， 接着将```ax```寄存器的值拷贝给```ds```，即```ds```目前为```0x07c0```。

接下来将```ax```寄存器设置为```0x9000```， 接着将```ax```寄存器的值拷贝给```es```，即```es```目前为```0x9000```。


下面是bootsect.s中的51-55行：

```x86asm
	mov	cx,#256 #设置移动计数值256字
	sub	si,si   #源地址	ds:si = 0x07C0:0x0000
	sub	di,di   #目标地址 es:di = 0x9000:0x0000
	rep         #重复执行并递减cx的值
	movw        #从内存[si]处移动cx个字到[di]处			
```

这里首先将```cx```的值设置为```256```。

接下来```sub```指令后跟了两个相同的```si```寄存器，这其实会将寄存器```si```设置为0。```sub	di,di```同理将```di```设置为0。

接下来使用```rep```前缀和```movsw```指令。

根据Intel手册，```movsw```的作用是从```DS:(E)SI```拷贝一个字到```ES:（E)DI```。```movsw```操作之后会对```si```和```si```进行递增或者递减，递增还是递减由```EFLAGS```寄存器中的方向位(DF: direction flag)来决定， DF=0，则进行递增， DF=1，则进行递减。

因此```rep movsw```的实际作用是从```ds:si```拷贝256个字(512字节)到```es:si```处。


接下来是bootsect.s的第56行，使用```jmpi```指令进行跳转。

```x86asm
	jmpi	go,INITSEG
```

```jmpi```是段间跳转指令，```jmpi```的格式是```jmpi 段内偏移， 段选择子```。

这句指令使得程序跳转到```0x9000``` 偏移量为```go```处的代码执行。执行完之后```cs```寄存器的值将等于```0x9000```。

下面是bootsect.s的第57-62行。

```x86asm
go:	mov	ax,cs  #将ds，es，ss都设置成移动后代码所在的段处(0x9000)
	mov	ds,ax
	mov	es,ax
	mov	ss,ax
	mov	sp,#0xFF00
```

```cs```寄存器的值为```0x9000```。接下来的操作就是将```ds```，```es```，```ss```都赋值为```0x9000```。同时将```sp```设置为```0xFF00```。


### step2：加载setup.s代码到```0x9000:0x200```处

接下来这一部分用于加载setup.s的代码到```0x9000:0x200```处。

下面这里是bootsect.s的67-77行。

```x86asm
load_setup:
	mov	dx,#0x0000		! drive 0, head 0
	mov	cx,#0x0002		! sector 2, track 0
	mov	bx,#0x0200		! address = 512, in INITSEG
	mov	ax,#0x0200+SETUPLEN	! service 2, nr of sectors
	int	0x13			! read it
	jnc	ok_load_setup		! ok - continue
	mov	dx,#0x0000
	mov	ax,#0x0000		! reset the diskette
	int	0x13
	j	load_setup
```

这里利用了BIOS的```0x13```号中断，```0x13```中断和磁盘操作相关，这里使用了2号功能码。

0x13中断的2号功能的各项参数含义如下：
- AH = 02h
- AL = 要读取多少扇区，非0的数值
- CH = 柱面的低8位
- CL = CL[5：0]表示起始扇区，CL[7：6]是柱面的高2位
- DH = 磁头号
- DL = 驱动器号
- ES:BX = 数据缓冲区的位置

返回值:
- 当出错时CF被设置。
- 成功操作时，CF被清楚。

```ax = 0x0204```， 因此```ah=0x02```, ```al=0x04```,代表这里进行的操作是都磁盘到内存，且要读取4个扇区。
```bx = 0x200```， 因此从磁盘中读取的数据将拷贝到```0x9000:0x200```处
```cx = 0x0002```, ```cx[5:0] = 0x2```，表示起始扇区为2，```{cx[7:6], cx[15:8]} = 0x0```, 代表柱面为0。
```dx = 0x0000```， ```dh = 0x0```, 磁头号为0， ```dl = 0x0```, 驱动器号为0。

关于```0x13```中断的更多详细功能，可以参考[这里](http://www.ctyme.com/intr/int-13.htm)。

如果读取成功则执行```ok_load_setup```。 这里使用的是```jnc```跳转指令，它会根据CF的状态决定是否跳转。

如果不成功，则对驱动器进行复位，再次读取。复位操作仍然使用的是```0x13```中断，操作码为0。

- AH = 00h
- DL = 驱动器号

接下来是bootsect.s的79-90行。

```x86asm
ok_load_setup:

! Get disk drive parameters, specifically nr of sectors/track

	mov	dl,#0x00
	mov	ax,#0x0800		! AH=8 is get drive parameters
	int	0x13
	mov	ch,#0x00
	seg cs
	mov	sectors,cx
	mov	ax,#INITSEG
	mov	es,ax
```

这里是使用```0x13```中断的8号功能码去获取一些磁盘驱动器的参数。

入参：
- ah：功能码，08h代表去获取驱动器的参数。
- dl：为驱动器号。

返回信息：
- CF：如果出错则CF置为1，如果成功则CF=0。如果出错，ah=状态码
- ah = 0， al = 0 
- bl：驱动器的类型(AT/PS2)
- ch：最大柱面号的低8位
- cl: cl[5:0]代表每磁道最大扇区数， cl[7：6]代表最大柱面号高2位
- dh:最大磁头数 
- dl:驱动器数量
- es:di：软驱磁盘参数表

在调用完0x13中断获取完磁盘参数后，首先对```ch```进行置零，因为```ch```中存放的是最大柱面，而我们下面要去获取扇区数，因此避免其干扰。

这下面使用```mov	sectors,cx```将最大扇区数存在了sectors中。

最后由于中断返回值修改了```es```，因此需要进行恢复。

```x86asm
mov	ax,#INITSEG
mov	es,ax
```

下面是bootsect.s的第92-102行，主要使用BIOS中断```0x10```向终端中打印信息。

```x86asm
! Print some inane message

	mov	ah,#0x03		! read cursor pos
	xor	bh,bh
	int	0x10
	
	mov	cx,#24
	mov	bx,#0x0007		! page 0, attribute 7 (normal)
	mov	bp,#msg1
	mov	ax,#0x1301		! write string, move cursor
	int	0x10
```

```0x10```中断号有多个功能,具体含义如下：
- 1.读光标位置，```ah=0x03```
	
  输入：
  - bh = 页号
	
  输出：
  - ch = 扫描开始线
  - cl = 扫描结束线
  - dh = 行号
  - dl = 列号

- 2.打印字符串：```ah=0x013```
  
  输入：
  - al = 放置光标的方式和规定属性
  - es:bp 字符串位置
  - cx = 显示的字符串字符数
  - bh = 显示页面号
  - bl = 字符属性
  - dh = 行号
  - dl = 列号

首先读取了目前光标所在的位置，存储在了```dx```中。

```x86asm
	mov	ah,#0x03		! read cursor pos
	xor	bh,bh
	int	0x10
```

接着指定了要显示的字符串的长度为24， 页面号为0，字符属性为7，要显示的字符位置是```0x9000:msg```, 即```\r\nLoading system ...\r\n\r\n```,放置光标的方式和规定属性为0x1。

```x86asm
	mov	cx,#24
	mov	bx,#0x0007		! page 0, attribute 7 (normal)
	mov	bp,#msg1
	mov	ax,#0x1301		! write string, move cursor
	int	0x10
```

### step3：加载system模块到```0x1000:0x0000```处

接下来，要继续读system模块到内存中。 

下面是bootsect.s的104-110行：

```x86asm
! ok, we've written the message, now
! we want to load the system (at 0x10000)

	mov	ax,#SYSSEG
	mov	es,ax		! segment of 0x010000
	call	read_it
	call	kill_motor
```

这里实际会设置```ax=0x1000```, ```es = 0x1000```，进而会调用```read_it```方法，稍后我们会详细理解```read_it```方法，这里我们先有个概念，```read_it```实际上作用就是将system模块存放在```0x1000:0x0000```处。

```read_it```位于bootsect.s的第151行。

首先看151-155行。

```x86asm
read_it:
	mov ax,es
	test ax,#0x0fff
die:	jne die			! es must be at 64kB boundary
	xor bx,bx		! bx is starting address within segment
```

```test```指令执行AND运算，当AND运算的结果为零时，```test```设置零标志```ZF=1```。

而这里```0x1000 & 0x0fff = 0x0000```,因此```ZF```会被设置。```jne```跳转的条件是```ZF == 0```，因此不会进行跳转。这里的作用主要是用来检查```es```的值要在````64KB```的边界处。

除此以外```xor bx，bx```将```bx```的寄存器设置为0。

接下来是第156-160行

```x86asm
rp_read:
	mov ax,es
	cmp ax,#ENDSEG		! have we loaded all yet?
	jb ok1_read
	ret
```

```rp_read```的实际是逐磁道读取磁盘中system模块的过程。如下图所示共两个磁道，两个磁头，每磁道八个扇区，读取顺序如下所示，首先读取0磁头0磁道，然后读取1磁头0磁道，接着读取0磁头1磁道，最后读取1磁头1磁道。

![rp_read](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/bootsect/boot_ok_read.png)

```rp_read```首先判断是否已经读入了所有的数据(system模块)。比较```ax```和```ENDSEG```的值，如果不相等，则需要继续读取，于是跳转到```ok1_read```中执行。

```ok1_read```位于161-172行：

```x86asm
ok1_read:
	seg cs
	mov ax,sectors
	sub ax,sread
	mov cx,ax
	shl cx,#9
	add cx,bx
	jnc ok2_read
	je ok2_read
	xor ax,ax
	sub ax,bx
	shr ax,#9
```

```ok1_read```主要计算了当前磁道上还有多少扇区没有读取完，并将当期磁道上还剩下的扇区数存在了```ax```中， 将下一次读磁盘读到的字节数存到了```cx```中。

下面这几句便是计算的过程：

```x86asm
	mov ax,sectors
	sub ax,sread          ！当前磁道还有多少扇区没有读，下面调用read_track的时候会使用到该参数
	mov cx,ax
	shl cx,#9             ！计算这一次读会读多少字节
```

接下来进行判断，读到的数据是否超过了64KB。如果没有超过，则会跳转到```ok2_read```执行。

```x86asm
	add cx,bx             ！计算是否会超过64KB，64KB = 65536 = 1_00000000_00000000
	jnc ok2_read
	je ok2_read
```

ok2_read/ok3_read/ok4_read位于173-196行。

ok2_read实际的作用就是将**当前磁道上的所有扇区全部读完**。更具体的，就是读取开始扇区```cl```和需读扇区数```al```的数据到```es:bx```开始处。

```x86asm
ok2_read:
                          ! ax 先前已经设置
	call read_track
	mov cx,ax             ！cx = ax，本次读取的扇区数
	add ax,sread          ！当前磁道上已经读取的扇区数
	seg cs
	cmp ax,sectors        ！如果当前磁道上还有扇区未读，则跳转到ok3_read。
	jne ok3_read
	mov ax,#1             ！
	sub ax,head           ！判断当前磁头号
	jne ok4_read          ！如果是0磁头，则再去读1磁头上的扇区数据。如果是1磁头
	inc track             ！否则读取下一个磁道
ok4_read:
	mov	%ax, head         !保存当前的磁头号
	xor	%ax, %ax          !清除已读扇区数
ok3_read:
	mov	%ax, sread        !保存当前扇区已读扇区数
	shl	$9, %cx
	add	%cx, %bx
	jnc	rp_read           ！已经读取了64KB数据，调整当前段，为读取下一段数据做准备。
	mov	%es, %ax
	add	$0x1000, %ax      !刚开始是0x1000，读完64Kb之后，调整为0x2000，0x3000，最终到0x4000结束。
	mov	%ax, %es
	xor	%bx, %bx
	jmp	rp_read
```


```ok2_read```的第一句话是调用了```read_track```方法：

```x86asm
call read_track
```

```read_track```的作用是读取当前磁道上的扇面到```es:bx```处。

```x86asm
read_track:
	push ax            !保存ax,bx,cx,dx寄存器
	push bx            
	push cx            
	push dx
	mov dx,track       !获取当前的磁道号
	mov cx,sread       !获取当前磁道上的已读扇区数
	inc cx             !cl = 开始读的扇区号
	mov ch,dl          !ch = 当前磁道号
	mov dx,head        !dx = 当前磁头号， 目前磁头号还在dl中，后面会挪动到dh中。
	mov dh,dl          !将磁头号从dl挪动到dh中
	mov dl,#0          !dl = 驱动器号
	and dx,#0x0100     !将dx与0x0100进行按位与，实际就是使得磁头号小于等于1。
	mov ah,#2          !ah = 2，读磁盘扇区的功能号
	int 0x13           !0x13号中断， 读取磁盘数据。
	jc bad_rt          !如果出错，则跳转运行bad_rt
	pop dx             !恢复dx,cx,bx,ax寄存器
	pop cx
	pop bx
	pop ax
	ret
```

```read_track```之后，会统计一些数据，看本磁道上的扇区是否全部读完，如果没有读完，则跳转到```ok3_read```进行再次读取。

```x86asm
	mov cx,ax             ！cx = ax，本次读取的扇区数
	add ax,sread          ！当前磁道上已经读取的扇区数
	seg cs
	cmp ax,sectors        ！如果当前磁道上还有扇区未读，则跳转到ok3_read。
	jne ok3_read
```

如果已经读完，则调整磁头和磁道，继续读取。这里指定了磁盘读取的顺序。

```x86asm
	mov ax,#1             ！
	sub ax,head           ！判断当前磁头号
	jne ok4_read          ！如果是0磁头，则再去读1磁头上的扇区数据。如果是1磁头
	inc track             ！否则读取下一个磁道
ok4_read:
	mov head,ax
	xor ax,ax
```

需要分情况进行讨论：
- 如果当前是0磁头0磁道，即```head=0```， ```track=0```则```ax = 1```，```sub ax, head```之后，```ax = 1```， 由于相减不等于0，因此```ZF = 0```，```jne```会进行跳转， 于是```head=1```。
- 如果当前是1磁头0磁道，即```head=1```， ```track=0```则```ax = 0```，```sub ax, head```之后，```ax = 0```， 由于相减等于0，因此```ZF = 1```，```jne```不会进行跳转， 于是```head=0```，```track=1```。
- 如果当前是0磁头1磁道，即```head=0```， ```track=1```则```ax = 1```，```sub ax, head```之后，```ax = 1```， 由于相减不等于0，因此```ZF = 0```，```jne```会进行跳转， 于是```head=1```。

总结起来读取顺序是首先读取0磁头0磁道，然后读取1磁头0磁道，接着读取0磁头1磁道，最后读取1磁头1磁道。

读到这里应该对整个读取的过程有了一个概念，整个过程的流程如下所示：

![read_disk](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/bootsect/read_disk.png)


看到这里，我们再回到调用```read_it```的地方, 我们看看当读取完system模块之后，还会做些什么操作。

```x86asm
	mov	ax,#SYSSEG
	mov	es,ax		! segment of 0x010000
	call	read_it
	call	kill_motor
! After that we check which root-device to use. If the device is
! defined (!= 0), nothing is done and the given device is used.
! Otherwise, either /dev/PS0 (2,28) or /dev/at0 (2,8), depending
! on the number of sectors that the BIOS reports currently.

	seg cs
	mov	ax,root_dev
	cmp	ax,#0
	jne	root_defined
	seg cs
	mov	bx,sectors
	mov	ax,#0x0208		! /dev/ps0 - 1.2Mb
	cmp	bx,#15
	je	root_defined
	mov	ax,#0x021c		! /dev/PS0 - 1.44Mb
	cmp	bx,#18
	je	root_defined
undef_root:
	jmp undef_root
root_defined:
	seg cs
	mov	root_dev,ax

! after that (everyting loaded), we jump to
! the setup-routine loaded directly after
! the bootblock:

	jmpi	0,SETUPSEG
```

这里首先判断了```root_dev```是否进行了定义。如果定义了，则跳转到```root_defined```执行。

0x0306

```x86asm
	seg cs
	mov	ax,root_dev
	cmp	ax,#0
	jne	root_defined
```

这里需要补充一下Linux-0.11对于设备号的定义：

$$设备号 = 主设备号 * 256 + 次设备号$$

主设备号： 1-内存，2-磁盘，3-硬盘， 4-ttyx，5-tty，6-并行口，7非命名管道

|主设备号|设备名|含义|
|--|--|--|
|0x300|/dev/hd0|代表第1块硬盘|
|0x301|/dev/hd1|代表第1块硬盘的第1个分区|
|0x302|/dev/hd2|代表第1块硬盘的第2个分区|
|0x303|/dev/hd3|代表第1块硬盘的第3个分区|
|0x304|/dev/hd4|代表第1块硬盘的第4个分区|
|0x305|/dev/hd5|代表第2块硬盘|
|0x306|/dev/hd6|代表第2块硬盘的第1个分区|
|0x307|/dev/hd7|代表第2块硬盘的第2个分区|
|0x308|/dev/hd8|代表第2块硬盘的第3个分区|
|0x309|/dev/hd9|代表第2块硬盘的第4个分区|

在Linux-0.11中，这里的```ROOT_DEV```定义为```0x306```,因为当年linus是在第2块硬盘上的安装的文件系统。在编译内核时，可以根据自己的环境修改该参数。

假设没有定义```ROOT_DEV```，就需要根据BIOS的每磁道扇区数来决定是使用/dev/PS0(0x0208)还是/dev/at0(0x021c)。

```x86asm
	seg cs
	mov	bx,sectors
	mov	ax,#0x0208		! /dev/ps0 - 1.2Mb
	cmp	bx,#15
	je	root_defined
	mov	ax,#0x021c		! /dev/PS0 - 1.44Mb
	cmp	bx,#18
	je	root_defined
```

程序的最后，因为所有的需要加载的内容都加载完了，于是执行```jmpi	0,SETUPSEG```跳转到了setup.s中进行执行。

文章的最后，我们通过一张图回顾一下bootsect.s所做的一些事情：

![bootsect-overview](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/bootsect/bootsect-overview.png)


文中如有表达不正确之处，欢迎大家与我交流，微信号codebuilding。

![wechat](https://github.com/zgjsxx/static-img-repo/raw/main/blog/personal/wechat.jpg)

-----


## 参考文章

https://github.com/Wangzhike/HIT-Linux-0.11/blob/master/1-boot/OS-booting.md
