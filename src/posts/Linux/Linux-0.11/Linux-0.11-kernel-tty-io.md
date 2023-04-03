---
category:
  - Linux
tag:
  - Linux-0.11代码解读系列
---

# Linux-0.11 kernel目录tty_io.c详解


keyboard_interrupt -> call *key_table(,%eax,4) -> do_self -> put_queue -> (tty->read_q)-> do_tty_interrupt-> copy_to_cooked -> (tty->secondary) ->wake_up <- sys_read <- rw_char <- tty_read <- read <- (shell)


## tty_init
```c
void tty_init(void)
```
该函数用于初始化tty终端。

```c
rs_init();//初始化串口终端
con_init();//初始化控制台终端
```
## tty_intr
```c
void tty_intr(struct tty_struct * tty, int mask)
```
键盘中断^C(Ctrl + C)的处理函数，实际就是向前台进程组发送SIGINT信号。


```c
int i;

if (tty->pgrp <= 0)
    return;
for (i=0;i<NR_TASKS;i++)
    if (task[i] && task[i]->pgrp==tty->pgrp)
        task[i]->signal |= mask;
```

## sleep_if_empty
```c
static void sleep_if_empty(struct tty_queue * queue)
```

如果队列缓冲区为空，则让进程进入可中断睡眠状态。

```c
cli();
while (!current->signal && EMPTY(*queue))
    interruptible_sleep_on(&queue->proc_list);
sti();
```

## sleep_if_full
```c
static void sleep_if_full(struct tty_queue * queue)
```

```c
if (!FULL(*queue))
    return;
cli();
while (!current->signal && LEFT(*queue)<128)
    interruptible_sleep_on(&queue->proc_list);
sti();
```
## wait_for_keypress
```c
void wait_for_keypress(void)
```

```c
sleep_if_empty(&tty_table[0].secondary);
```

## copy_to_cooked
```c
void copy_to_cooked(struct tty_struct * tty)
```

该函数作用复制成规范模式字符序列。

```c
signed char c;

while (!EMPTY(tty->read_q) && !FULL(tty->secondary)) {//如果读队列不为空， 且辅助队列不满，就循环读取一个字节
    GETCH(tty->read_q,c);//读取一个字符到c
    if (c==13)       //如果是回车字符
        if (I_CRNL(tty))//回车转换行置位
            c=10;   //处理成换行符LF
        else if (I_NOCR(tty)) //NOCR置位
            continue; //忽略回车
        else ;
    else if (c==10 && I_NLCR(tty))//如果是换行符， 并且换行转回车NLCR置为，则将其转换为回车符CR。
        c=13;//转换为回车
    if (I_UCLC(tty))//如果大写转小写置位， 则换成小写
        c=tolower(c);
    if (L_CANON(tty)) {//CANON置位
        if (c==KILL_CHAR(tty)) {//如果是KILL(^U)
            /* deal with killing the input line */
            while(!(EMPTY(tty->secondary) ||
                    (c=LAST(tty->secondary))==10 ||
                    c==EOF_CHAR(tty))) {
                if (L_ECHO(tty)) {//本地回显标志置位
                    if (c<32)//控制字符要删2字节
                        PUTCH(127,tty->write_q);
                    PUTCH(127,tty->write_q);
                    tty->write(tty);
                }
                DEC(tty->secondary.head);
            }
            continue;//继续读取读队列中字符进行处理
        }
        if (c==ERASE_CHAR(tty)) {//如果该字符是删除控制字符ERASE(^H)
            if (EMPTY(tty->secondary) ||
                (c=LAST(tty->secondary))==10 ||
                c==EOF_CHAR(tty))
                continue;
            if (L_ECHO(tty)) {//本地回写标志置位
                if (c<32)
                    PUTCH(127,tty->write_q);
                PUTCH(127,tty->write_q);
                tty->write(tty);
            }
            DEC(tty->secondary.head);
            continue;
        }
        if (c==STOP_CHAR(tty)) {//如果字符是停止控制字符（^S）, 则置tty停止标志，停止tty输出
            tty->stopped=1;
            continue;
        }
        if (c==START_CHAR(tty)) {//如果是开始字符(^Q)
            tty->stopped=0;
            continue;
        }
    }
    if (L_ISIG(tty)) {
        if (c==INTR_CHAR(tty)) {
            tty_intr(tty,INTMASK);
            continue;
        }
        if (c==QUIT_CHAR(tty)) {
            tty_intr(tty,QUITMASK);
            continue;
        }
    }
    if (c==10 || c==EOF_CHAR(tty))
        tty->secondary.data++;
    if (L_ECHO(tty)) {//如果开启了回显
        if (c==10) {
            PUTCH(10,tty->write_q);
            PUTCH(13,tty->write_q);
        } else if (c<32) {
            if (L_ECHOCTL(tty)) {
                PUTCH('^',tty->write_q);
                PUTCH(c+64,tty->write_q);
            }
        } else
            PUTCH(c,tty->write_q);
        tty->write(tty);
    }
    PUTCH(c,tty->secondary);
}
wake_up(&tty->secondary.proc_list);
```

## tty_read
```c
int tty_read(unsigned channel, char * buf, int nr)
```
该函数是终端读函数。

该函数首先是定义了一些参数，并对chanel和nr参数进行校验。
```c
struct tty_struct * tty;
char c, * b=buf;
int minimum,time,flag=0;
long oldalarm;

if (channel>2 || nr<0) return -1;
```

