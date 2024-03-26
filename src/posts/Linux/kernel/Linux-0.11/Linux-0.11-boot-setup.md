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

最后，我们梳理一下，这个步骤结束之后，内存的位置信息：

|内存地址|长度(字节)|名称|描述|
|--|--|--|--|
|0x90000|2|光标位置|列号， 行号|
|0x90002|2|扩展内存数|系统从1MB开始的扩展内存数值|
|0x90004|2|显示页面|当前显示页面|
|0x90006|1|显示模式||
|0x90007|1|字符列数||
|0x90008|2|??||
|0x9000A|1|显示内存|显示内存(0x00-64k, 0x01-128k,0x02-192k, 0x03-256k)|
|0x9000B|1|显示状态|0x00-彩色，I/O=0x3dX; 0x01-单色， I/O=0x3bx|
|0x9000C|2|特性参数|显示卡特性参数|
|...||||
|0x90080|16|硬盘参数表|第1个硬盘的参数表|
|0x90090|16|硬盘参数表|第2个硬盘的参数表|
|0x901FC|2|根设备号|根文件系统所在的设备号(bootsect.s设置)|

### step2：重新搬运system的位置

下面是setup.s的的110-125行，其作用是给system模块移动位置。

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

第一次进入这里时```ax = 0```， 因此```es = 0```，接着```ax```加上了```0x1000```，结果为```0x1000```, 将```ax```与````0x9000```比较，判断是否全部移动。因为system模块存储在```0x10000-0x90000```,因此```cmp	ax,#0x9000```可以作为循环终止条件。

下面的代码则是为```rep movsw```构建循环的条件，```movsw```的作用是从```DS:(E)SI```拷贝一个字到```ES:（E)DI```，将```di```和```si```设置为0，```ds```设置为```0x1000```，```es```设置为```0x0```，循环次数为0x8000次。

这里最终的效果就是按照每64kb为一个移动单元将system模块搬运到0x0出的位置。

```x86asm
	mov	ds,ax		! source segment
	sub	di,di
	sub	si,si
	mov 	cx,#0x8000
```

### step3：设置IDT和GDT

因为将system模块搬运到了物理地址为```0x0```处，这里原来是BIOS中断存放的位置，因此这个搬运操作实际上覆盖了BIOS中断，因此我们需要重新设置。

接下来，将加载gdt和idt的寄存器。

```x86asm
end_move:
	mov	ax,#SETUPSEG	! right, forgot this at first. didn't work :-)
	mov	ds,ax
	lidt	idt_48		! load idt with 0,0
	lgdt	gdt_48		! load gdt with whatever appropriate
```

idt_48和gdt_48的值定义在下面：

```x86asm
idt_48:
	.word	0			! idt limit=0
	.word	0,0			! idt base=0L

gdt_48:
	.word	0x800		! gdt limit=2048, 256 GDT entries
	.word	512+gdt,0x9	! gdt base = 0X9xxxx
```

### step4：打开A20地址线

下面这里是开启A20地址线。

后面涉及了对于中断芯片8259a的编程，这个过程参考附录1。

```x86asm
	call	empty_8042
	mov	al,#0xD1		! command write
	out	#0x64,al
	call	empty_8042
	mov	al,#0xDF		! A20 on
	out	#0x60,al
	call	empty_8042

! well, that went ok, I hope. Now we have to reprogram the interrupts :-(
! we put them right after the intel-reserved hardware interrupts, at
! int 0x20-0x2F. There they won't mess up anything. Sadly IBM really
! messed this up with the original PC, and they haven't been able to
! rectify it afterwards. Thus the bios puts interrupts at 0x08-0x0f,
! which is used for the internal hardware interrupts as well. We just
! have to reprogram the 8259's, and it isn't fun.

	mov	al,#0x11		! initialization sequence
	out	#0x20,al		! send it to 8259A-1
	.word	0x00eb,0x00eb		! jmp $+2, jmp $+2
	out	#0xA0,al		! and to 8259A-2
	.word	0x00eb,0x00eb
	mov	al,#0x20		! start of hardware int's (0x20)
	out	#0x21,al
	.word	0x00eb,0x00eb
	mov	al,#0x28		! start of hardware int's 2 (0x28)
	out	#0xA1,al
	.word	0x00eb,0x00eb
	mov	al,#0x04		! 8259-1 is master
	out	#0x21,al
	.word	0x00eb,0x00eb
	mov	al,#0x02		! 8259-2 is slave
	out	#0xA1,al
	.word	0x00eb,0x00eb
	mov	al,#0x01		! 8086 mode for both
	out	#0x21,al
	.word	0x00eb,0x00eb
	out	#0xA1,al
	.word	0x00eb,0x00eb
	mov	al,#0xFF		! mask off all interrupts for now
	out	#0x21,al
	.word	0x00eb,0x00eb
	out	#0xA1,al
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
	mov	ax,#0x0001	! protected mode (PE) bit
	lmsw	ax		! This is it!
	jmpi	0,8		! jmp offset 0 of segment 8 (cs)
```


