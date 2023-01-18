---
category: 
- 编码
---

# UTF8转GBK代码

目录结构如下：
```shell
[root@localhost gbk-utf8]# tree
.
├── main.c
├── utf8.c
└── utf8.h
```

## utf8.h
```cpp
/**
 * Copyright (C) 2008  Huang Guan
 * Copyright (C) 2011  iBoxpay.com inc.
 *
 * $Id: 509d9187fcedee642b722b528884dc8378b93ede $
 *
 * Description: GBK UTF-8 iconv functions header file
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef _UTF8_H
#define _UTF8_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * UTF-8 to GBK
 * @param src [in]
 * @param dst [out]
 * @param len [in] The most bytes which starting at dst, will be written.
 *
 */
void utf8_to_gb(const char* src, char* dst, int len);

/**
 * GBK to UTF-8
 *
 * @param src [in]
 * @param dst [out]
 * @param len [in] The most bytes which starting at dst, will be written.
 */
void gb_to_utf8(const char* src, char* dst, int len);

#ifdef __cplusplus
}
#endif

#endif  // end of _UTF8_H


```



## utf8.c
```cpp
/**
 *  Copyright (C) 2008  Huang Guan
 *  Copyright (C) 2011  iBoxpay.com inc.
 *
 *  $Id: 691029ec2ac041372193855b2eb56db17bdac132 $
 *
 *  Description: This file mainly includes the functions about utf8
 *
 *  History:
 *  2008-7-10 13:31:57 Created.
 *  2011-12-28 Format the code style, and add comments by Lytsing
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#ifdef __WIN32__
#include <windows.h>
#else
#include <iconv.h>
#endif

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <memory.h>

#include "utf8.h"


#ifdef __WIN32__
void utf8_to_gb(const char* src, char* dst, int len)
{
    int ret = 0;
    WCHAR* strA;
    int i= MultiByteToWideChar(CP_UTF8, 0, src, -1, NULL, 0);
    if (i <= 0) {
        printf("ERROR.");
        return;
    }
    strA = (WCHAR*)malloc(i * 2);
    MultiByteToWideChar(CP_UTF8, 0, src, -1, strA, i);
    i = WideCharToMultiByte(CP_ACP, 0, strA, -1, NULL, 0, NULL, NULL);
    if (len >= i) {
        ret = WideCharToMultiByte(CP_ACP, 0, strA, -1, dst, i, NULL, NULL);
        dst[i] = 0;
    }
    if (ret <= 0) {
        free(strA);
        return;
    }

    free( strA );
}

void gb_to_utf8(const char* src, char* dst, int len)
{
    int ret = 0;
    WCHAR* strA;
    int i= MultiByteToWideChar(CP_ACP, 0, src, -1, NULL, 0);
    if (i <= 0) {
        printf("ERROR.");
        return;
    }
    strA = (WCHAR*)malloc(i * 2);
    MultiByteToWideChar(CP_ACP, 0, src, -1, strA, i);
    i = WideCharToMultiByte(CP_UTF8, 0, strA, -1, NULL, 0, NULL, NULL);
    if (len >= i) {
        ret = WideCharToMultiByte(CP_UTF8, 0, strA, -1, dst, i, NULL, NULL);
        dst[i] = 0;
    }

    if (ret <= 0) {
        free(strA);
        return;
    }
    free(strA);
}
#else   //Linux
// starkwong: In iconv implementations, inlen and outlen should be type of size_t not uint, which is different in length on Mac
void utf8_to_gb(const char* src, char* dst, int len)
{
    int ret = 0;
    size_t inlen = strlen(src) + 1;
    size_t outlen = len;

    // duanqn: The iconv function in Linux requires non-const char *
    // So we need to copy the source string
    char* inbuf = (char *)malloc(len);
    char* inbuf_hold = inbuf;   // iconv may change the address of inbuf
                                // so we use another pointer to keep the address
    memcpy(inbuf, src, len);

    char* outbuf = dst;
    iconv_t cd;
    cd = iconv_open("GBK", "UTF-8");
    if (cd != (iconv_t)-1) {
        ret = iconv(cd, &inbuf, &inlen, &outbuf, &outlen);
        if (ret != 0) {
            printf("iconv failed err: %s\n", strerror(errno));
        }

        iconv_close(cd);
    }
    free(inbuf_hold);   // Don't pass in inbuf as it may have been modified
}

void gb_to_utf8(const char* src, char* dst, int len)
{
    int ret = 0;
    size_t inlen = strlen(src) + 1;
    size_t outlen = len;

    // duanqn: The iconv function in Linux requires non-const char *
    // So we need to copy the source string
    char* inbuf = (char *)malloc(len);
    char* inbuf_hold = inbuf;   // iconv may change the address of inbuf
                                // so we use another pointer to keep the address
    memcpy(inbuf, src, len);

    char* outbuf2 = NULL;
    char* outbuf = dst;
    iconv_t cd;

    // starkwong: if src==dst, the string will become invalid during conversion since UTF-8 is 3 chars in Chinese but GBK is mostly 2 chars
    if (src == dst) {
        outbuf2 = (char*)malloc(len);
        memset(outbuf2, 0, len);
        outbuf = outbuf2;
    }

    cd = iconv_open("UTF-8", "GBK");
    if (cd != (iconv_t)-1) {
        ret = iconv(cd, &inbuf, &inlen, &outbuf, &outlen);
        if (ret != 0)
            printf("iconv failed err: %s\n", strerror(errno));

        if (outbuf2 != NULL) {
            strcpy(dst, outbuf2);
            free(outbuf2);
        }

        iconv_close(cd);
    }
    free(inbuf_hold);   // Don't pass in inbuf as it may have been modified
}
#endif
```

## 测试代码main.c
```cpp
#include "utf8.h"
#include <stdio.h>
#include <string.h>
void printContent(char *p)
{
    unsigned int i;
    //打印其内容, char *
    for(i=0;i<strlen(p);i++)
        printf("%02x ",(unsigned char)p[i]);
    printf("\n");
}

int main()
{
    char dst[4096];
    const char src[7] = {(char)0xe6, (char)0x82, (char)0xa8, (char)0xe5, (char)0xa5, (char)0xbd, (char)0x00};//您好
    utf8_to_gb(src, dst, 4096);
    printContent(dst);
}
```

# 编译运行
```shell
g++ main.c utf8.c
./a.out
c4 fa ba c3
```

"您好"的GBK编码的输出C4fa bac3是正确的。

# PS
该代码在Linux平台下，本人测试通过，Windows平台本人尚未测试。

# 参考：
https://github.com/lytsing/gbk-utf8