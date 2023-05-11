---
category: 
- C++
- effective Modern C++
---

# Item23：右值引用，移动语义，完美转发


## 总结

- ```std::move```执行到右值的无条件的转换，但就自身而言，它不移动任何东西。
- ```std::forward```只有当它的参数被绑定到一个右值时，才将参数转换为右值。
- ```std::move```和```std::forward```在运行期什么也不做。