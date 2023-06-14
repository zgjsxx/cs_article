```cpp
#include <string.h>
#include <iostream>
class Toy
{
public:
    Toy(const char* name)
    {
        name_ = new char[20];
        memset(name_, 0, 20);
        strcpy(name_, name);
    }

    ~Toy()
    {
        delete name_;
        name_ = nullptr;
    }

    Toy(Toy &t)
    {
        std::cout << "Toy(Toy &t)" << std::endl;
        name_ = new char[20];
        strcpy(t.name_, (const char*)name_);
    }

    Toy(Toy&& t){
        std::cout << "Toy(Toy &&t)" << std::endl;
        std::cout <<"move constrctor" << std::endl;
        name_ = t.name_;
        t.name_ = nullptr;
    }

    Toy& operator=(Toy &t){
        std::cout << "Toy(Toy &t)" << std::endl;
        strcpy(t.name_, (const char*)name_);
        return *this;
    }

    Toy& operator=(Toy &&t){
        std::cout << "Toy& operator=(Toy &&t)" << std::endl;
        name_ = t.name_;
        t.name_ = nullptr;
        return *this;
    }
private:
    char* name_{nullptr};
};

void process(Toy t)
{

}

int main()
{
    Toy t("baby");
    process(t);
    process(std::move(t));
}
```


```cpp
#include <string.h>
#include <iostream>
class Toy
{
public:
    Toy(const char* name)
    {
        name_ = new char[20];
        memset(name_, 0, 20);
        strcpy(name_, name);
    }

    ~Toy()
    {
        delete name_;
        name_ = nullptr;
    }

    Toy(Toy &t)
    {
        std::cout << "Toy(Toy &t)" << std::endl;
        name_ = new char[20];
        strcpy(t.name_, (const char*)name_);
    }

    Toy(Toy&& t){
        std::cout << "Toy(Toy &&t)" << std::endl;
        std::cout <<"move constrctor" << std::endl;
        name_ = t.name_;
        t.name_ = nullptr;
    }

    Toy& operator=(Toy &t){
        std::cout << "Toy(Toy &t)" << std::endl;
        strcpy(t.name_, (const char*)name_);
        return *this;
    }

    Toy& operator=(Toy &&t){
        std::cout << "Toy& operator=(Toy &&t)" << std::endl;
        name_ = t.name_;
        t.name_ = nullptr;
        return *this;
    }
private:
    char* name_{nullptr};
};

void process(Toy& t)
{

}

int main()
{
    Toy t("baby");
    process(t);
}
```


```cpp
#include <string.h>
#include <iostream>
class Toy
{
public:
    Toy(const char* name)
    {
        name_ = new char[20];
        memset(name_, 0, 20);
        strcpy(name_, name);
    }

    ~Toy()
    {
        delete name_;
        name_ = nullptr;
    }

    Toy(Toy &t)
    {
        std::cout << "Toy(Toy &t)" << std::endl;
        name_ = new char[20];
        strcpy(t.name_, (const char*)name_);
    }

    Toy(Toy&& t){
        std::cout << "Toy(Toy &&t)" << std::endl;
        std::cout <<"move constrctor" << std::endl;
        name_ = t.name_;
        t.name_ = nullptr;
    }

    Toy& operator=(Toy &t){
        std::cout << "Toy(Toy &t)" << std::endl;
        strcpy(t.name_, (const char*)name_);
        return *this;
    }

    Toy& operator=(Toy &&t){
        std::cout << "Toy& operator=(Toy &&t)" << std::endl;
        name_ = t.name_;
        t.name_ = nullptr;
        return *this;
    }
private:
    char* name_{nullptr};
};

void process(Toy&& t)
{

}

int main()
{
    Toy t("baby");
    process(std::move(t));
}
```