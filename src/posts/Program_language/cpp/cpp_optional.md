---
category: 
- C++
---

# std::optional的实现原理

```cpp
template <typename T>
class optional
{
	bool _initialized;
	std::aligned_storage_t<sizeof(T), alignof(T)> _storage;
public: 
// operations 
};
```