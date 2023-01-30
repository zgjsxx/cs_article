---
category: 
- Linux
- Kernel
---

# kernel中关于链表的宏定义
- list_for_each_entry


```cpp
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
/* 找到指定的成员在定义的结构中的偏移的位置 */
#define offsetof(TYPE, MEMBER) ((size_t) &((TYPE *)0)->MEMBER)
/*    根据结构体成员的地址，以及结构体成员在结构体中的偏移值计算出结构体变量的地址 
 *        ptr    :    结构体成员变量的地址
 *        type    :    结构体的类型定义
 *        member    :    结构体中该成员的定义名称
 */
#define container_of(ptr, type, member) ({            \
    const typeof(((type *)0)->member) * __mptr = (ptr);    \
    (type *)((char *)__mptr - offsetof(type, member)); })
/* 对container_of进行宏的再次定义，作用和container_of一样 */
#define list_entry(ptr, type, member) \
    container_of(ptr, type, member)
/*    对一个链表中的所有元素进行遍历:
 *        pos      : 表示为定义的结构体变量的地址，用来存放每次遍历的结点元素的首地址
 *        head    : 表示要遍历的链表头部
 *        member  : 为该链表成员在结构体中的名称
 */
#define list_for_each_entry(pos, head, member)                \
    for (pos = list_entry((head)->next, typeof(*pos), member);    \
         &pos->member != (head);     \
         pos = list_entry(pos->member.next, typeof(*pos), member))
/*    功能和list_for_each_entry相同
 *    但是遍历的结点是从head结点开始，而不是从head->next开始
 */
#define yl_list_for_each_entry(pos, head, member)                \
        for (pos = list_entry((head), typeof(*pos), member);    \
             &pos->member != NULL;    \
             pos = list_entry(pos->member.next, typeof(*pos), member))
/* 链表连接件的结构体定义 */
struct list_head {
    struct list_head *next, *prev;    
};
/* 定义一个student结构体，然后用list_head将这些结构体串起来 */
struct student{
    char name[20];            //名字字段
    struct list_head list;    // 连接件字段
};
/* 程序的入口函数 */
int main(int argc, char *argv[])
{
    int i;
    struct student *stu;
    struct student *p;
    struct list_head *g_list = NULL;    /* 表示链表头部 */
    struct list_head *t_list = NULL;    /* 表示临时链表元素指针 */
    /* 动态分配一块内存区域 */
    stu = malloc(sizeof(struct student) * 10);
    if(!stu)
    {
        printf("malloc error!\n");
        return -1;
    }
    /* 对内存区域进行赋值，并将其加入到定义的链表当中 */
    for(i = 0; i < 10; i++)
    {
        sprintf(stu[i].name, "stu-%d", i);
        /* 判断链表是否为空 */
        if(!g_list)        /* 为空 */
        {
            g_list = &stu[i].list;
            g_list->next = NULL;
        }
        else            /* 不为空 */
        {
            t_list = g_list;
            while(t_list)    /* 对链表进行遍历 */
            {
                if(t_list->next== NULL)
                {
                    t_list->next = &stu[i].list;
                    stu[i].list.next = NULL;
                }
                t_list = t_list->next;
            }
        }
    }
    i = 0;
    /* 对链表进行遍历 */
    yl_list_for_each_entry(p, g_list, list)
    {
        printf("%d : %s\n", i, p->name);
        i += 1;
    }
    return 0;
}
```