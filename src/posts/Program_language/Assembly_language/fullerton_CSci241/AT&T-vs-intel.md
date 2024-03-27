---
category: 
- 汇编语言
---

- [AT\&T和Intel汇编语法有什么不同](#att和intel汇编语法有什么不同)
  - [原操作数和目的操作数的顺序](#原操作数和目的操作数的顺序)
  - [注释语句不同](#注释语句不同)
  - [立即数写法不同](#立即数写法不同)
  - [取址方式不同](#取址方式不同)
  - [命令后缀](#命令后缀)


# AT&T和Intel汇编语法有什么不同

## 原操作数和目的操作数的顺序

Intel语法先写目标操作数，再写源操作数，AT&T语法先写源操作数，再写目标操作数。

Intel：

```x86asm
mov ebp, esp
```

AT&T:

```x86asm
mov %esp, %ebp 
```

## 注释语句不同

Intel：

```x86asm
mov ebp, esp ;mov
```

AT&T:

```x86asm
movl %esp, %ebp //mov 
```

## 立即数写法不同

Intel：

```x86asm
mov ebp, 0x100
```

AT&T:

```x86asm
movl $0x100, %ebp
```

## 取址方式不同


|Intel|AT&T|
|--|--|
|[base + reg * scale + displacement]  |displacement(base, index, scale)|
 
Intel:

```x86asm
mov eax, [0100]
mov eax, [ESI]
mov eax, [EBP-8]
mov eax, [EBX*4+0100]
mov eax, [EDX+EBX*4+8]
```

AT&T:

```x86asm
movl           0x0100, %eax
movl           (%esi), %eax
movl         -8(%ebp), %eax
movl  0x0100(,%ebx,4), %eax
movl 0x8(%edx,%ebx,4), %eax
```


## 命令后缀

AT&T语法中命令存在后缀，后缀可以表示操作数的大小。"l"代表long，即4个字节， "w"代表word， 2个字节， "b"代表字节。

Intel语法中有类似的符号，byte ptr代表一个字节， word ptr代表一个字， dword ptr代表双字。

下面是详细的例子：

|Intel|AT&T|
|--|--|
|mov al,bl<br>mov ax，bx<br> mov eax，ebx<br>mov eax， dword ptr [ebx]|movb %bl， %al<br>movw %bx， %ax<br>movl %ebx， %eax<br>movl (%ebx), %eax|