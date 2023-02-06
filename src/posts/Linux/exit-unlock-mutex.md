
```cpp
#include<unistd.h>
#include<sys/mman.h>
#include<pthread.h>
#include<sys/types.h>
#include<sys/wait.h>
#include<fcntl.h>
#include<string.h>
#include<stdlib.h>
#include<stdio.h>
#include <string>
#include <iostream>
using namespace std;
pthread_mutex_t mutex;

void* func1(void* param)
{
    pthread_mutex_lock(&mutex);
    cout << "func1 get lock" << endl;
    pthread_exit(NULL);
}

void* func2(void* param)
{
    sleep(2);
    pthread_mutex_lock(&mutex);
    cout << "func2 get lock" << endl;
    pthread_mutex_unlock(&mutex);
    return NULL;
}

int main(void)
{
    int i;
    pthread_mutex_init(&mutex, NULL);
    pthread_t tid1, tid2;
    pthread_create(&tid1, NULL, func1, NULL);
    pthread_create(&tid2, NULL, func2, NULL);

    pthread_join(tid1,NULL);
    pthread_join(tid2,NULL);
    pthread_mutex_destroy(&mutex);
    return 0;
}
```


```cpp
#include<unistd.h>
#include<sys/mman.h>
#include<pthread.h>
#include<sys/types.h>
#include<sys/wait.h>
#include<fcntl.h>
#include<string.h>
#include<stdlib.h>
#include<stdio.h>
#include <string> 
#include <iostream>
using namespace std;
pthread_mutex_t mutex;

void* func1(void* param)
{
    pthread_mutex_lock(&mutex);
    cout << "func1 get lock" << endl;
    pthread_exit(NULL);
}

void* func2(void* param)
{
    sleep(2);
    int r = pthread_mutex_lock(&mutex);
    if (r == EOWNERDEAD)
    {
        cout << "thread2 will unlock the lock" << endl;
        pthread_mutex_consistent(&mutex);
    }  

    cout << "func2 get lock" << endl;
    pthread_mutex_unlock(&mutex);
    return NULL;
}

int main(void)
{
    int i;
    pthread_mutexattr_t attr;
    int err = pthread_mutexattr_init(&attr);
    if (err != 0)
        return err;
         
    pthread_mutexattr_setrobust(&attr,PTHREAD_MUTEX_ROBUST);  
    pthread_mutex_init(&mutex, &attr);
    
    pthread_t tid1, tid2;
    pthread_create(&tid1, NULL, func1, NULL);
    pthread_create(&tid2, NULL, func2, NULL);

    pthread_join(tid1,NULL);
    pthread_join(tid2,NULL);
    pthread_mutex_destroy(&mutex);

    return 0;
}
```