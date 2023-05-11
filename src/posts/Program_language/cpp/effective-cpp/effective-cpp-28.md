---
category: 
- C++
tag:
- C++
- effective c++读书笔记
---

# effective c++ 28 避免返回handles指向对象内部成分

本节也是作者的一个建议，让我们避免返回handles，handle包含了指针，引用和迭代器等等，并阐述了如果返回handle可能会引起哪些问题。和上一节类似，是作者的一个建议，并不意味着在任何时候都不可以返回handle。 

下面就看看返回handle可能存在的问题。upperLeft是一个const函数，但是其返回了Point&， 这就意味着，虽然在upperLeft内部虽然不会修改成员变量，但在函数外部却可以进行修改！ 这是矛盾的，也一定程度上破坏了封装性。

## 分析

返回handle可能带来的第一个问题就是可能导致封装性的降低。

看下面的例子，

```cpp
#include <memory>

	// class for representing points
class Point
{
public:
	Point() {}
	Point(int xx, int yy) : x(xx), y(yy) {}
	void setX(int newX) { x = newX; }
	void setY(int newY) { y = newY; }

private:
	int x, y;
};

// Point data for a Rectangle
struct RectData
{
	//RectData() {}
	RectData(Point p1, Point p2)
	{
		ulhc = p1;
		lrhc = p2;
	}
	Point ulhc;	// upper left hand corner
	Point lrhc;	// lower rght hand corner
};

class Rectangle
{
public:
	Rectangle(Point p1, Point p2) : pData(create(p1, p2))
	{
	}

	Point& upperLeft() const { return pData->ulhc; }
	Point& lowerRight() const { return pData->lrhc; }

private:
	std::shared_ptr<RectData> pData;
	RectData* create(Point p1, Point p2)
	{
		return new RectData(p1, p2);
	}
};

int main()
{
    Point p1(0, 0);
    Point p2(100, 100);
    const Rectangle rec(p1, p2);
    rec.upperLeft().setX(50);
}
```

[have a try](https://godbolt.org/z/fE36T3rn5)

那么如何修改呢？

很简单，在upperLeft的返回值中加上const， 这样就不允许去修改rectangle内部的point,只能获取。

```cpp
const	Point& upperLeft() const { return pData->ulhc; }
const	Point& lowerRight() const { return pData->lrhc; }
```

[have a try](https://godbolt.org/z/xo33z1nPK)

下面便是第二个问题，upperLeft可能还会导致悬空引用的问题。看下面的例子：

boundingBox的调用可以获取一个新的rectangle的临时对象，并将其upperLeft的point返回给指针。但是这句话执行完毕之后，这个对象就已经被析构了，这是一个右值。也就是此时的pUpperLeft的指针指向了栈空间中的一个被析构的对象，这是很危险的，容易引起段错误。


```cpp
const Rectangle boundingBox(const GuiObject& obj)
{
	Rectangle r;
	return r;
}

int main()
{
	// make pgo point to some GUI object
	GuiObject* pgo = new GuiObject;

	// get ptr to the upper left point of its bounding box
	const Point* pUpperLeft = &(boundingBox(*pgo)).upperLeft();
}
```

这便是作者给出的两点理由，当然这也是作者的建议，并不意味着任何时候都不能返回。

## 总结

- 避免返回handles(包括references、指针、迭代器)指向对象内部。遵守这个条款可增加封装性，帮助const成员函数的行为像一个const，并将发生悬空指针(引用)的可能性降至最低。
