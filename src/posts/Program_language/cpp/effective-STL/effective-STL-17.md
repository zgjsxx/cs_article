---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-17 使用交换技巧来修整过剩容量

这个是一个STL的使用技巧。当一个容器需要收缩尺寸的时候，可以使用本文中的方法。

这在对内存有较高要求的场景下，非常有效。

```cpp
#include <iostream>
#include <vector>
int main()
{
	std::vector<int> vec;
	vec.reserve(1000);//这时强制把vec设置为容量是1000
	std::cout << vec.capacity() << std::endl;

	for(int i = 0; i < 10; ++i)//经过循环vec只真正用了10个int内存，还剩990int内存
	{
		vec.push_back(i);
	}

	std::vector<int>(vec).swap(vec);//修剪vec的容量，使其释放多余的内存容量，尽可能保持最小容量
	std::cout << vec.capacity() << std::endl;

    std::vector<int>().swap(vec);//如果将容器的空间减少到0
	std::cout << vec.capacity() << std::endl;
}
```

当然在c++11以后还有其他的办法
```cpp
#include <iostream>
#include <vector>
int main()
{
	std::vector<int> vec;
	vec.reserve(1000);//这时强制把vec设置为容量是1000
	std::cout << vec.capacity() << std::endl;

	for(int i = 0; i < 10; ++i)//经过循环vec只真正用了10个int内存，还剩990int内存
	{
		vec.push_back(i);
	}

	vec.shrink_to_fit();
	std::cout << vec.capacity() << std::endl;
}
```




## 总结

