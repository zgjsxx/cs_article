---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---


# effective c++ 47 请使用trait class 表现类型信息


```cpp
#pragma once

//http://www.cplusplus.com/reference/iterator/iterator_traits/
#include <iterator>

template<typename IterT, typename DistT>
void doAdvance(IterT& iter, DistT d, std::random_access_iterator_tag)
{
	iter += d;
}

template<typename IterT, typename DistT>
void doAdvance(IterT& iter, DistT d, std::bidirectional_iterator_tag)
{
	if (d >= 0)
	{
		while (d--)
		{
			++iter;
		}
	}
	else
	{
		while (d++)
		{
			--iter;
		}
	}
}

template<typename IterT, typename DistT>
void doAdvance(IterT& iter, DistT d, std::input_iterator_tag)
{
	if (d < 0)
	{
		throw std::out_of_range("Negative distance");
	}
	while (d--)
	{
		++iter;
	}
}

template<typename IterT, typename DistT>
void advance(IterT& iter, DistT d)
{
	//doAdvance(iter, d, typename std::iterator_traits<IterT>::iterator_category());

	auto category = typename std::iterator_traits<IterT>::iterator_category();
	doAdvance(iter, d, category);
}

int main()
{
	return 0;
}
```


## 总结
- Trait classes使得"类型相关信息"在编译器可用。它们以templates和templates特化完成实现。
- 整合重载技术后。traits classes有可能在编译器对类型执行if-else测试。