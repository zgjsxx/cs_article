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

## tty_intr
```c
void tty_intr(struct tty_struct * tty, int mask)
```

## sleep_if_empty
```c
static void sleep_if_empty(struct tty_queue * queue)
```

## sleep_if_full
```c
static void sleep_if_full(struct tty_queue * queue)
```


## wait_for_keypress
```c
void wait_for_keypress(void)
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
    if (L_ECHO(tty)) {
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

## tty_write
```c
int tty_write(unsigned channel, char * buf, int nr)
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