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

https://staffwww.fullcoll.edu/aclifton/cs241/lecture-string-operations.html