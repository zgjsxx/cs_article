---
category: 
- C++
---


## 什么样的类需要自定义析构函数?

首先看下面这个类，这个类需要写自定义析构函数吗？

```cpp
class Student{
public:
    Student(std::string name , int age, int id):name_(name), age_(age), id(id_){}；
    //需要析构函数吗？
public:
    std::string getName() const{
        return name_;
    }
    int getAge() const{
        return age_;
    }
    int getId() const{
        return id_;
    }
private:
    std::string name_;
    int age_;
    int id_;
}
```


```cpp
class Student{
public:
    Student(const char* s , std::size_t n){
        name_ = new char[n];
        memcpy(name_, s, n);
    }
    //需要析构函数吗？
public:
    std::string getName() const{
        return name_;
    }
    int getAge() const{
        return age_;
    }
    int getId() const{
        return id_;
    }
private:
    char* name_;
}
```