文中如有表达不正确之处，欢迎大家与我交流，微信号codebuilding。

![](https://github.com/zgjsxx/static-img-repo/raw/main/blog/personal/wechat.jpg)


## 附录 

### 1.8259工作方式

8259的命令字分为两部分：初始化命令字（ICW = initial command words）和操作命令字(OCW = operate command words)

A0 = 0， 操作端口为0x20和0xA0。

ICW1的格式如下

<table>
    <tr>
        <th>位</th><th>名称</th><th>含义</th>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>7</mn></msub></math></td><td>A7</td><td rowspan = "3">A7-A5表示在MCS80/85中用于中断服务过程的页面起始地址。与ICW2中的A15-A8共同组成。这几位对于8086/88处理器无用。</td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>6</mn></msub></math></td><td>A6</td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>5</mn></msub></math></td><td>A5</td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>4</mn></msub></math></td><td>1</td><td>恒为1</td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>3</mn></msub></math></td><td>LTIM</td><td>1-电平触发中断方式；0-边沿触发方式</td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>2</mn></msub></math></td><td>0</td>ADI<td>MCS80/85系统用于CALL指令地址间隔。对于8086/88处理器无用</td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>1</mn></msub></math></td><td>SNGL</td><td>1-单片8259A；0-多片级联  </td>
    </tr>
    <tr>
        <td><math><msub><mi>D</mi><mn>0</mn></msub></math></td><td>IC4</td><td>1-需要ICW4； 0-不需要</td>
    </tr>
</table>

在Linux系统中ICW1被设置为0x11，表示中断请求是边沿触发、多篇8259A级联，并且最后需要发送到ICW4。

![ICW1](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-boot/setup/ICW1.png)


ICW2主要设置了中断号的取值范围。其设置芯片送出的中断号的高5位。当A0 = 1时表示对ICW2进行设置

A0 = 1， 操作端口为0x21和0xA1。

ICW2的格式如下：


Linux 0.11系统把主片的ICW2设置为0x20，表示主片中断请求的0级-7级对应的中断号范围是0x20-0x27。 而从片的ICW2被设置为0x28，表示从片的中断请求8级-15级对应的中断号范围是0x28-0x2f。


ICW3指定了主从8259芯片的连接关系。

A0 = 1， 操作端口为0x21和0xA1。

ICW3格式：

Linux 0.11内核将8259A主片的ICW3设置为0x04，即s2 = 1，其余各位为0。

ICW4：

|位|名称|含义|
|${D}_{7}$|0|恒为0|
|${D}_{6}$|0|恒为0|
|${D}_{5}$|0|恒为0|
|${D}_{4}$|SFNM|1-选择特殊全嵌套方式 0-普通全嵌套方式|
|${D}_{3}$|BUF|恒为0|1-缓冲方式 0-缓冲方式下从片|
|${D}_{2}$|M/S|1-缓冲方式下主片； 0-缓冲方式下从片|
|${D}_{1}$|AEOI|1-自动结束中断方式；0-非自动结束方式|
|${D}_{0}$|uPM|1-8086/88处理器系统； 0-MCS80/85系统|


https://blog.csdn.net/weixin_42214698/article/details/125036960