---
category: 
- 汇编语言
---

# 第十八讲 c字符串

C 风格字符串是一个字节数组，其中最后一个字节等于 0。这使得我们可以计算出字符串的长度，而不用取存储它。计算方法是遍历字符串直到找到 0 字节。在 C/C++ 中，这看起来像这样：

```c
size_t strlen(char* s) {
    size_t l = 0;
    while(*s != 0) {
        ++l;
        ++s;
    }
    return l;
}
```

注意```0```和字符常量```\0```是完全相同的。

计算字符串的长度是所有操作的基础。复制、追加、字符串搜索等依赖于字符串的长度。因此，我们希望使此操作尽可能快。我们将看到的其他字符串操作是:

- strcpy – 将一个字符串复制到另一个字符串。

- strcat – 将两个字符串连接成第三个字符串。

- strstr – 在字符串中搜索子字符串

上面的汇编的第一个翻译可能如下所示

```x86asm
strlen:
    ; rdi = char* s
    ; rax = returned length
    xor rax, rax

.while:
    cmp byte [rdi], 0
    je .return
    inc rdi
    inc rax
    jmp .while

.return:
    ret
```

这是汇编函数的一个示例，它比其原始 C 版本长不了多少，然而，一次访问一个字节的内存并不是实现这一点的最有效方法。在本讲座中，我们将介绍多种不同的方法来执行此操作，从使用带有```rep```前缀的特定于字符串的指令，到一次加载多个字节，再到使用XMM寄存器并行化进程的高级方法。

strcpy 只是将字节从一个字符串复制到另一个字符串的问题。我们假设目标字符串有足够的空间。在C中这是

```c
char* strcpy(char* dest, char* src) {
    while(*src != 0) {
        *dest = *src;
        ++dest;
        ++src;
    }
    *dest = 0; // Copy terminating nul
    return dest;
}
```

（我们返回 dest 中最后一个终止 0 的地址，因为它在下面实现 strcat 时很有用。)

在汇编中：

```x86asm
strcpy:
    ; rdi = char* dest
    ; rsi = char* src

.while:
    cmp byte [rsi], 0
    je .done
    movsb     ; See string instructions below
    inc rsi
    inc rdi
    jmp .while

.done:
    mov byte [rdi], 0
    mov rax, rdi
    ret
```

为了连接两个字符串，我们必须将第一个字符串复制到目标中，然后是第二个字符串，最后是终止符 0。

```c
char* strcat(char *dest, char* a, char* b) {
    dest = strcpy(dest, a);
    return strcpy(dest, b);
}
```

```x86asm
strcat:
  ; rdi = char* dest
  ; rsi = char* a
  ; rdx = char* b
  push rbp
  mov rbp, rsp

  call strcpy

  mov rdi, rax
  mov rsi, rdx
  call strcpy

  pop rbp
  ret
```

strstr是最有趣的。实现子字符串搜索的自然方法是使用嵌套循环：

```c
char* strstr(char* src, char* ptn) {
  size_t tl = strlen(src);
  size_t pl = strlen(ptn);

  for(size_t = 0; i < tl - pl; ++i) {
    bool matches = true;
    for(size_t j = 0; j < pl; ++j)
      if(src[i + j] != ptn[j]) {
        matches = false;
        break;
      }

    if(matches)
      return src + i;
  }

  return 0; // Not found, null pointer
}
```

这种实现方式的时间复杂度是```O(mn)```，这里```m```是源字符串的长度， ```n```是搜索字符串的长度。有更快的算法，但它们依赖于模式 ptn 的各种跳过表的预计算。

为了将其转化为汇编，我们需要进行一些修改。首先，我们要消除对 strlen 的调用。应该可以检测循环中搜索字符串和模式的结尾：

```c
char* strstr(char* src, char* ptn) {
  for(size_t i = 0; ; ++i) {
    bool matches = true;
    for(size_t j = 0; ptn[j] != 0; ++j) {

      if(src[i + j] == 0)
        break;

      if(src[i + j] != ptn[j]) {
        matches = false;
        break;
      }
    }

    if(matches)
      return src + i;
  }

  return 0; // Not found
}
```

第二个调整是要注意，在函数内部，除了 ```src + i``` 之外，我们从不使用 ```src```。因此我们可以用基于指针的循环替换外部整数循环：

