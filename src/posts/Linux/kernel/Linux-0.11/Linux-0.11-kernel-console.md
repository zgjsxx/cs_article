---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

- [Linux-0.11 kernel目录console.c详解](#linux-011-kernel目录consolec详解)
  - [模块简介](#模块简介)
  - [函数详解](#函数详解)
    - [gotoxy](#gotoxy)
    - [con\_write](#con_write)
    - [con\_init](#con_init)


# Linux-0.11 kernel目录console.c详解

## 模块简介

## 函数详解

### gotoxy

```c
static inline void gotoxy(unsigned int new_x,unsigned int new_y)
```

该方法的作用是更新光标位置(x,y)，并修正光标在显示内存中的对应位置pos。

首先检查参数的有效性。如果给定的光标列号超出了显示器列数，或者光标行号不低于显示的最大行数，则退出。

```c
	if (new_x > video_num_columns || new_y >= video_num_lines)
		return;
```

如果参数是有效的，则进行更新。

```c
	x=new_x;
	y=new_y;
	pos=origin + y*video_size_row + (x<<1);     // 1列用2个字节表示，x<<1.
```

### con_write

```c
void con_write(struct tty_struct * tty)
```

控制台写的程序。

首先获取写缓冲队列的现有字符数nr。然后对队列中的每个字符进行处理。在处理每个字符的循环过程中，首先在写队列中取一个字符c，根据前面处理字符所设置的状态state分步骤进行处理。

```c
	int nr;
	char c;

	nr = CHARS(tty->write_q);
	while (nr--) {
		GETCH(tty->write_q,c);
		switch(state) {
```

state的状态机如下图所示：

![state状态变化](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/Linux-0.11/Linux-0.11-kernel/console/console.png)

如果状态是0：

```c
    case 0:
        if (c>31 && c<127) {
            if (x>=video_num_columns) {
                x -= video_num_columns;
                pos -= video_size_row;
                lf();
            }
            __asm__("movb attr,%%ah\n\t"
                "movw %%ax,%1\n\t"
                ::"a" (c),"m" (*(short *)pos)
                );
            pos += 2;
            x++;
        } else if (c==27)
            state=1;
        else if (c==10 || c==11 || c==12)
            lf();
        else if (c==13)
            cr();
        else if (c==ERASE_CHAR(tty))
            del();
        else if (c==8) {
            if (x) {
                x--;
                pos -= 2;
            }
        } else if (c==9) {
            c=8-(x&7);
            x += c;
            pos += c<<1;
            if (x>video_num_columns) {
                x -= video_num_columns;
                pos -= video_size_row;
                lf();
            }
            c=9;
        } else if (c==7)
            sysbeep();
        break;
```

如果状态是1：

```c
    case 1:
        state=0;
        if (c=='[')
            state=2;
        else if (c=='E')
            gotoxy(0,y+1);
        else if (c=='M')
            ri();
        else if (c=='D')
            lf();
        else if (c=='Z')
            respond(tty);
        else if (x=='7')
            save_cur();
        else if (x=='8')
            restore_cur();
        break;
```

如果状态是3：

```c
    case 3:
        if (c==';' && npar<NPAR-1) {
            npar++;
            break;
        } else if (c>='0' && c<='9') {
            par[npar]=10*par[npar]+c-'0';
            break;
        } else state=4;
```

如果状态是4：

```c
    case 4:
        state=0;
        switch(c) {
            case 'G': case '`':
                if (par[0]) par[0]--;
                gotoxy(par[0],y);
                break;
            case 'A':
                if (!par[0]) par[0]++;
                gotoxy(x,y-par[0]);
                break;
            case 'B': case 'e':
                if (!par[0]) par[0]++;
                gotoxy(x,y+par[0]);
                break;
            case 'C': case 'a':
                if (!par[0]) par[0]++;
                gotoxy(x+par[0],y);
                break;
            case 'D':
                if (!par[0]) par[0]++;
                gotoxy(x-par[0],y);
                break;
            case 'E':
                if (!par[0]) par[0]++;
                gotoxy(0,y+par[0]);
                break;
            case 'F':
                if (!par[0]) par[0]++;
                gotoxy(0,y-par[0]);
                break;
            case 'd':
                if (par[0]) par[0]--;
                gotoxy(x,par[0]);
                break;
            case 'H': case 'f':
                if (par[0]) par[0]--;
                if (par[1]) par[1]--;
                gotoxy(par[1],par[0]);
                break;
            case 'J':
                csi_J(par[0]);
                break;
            case 'K':
                csi_K(par[0]);
                break;
            case 'L':
                csi_L(par[0]);
                break;
            case 'M':
                csi_M(par[0]);
                break;
            case 'P':
                csi_P(par[0]);
                break;
            case '@':
                csi_at(par[0]);
                break;
            case 'm':
                csi_m();
                break;
            case 'r':
                if (par[0]) par[0]--;
                if (!par[1]) par[1] = video_num_lines;
                if (par[0] < par[1] &&
                    par[1] <= video_num_lines) {
                    top=par[0];
                    bottom=par[1];
                }
                break;
            case 's':
                save_cur();
                break;
            case 'u':
                restore_cur();
                break;
        }
```



### con_init

```c
void con_init(void)
```

该方法用于初始化控制台程序。

```c
    // 寄存器变量a为了高效的访问和操作。
    // 若想指定存放的寄存器(如eax),则可以写成：
    // register unsigned char a asm("ax");。
	register unsigned char a;
	char *display_desc = "????";
	char *display_ptr;
```

首先根据setup.s程序取得系统硬件参数初始化几个本函数专用的静态全局变量。  

```c
	video_num_columns = ORIG_VIDEO_COLS;    // 显示器显示字符列数
	video_size_row = video_num_columns * 2; // 每行字符需要使用的字节数
	video_num_lines = ORIG_VIDEO_LINES;     // 显示器显示字符行数
	video_page = ORIG_VIDEO_PAGE;           // 当前显示页面
	video_erase_char = 0x0720;              // 擦除字符(0x20是字符，0x07属性)
```

根据显示模式是单色还是彩色分别设置所使用的显示内存起始位置以及显示寄存器索引端口号和显示寄存器数据端口号。

```c
	if (ORIG_VIDEO_MODE == 7)			// 是否是单色显示器
	{
		video_mem_start = 0xb0000;      // 设置单显映象内存起始地址
		video_port_reg = 0x3b4;         // 设置单显索引寄存器端口
		video_port_val = 0x3b5;         // 设置单显数据寄存器端口
        // 接着我们根据BIOS中断int 0x10 功能0x12获得的显示模式信息，判断显示卡是
        // 单色显示卡还是彩色显示卡。若使用上述中断功能所得到的BX寄存器返回值不等于
        // 0x10，则说明是EGA卡。因此初始显示类型为EGA单色。虽然EGA卡上有较多显示内存，
        // 但在单色方式下最多只能利用地址范围在 0xb0000-0xb8000 之间的显示内存。
        // 然后置显示器描述字符串为 'EGAm'. 并会在系统初始化期间显示器描述字符串将
        // 显示在屏幕的右上角。
        // 注意，这里使用了 bx 在调用中断 int 0x10 前后是否被改变的方法来判断卡的类型。
        // 若BL在中断调用后值被改变，表示显示卡支持 Ah=12h 功能调用，是EGA或后推出来的
        // VGA等类型的显示卡。若中断调用返回值未变，表示显示卡不支持这个功能，则说明
        // 是一般单色显示卡。
		if ((ORIG_VIDEO_EGA_BX & 0xff) != 0x10)
		{
			video_type = VIDEO_TYPE_EGAM;       // 设置显示类型(EGA单色)
			video_mem_end = 0xb8000;            // 设置显示内存末端地址
			display_desc = "EGAm";              // 设置显示描述字符串
		}
		else    
		{
            // 如果 BX 寄存器的值等于 0x10，则说明是单色显示卡MDA。 03h = 256k
			video_type = VIDEO_TYPE_MDA;        // 设置显示类型(MDA单色)
			video_mem_end	= 0xb2000;          // 设置显示内存末端地址
			display_desc = "*MDA";              // 设置显示描述字符串
		}
	}
    // 如果显示模式不为7，说明是彩色显示卡。此时文本方式下所用的显示内存起始地址为0xb8000；
    // 显示控制索引寄存器端口地址为 0x3d4；数据寄存器端口地址为 0x3d5。
	else								/* If not, it is color. */
	{
		video_mem_start = 0xb8000;              // 显示内存起始地址
		video_port_reg	= 0x3d4;                // 设置彩色显示索引寄存器端口
		video_port_val	= 0x3d5;                // 设置彩色显示数据寄存器端口
        // 再判断显示卡类别。如果 BX 不等于 0x10，则说明是EGA/VGA 显示卡。此时实际上我们
        // 可以使用32KB显示内存(0xb8000 -- 0xc0000),但该程序只使用了其中16KB显示内存。
		if ((ORIG_VIDEO_EGA_BX & 0xff) != 0x10)
		{
			video_type = VIDEO_TYPE_EGAC;       // 设置显示类型(EGA彩色)
			video_mem_end = 0xbc000;            // 设置显示内存末端地址
			display_desc = "EGAc";              // 设置显示描述字符串
		}
		else    // 如果 BX 寄存器的值等于 0x10,则说明是CGA显示卡，只使用8KB显示内存
		{
			video_type = VIDEO_TYPE_CGA;        // 设置显示类型(CGA彩色)
			video_mem_end = 0xba000;            // 设置显示内存末端地址
			display_desc = "*CGA";              // 设置显示描述字符串
		}
	}
```

最后允许键盘中断。

```c
    // 然后我们在屏幕的右上角显示描述字符串。采用的方法是直接将字符串写到显示内存
    // 相应位置处。首先将显示指针display_ptr 指到屏幕第1行右端差4个字符处(每个字符
    // 需2个字节，因此减8)，然后循环复制字符串的字符，并且每复制1个字符都空开1个属性字节。
	display_ptr = ((char *)video_mem_start) + video_size_row - 8;
	while (*display_desc)
	{
		*display_ptr++ = *display_desc++;
		display_ptr++;                      // 空开属性字节
	}
	
	/* Initialize the variables used for scrolling (mostly EGA/VGA)	*/
	
	origin	= video_mem_start;              // 滚屏起始显示内存地址
	scr_end	= video_mem_start + video_num_lines * video_size_row;   // 结束地址
	top	= 0;                                // 最顶行号
	bottom	= video_num_lines;              // 最底行号

    // 最后初始化当前光标所在位置和光标对应的内存位置pos，并设置键盘中断0x21陷阱门
    // 描述符，&keyboard_interrupt是键盘中断处理过程地址。取消8259A中对键盘中断的
    // 屏蔽，允许响应键盘发出的IRQ1请求信号。最后复位键盘控制器以允许键盘开始正常工作。
	gotoxy(ORIG_X,ORIG_Y);
	set_trap_gate(0x21,&keyboard_interrupt);
	outb_p(inb_p(0x21)&0xfd,0x21);          // 取消对键盘中断的屏蔽，允许IRQ1。
	a=inb_p(0x61);                          // 读取键盘端口0x61(8255A端口PB)
	outb_p(a|0x80,0x61);                    // 设置禁止键盘工作（位7置位）
	outb(a,0x61);                           // 再允许键盘工作，用以复位键盘
```