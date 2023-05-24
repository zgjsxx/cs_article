```cpp
#include <iostream>
#include <type_traits>

class PrivateX { int x; };
class ProtectedX { protected: int x; };
class PublicX { public: int x; };
class NoX {};

template <typename T>
class IsPublicMember {
  template <typename U = T>
  static std::true_type Test(decltype(std::declval<U>().x)*);

  template <typename U = T>
  static std::false_type Test(...);

public:
  constexpr static bool value = decltype(Test(0))::value;
};

template <typename T>
class IsProtectedMember {
  struct Derived : T {
    template <typename U = Derived>
    static std::true_type Test(decltype(std::declval<U>().x)*);

    template <typename U = Derived>
    static std::false_type Test(...);
  };

public:
  constexpr static bool value = decltype(Derived::Test(0))::value;
};

template <typename T>
class IsPrivateMember {
  struct Fallback { int x; };

  struct Derived : T, Fallback {
    template <typename U = Derived>
    static std::false_type Test(decltype(std::declval<U>().x)*);

    template <typename U = Derived>
    static std::true_type Test(...);

    constexpr static bool value = decltype(Test(0))::value;
  };

public:
  constexpr static bool value = decltype(Derived::Test(0))::value;
};

template <typename T>
constexpr const char* DetectMember() {
  if constexpr (IsPublicMember<T>::value) {
    return "public";
  } else if constexpr (IsProtectedMember<T>::value) {
    return "protected";
  } else if constexpr (IsPrivateMember<T>::value) {
    return "private";
  } else {
    return "member does not exist";
  }
}

int main() {
  std::cout << DetectMember<PublicX>() << std::endl;
  std::cout << DetectMember<ProtectedX>() << std::endl;
  std::cout << DetectMember<PrivateX>() << std::endl;
  std::cout << DetectMember<NoX>() << std::endl;

  return 0;
}
```


https://www.zhihu.com/question/543037078/answer/2572261125