---
category: 
- 汇编语言
---


# 操作系统1

## 两阶段引导加载程序

由于BIOS仅自动将磁盘的前 512 字节加载到内存中，因此我们必须自己加载其余部分。这将涉及调用中断[0x13](http://www.ctyme.com/intr/int-13.htm)，该中断用于操作磁盘。操作中断[0x13]一般需要两个步骤：

- 重置磁盘（子功能```ah = 0x0```）
- 执行扩展读取以将 n 个块加载到内存中（子功能 ```ah = 0x42```）

中断 0x13 涵盖与磁盘相关的功能，子功能 ```ah=0x42``` 执行从磁盘到内存的扩展读取。```dl``` 应该是 ```0x80```（驱动器号），```ds:si``` 应该包含描述我们要加载的内容以及加载位置的结构的地址：

```c
struct disk_addr_pkt {
    unsigned char sz;       // Size of packet = 0x10
    unsigned char _res;     // Reserved, do not use
    unsigned short blk_cnt; // How many blocks to transfer?
    void*          buffer;  // Address to load into
    unsigned long  blk_num; // Starting block number
};
```

“块”不是字节； 1 块 = 512 字节。 （磁盘对“块”的理解可能有所不同，但很多代码都是使用这种假设编写的，BIOS 会为我们进行转换。）

磁盘地址数据包必须在内存中对齐为 2 的倍数（即在字边界上）。数据包的“大小”存储在数据包内部，因为数据包结构有两种版本：我们上面使用的 16/32 位版本和 64 位版本，其中地址和块计数可以是64 位数量。



```x86asm
;;;
;;; two-stage.s
;;; Illustrates a two-stage loader, where the first stage invokes the BIOS
;;; to load the second stage.
;;;

bits 16
org 0x7c00

start:
origin:     equ         0x7c00
blk_count:  equ         (end - loaded_code) / 512 + 1

; -----------------------------------------------------------------------------
; First stage loader

; Reset disk
mov ah, 0x0         ; Subfunction reset
mov dl, 0x80        ; Disk number
int 0x13

; Load blocks 
mov ah, 0x42        ; Int 0x13, subfunction Extended Read
mov dl, 0x80        ; Drive num
mov si, disk_packet ; Packet address
int 0x13

jmp loaded_code

; ----------------------------------------------------------------------------
; Begin "pseudo-data" section

string:         db      "Hello, world!"
strlen:         equ     $-string
screen_addr:    equ     0xb8000

align 2 
disk_packet:    db      0x10            ; Packet size
                db      0               ; Reserved
                dw      blk_count       ; Block count
                dd      loaded_code     ; Addr. to load
                dd      1               ; Starting block

; Pad remainder with 0 bytes
times 510 - ($ - $$)    db 0

; Write boot signature at end
dw 0xaa55

; -----------------------------------------------------------------------------
; Begin second-stage loader

loaded_code:

; Set 80x25 text mode
mov ah, 0x0
mov al, 0x3
int 0x10

; Print text
mov si, 0          ; Memory index/cursor position
print:
    ; Print character
    mov ah, 0x0a    ; Subfunction = write char
    mov al, byte [si + string]
    mov bh, 0       ; Page = 0
    mov cx, 1       ; Write count = 1
    int 0x10

    ; Move cursor
    inc si
    mov ah, 0x02    ; Subfunction = set cursor pos.
    mov bh, 0       ; Page = 0
    mov dh, 0       ; Cursor row = 0
    mov dx, si      ; Cursor col = si
    mov dh, 0
    int 0x10

    cmp si, strlen
    jne print

; Infinite loop
forever: jmp forever

end:

; Pad so there's a good number of blocks used in the disk
times 1024 * 1024  db 0
```

## 进入32位保护模式

现在我们有了更多的代码（和数据）空间，我们可以将系统切换到 32 位保护模式。进入32位保护模式的基本步骤是

- 禁用中断。我们不希望在更改系统模式时触发中断，因为中断处理程序将无法正常工作。

- 启用 A20 线，以允许更大的地址空间。 （请记住，在 16 位模式下，我们只能访问 20 位地址空间。）

- 加载带有段偏移量的全局描述符表 (GDT)。在 32 位模式下，段寄存器中的值不是直接用作段地址，而是作为表（GDT）的索引，其中表中的每个条目都包含有关该段的信息。

- 通过设置寄存器CR0的低位来切换到32位模式。

### 禁用中断

原文链接：https://staffwww.fullcoll.edu/aclifton/cs241/lecture-operating-systems-2.html