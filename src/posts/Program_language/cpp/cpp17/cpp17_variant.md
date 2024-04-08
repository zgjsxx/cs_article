
# std::variant

需要一个求解某个类型在可变参数类型中的位置。

```cpp
#include <stdexcept>
#include <vector>
#include <cstring>
#include <utility> // For std::forward
#include <type_traits> // For std::is_same, std::remove_reference


//Position<Ts...> 从 Ts... 找到 T类型的下标
template<int id, typename U, typename T, typename ...Ts>
struct Position {
    constexpr static int pos = std::is_same<U, T>::value ? id : Position<id + 1, U, Ts...>::pos;
};
template<int id, typename U, typename T>
struct Position<id, U, T> {
    constexpr static int pos = id;
};


template<typename ...Ts>
class A
{

public:
    template<typename T>
    int get_index(){
        return Position<0, T, Ts...>::pos;

    }
};

int main(){

A<int, float, double, std::string> a;
std::cout << a.get_index<std::string>() << std::endl;
}
```