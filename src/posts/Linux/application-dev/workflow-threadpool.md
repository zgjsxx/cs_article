# workflow 线程池分析



```c
typedef struct msg_t {
int data; // 存储的消息
struct msg_t* next; // 链接到下一个消息的指针
} msg_t;
```

那么我们可以设置linkoff为4，为data这个int的内存大小，这样子link就是next这个指针的地址.

```*link=NULL```，即将这个next指针置为NULL，

然后```*queue->put_tail```代表了当前队尾的next指针，

```*queue->put_tail = link```也就是将link添加到当前消息队列的队尾了，

```queue->put_tail = link```则是正常更新队尾，这两行就是所谓的”拉链“操作。

然后 ```*(void **)*queue->get_head```实际是取出当前队首的next指针然后再更新```*queue->get_head```，也即将链头移动到下一条消息。这个队列的核心实际就是在msg内部保留一个next指针，用于实现链表，而不由队列自身维护链表，这样子msg的生命周期就由msg的生产消费者维护，从而队列自身不需要额外的内存开销来维护链表。

msgqueue.h
```c
#ifndef _MSGQUEUE_H_
#define _MSGQUEUE_H_

#include <stddef.h>

typedef struct __msgqueue msgqueue_t;

#ifdef __cplusplus
extern "C"
{
#endif

/* A simple implementation of message queue. The max pending messages may
 * reach two times 'maxlen' when the queue is in blocking mode, and infinite
 * in nonblocking mode. 'linkoff' is the offset from the head of each message,
 * where spaces of one pointer size should be available for internal usage.
 * 'linkoff' can be positive or negative or zero. */

msgqueue_t *msgqueue_create(size_t maxlen, int linkoff);
void msgqueue_put(void *msg, msgqueue_t *queue);
void *msgqueue_get(msgqueue_t *queue);
void msgqueue_set_nonblock(msgqueue_t *queue);
void msgqueue_set_block(msgqueue_t *queue);
void msgqueue_destroy(msgqueue_t *queue);

#ifdef __cplusplus
}
#endif

#endif

```

msgqueue.c
```c

#include <errno.h>
#include <stdlib.h>
#include <pthread.h>
#include "msgqueue.h"

struct __msgqueue
{
	size_t msg_max;
	size_t msg_cnt;
	int linkoff;
	int nonblock;
	void *head1;
	void *head2;
	void **get_head;
	void **put_head;
	void **put_tail;
	pthread_mutex_t get_mutex;
	pthread_mutex_t put_mutex;
	pthread_cond_t get_cond;
	pthread_cond_t put_cond;
};

void msgqueue_set_nonblock(msgqueue_t *queue)
{
	queue->nonblock = 1;
	pthread_mutex_lock(&queue->put_mutex);
	pthread_cond_signal(&queue->get_cond);
	pthread_cond_broadcast(&queue->put_cond);
	pthread_mutex_unlock(&queue->put_mutex);
}

void msgqueue_set_block(msgqueue_t *queue)
{
	queue->nonblock = 0;
}

static size_t __msgqueue_swap(msgqueue_t *queue)
{
	void **get_head = queue->get_head;
	size_t cnt;

	queue->get_head = queue->put_head;
	pthread_mutex_lock(&queue->put_mutex);
	while (queue->msg_cnt == 0 && !queue->nonblock)
		pthread_cond_wait(&queue->get_cond, &queue->put_mutex);

	cnt = queue->msg_cnt;
	if (cnt > queue->msg_max - 1)
		pthread_cond_broadcast(&queue->put_cond);

	queue->put_head = get_head;
	queue->put_tail = get_head;
	queue->msg_cnt = 0;
	pthread_mutex_unlock(&queue->put_mutex);
	return cnt;
}

void msgqueue_put(void *msg, msgqueue_t *queue)
{
	void **link = (void **)((char *)msg + queue->linkoff);

	*link = NULL;
	pthread_mutex_lock(&queue->put_mutex);
	while (queue->msg_cnt > queue->msg_max - 1 && !queue->nonblock)
		pthread_cond_wait(&queue->put_cond, &queue->put_mutex);

	*queue->put_tail = link;
	queue->put_tail = link;
	queue->msg_cnt++;
	pthread_mutex_unlock(&queue->put_mutex);
	pthread_cond_signal(&queue->get_cond);
}

void *msgqueue_get(msgqueue_t *queue)
{
	void *msg;

	pthread_mutex_lock(&queue->get_mutex);
	if (*queue->get_head || __msgqueue_swap(queue) > 0)
	{
		msg = (char *)*queue->get_head - queue->linkoff;
		*queue->get_head = *(void **)*queue->get_head;
	}
	else
	{
		msg = NULL;
		errno = ENOENT;
	}

	pthread_mutex_unlock(&queue->get_mutex);
	return msg;
}

msgqueue_t *msgqueue_create(size_t maxlen, int linkoff)
{
	msgqueue_t *queue = (msgqueue_t *)malloc(sizeof (msgqueue_t));
	int ret;

	if (!queue)
		return NULL;

	ret = pthread_mutex_init(&queue->get_mutex, NULL);
	if (ret == 0)
	{
		ret = pthread_mutex_init(&queue->put_mutex, NULL);
		if (ret == 0)
		{
			ret = pthread_cond_init(&queue->get_cond, NULL);
			if (ret == 0)
			{
				ret = pthread_cond_init(&queue->put_cond, NULL);
				if (ret == 0)
				{
					queue->msg_max = maxlen;
					queue->linkoff = linkoff;
					queue->head1 = NULL;
					queue->head2 = NULL;
					queue->get_head = &queue->head1;
					queue->put_head = &queue->head2;
					queue->put_tail = &queue->head2;
					queue->msg_cnt = 0;
					queue->nonblock = 0;
					return queue;
				}

				pthread_cond_destroy(&queue->get_cond);
			}

			pthread_mutex_destroy(&queue->put_mutex);
		}

		pthread_mutex_destroy(&queue->get_mutex);
	}

	errno = ret;
	free(queue);
	return NULL;
}

void msgqueue_destroy(msgqueue_t *queue)
{
	pthread_cond_destroy(&queue->put_cond);
	pthread_cond_destroy(&queue->get_cond);
	pthread_mutex_destroy(&queue->put_mutex);
	pthread_mutex_destroy(&queue->get_mutex);
	free(queue);
}

```


