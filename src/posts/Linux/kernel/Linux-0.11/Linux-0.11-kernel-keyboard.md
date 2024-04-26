---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录keyboard.S详解](#linux-011-kernel目录keyboards详解)
	- [模块简介](#模块简介)
	- [方法详解](#方法详解)
		- [keyboard\_interrupt:](#keyboard_interrupt)
		- [do\_self](#do_self)
	- [参考文章](#参考文章)

# Linux-0.11 kernel目录keyboard.S详解

## 模块简介

该键盘驱动汇编程序主要包括键盘中断处理程序。

该程序首先根据键盘特殊键(例如Alt，Shift, Ctrl, Caps键)的状态设置程序后面要用到的状态标志变量mode的值。然后根据引起键盘中断的按键扫描码，调用已经编排成跳转表的相应扫描码处理子程序，把扫描码对应的字符放入读字符队列(```read_q```)中。接下来调用c处理函数```do_tty_interrupt```,该函数仅包含一个对行规程函数```copy_to_cooked```的调用。

这个行规程函数的主要作用就是把```read_q```读缓冲队列中的字符经过适当处理后放入规范模式队列(```secondary```)，并且在处理过程中，若相应终端设备设置了回显标志，还会把字符直接放入写队列```write_q```中，从而终端屏幕上会显示出刚刚键入的字符。

程序中使用mode表示特殊键的按下状态标志：

```x86asm
mode:	.byte 0		/* caps, alt, ctrl and shift mode */
```

|比特位|含义|
|--|--|
|7|caps键被按下|
|6|caps键的状态|
|5|右alt键按下|
|4|左alt键按下|
|3|右ctrl按下|
|2|左ctrl按下|
|1|右shift键按下|
|0|左shift键按下|

使用```leds```来表示键盘指示灯的状态标志。

```x86asm
leds:	.byte 2		/* num-lock, caps, scroll-lock mode (nom-lock on) */
```

|比特位|含义|
|--|--|
|2|caps-lock|
|1|num-lock 初始置1|
|0|scroll-lock|

对于AT键盘的扫描码，当键被按下时，则键的扫描码被送出，当键松开时，将会发送两个字节，第一个是0xf0，第2个还是按下时的扫描码。为了向下的兼容性，设计人员将AT键盘发出的扫描码转成了老式的PC/XT标准键盘的扫描码。因此ketboard.S中仅对PC/XT的扫描码进行了处理。

PC/XT标准键盘的样子是这样的，和现在大家使用的键盘的格局不太一样。

![IBM_Model_F_XT_kbd](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/keyboard/IBM_Model_F_XT_kbd.jpg)

其扫描码如下所示:

![scan-code.png](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/keyboard/scan-code.png)


## 方法详解

### keyboard_interrupt:

当键盘控制器接收到用户的一个按键操作时，就会向中断控制器发出一个键盘中断请求信号IRQ1。当CPU响应该请求时就会执行键盘中断处理程序。

该程序首先会从```0x60```端口读取当前按键的扫描码，判断是否是```0xe0```或者```0xe1```。如果是，则立即对键盘控制器做出应答，并向中断控制器发送终端结束EOI信号，以允许键盘控制器能继续产生中断信号。

程序的开始和其他中断处理函数类似，是一段保存寄存器上下文的操作。

```x86asm
	pushl %eax
	pushl %ebx
	pushl %ecx
	pushl %edx
	push %ds
	push %es
	movl $0x10,%eax
	mov %ax,%ds
	mov %ax,%es
```

接下来将键盘扫描码读取到```al```中，判断其是否是```0xe0```还是```0xe1```。

如果扫描码是``` 0xe0``` 或者 ```0xe1```，那说明这个键的扫描码是有多个字节的，需要先保存下来等待接下来的扫描码组合成完整的扫描码。 

若是```0xe0```，则跳转到```set_e0```处执行,若是```0xe1```，则跳转到```set_e1```处执行。

```x86asm
	xor %al,%al		/* %eax is scan code */
	inb $0x60,%al
	cmpb $0xe0,%al
	je set_e0
	cmpb $0xe1,%al
	je set_e1
```

接下来，如果是```0xe0```，则设置```e0 = 0```，如果是```0xe1```，则设置```e0 = 1```。

```e0_e1```处的代码针对使用8255A的PC标准键盘电路进行硬件复位处理。端口0x61是8255A输出口B的地址，该输出端口的第7为用于禁止和允许对键盘数据的处理。处理扫描码的过程很简单，就是先禁止键盘，然后立即重新允许键盘。

```x86asm
e0_e1:	inb $0x61,%al
	jmp 1f
1:	jmp 1f
1:	orb $0x80,%al
	jmp 1f
1:	jmp 1f
1:	outb %al,$0x61
	jmp 1f
1:	jmp 1f
1:	andb $0x7F,%al
	outb %al,$0x61
	movb $0x20,%al
	outb %al,$0x20
	pushl $0
	call do_tty_interrupt
	addl $4,%esp
	pop %es
	pop %ds
	popl %edx
	popl %ecx
	popl %ebx
	popl %eax
	iret
set_e0:	movb $1,e0
	jmp e0_e1
set_e1:	movb $2,e0
	jmp e0_e1
```

如果收到的不是扫描码，则调用响应按键的处理程序。

```x86asm
	je set_e1
	call key_table(,%eax,4)
	movb $0,e0
```

```key_table```的定义如下：

```c
key_table:
	.long none,do_self,do_self,do_self	/* 00-03 s0 esc 1 2 */
	.long do_self,do_self,do_self,do_self	/* 04-07 3 4 5 6 */
	.long do_self,do_self,do_self,do_self	/* 08-0B 7 8 9 0 */
	.long do_self,do_self,do_self,do_self	/* 0C-0F + ' bs tab */
	.long do_self,do_self,do_self,do_self	/* 10-13 q w e r */
	.long do_self,do_self,do_self,do_self	/* 14-17 t y u i */
	.long do_self,do_self,do_self,do_self	/* 18-1B o p } ^ */
	.long do_self,ctrl,do_self,do_self	/* 1C-1F enter ctrl a s */
	.long do_self,do_self,do_self,do_self	/* 20-23 d f g h */
	.long do_self,do_self,do_self,do_self	/* 24-27 j k l | */
	.long do_self,do_self,lshift,do_self	/* 28-2B { para lshift , */
	.long do_self,do_self,do_self,do_self	/* 2C-2F z x c v */
	.long do_self,do_self,do_self,do_self	/* 30-33 b n m , */
	.long do_self,minus,rshift,do_self	/* 34-37 . - rshift * */
	.long alt,do_self,caps,func		/* 38-3B alt sp caps f1 */
	.long func,func,func,func		/* 3C-3F f2 f3 f4 f5 */
	.long func,func,func,func		/* 40-43 f6 f7 f8 f9 */
	.long func,num,scroll,cursor		/* 44-47 f10 num scr home */
	.long cursor,cursor,do_self,cursor	/* 48-4B up pgup - left */
	.long cursor,cursor,do_self,cursor	/* 4C-4F n5 right + end */
	.long cursor,cursor,cursor,cursor	/* 50-53 dn pgdn ins del */
	.long none,none,do_self,func		/* 54-57 sysreq ? < f11 */
	.long func,none,none,none		/* 58-5B f12 ? ? ? */
	.long none,none,none,none		/* 5C-5F ? ? ? ? */
	.long none,none,none,none		/* 60-63 ? ? ? ? */
	.long none,none,none,none		/* 64-67 ? ? ? ? */
	.long none,none,none,none		/* 68-6B ? ? ? ? */
	.long none,none,none,none		/* 6C-6F ? ? ? ? */
	.long none,none,none,none		/* 70-73 ? ? ? ? */
	.long none,none,none,none		/* 74-77 ? ? ? ? */
	.long none,none,none,none		/* 78-7B ? ? ? ? */
	.long none,none,none,none		/* 7C-7F ? ? ? ? */
	.long none,none,none,none		/* 80-83 ? br br br */
	.long none,none,none,none		/* 84-87 br br br br */
	.long none,none,none,none		/* 88-8B br br br br */
	.long none,none,none,none		/* 8C-8F br br br br */
	.long none,none,none,none		/* 90-93 br br br br */
	.long none,none,none,none		/* 94-97 br br br br */
	.long none,none,none,none		/* 98-9B br br br br */
	.long none,unctrl,none,none		/* 9C-9F br unctrl br br */
	.long none,none,none,none		/* A0-A3 br br br br */
	.long none,none,none,none		/* A4-A7 br br br br */
	.long none,none,unlshift,none		/* A8-AB br br unlshift br */
	.long none,none,none,none		/* AC-AF br br br br */
	.long none,none,none,none		/* B0-B3 br br br br */
	.long none,none,unrshift,none		/* B4-B7 br br unrshift br */
	.long unalt,none,uncaps,none		/* B8-BB unalt br uncaps br */
	.long none,none,none,none		/* BC-BF br br br br */
	.long none,none,none,none		/* C0-C3 br br br br */
	.long none,none,none,none		/* C4-C7 br br br br */
	.long none,none,none,none		/* C8-CB br br br br */
	.long none,none,none,none		/* CC-CF br br br br */
	.long none,none,none,none		/* D0-D3 br br br br */
	.long none,none,none,none		/* D4-D7 br br br br */
	.long none,none,none,none		/* D8-DB br ? ? ? */
	.long none,none,none,none		/* DC-DF ? ? ? ? */
	.long none,none,none,none		/* E0-E3 e0 e1 ? ? */
	.long none,none,none,none		/* E4-E7 ? ? ? ? */
	.long none,none,none,none		/* E8-EB ? ? ? ? */
	.long none,none,none,none		/* EC-EF ? ? ? ? */
	.long none,none,none,none		/* F0-F3 ? ? ? ? */
	.long none,none,none,none		/* F4-F7 ? ? ? ? */
	.long none,none,none,none		/* F8-FB ? ? ? ? */
	.long none,none,none,none		/* FC-FF ? ? ? ? */
```


### do_self

```do_self```用于处理普通按键，即含义没有任何变化并且只有一个字符返回的键。

程序的开始，判断是否同时按下了alt键或者shift键，并取出对应的映射表。

```x86asm
do_self:
	lea alt_map,%ebx        // 取alt键同时按下时的映射表基址alt_map
	testb $0x20,mode		// 右边的alt是否同时被按下了
	jne 1f                  // 如果是，则testb $0x20 mode结果不为0，向前跳转到标号1。
	lea shift_map,%ebx      // 取shift键同时按下时的映射表shift_map
	testb $0x03,mode        // 是否shift键同时按下了
	jne 1f                  // 如果是， 向前跳转到标号1。
	lea key_map,%ebx        // 否则使用普通映射表key_map
```

接下俩根据扫描码映射表对应的ASCII字符。若没有对应字符，则返回none。

```x86asm
1:	movb (%ebx,%eax),%al    // 将扫描码作为索引值， 取出对应的ASCII码，放入al中。
	orb %al,%al             // 检测al中是否为0，如果为0， 则跳转到none。
	je none
	testb $0x4c,mode		// 如果ctrl键已经按下，或者caps键被锁定，
	je 2f
	cmpb $'a,%al            // 并且字符在0x61-0x7D范围内，则将其转成大写字符，0x41-0x5D
	jb 2f
	cmpb $'},%al
	ja 2f
	subb $32,%al          
2:	testb $0x0c,mode		// 如果ctrl被按下，并且字符在0x40- 0x5f之间，将其转换为控制字符
	je 3f
	cmpb $64,%al
	jb 3f
	cmpb $64+32,%al
	jae 3f
	subb $64,%al
3:	testb $0x10,mode		// 如果左alt键同时被按下，则将字符的位8置位。即此时生成值大于0x7f扩展字符集中的字符
	je 4f
	orb $0x80,%al
4:	andl $0xff,%eax
	xorl %ebx,%ebx
	call put_queue
none:	ret
```


## 参考文章

https://dosdays.co.uk/topics/xt_vs_at_keyboards.php