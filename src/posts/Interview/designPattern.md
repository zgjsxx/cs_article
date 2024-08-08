
---
category: 
- 面经
tag:
- 设计模式面经
---

- [设计模式面经](#设计模式面经)
  - [创建型模式](#创建型模式)
    - [工厂方法](#工厂方法)
  - [结构性模式](#结构性模式)
    - [适配器模式](#适配器模式)
  - [行为型模式](#行为型模式)
    - [策略模式](#策略模式)


# 设计模式面经

## 创建型模式

### 工厂方法

工厂方法模式（Factory Method Pattern）定义了一个创建对象的接口，但由子类决定实例化哪一个类。工厂方法将对象的实例化推迟到子类。

1.定义 Shape 接口

```cpp
// Shape.h
#ifndef SHAPE_H
#define SHAPE_H

class Shape {
public:
    virtual void draw() = 0;  // 纯虚函数
    virtual ~Shape() {}
};

#endif // SHAPE_H

```

2.定义 Circle 类

```cpp
// Circle.h
#ifndef CIRCLE_H
#define CIRCLE_H

#include "Shape.h"
#include <iostream>

class Circle : public Shape {
public:
    void draw() override {
        std::cout << "Drawing Circle" << std::endl;
    }
};

#endif // CIRCLE_H
```

3.定义 Square 类

```cpp
// Square.h
#ifndef SQUARE_H
#define SQUARE_H

#include "Shape.h"
#include <iostream>

class Square : public Shape {
public:
    void draw() override {
        std::cout << "Drawing Square" << std::endl;
    }
};

#endif // SQUARE_H

```

4.定义工厂接口 ShapeFactory

```cpp
// ShapeFactory.h
#ifndef SHAPEFACTORY_H
#define SHAPEFACTORY_H

#include "Shape.h"

class ShapeFactory {
public:
    virtual Shape* createShape() = 0;  // 纯虚函数
    virtual ~ShapeFactory() {}
};

#endif // SHAPEFACTORY_H
```

5.定义具体工厂类 CircleFactory 和 SquareFactory

```cpp
// CircleFactory.h
#ifndef CIRCLEFACTORY_H
#define CIRCLEFACTORY_H

#include "ShapeFactory.h"
#include "Circle.h"

class CircleFactory : public ShapeFactory {
public:
    Shape* createShape() override {
        return new Circle();
    }
};

#endif // CIRCLEFACTORY_H

// SquareFactory.h
#ifndef SQUAREFACTORY_H
#define SQUAREFACTORY_H

#include "ShapeFactory.h"
#include "Square.h"

class SquareFactory : public ShapeFactory {
public:
    Shape* createShape() override {
        return new Square();
    }
};

#endif // SQUAREFACTORY_H

```

6.测试工厂方法模式

```cpp
// main.cpp
#include <iostream>
#include "ShapeFactory.h"
#include "CircleFactory.h"
#include "SquareFactory.h"

int main() {
    ShapeFactory* factory;

    // 创建 Circle 对象
    factory = new CircleFactory();
    Shape* shape1 = factory->createShape();
    shape1->draw();
    delete shape1;
    delete factory;

    // 创建 Square 对象
    factory = new SquareFactory();
    Shape* shape2 = factory->createShape();
    shape2->draw();
    delete shape2;
    delete factory;

    return 0;
}
```

相对于简单工厂模式，工厂方法模式（Factory Method Pattern）有以下几个主要好处：

1.遵循开闭原则

开闭原则（Open/Closed Principle）是面向对象设计的重要原则之一，它要求软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。工厂方法模式遵循开闭原则，而简单工厂模式则不完全遵循。

- 简单工厂模式：当需要添加新的产品类型时，必须修改工厂类以添加新产品的创建逻辑。这意味着工厂类需要修改，从而违反了开闭原则。
- 工厂方法模式：当需要添加新的产品类型时，只需创建一个新的具体工厂类和相应的产品类，无需修改现有的工厂接口和客户端代码。这使得系统更易于扩展。

2.更好的代码组织和管理

工厂方法模式将产品创建逻辑封装在不同的具体工厂类中，每个具体工厂类负责一种产品的创建。

- 简单工厂模式：所有产品的创建逻辑集中在一个工厂类中，随着产品种类的增加，工厂类会变得庞大且复杂，不利于代码的维护和管理。
- 工厂方法模式：将不同产品的创建逻辑分散在各自的具体工厂类中，每个工厂类的职责单一，代码更加清晰易懂，便于管理和维护。

3.更高的灵活性和可扩展性

工厂方法模式通过引入抽象工厂接口，使得客户端代码依赖于抽象而非具体实现，从而提高了系统的灵活性。

- 简单工厂模式：客户端依赖于具体的工厂类，当工厂类需要修改时，客户端代码也可能需要调整。
- 工厂方法模式：客户端依赖于抽象工厂接口和产品接口，具体实现类的变化对客户端代码透明，从而提高了系统的灵活性和可扩展性。


## 结构性模式

### 适配器模式

日志系统

假设你有一个旧的日志类 ```OldLogger```，它的接口 ```logMessage(std::string msg)```，但你的系统希望使用新的接口 Logger，该接口提供 ```log(std::string msg, LogLevel level)``` 方法。

```cpp
#include <iostream>
#include <string>

// 旧的日志类
class OldLogger {
public:
    void logMessage(const std::string& msg) {
        std::cout << "Old Logger: " << msg << std::endl;
    }
};

// 新的日志接口
enum class LogLevel {
    INFO,
    WARNING,
    ERROR
};

class Logger {
public:
    virtual void log(const std::string& msg, LogLevel level) = 0;
};

// 适配器类
class LoggerAdapter : public Logger {
private:
    OldLogger* oldLogger;

public:
    LoggerAdapter() {
        oldLogger = new OldLogger();
    }

    void log(const std::string& msg, LogLevel level) override {
        std::string levelStr;
        switch (level) {
            case LogLevel::INFO:
                levelStr = "INFO: ";
                break;
            case LogLevel::WARNING:
                levelStr = "WARNING: ";
                break;
            case LogLevel::ERROR:
                levelStr = "ERROR: ";
                break;
        }
        oldLogger->logMessage(levelStr + msg);
    }

    ~LoggerAdapter() {
        delete oldLogger;
    }
};

int main() {
    Logger* logger = new LoggerAdapter();
    logger->log("This is an information message.", LogLevel::INFO);
    logger->log("This is a warning message.", LogLevel::WARNING);
    logger->log("This is an error message.", LogLevel::ERROR);
    delete logger;
    return 0;
}
```


## 行为型模式

### 策略模式

策略模式（Strategy Pattern）是一种行为设计模式，它允许在运行时选择算法的实现方式。它通过定义一系列的算法，将每一个算法封装起来，并使它们可以互换，从而使得算法的变化不会影响使用算法的客户。

以下是一个简单的 C++ 示例，展示了如何使用策略模式来实现不同的排序算法。

示例：策略模式实现排序算法

1.定义策略接口

首先，定义一个策略接口 ```SortStrategy```，该接口声明了所有具体策略类需要实现的方法：

```c
#include <vector>
#include <iostream>

// 策略接口
class SortStrategy {
public:
    virtual ~SortStrategy() = default;
    virtual void sort(std::vector<int>& data) const = 0;
};
```
2.实现具体策略

然后，实现具体的排序策略。例如，冒泡排序和插入排序：

```c
// 冒泡排序策略
class BubbleSortStrategy : public SortStrategy {
public:
    void sort(std::vector<int>& data) const override {
        int n = data.size();
        for (int i = 0; i < n - 1; ++i) {
            for (int j = 0; j < n - i - 1; ++j) {
                if (data[j] > data[j + 1]) {
                    std::swap(data[j], data[j + 1]);
                }
            }
        }
    }
};

// 插入排序策略
class InsertionSortStrategy : public SortStrategy {
public:
    void sort(std::vector<int>& data) const override {
        int n = data.size();
        for (int i = 1; i < n; ++i) {
            int key = data[i];
            int j = i - 1;
            while (j >= 0 && data[j] > key) {
                data[j + 1] = data[j];
                --j;
            }
            data[j + 1] = key;
        }
    }
};
```

3.上下文类

定义一个 Sorter 类，它使用 SortStrategy 进行排序：

```cpp
class Sorter {
public:
    Sorter(SortStrategy* strategy) : strategy_(strategy) {}

    void setStrategy(SortStrategy* strategy) {
        strategy_ = strategy;
    }

    void sort(std::vector<int>& data) {
        strategy_->sort(data);
    }

private:
    SortStrategy* strategy_;
};
```

4.使用策略模式

在 main 函数中使用策略模式来选择不同的排序算法：

```cpp
int main() {
    // 创建数据
    std::vector<int> data = {64, 34, 25, 12, 22, 11, 90};

    // 使用冒泡排序策略
    SortStrategy* bubbleSort = new BubbleSortStrategy();
    Sorter sorter(bubbleSort);
    sorter.sort(data);

    std::cout << "Bubble Sort Result: ";
    for (int num : data) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // 更改策略为插入排序
    SortStrategy* insertionSort = new InsertionSortStrategy();
    sorter.setStrategy(insertionSort);
    data = {64, 34, 25, 12, 22, 11, 90}; // 重新定义数据
    sorter.sort(data);

    std::cout << "Insertion Sort Result: ";
    for (int num : data) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // 清理内存
    delete bubbleSort;
    delete insertionSort;

    return 0;
}
```