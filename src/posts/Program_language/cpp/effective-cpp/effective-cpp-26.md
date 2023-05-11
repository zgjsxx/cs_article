---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 26 尽量延后变量定义式的出现时间

本节主要介绍，在很多时候，**如果变量定义的过早，可能变量的定义将无效**。

例如下面的例子，如果password长度小于8，函数将会抛出异常， 那么定义的encrypted的构造和析构将毫无意义。

```cpp
std::string encryptPassword(const std::string& password)
{
    std::string encrypted;
	if (password.length() < 8)
	{
		throw std::logic_error("Password too short");
	}

    encrypted = password;
	encrypt(encrypted);

	return encrypted;
}

```

上面的函数应该修改为下面的形式，延后变量encrypted的定义。

```cpp
std::string encryptPassword(const std::string& password)
{
	if (password.length() < 8)
	{
		throw std::logic_error("Password too short");
	}

	std::string encrypted(password);
	encrypt(encrypted);

	return encrypted;
}
```

## 总结
- 尽量延后变量定义式的出现。这样做可以增加程序的清晰度并改善程序效率。