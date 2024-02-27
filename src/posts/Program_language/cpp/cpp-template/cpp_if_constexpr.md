

```cpp
#include <type_traits>

struct input_iterator_tag {};
struct output_iterator_tag {};
struct forward_iterator_tag : public input_iterator_tag {};
struct bidirectional_iterator_tag : public forward_iterator_tag {};
struct random_access_iterator_tag : public bidirectional_iterator_tag {};

void advance_dispatch_bid()
{
    //
}

// advance 的 random_access_iterator_tag 的版本
void advance_dispatch_random()
{
    //
}

template <class Type>
void advance()
{
     if constexpr(std::is_same_v<Type, random_access_iterator_tag>) 
        return advance_dispatch_random( );
    else
        return advance_dispatch_bid();
}


int main()
{
    advance<random_access_iterator_tag>();
}
```