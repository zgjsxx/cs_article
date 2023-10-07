# Linux读写锁的死锁问题

```cpp

#include <iostream>
#include <pthread.h>
#include <unistd.h>


pthread_rwlock_t m_lock;
pthread_rwlockattr_t attr;

int A = 0, B = 0;

//线程1
void* threadFunc1(void* p)
{
  printf("thread 1 running..\n");
  pthread_rwlock_rdlock(&m_lock);
  printf("thread 1 read source A=%d\n", A);
  usleep(3000000); // 等待100ms，此时线程2大概率会被唤醒并申请写锁

  pthread_rwlock_rdlock(&m_lock);
  printf("thread 1 read source B=%d\n", B);

  //释放读锁
  pthread_rwlock_unlock(&m_lock);
  pthread_rwlock_unlock(&m_lock);

  return NULL;
}

//线程2
void* threadFunc2(void* p)
{
  printf("thread 2 running..\n");
  pthread_rwlock_wrlock(&m_lock);
  A = 1;
  B = 1;
  printf("thread 2 write source A and B\n");

  //释放写锁
  pthread_rwlock_unlock(&m_lock);

  return NULL;
}

int main()
{

    pthread_rwlockattr_init(&attr);
    pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP);//设置写锁优先级高

        //初始化读写锁
  if (pthread_rwlock_init(&m_lock, &attr) != 0)
  {
    printf("init rwlock failed\n");
    return -1;
  }

  //初始化线程
  pthread_t hThread1;
  pthread_t hThread2;
  if (pthread_create(&hThread1, NULL, &threadFunc1, NULL) != 0)
  {
    printf("create thread 1 failed\n");
    return -1;
  }
  usleep(1000000);
  if (pthread_create(&hThread2, NULL, &threadFunc2, NULL) != 0)
  {
    printf("create thread 2 failed\n");
    return -1;
  }

  pthread_join(hThread1, NULL);
  pthread_join(hThread2, NULL);

  pthread_rwlock_destroy(&m_lock);
  return 0;
}
```

写优先


```cpp
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <shared_mutex>

using namespace std;

void print() {
    cout << "\n";
}
template<typename T, typename... Args>
void print(T&& first, Args&& ...args) {
    cout << first << " ";
    print(std::forward<Args>(args)...);
}

std::shared_mutex mtx;
int step = 0;
std::mutex cond_mtx;
std::condition_variable cond;

void read() {
    //step0: 读锁
    shared_lock<std::shared_mutex> lock(mtx);

    unique_lock<std::mutex> uniqueLock(cond_mtx);
    print("read lock 1");
    //通知step0结束
    ++step;
    cond.notify_all();
    //等待step1: 写锁 结束
    cond.wait(uniqueLock, []{
        return step == 2;
    });
    uniqueLock.unlock();

    //step2: 再次读锁
    shared_lock<std::shared_mutex> lock1(mtx);

    print("read lock 2");
}

void write() {
    //等待step0: 读锁 结束
    unique_lock<std::mutex> uniqueLock(cond_mtx);
    cond.wait(uniqueLock, []{
        return step == 1;
    });
    uniqueLock.unlock();

    //step1: 写锁
    lock_guard<std::shared_mutex> lock(mtx);

    uniqueLock.lock();
    print("write lock");
    //通知step1结束
    ++step;
    cond.notify_all();
    uniqueLock.unlock();

}

int main() {
    std::thread t_read{read};
    std::thread t_write{write};
    t_read.join();
    t_write.join();
    return 0;
}

```