接下来获取channel对应的tty对象,并从tty对象的VMIN和VTIME计算出读字符的超时时间time和最少需要读取的字符个数minimum。由于VTIME是一个1/10秒的计数值，因此这里需要乘以10。
```c
tty = &tty_table[channel];
oldalarm = current->alarm;//进程原本的alarm
time = 10L*tty->termios.c_cc[VTIME];//读操作等待时间
minimum = tty->termios.c_cc[VMIN];//满足读操作，最少需要读取的字符数
```

下面，如果time已经设置了值，但是minimum没有设置值，就给minimum设置为1，即每读取一个字符就返回。 接下来我们复用进程PCB中的alarm字段作为字符读取的超时值，在上面的代码中，我们已经保存了进程原本的alarm值到oldalarm中。 如果alarm值为0，或者当前滴答数加上超时值time小于原本的alarm值， 那么就设置flag为1，并且将进程当前的alarm值修改为time+jiffies。 这里这么操作主要就是因为复用了PCB中的字段。 接着如果minimum的值大于nr值，则将minumum设置为nr。

```c
if (time && !minimum) {
    minimum=1;
    if ((flag=(!oldalarm || time+jiffies<oldalarm)))
        current->alarm = time+jiffies;
}
if (minimum>nr)
    minimum=nr;
```

下面开始从终端的辅助队列中读取字符。 首先判断是否是内核在上面设置的字符读取的超时到期了，如果是就跳出循环。如果有其他信号，也是跳出循环。
```c
while (nr>0) {
    if (flag && (current->signal & ALRMMASK)) {
        current->signal &= ~ALRMMASK;
        break;
    }
    if (current->signal)
        break;
```

接下来如果终端的辅助队列为空，或者设置了终端的规范模式并且辅助队列中的字符行数为0以及辅助队列空闲空间大于20, 则代表当前读不到字符，于是让进程进入可中断睡眠状态。
```c
if (EMPTY(tty->secondary) || (L_CANON(tty) &&
!tty->secondary.data && LEFT(tty->secondary)>20)) {//暂时没有足够的数据
    sleep_if_empty(&tty->secondary);
    continue;
}
```

下面开始正式进行字符的读取。一直读到nr = 0或者缓冲队列为空。
```c
    do {
        GETCH(tty->secondary,c);//读取一个字符
        if (c==EOF_CHAR(tty) || c==10)//文件结束符^D或者换行符10
            tty->secondary.data--;//字符行数减去1
        if (c==EOF_CHAR(tty) && L_CANON(tty))//文件结束符^D或者规范模式置位
            return (b-buf);
        else {
            put_fs_byte(c,b++);
            if (!--nr)//已经读到了指定的字节数
                break;
        }
    } while (nr>0 && !EMPTY(tty->secondary));//辅助队列不为空
```

程序运行到这里，说明我们已经读取了nr个字符或者辅助队列已经空了。下面先重新设置获取字符的超时值。
```c
    if (time && !L_CANON(tty)) {//读到了nr个字符或者辅助队列为空
        if ((flag=(!oldalarm || time+jiffies<oldalarm)))
            current->alarm = time+jiffies;
        else
            current->alarm = oldalarm;
    }
    if (L_CANON(tty)) {
        if (b-buf)
            break;
    } else if (b-buf >= minimum)
        break;
}
```

程序的最后，还原进程的alarm值。
```c
current->alarm = oldalarm;
if (current->signal && !(b-buf))
    return -EINTR;
return (b-buf);//返回已经读取的字节数
```

## tty_write
```c
int tty_write(unsigned channel, char * buf, int nr)
```
该函数是中断写的函数。

该函数的开始定义了一些参数，并对channel和nr进行参数校验。
```c
static int cr_flag=0;
struct tty_struct * tty;
char c, *b=buf;

if (channel>2 || nr<0) return -1;
```

接下来取出对应的终端tty，首先判断tty的write_q队列有没有满， 如果满了就进入可中断睡眠的状态。如果进程收到了信号，直接跳出循环。
```c
tty = channel + tty_table;
while (nr>0) {
    sleep_if_full(&tty->write_q);
    if (current->signal)
        break;
```
当要写的字符数量还大于0，并且write_q还没有满，就从用户传入的buffer中获取一个字符c。如果O_POST置位，则需要对字符进行后续处理。如果字符是'\r'，并且回车转换行置位，则将字符转换为'\n'。如果字符是'\n'，并且换行转回车置位，则将字符转换为'\r'。如果字符是'\n',cr_flag没有置位，但是换行转回车置位，则将cr_flag置1，并将该回车放入write_q中。
```c
    while (nr>0 && !FULL(tty->write_q)) {
        c=get_fs_byte(b);
        if (O_POST(tty)) {
            if (c=='\r' && O_CRNL(tty))
                c='\n';
            else if (c=='\n' && O_NLRET(tty))
                c='\r';
            if (c=='\n' && !cr_flag && O_NLCR(tty)) {
                cr_flag = 1;
                PUTCH(13,tty->write_q);
                continue;
            }
            if (O_LCUC(tty))//如果小写转大写开启
                c=toupper(c);//将字符转化为大写
        }
        b++; nr--;
        cr_flag = 0;
        PUTCH(c,tty->write_q);
    }
```
接下来如果是中断，则调用con_write进行中断写，如果是串口，则调用rs_write进行写。
```c
    tty->write(tty);
    if (nr>0)
        schedule();
}
return (b-buf);
```

## do_tty_interrupt
```c
void do_tty_interrupt(int tty)
```
该函数是终端中断处理函数。

该函数的内部实现就是调用copy_to_cooked函数。

```c
copy_to_cooked(tty_table+tty);
```

## chr_dev_init
```c
void chr_dev_init(void)
```
该函数时字符设备初始化函数。该函数实现为空，为以后做准备。