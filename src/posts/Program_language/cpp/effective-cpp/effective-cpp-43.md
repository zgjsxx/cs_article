---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 43-处理模板化基类的名称

该节主要分析了一个写模板时常常会遇到的一个编译错误。

## 分析

这里有一个模板基类，有派生类继承了模板基类，并调用了基类中的方法，但是编译器却会报找不该方法，这是怎么回事？

```cpp
#include <string>
#include <iostream>
class CompanyA
{
public:
	void sendCleartext(const std::string& msg) 
    {
        std::cout << "A sendCleartext" << std::endl;
    }
	void sendEncrypted(const std::string& msg) 
    {
        std::cout << "A sendEncrypted" << std::endl;
    }
};


class CompanyB
{
public:
	void sendCleartext(const std::string& msg) 
    {
        std::cout << "B sendCleartext" << std::endl;
    }
	void sendEncrypted(const std::string& msg) 
    {
        std::cout << "B sendEncrypted" << std::endl;
    }
};


class MsgInfo {
public:
    MsgInfo(std::string msg):msg_(msg){}
private:
	std::string msg_{};
};


template<typename Company>
class MsgSender
{
public:

	void sendClear(const MsgInfo& info)
	{
		std::string msg;
		Company c;
		c.sendCleartext(msg);
	}

	void sendSecret(const MsgInfo& info)
	{
	}
};


template<typename Company>
class LoggingMsgSender : public MsgSender<Company>
{
public:
	void sendClearMsg(const MsgInfo& info)
	{
        sendClear(info);
	}
};

int main()
{
    MsgInfo info("test");
    LoggingMsgSender<CompanyB> loggingMsgSender;
    loggingMsgSender.sendClearMsg(info);
}
```

编译输出如下：

```shell
/home/work/cpp_proj/test2/main.cpp: In member function ‘void LoggingMsgSender<Company>::sendClearMsg(const MsgInfo&)’:
/home/work/cpp_proj/test2/main.cpp:63:9: error: there are no arguments to ‘sendClear’ that depend on a template parameter, so a declaration of ‘sendClear’ must be available [-fpermissive]
         sendClear(info);
         ^~~~~~~~~
/home/work/cpp_proj/test2/main.cpp:63:9: note: (if you use ‘-fpermissive’, G++ will accept your code, but allowing the use of an undeclared name is deprecated)
/home/work/cpp_proj/test2/main.cpp: In instantiation of ‘void LoggingMsgSender<Company>::sendClearMsg(const MsgInfo&) [with Company = CompanyB]’:
/home/work/cpp_proj/test2/main.cpp:71:39:   required from here
/home/work/cpp_proj/test2/main.cpp:63:18: error: ‘sendClear’ was not declared in this scope, and no declarations were found by argument-dependent lookup at the point of instantiation [-fpermissive]
         sendClear(info);
         ~~~~~~~~~^~~~~~
/home/work/cpp_proj/test2/main.cpp:63:18: note: declarations in dependent base ‘MsgSender<CompanyB>’ are not found by unqualified lookup
/home/work/cpp_proj/test2/main.cpp:63:18: note: use ‘this->sendClear’ instead
```


从编译的输出也可以看出，原因是编译器觉得```sendClear```含义不明确，编译器也给出了解决办法，使用```this->sendClear```，这里我们要思考的是，为什么编译器会找不到```sendClear```函数呢？ 不是就定义在模板基类中吗？

实际上原因就是基类是一个模板类， 而模板类是可以被特化的，例如这里又有了一个```CompanyZ```，而MsgSender对于CompanyZ的特化版本可能就没有```sendClear```方法，因此编译器才会说```sendClear```含义不明确。

```cpp
class CompanyZ
{
public:
	void sendEncrypted(const std::string& msg) {}
};


template<>
class MsgSender<CompanyZ>
{
public:
	void sendSecret(const MsgInfo& info)
	{
	}
};

```


好了，知道了原因之后，那么就可以给出解决办法了，其实上面编译器也已经给出来一种办法。

**第一种**就是在派生类中调用模板基类中的方法时加上```this->```。

```cpp
template<typename Company>
class LoggingMsgSender : public MsgSender<Company>
{
public:
	void sendClearMsg(const MsgInfo& info)
	{
        this->sendClear(info);
	}
};
```

[have a try](https://godbolt.org/z/hMEcPoEPf)

**第二种**就是在派生类中调用模板基类中的方法时加上使用```using```

```cpp
template<typename Company>
class LoggingMsgSender : public MsgSender<Company>
{
using MsgSender<Company>::sendClear;

public:
	void sendClearMsg(const MsgInfo& info)
	{
		sendClear(info);
	}
};

```
[have a try](https://godbolt.org/z/M6TYofo6n)


**第三种**就是在派生类中明确指出使用```MsgSender<Company>::sendClear(info)```。

```cpp
template<typename Company>
class LoggingMsgSender : public MsgSender<Company>
{
public:
	void sendClearMsg(const MsgInfo& info)
	{
		MsgSender<Company>::sendClear(info);
	}
};

```

[have a try](https://godbolt.org/z/e43z7T7rc)


最后提一句，如果子类不是一个模板类，编译时也是不会有问题的，因为很明确。
```cpp
class LoggingMsgSender : public MsgSender<CompanyB>
{
public:
	void sendClearMsg(const MsgInfo& info)
	{
        sendClear(info);
	}
};
```

## 总结

- 在派生类模板中如果需要调用模板基类的方法，需要使用this->，或者明确指出名称。