thrdpool.h
```c
/*
  Copyright (c) 2019 Sogou, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Author: Xie Han (xiehan@sogou-inc.com)
*/

#ifndef _THRDPOOL_H_
#define _THRDPOOL_H_

#include <stddef.h>

typedef struct __thrdpool thrdpool_t;

struct thrdpool_task
{
	void (*routine)(void *);
	void *context;
};

#ifdef __cplusplus
extern "C"
{
#endif

/*
 * Thread pool originates from project Sogou C++ Workflow
 * https://github.com/sogou/workflow
 *
 * A thread task can be scheduled by another task, which is very important,
 * even if the pool is being destroyed. Because thread task is hard to know
 * what's happening to the pool.
 * The thread pool can also be destroyed by a thread task. This may sound
 * strange, but it's very logical. Destroying thread pool in thread task
 * does not end the task thread. It'll run till the end of task.
 */

thrdpool_t *thrdpool_create(size_t nthreads, size_t stacksize);
int thrdpool_schedule(const struct thrdpool_task *task, thrdpool_t *pool);
int thrdpool_increase(thrdpool_t *pool);
int thrdpool_in_pool(thrdpool_t *pool);
void thrdpool_destroy(void (*pending)(const struct thrdpool_task *),
					  thrdpool_t *pool);

#ifdef __cplusplus
}
#endif

#endif

```
thrdpool.c
```c
/*
  Copyright (c) 2019 Sogou, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Author: Xie Han (xiehan@sogou-inc.com)
*/

#include <errno.h>
#include <pthread.h>
#include <stdlib.h>
#include <string.h>
#include "msgqueue.h"
#include "thrdpool.h"

struct __thrdpool
{
	msgqueue_t *msgqueue;
	size_t nthreads;
	size_t stacksize;
	pthread_t tid;
	pthread_mutex_t mutex;
	pthread_key_t key;
	pthread_cond_t *terminate;
};

struct __thrdpool_task_entry
{
	void *link;
	struct thrdpool_task task;
};

static pthread_t __zero_tid;

static void *__thrdpool_routine(void *arg)
{
	thrdpool_t *pool = (thrdpool_t *)arg;
	struct __thrdpool_task_entry *entry;
	void (*task_routine)(void *);
	void *task_context;
	pthread_t tid;

	pthread_setspecific(pool->key, pool);
	while (!pool->terminate)
	{
		entry = (struct __thrdpool_task_entry *)msgqueue_get(pool->msgqueue);
		if (!entry)
			break;

		task_routine = entry->task.routine;
		task_context = entry->task.context;
		free(entry);
		task_routine(task_context);

		if (pool->nthreads == 0)
		{
			/* Thread pool was destroyed by the task. */
			free(pool);
			return NULL;
		}
	}

	/* One thread joins another. Don't need to keep all thread IDs. */
	pthread_mutex_lock(&pool->mutex);
	tid = pool->tid;
	pool->tid = pthread_self();
	if (--pool->nthreads == 0)
		pthread_cond_signal(pool->terminate);

	pthread_mutex_unlock(&pool->mutex);
	if (memcmp(&tid, &__zero_tid, sizeof (pthread_t)) != 0)
		pthread_join(tid, NULL);

	return NULL;
}

static void __thrdpool_terminate(int in_pool, thrdpool_t *pool)
{
	pthread_cond_t term = PTHREAD_COND_INITIALIZER;

	pthread_mutex_lock(&pool->mutex);
	msgqueue_set_nonblock(pool->msgqueue);
	pool->terminate = &term;

	if (in_pool)
	{
		/* Thread pool destroyed in a pool thread is legal. */
		pthread_detach(pthread_self());
		pool->nthreads--;
	}

	while (pool->nthreads > 0)
		pthread_cond_wait(&term, &pool->mutex);

	pthread_mutex_unlock(&pool->mutex);
	if (memcmp(&pool->tid, &__zero_tid, sizeof (pthread_t)) != 0)
		pthread_join(pool->tid, NULL);
}

static int __thrdpool_create_threads(size_t nthreads, thrdpool_t *pool)
{
	pthread_attr_t attr;
	pthread_t tid;
	int ret;

	ret = pthread_attr_init(&attr);
	if (ret == 0)
	{
		if (pool->stacksize)
			pthread_attr_setstacksize(&attr, pool->stacksize);

		while (pool->nthreads < nthreads)
		{
			ret = pthread_create(&tid, &attr, __thrdpool_routine, pool);
			if (ret == 0)
				pool->nthreads++;
			else
				break;
		}

		pthread_attr_destroy(&attr);
		if (pool->nthreads == nthreads)
			return 0;

		__thrdpool_terminate(0, pool);
	}

	errno = ret;
	return -1;
}

thrdpool_t *thrdpool_create(size_t nthreads, size_t stacksize)
{
	thrdpool_t *pool;
	int ret;

	pool = (thrdpool_t *)malloc(sizeof (thrdpool_t));
	if (!pool)
		return NULL;

	pool->msgqueue = msgqueue_create((size_t)-1, 0);
	if (pool->msgqueue)
	{
		ret = pthread_mutex_init(&pool->mutex, NULL);
		if (ret == 0)
		{
			ret = pthread_key_create(&pool->key, NULL);
			if (ret == 0)
			{
				pool->stacksize = stacksize;
				pool->nthreads = 0;
				memset(&pool->tid, 0, sizeof (pthread_t));
				pool->terminate = NULL;
				if (__thrdpool_create_threads(nthreads, pool) >= 0)
					return pool;

				pthread_key_delete(pool->key);
			}

			pthread_mutex_destroy(&pool->mutex);
		}

		errno = ret;
		msgqueue_destroy(pool->msgqueue);
	}

	free(pool);
	return NULL;
}

inline void __thrdpool_schedule(const struct thrdpool_task *task, void *buf,
								thrdpool_t *pool);

void __thrdpool_schedule(const struct thrdpool_task *task, void *buf,
						 thrdpool_t *pool)
{
	((struct __thrdpool_task_entry *)buf)->task = *task;
	msgqueue_put(buf, pool->msgqueue);
}

int thrdpool_schedule(const struct thrdpool_task *task, thrdpool_t *pool)
{
	void *buf = malloc(sizeof (struct __thrdpool_task_entry));

	if (buf)
	{
		__thrdpool_schedule(task, buf, pool);
		return 0;
	}

	return -1;
}

int thrdpool_increase(thrdpool_t *pool)
{
	pthread_attr_t attr;
	pthread_t tid;
	int ret;

	ret = pthread_attr_init(&attr);
	if (ret == 0)
	{
		if (pool->stacksize)
			pthread_attr_setstacksize(&attr, pool->stacksize);

		pthread_mutex_lock(&pool->mutex);
		ret = pthread_create(&tid, &attr, __thrdpool_routine, pool);
		if (ret == 0)
			pool->nthreads++;

		pthread_mutex_unlock(&pool->mutex);
		pthread_attr_destroy(&attr);
		if (ret == 0)
			return 0;
	}

	errno = ret;
	return -1;
}

inline int thrdpool_in_pool(thrdpool_t *pool);

int thrdpool_in_pool(thrdpool_t *pool)
{
	return pthread_getspecific(pool->key) == pool;
}

void thrdpool_destroy(void (*pending)(const struct thrdpool_task *),
					  thrdpool_t *pool)
{
	int in_pool = thrdpool_in_pool(pool);
	struct __thrdpool_task_entry *entry;

	__thrdpool_terminate(in_pool, pool);
	while (1)
	{
		entry = (struct __thrdpool_task_entry *)msgqueue_get(pool->msgqueue);
		if (!entry)
			break;

		if (pending)
			pending(&entry->task);

		free(entry);
	}

	pthread_key_delete(pool->key);
	pthread_mutex_destroy(&pool->mutex);
	msgqueue_destroy(pool->msgqueue);
	if (!in_pool)
		free(pool);
}
```


main.c
```c
#include <iostream>
#include <unistd.h>
#include "thrdpool.h"
#include "msgqueue.h"

void test(void* arg)
{
    std::cout << "Hello World" << std::endl;
}

int main()
{
    thrdpool_t* pool = thrdpool_create(10, 256*1024);
    
    struct thrdpool_task task = {
        .routine	=	test,
        .context	=	NULL
    };

    thrdpool_schedule(&task, pool);

    while(1){
        sleep(1);
    }
}
```