```c
char* strstr(char* src, char* ptn) {
  for(; ; ++src) {
    bool matches = true;
    for(size_t j = 0; ptn[j] != 0; ++j) {

      if(src[j] == 0)
        break;

      if(src[j] != ptn[j]) {
        matches = false;
        break;
      }
    }

    if(matches)
      return src;
  }

  return 0; // Not found
}
```

我们可以类似地替换内部循环，只要我们保存原始的 ptn，这样我们就可以从头开始：

```c
char* strstr(char* src, char* ptn) {
  for(; ; ++src) {
    bool matches = true;
    for(char* p = ptn, char* s = src; *p != 0 && *s != 0; ++p, ++s) 
      if(*s != *p) {
        matches = false;
        break;
      }

    if(matches)
      return src;
  }

  return 0; // Not found
}
```

因为内循环中的字符串结束条件位于开始处，所以我们可以将其折叠到循环条件中。最后，请注意，我们实际上不需要存储变量 matches 的值。对于内循环中的每次比较，如果两个字节不相等，则跳转到外循环的更新步骤。另一方面，如果内部循环正常完成，这意味着所有字节都相等，我们可以返回。在这种情况下，程序集跳转到任意标签的能力实际上允许我们简化代码，删除标志变量。

这个函数很简单，我们可以将它翻译成汇编。

```x86asm
strstr:
  ; rdi = char* src
  ; rsi = char* ptn
  ; rax = returned char*

  ; rsi = s
  ; rdi = p
  ; rax = src
  ; r11 = ptn

  mov rax, rdi
  mov r11, rsi

.src_loop:
  mov rdi, r11       ; p = ptn
  mov rsi, rax       ; s = src

.ptn_loop:
  cmp byte [rdi], 0
  je .end_ptn_loop
  cmp byte [r11], 0
  je .end_ptn_loop

  cmpsb               ; [rdi] != [rsi]
  jne .cont_ptn_loop
  ret                 ; return src

.cont_ptn_loop:
  inc rdi
  inc rsi
  jmp .ptn_loop

.cont_src_loop:
  inc rax
  jmp .src_loop
```

为了进行字节 [rdi] 与字节 [rsi] 的实际比较，我们使用字符串指令 cmpsb，它允许我们比较两个内存操作数，这是我们通常无法做到的。 cmps 是一系列字符串指令之一，所有这些指令都隐式使用 rdi/rsi 作为读取地址。

## 字符串指令

有许多特定于字符串的指令，全部以 s 结尾，它们具有几个共同的特征：

- 它们都隐式使用 ```rdi``` 和 ```rsi``` 寄存器作为地址。它们要么用作两个源操作数（例如，用于字符串比较 cmps），要么用作类似传输操作的源（rsi）和目标（rdi）。
- 它们每次都会隐式增加 rdi 和 rsi（如果使用的话）。当重复最终终止时，rdi 和 rsi 保留在其最终位置。
- 全部接受rep前缀，这会导致处理器本身重复指令，而我们不会进行任何循环/分支。
- 从技术上讲，它们允许字节、单词、双字或 qword 的字符串，但我们只会使用字节变体。

### ```rep```前缀

```rep``` 前缀是修饰符，可应用于少数指令，告诉 CPU 在内部重复它们（即不需要比较/分支！），直到满足某些条件。可用的前缀有
- ```rep``` – 重复 ```rcx``` 次，就像```loop```指令一样，重复执行直到 ```rcx == 0```。所有其他```rep```前缀也隐式使用此条件；也就是说，```repe```的停止条件是如果 ```[rdi] != [rsi]``` 或 ```rcx == 0```。
- ```repe``` – 重复直到 ```[rdi] != [rsi]``` 或在某些情况下，直到 ```[rdi] != rax```。这基本上循环直到设置零标志。 ```repz``` 是此前缀的别名。
- ```repne``` – 重复直到 ```[rdi] == [rsi]``` 或在某些情况下，直到 ```[rsi] == rax```。这基本上循环直到零标志被清除。 ```repnz``` 是此前缀的别名。

```rep``` 前缀可以与字符串指令 ```movs、lods、stos``` 一起使用。 ```repe```/```repne``` 前缀可与字符串指令 ```cmps``` 和 ```scas``` 一起使用。

