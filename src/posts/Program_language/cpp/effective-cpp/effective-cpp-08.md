---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 08 别让异常逃离析构函数

本文主要讲解了在日常编码中需要注意的一个原则，即在类的析构函数中不要抛出异常。因为类的析构函数的作用是对对象的资源
进行释放。而一旦在析构函数中抛出了异常，那么某些资源就可能无法正常释放。

## 分析

作者使用的例子是一个数据库连接的例子。如下所示， DBConnection是一个数据库连接的类，create方法可以创建一个连接， 而close方法就用于关闭该连接，但是关闭过程中可会失败，这个时候就会抛出异常。

```cpp
#include <stdlib.h>

class DBConnection
{
public:
	// Function to return DBConnection objects.
	static DBConnection create()
	{
		static DBConnection db;
		return db;
	}

	// Close connection; throw an exception if closing fails.
	void close()
	{
		throw 5;
	}
};
```

我们为了避免忘记close， 通常会使用RAII设计模式进行封装。如下所示， 我们新建了一个DBconn的类，该类的析构函数中会调用DBConnection的close方法。 但是由于db.close方法会抛出异常，一方面会造成db.close之后的代码无法执行，另一方面，该异常会扩散到析构函数以外。因此我们不可以这样处理。

```cpp
class DBConn
{
public:
	DBConn(DBConnection database) :
		db(database)
	{
	}

	~DBConn()
	{
        db.close();
	}

private:
	DBConnection db;
};
```

优化方法有两种，一种是直接在析构函数的异常处使用abort，避免异常的扩散。

```cpp
class DBConn
{
public:
	DBConn(DBConnection database) :
		db(database)
	{
	}

	~DBConn()
	{
		try
		{
			db.close();
		}
		catch (...)
		{
			// make log entry.
			std::abort();
		}
	}

private:
	DBConnection db;
};
```

另一种是吞下异常：

```cpp
class DBConn
{
public:
	DBConn(DBConnection database) :
		db(database)
	{
	}

	~DBConn()
	{
		try
		{
			db.close();
		}
		catch (...)
		{
			// make log entry.

		}
	}
private:
	DBConnection db;
};
```

一般而言，将异常吞掉是个坏注意，因为其让数据库连接是否正常关闭变得无法感知。但是有时候吞掉异常，也会比"草率结束程序"要好。

正确的做法是，DBConn需要让用户感知，连接是否正常关闭。为此我们需要为DBConn添加close接口，该接口所抛出的异常由调用者进行处理。并且如果关闭失败的情况下，析构函数仍然会处理。这种做法就是既使得用户可以感知连接状态，又使得关闭行为变得更加的安全。

```cpp
#include <memory>
#include "DBConnection.h"

class DBConn
{
public:
	DBConn(DBConnection database) :
		db(database),
		closed(false)
	{
	}

	~DBConn()
	{
		if (!closed)
		{
			// Try to close connection if client didn't
			try
			{
				db.close();
			}
			catch (...)
			{
				// make log entry.
				std::abort();
			}
		}

	}

	// New function for client to use.
	void close()
	{
		db.close();
		closed = true;
	}

private:
	DBConnection db;
	bool closed;
};
```

## 总结
- 析构函数绝对不要吐出异常。如果一个被析构函数调用的函数可能抛出异常，析构函数应该捕捉任何异常，然后吞下它们(不传播)或结束程序。
- 如果客户需要对某个操作函数运行期间抛出的异常做出反应，那么class应该提供一个普通函数(而非在析构函数中)执行该操作。
  