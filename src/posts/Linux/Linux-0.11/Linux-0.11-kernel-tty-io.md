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

## chr_dev_init
```c
void chr_dev_init(void)
```