请注意，无论使用什么前缀，重复都会在 ```rcx == 0``` 时终止。

因此，如果您不希望 ```rcx``` 对指令重复次数产生任何影响，请将其设置为可能的最大无符号 qword 值：

```mov rcx, -1```


### 传输指令：lods、stos 和 movs

存在从内存到al、从al到内存以及从内存到内存传输数据的三个指令。这些是 ```lod```、```stos``` 和 ```movs```：

|指令|描述|
|--|--|
|```lodsb```|将 ```[rdi]```处的一个字节加载到 ```al```|
|```stosb```|将 ```al``` 中的字节写入字节 ```[rdi]```|
|```movsb```|将字节从 ```[rsi]``` 复制到 ```[rdi]```,之后对```rsi```和```rdi```进行递增或者递减，递增还是递减由方向位(DF: direction flag)来决定|

```rep``` 前缀使这些操作运行 ```rcx``` 次。其他前缀不能与它们一起使用，因此，必须提前知道输入字符串的长度。尽管如此，```stosb``` 仍可用于用常量字节填充内存数组，而 ```movsb``` 则可用于将一个字符串复制到另一个字符串中。```rep lodsb``` 并不是特别有用，因为它会重复地将字节加载到 al 中，但随后不会对它们执行任何操作。

## 比较指令：```cmps``` 和 ```scas```

```cmpsb``` 将 ```[rdi]``` 处的字节与 ```[rsi]``` 处的字节进行比较，并相应地更新标志。由于 ```repe```/```repne``` 前缀使用 ```ZF```，因此可用于按字节比较一对字符串，在相等/不相等的第一对字节处停止。

```scas``` 将字节 ```[rdi]``` 与 ```al``` 进行比较并相应地更新标志。因此，虽然 ```cmps``` 对应于按字节比较两个字符串，但 ```scas``` 对应于在字符串中搜索存储在 ```al``` 中的特定字符。同样，```repe```/```repne``` 可用于搜索第一次出现等于/不等于 ```al``` 的字节。

问题：我们可以使用repe前缀来简化上面strstr的实现吗？

就我个人而言，我不这么认为，因为我们的终止条件比仅仅 !=; 更复杂。我们还必须检查任一列表中的终止 \0，但我很高兴被证明是错误的！


## 字符串操作 strlen

我们可以使用 scas 来实现 strlen 的支持rep的版本

```x86asm
strlen:
    ; rdi = char*
    ; rax = return length

    mov rcx, -1     ; Max 64-bit unsigned value
    mov r11, rdi    ; Save original rdi
    xor al, al      ; al = '\0'
    repne scasb
    ; Now rdi points to the 0 byte

    sub rdi, rax
    mov rdi, r11    ;restore rdi?(原文错了)
    ret
```

## 并行化strlen

我们当前版本的 ```strlen``` 一次仅加载一个字节。通过使用 64 位寄存器的全宽度，我们可以在相同的时间内加载 8 个字节，但是我们会遇到在这 8 个字节内的任何位置检测到单个 0 字节的问题。最简单的方法是重复移位并检查寄存器的低/高字节部分：

```x86asm
 mov rbx, qword [rdi]
  cmp bl, 0
  je .low
  cmp bh, 0
  je .high

  ; Check next word
  shr rbx, 16
  add rdi, 2
  cmp bl, 0
  ...
```

因为有四个字，所以我们需要执行四次移位/比较过程（如果我们手动将它们全部写出来，而不是使用循环，速度会更快）。主要的问题是我们使用通用寄存器（rbx），就像它是一个 8 字节的向量寄存器一样，但事实并非如此。如果我们改用 xmm 寄存器，我们就有更多的指令可供使用，可以平等地对待所有字节。

