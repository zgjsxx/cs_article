
---
category: 
- 面经
tag:
- 设计模式面经
---

- [设计模式面经](#设计模式面经)
  - [设计模式的几大原则](#设计模式的几大原则)
  - [创建型模式](#创建型模式)
    - [工厂方法](#工厂方法)
  - [结构型模式](#结构型模式)
    - [适配器模式](#适配器模式)
    - [桥接模式](#桥接模式)
    - [组合模式](#组合模式)
    - [享元模式](#享元模式)
  - [行为型模式](#行为型模式)
    - [策略模式](#策略模式)
  - [装饰器模式和代理模式的区别](#装饰器模式和代理模式的区别)


# 设计模式面经

## 设计模式的几大原则

设计模式的原则是软件设计中用于创建更灵活、可维护和可扩展的系统的基本指导原则。这些原则帮助开发者在设计过程中做出更好的决策，避免常见的设计错误。以下是一些重要的设计模式原则：

**1. 单一职责原则 (Single Responsibility Principle, SRP)**
定义：一个类应该只有一个引起它变化的原因，即一个类只负责一项职责。
目的：减少类的复杂性，使其更易于理解和维护。如果一个类承担多种职责，那么每种职责的变化都可能影响到这个类。

**2. 开放封闭原则 (Open/Closed Principle, OCP)**
定义：软件实体（类、模块、函数等）应该对扩展开放，对修改封闭。
目的：当需求变化时，可以通过扩展原有功能而不是修改已有代码来实现新的需求，从而提高系统的稳定性和灵活性。

**3. 里氏替换原则 (Liskov Substitution Principle, LSP)**
定义：子类型必须能够替换掉它们的基类型，且不影响程序的正确性。
目的：确保继承关系的正确性，即子类对象能完全替代父类对象，使得父类的调用者能够透明地使用子类的实例。

**4. 依赖倒置原则 (Dependency Inversion Principle, DIP)**
定义：高层模块不应该依赖于低层模块，两者都应该依赖于抽象。抽象不应该依赖于细节，细节应该依赖于抽象。
目的：通过依赖抽象（接口或抽象类），而不是具体实现，来减少类之间的耦合性，提高系统的灵活性和可维护性。

**5. 接口隔离原则 (Interface Segregation Principle, ISP)**
定义：客户端不应该被迫依赖于它不使用的方法，应该将庞大的接口拆分为更小、更具体的接口，使得客户端只需了解它所需的接口。
目的：通过接口分离降低系统的复杂性，避免由于接口臃肿导致的实现类的复杂性。

**6. 合成复用原则 (Composite Reuse Principle, CRP)**
定义：优先使用对象组合（即“has-a”关系）而不是继承（即“is-a”关系）来达到代码复用的目的。
目的：通过组合来提高代码的复用性和灵活性，减少继承带来的紧耦合问题。

**7. 迪米特法则 (Law of Demeter, LoD)**
定义：一个对象应该对其他对象有尽可能少的了解，即“最少知识原则”。
目的：减少对象之间的依赖关系，降低系统的耦合度，从而提高系统的模块化和维护性。

**8. 优先使用组合而不是继承**
定义：与继承相比，优先使用对象组合来复用代码。
目的：通过组合，类之间的依赖性较低，系统结构更灵活，容易扩展。

**总结**

这些设计原则在实践中相互作用，共同促进了高质量的代码设计。理解并运用这些原则，可以帮助开发者设计出更易维护、更具弹性的软件系统。

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


## 结构型模式

### 适配器模式

适配器模式可以分为对象适配器模式（Object Adapter）和类适配器模式（Class Adapter）两种。

**1.对象适配器模式（Object Adapter Pattern）**

对象适配器通过组合的方式实现。适配器类内部持有一个需要适配对象的实例，通过将请求委托给该实例来实现适配。对象适配器不涉及继承，适配器和被适配者是两个独立的对象。例如一个日志系统:

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

**2.类适配器模式（Class Adapter Pattern）**

类适配器通过多重继承的方式实现。适配器类同时继承了目标接口和需要适配的类，通过重写目标接口的方法，将调用转发给适配的类。

```cpp
#include <iostream>

// 目标接口
class ITarget {
public:
    virtual void request() = 0;
    virtual ~ITarget() = default;
};

// 需要适配的类
class Adaptee {
public:
    void specificRequest() {
        std::cout << "Adaptee's specific request" << std::endl;
    }
};

// 类适配器类
class ClassAdapter : public ITarget, private Adaptee {
public:
    void request() override {
        specificRequest();  // 直接调用Adaptee的方法
    }
};

int main() {
    ITarget* adapter = new ClassAdapter();

    adapter->request();  // 调用Target接口

    delete adapter;

    return 0;
}
```

在这个例子中，```ClassAdapter``` 类继承了 ```ITarget``` 接口和 ```Adaptee``` 类，并在 ```request()``` 方法中直接调用 ```Adaptee``` 的 ```specificRequest()``` 方法。这种方式使用了多重继承。

**对象适配器与类适配器的区别**
- 对象适配器使用组合方式实现，可以适配多个不同的类，但无法修改适配的类；适配器和适配的类是松散耦合的。
- 类适配器使用多重继承方式实现，继承了适配的类，因此可以直接访问其接口和方法；但由于C++不支持多重继承与抽象类一起使用，会导致继承接口受限，且适配器和适配的类是紧密耦合的。

**选择适配器模式的依据**
- 对象适配器更常用，因为它灵活且可以适配多个不同的类。一般推荐使用对象适配器模式。
- 类适配器更适用于你只需要适配一个类，并且该类的所有方法你都可以直接使用的情况。

### 桥接模式

**桥接模式的作用**
桥接模式的核心作用是将**抽象部分与实现部分**分离，从而使它们可以独立地进行扩展和变化。这种分离提供了更好的灵活性和可维护性：

- 解耦抽象与实现：在传统的继承结构中，抽象和实现是紧密耦合的，这意味着每当抽象部分发生变化时，实现部分也可能需要改变。而桥接模式通过引入一个实现接口，将两者解耦，从而允许它们独立地演化。

- 增强系统的可扩展性：使用桥接模式后，可以在不修改现有代码的情况下，增加新的实现方式或新的抽象类型。这使得系统更容易扩展和维护。

- 提高灵活性：由于桥接模式将抽象与实现部分分离，客户端可以在运行时选择不同的实现部分，而无需了解实现的具体细节。

**桥接模式的使用场景**

桥接模式适用于以下场景：

- 当一个类存在多个可能的扩展方向，并且每种扩展都可能有不同的实现时。例如，在一个图形绘制系统中，可以有不同的图形类型（如圆形、矩形等）和不同的绘制方式（如矢量绘制、光栅绘制等），桥接模式允许你在不影响客户端代码的情况下独立扩展图形类型和绘制方式。不使用桥接模式时，则需要使用图形类型的个数*光栅绘制个数的类去进行管理。

- 需要在不同的实现之间进行切换时。例如，如果一个系统需要在不同的平台或环境（如Windows、Linux等）下运行，每个平台有不同的实现细节，桥接模式可以让你在不修改抽象部分的情况下轻松切换实现。

- 避免类的继承层次过于复杂时。当系统需要继承多个维度的类时，传统的继承会导致类爆炸（即类的数量过多且结构复杂），使用桥接模式可以将这些维度分开，减少类的数量和复杂度。

当系统需要在运行时动态切换实现时，桥接模式允许系统在运行时绑定具体实现，而不需要重新编译。

假设我们有一个图形绘制系统，支持不同类型的图形（如圆形和矩形），同时可以使用不同的绘制方式（如用矢量图形绘制和用光栅图形绘制）。使用桥接模式，可以将“图形类型”和“绘制方式”分开，使得两者可以独立变化。

```cpp
#include <iostream>

// 实现接口（Implementor）
class DrawingImplementor {
public:
    virtual void drawCircle(double x, double y, double radius) = 0;
    virtual void drawRectangle(double x1, double y1, double x2, double y2) = 0;
    virtual ~DrawingImplementor() = default;
};

// 具体实现类（ConcreteImplementor） - 矢量绘图实现
class VectorDrawingImplementor : public DrawingImplementor {
public:
    void drawCircle(double x, double y, double radius) override {
        std::cout << "Vector drawing: Circle at (" << x << ", " << y << ") with radius " << radius << std::endl;
    }

    void drawRectangle(double x1, double y1, double x2, double y2) override {
        std::cout << "Vector drawing: Rectangle from (" << x1 << ", " << y1 << ") to (" << x2 << ", " << y2 << ")" << std::endl;
    }
};

// 具体实现类（ConcreteImplementor） - 光栅绘图实现
class RasterDrawingImplementor : public DrawingImplementor {
public:
    void drawCircle(double x, double y, double radius) override {
        std::cout << "Raster drawing: Circle at (" << x << ", " << y << ") with radius " << radius << std::endl;
    }

    void drawRectangle(double x1, double y1, double x2, double y2) override {
        std::cout << "Raster drawing: Rectangle from (" << x1 << ", " << y1 << ") to (" << x2 << ", " << y2 << ")" << std::endl;
    }
};

// 抽象类（Abstraction）
class Shape {
protected:
    DrawingImplementor* implementor;  // 持有实现部分的引用

public:
    Shape(DrawingImplementor* imp) : implementor(imp) {}
    virtual void draw() = 0;  // 抽象方法，交由具体类实现
    virtual ~Shape() = default;
};

// 扩展抽象类（RefinedAbstraction） - 圆形
class Circle : public Shape {
private:
    double x, y, radius;

public:
    Circle(DrawingImplementor* imp, double x, double y, double radius)
        : Shape(imp), x(x), y(y), radius(radius) {}

    void draw() override {
        implementor->drawCircle(x, y, radius);  // 调用实现部分的方法
    }
};

// 扩展抽象类（RefinedAbstraction） - 矩形
class Rectangle : public Shape {
private:
    double x1, y1, x2, y2;

public:
    Rectangle(DrawingImplementor* imp, double x1, double y1, double x2, double y2)
        : Shape(imp), x1(x1), y1(y1), x2(x2), y2(y2) {}

    void draw() override {
        implementor->drawRectangle(x1, y1, x2, y2);  // 调用实现部分的方法
    }
};

int main() {
    // 使用矢量绘图实现
    DrawingImplementor* vectorDrawer = new VectorDrawingImplementor();
    Shape* vectorCircle = new Circle(vectorDrawer, 10, 10, 5);
    Shape* vectorRectangle = new Rectangle(vectorDrawer, 0, 0, 15, 15);

    vectorCircle->draw();
    vectorRectangle->draw();

    // 使用光栅绘图实现
    DrawingImplementor* rasterDrawer = new RasterDrawingImplementor();
    Shape* rasterCircle = new Circle(rasterDrawer, 20, 20, 10);
    Shape* rasterRectangle = new Rectangle(rasterDrawer, 5, 5, 25, 25);

    rasterCircle->draw();
    rasterRectangle->draw();

    delete vectorCircle;
    delete vectorRectangle;
    delete rasterCircle;
    delete rasterRectangle;
    delete vectorDrawer;
    delete rasterDrawer;

    return 0;
}
```

**代码解析**

- Implementor接口 (DrawingImplementor)：定义了绘制操作的接口，如绘制圆形和矩形的方法。
- ConcreteImplementor类 (VectorDrawingImplementor 和 RasterDrawingImplementor)：分别实现了矢量绘图和光栅绘图的具体操作。
- Abstraction类 (Shape)：定义了形状的抽象接口，并持有 DrawingImplementor 的引用。
- RefinedAbstraction类 (Circle 和 Rectangle)：具体实现了不同形状的类，它们通过调用 DrawingImplementor 的具体实现来完成绘图操作。

在前面的例子中，图形绘制系统通过桥接模式将**图形的抽象部分（如Circle和Rectangle）与绘制的实现部分（如VectorDrawingImplementor和RasterDrawingImplementor）**分离：

- 抽象部分 (Shape) 定义了图形的公共接口，它并不直接实现绘制操作，而是依赖于实现部分 (DrawingImplementor) 来执行具体的绘制。
- 实现部分 提供了具体的绘制方法，可以有不同的实现方式，如矢量绘图和光栅绘图。

这种设计使得你可以很容易地添加新的图形类型或新的绘制方式，而不需要修改现有的代码。例如，添加一个新的图形 Triangle 或者一个新的绘制实现 OpenGLDrawingImplementor，只需要分别扩展 Shape 和 DrawingImplementor 即可。

**桥接模式的实际应用**

桥接模式在许多领域都有广泛应用，特别是在以下系统中：

- GUI工具库：如Java的AWT和Swing，使用桥接模式分离了图形控件和它们的绘制实现。
- 数据库访问层：桥接模式可以用于分离数据库访问接口和具体的数据库实现，使得支持多种数据库变得容易。
- 设备控制软件：例如，支持多种硬件设备的驱动程序中，桥接模式可以将设备接口与具体的设备实现分开，以支持不同类型的设备。

通过以上的总结和具体的应用场景说明，可以更清楚地理解桥接模式在解耦、扩展性和灵活性方面的重要性。

### 组合模式

不使用组合模式的情况
假设我们有一个系统需要处理图形对象，比如椭圆 (Ellipse) 和矩形 (Rectangle)，并且还需要处理由这些图形对象组成的图形组 (GraphicGroup)。

如果不使用组合模式，我们可能会设计如下的类：

```cpp
#include <iostream>
#include <vector>

class Ellipse {
public:
    void draw() const {
        std::cout << "Drawing an Ellipse" << std::endl;
    }
};

class Rectangle {
public:
    void draw() const {
        std::cout << "Drawing a Rectangle" << std::endl;
    }
};

class GraphicGroup {
public:
    void addEllipse(const Ellipse& ellipse) {
        ellipses.push_back(ellipse);
    }

    void addRectangle(const Rectangle& rectangle) {
        rectangles.push_back(rectangle);
    }

    void draw() const {
        for (const auto& ellipse : ellipses) {
            ellipse.draw();
        }
        for (const auto& rectangle : rectangles) {
            rectangle.draw();
        }
    }

private:
    std::vector<Ellipse> ellipses;
    std::vector<Rectangle> rectangles;
};

int main() {
    Ellipse e1, e2;
    Rectangle r1;

    GraphicGroup group;
    group.addEllipse(e1);
    group.addEllipse(e2);
    group.addRectangle(r1);

    group.draw();

    return 0;
}
```
问题：
- GraphicGroup只能处理特定的图形对象（如 Ellipse 和 Rectangle），不能扩展到处理其他类型的图形。
- 如果你添加更多的图形类型，你需要修改 GraphicGroup 的代码以适应这些新类型，这违反了开闭原则（OCP）。

**使用组合模式的情况**

使用组合模式时，我们可以创建一个统一的抽象类 Graphic，并让 Ellipse、Rectangle 和 GraphicGroup 都继承这个抽象类。这样，客户端代码可以一致地处理单个图形和图形组。

```cpp
#include <iostream>
#include <vector>
#include <memory>

// 抽象基类
class Graphic {
public:
    virtual void draw() const = 0;
    virtual ~Graphic() = default;
};

// 具体图形类：椭圆
class Ellipse : public Graphic {
public:
    void draw() const override {
        std::cout << "Drawing an Ellipse" << std::endl;
    }
};

// 具体图形类：矩形
class Rectangle : public Graphic {
public:
    void draw() const override {
        std::cout << "Drawing a Rectangle" << std::endl;
    }
};

// 组合类：图形组
class GraphicGroup : public Graphic {
public:
    void add(std::shared_ptr<Graphic> graphic) {
        children.push_back(graphic);
    }

    void draw() const override {
        for (const auto& child : children) {
            child->draw();
        }
    }

private:
    std::vector<std::shared_ptr<Graphic>> children;
};

int main() {
    std::shared_ptr<Graphic> e1 = std::make_shared<Ellipse>();
    std::shared_ptr<Graphic> e2 = std::make_shared<Ellipse>();
    std::shared_ptr<Graphic> r1 = std::make_shared<Rectangle>();

    std::shared_ptr<GraphicGroup> group = std::make_shared<GraphicGroup>();
    group->add(e1);
    group->add(e2);
    group->add(r1);

    group->draw();

    return 0;
}
```
使用组合模式的优势：

- 统一接口： 所有图形类 (Ellipse, Rectangle, GraphicGroup) 都实现了相同的接口 Graphic，因此客户端代码可以一致地处理单个对象和组合对象。
- 扩展性强： 可以轻松添加新的图形类型，而无需修改现有的组合类 (GraphicGroup)。
- 简化客户端代码： 客户端不需要区分处理单个对象和组合对象，可以用相同的方式调用 draw() 方法。
- 通过组合模式，我们可以将单个对象和组合对象统一起来，从而简化客户端代码并提高系统的灵活性和可扩展性。

### 享元模式

享元模式（Flyweight Pattern）是一种结构型设计模式，旨在减少程序中创建对象的数量，从而减少内存的占用。它通过共享已经存在的对象来避免重复创建相同对象的代价，尤其在大量细粒度对象被频繁使用的场景下，这种模式非常有用。

**适用场景**

享元模式特别适用于以下场景：

- 程序中有大量相似的对象，并且这些对象的大部分状态是相同的，可以共享。
- 系统需要节省内存，并且对象的数量可能很大。

使用享元模式来管理 ConsoleLogger 和 FileLogger 可以更好地展示如何通过共享内部状态来减少内存开销和对象创建的成本。我们可以让这两种不同类型的日志记录器共享相同的日志级别（或其他配置），而输出到控制台还是文件作为具体实现的细节。

```cpp
#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <memory>

// 抽象享元类
class Logger {
public:
    virtual void log(const std::string& message, const std::string& context) const = 0;
    virtual ~Logger() = default;
};

// 具体享元类 - 控制台日志记录器
class ConsoleLogger : public Logger {
private:
    std::string logLevel; // 共享的内部状态

public:
    ConsoleLogger(const std::string& logLevel) : logLevel(logLevel) {}

    void log(const std::string& message, const std::string& context) const override {
        std::cout << "[" << logLevel << "] " << context << ": " << message << std::endl;
    }
};

// 具体享元类 - 文件日志记录器
class FileLogger : public Logger {
private:
    std::string logLevel; // 共享的内部状态
    std::string filename; // 文件名 - 共享的内部状态

public:
    FileLogger(const std::string& logLevel, const std::string& filename) 
        : logLevel(logLevel), filename(filename) {}

    void log(const std::string& message, const std::string& context) const override {
        std::ofstream ofs(filename, std::ios_base::app);
        if (ofs.is_open()) {
            ofs << "[" << logLevel << "] " << context << ": " << message << std::endl;
            ofs.close();
        }
    }
};

// 享元工厂类，用于管理和创建享元对象
class LoggerFactory {
private:
    std::map<std::string, std::shared_ptr<Logger>> loggers;

    std::string getKey(const std::string& logType, const std::string& logLevel, const std::string& filename = "") const {
        return logType + "-" + logLevel + "-" + filename;
    }

public:
    std::shared_ptr<Logger> getConsoleLogger(const std::string& logLevel) {
        std::string key = getKey("Console", logLevel);
        auto it = loggers.find(key);
        if (it != loggers.end()) {
            return it->second;
        } else {
            auto logger = std::make_shared<ConsoleLogger>(logLevel);
            loggers[key] = logger;
            return logger;
        }
    }

    std::shared_ptr<Logger> getFileLogger(const std::string& logLevel, const std::string& filename) {
        std::string key = getKey("File", logLevel, filename);
        auto it = loggers.find(key);
        if (it != loggers.end()) {
            return it->second;
        } else {
            auto logger = std::make_shared<FileLogger>(logLevel, filename);
            loggers[key] = logger;
            return logger;
        }
    }
};

int main() {
    LoggerFactory factory;

    // 创建不同类型和级别的日志记录器
    auto consoleErrorLogger = factory.getConsoleLogger("ERROR");
    auto consoleInfoLogger = factory.getConsoleLogger("INFO");

    auto fileErrorLogger = factory.getFileLogger("ERROR", "error.log");
    auto fileInfoLogger = factory.getFileLogger("INFO", "info.log");

    // 使用日志记录器记录日志信息
    consoleErrorLogger->log("This is an error message", "Main");
    consoleInfoLogger->log("This is an info message", "Main");

    fileErrorLogger->log("This is an error message", "Main");
    fileInfoLogger->log("This is an info message", "Main");

    // 使用同一个日志类型和级别的记录器
    auto anotherConsoleErrorLogger = factory.getConsoleLogger("ERROR");
    anotherConsoleErrorLogger->log("This is another error message", "Helper");

    auto anotherFileErrorLogger = factory.getFileLogger("ERROR", "error.log");
    anotherFileErrorLogger->log("This is another error message", "Helper");

    // 注意：consoleErrorLogger 和 anotherConsoleErrorLogger 是同一个实例
    // fileErrorLogger 和 anotherFileErrorLogger 也是同一个实例

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

## 装饰器模式和代理模式的区别

**装饰器模式**（Decorator Pattern）和**代理模式**（Proxy Pattern）都是**结构型设计模式**，它们有些相似，但也有不同的目的和用法。以下是它们的主要区别和特点：

**1. 目的**

装饰器模式：主要用于动态地扩展对象的功能，而不修改现有的对象结构。它通过将对象嵌套在一个装饰器对象中，来增加额外的行为或功能。

代理模式：主要用于控制对某个对象的访问，通常用于提供一个替代对象来控制对真实对象的访问。代理对象可以在访问真实对象之前或之后进行一些处理，比如缓存、权限控制、延迟加载等。

**2. 结构**

装饰器模式：

组件（Component）：定义了一个接口，用于实际组件和装饰器的基类。
具体组件（Concrete Component）：实现了 Component 接口的基本对象。
装饰器（Decorator）：实现了 Component 接口，并持有一个 Component 对象的引用，用于添加额外的功能。
具体装饰器（Concrete Decorator）：实现装饰器功能，添加具体的行为或状态。
代理模式：

主题接口（Subject）：定义了代理和真实对象都需要实现的接口。
真实主题（Real Subject）：实现了 Subject 接口，提供实际的业务逻辑。
代理（Proxy）：实现了 Subject 接口，持有 Real Subject 对象的引用，控制对 Real Subject 的访问，可能包括附加的操作。

**3. 用法示例**

装饰器模式示例
```cpp
#include <iostream>
#include <string>

// 组件接口
class Coffee {
public:
    virtual std::string getDescription() const = 0;
    virtual double cost() const = 0;
    virtual ~Coffee() = default;
};

// 具体组件
class SimpleCoffee : public Coffee {
public:
    std::string getDescription() const override {
        return "Simple Coffee";
    }

    double cost() const override {
        return 5.0;
    }
};

// 装饰器
class CoffeeDecorator : public Coffee {
protected:
    Coffee* coffee;
public:
    CoffeeDecorator(Coffee* c) : coffee(c) {}
    virtual ~CoffeeDecorator() { delete coffee; }
};

// 具体装饰器
class MilkDecorator : public CoffeeDecorator {
public:
    MilkDecorator(Coffee* c) : CoffeeDecorator(c) {}

    std::string getDescription() const override {
        return coffee->getDescription() + ", Milk";
    }

    double cost() const override {
        return coffee->cost() + 1.5;
    }
};

int main() {
    Coffee* myCoffee = new SimpleCoffee();
    myCoffee = new MilkDecorator(myCoffee);

    std::cout << myCoffee->getDescription() << ", Cost: $" << myCoffee->cost() << std::endl;

    delete myCoffee;
    return 0;
}
```

```cpp
#include <iostream>
#include <string>

// 主题接口
class Subject {
public:
    virtual void request() const = 0;
    virtual ~Subject() = default;
};

// 真实主题
class RealSubject : public Subject {
public:
    void request() const override {
        std::cout << "RealSubject: Handling request." << std::endl;
    }
};

// 代理
class Proxy : public Subject {
private:
    RealSubject* realSubject;
public:
    Proxy() : realSubject(new RealSubject()) {}
    ~Proxy() { delete realSubject; }

    void request() const override {
        std::cout << "Proxy: Pre-processing before real request." << std::endl;
        realSubject->request();
        std::cout << "Proxy: Post-processing after real request." << std::endl;
    }
};

int main() {
    Proxy proxy;
    proxy.request();
    return 0;
}
```

**4. 主要区别**

功能扩展 vs. 访问控制：

装饰器模式：用于动态地扩展对象的功能，通过在原对象外部添加装饰器。
代理模式：用于控制对对象的访问，可以包括延迟加载、权限检查等。

设计意图：

装饰器模式：意图是通过装饰器链来增加或修改对象的功能。
代理模式：意图是控制对真实对象的访问，通过代理提供额外的功能，如延迟加载或访问控制。

使用场景：

装饰器模式：适用于需要在运行时对对象添加功能，且这些功能的组合是灵活的。
代理模式：适用于需要控制对真实对象的访问，可能涉及延迟初始化、权限验证、记录日志等。

总结
装饰器模式和代理模式都是非常有用的设计模式，但它们解决的问题不同。装饰器模式侧重于扩展对象功能，而代理模式侧重于控制对对象的访问。了解它们的不同可以帮助你在设计系统时选择合适的模式。