这是来自 Abner Fog 的[快速汇编](https://www.agner.org/optimize/#asmlib) C 例程库的优化 strlen 的一部分：

```x86asm
    ; rdi = char* s

    pxor     xmm0, xmm0            ; set to zero
    mov      rax,  rdi
    sub      rax,  10H             ; rax = rdi - 16

    ; Main loop, search 16 bytes at a time
L1: add      rax,  10H             ; increment pointer by 16
    movq     xmm1, [rax]           ; read 16 bytes 
    pcmpeqb  xmm1, xmm0            ; compare 16 bytes with zero
    pmovmskb edx,  xmm1            ; get one bit for each byte result
    bsf      edx,  edx             ; find first 1-bit
    jz       L1                    ; loop if not found  


    ; Zero-byte found. Compute string length        
    sub      rax,  rdi             ; subtract start address
    add      rax,  rdx             ; add byte index
    ret
```

该算法的基本思想是：

- 从地址 rax 加载 16 个字节到 ```xmm1```
- 将每个字节分别与0进行比较（xmm0用0填充）。请记住，向量比较的结果不是更改标志寄存器，而是在比较为真时将每个字节设置为 1，如果不是，则将每个字节设置为 0。
- 将 ```xmm1``` 中每个字节的 1 位（真/假比较结果）复制到 ```edx``` 中。
- 如果未设置位，则重复。
- 否则，添加设置位的索引，加上 rax 距字符串开头的偏移量，以获得长度。

```movq``` 指令将一个四字从内存加载到 ```xmm``` 寄存器中（或将一个四字从 xmm 寄存器写入内存）。 ```movq``` 有点慢，因为它允许未对齐的读取； Fog最初的实现使用movdqa，它要求地址是16的倍数；未对齐的字符串通过在进入主循环之前首先检查未对齐的部分进行特殊处理。

```pcmpeqb``` 指令（Compare Packed Equal Bytes 的缩写）按字节比较两个 xmm 寄存器是否相等，如果为 true，则将目标中的每个字节设置为全 1，如果为 false，则将目标中的每个字节设置为全 0。

```pmovmskb``` 指令（移动掩码字节）获取 xmm 寄存器的每个字节组件的高位，并将它们复制到通用寄存器的位中。这实际上为我们提供了相同的 0 或 1 比较结果，但打包到 edx 的位中，而不是分散到 xmm1 上。


bsf 指令（位扫描向前）指令搜索已设置的第一个（最低）位。

- 如果设置了一个位，则将 edx 设置为该位的索引，并清除零标志。
- 如果没有设置任何位，则设置零标志

如果 edx 中没有设置位，那么我们加载的 16 个字节中没有一个字节是 0，因此我们还没有到达字符串的末尾。否则，edx 是我们加载的 16 字节内字符串结尾字节的偏移量。

让我们看一个例子来看看它是如何工作的：我们想要找到字符串“The Quick Brown Fox Jumped over the Lazy Dog.”的长度。该字符串有 45 个字符：

|T|h|e|␣|q|u|i|c|k|␣|b|r|o|w|n|␣|f|o|x|␣|j|u|m|p|e|d|␣|o|v|e|r|␣|t|h|e|␣|L|a|z|y|␣|D|o|g|.|\0|
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|

我们预加载 xmm0 全 0：

|xmm0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|Byte|0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|

循环的第一次迭代会将 Quick Brown 加载到 xmm1 中。

|xmm1|T|h|e|␣|q|u|i|c|k|␣|b|r|o|w|n|␣|
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|Byte|0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|

由于这些字节都不是 \0，因此比较会将 xmm1 中的所有内容设置为 0：

|xmm0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|Byte|0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|

然后我们将其作为单个位复制到 edx 中：edx = 0000000000000000b。

由于没有设置任何位，bsf 将设置零标志 ZF = 1，导致跳转到 L1。

下一个循环，rax = 16，所以我们将加载fox跳转到xmm1。由于这里也不存在零字节，因此该过程会重复。

|xmm1|t|h|e|␣|l|a|z|y|␣|d|o|g|.|\0|||
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|Byte|0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|

比较后，我们将```xmm1```设置为:

|xmm0|0|0|0|0|0|0|0|0|0|0|0|0|0|1|0|0|
|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
|Byte|0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|

然后将其复制到 edx 中，格式为 0010000000000000b。 bsf 将把 edx 设置为 13，即设置位的索引，同时还设置 ZF = 0。这将终止循环。

正如预期的那样，字符串的最终长度为 32 (rax) 加 13（位索引）= 45。


## 附录

https://staffwww.fullcoll.edu/aclifton/cs241/lecture-string-operations.html