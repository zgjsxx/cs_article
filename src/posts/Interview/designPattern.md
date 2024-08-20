
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
    - [装饰模式](#装饰模式)
    - [外观模式](#外观模式)
    - [享元模式](#享元模式)
    - [代理模式](#代理模式)
  - [行为型模式](#行为型模式)
    - [策略模式](#策略模式)
    - [命令模式](#命令模式)
    - [中介者模式](#中介者模式)
    - [责任链模式](#责任链模式)
  - [设计模式的相似的模式的区别](#设计模式的相似的模式的区别)
    - [装饰器模式和代理模式的区别](#装饰器模式和代理模式的区别)
    - [外观模式和适配器模式的区别](#外观模式和适配器模式的区别)


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

### 装饰模式

装饰模式（Decorator Pattern）是一种结构型设计模式，它允许你动态地给对象添加新的功能，而不改变其结构或影响其他对象。装饰模式通过使用一个或多个装饰器类，将功能包装在原始对象的基础之上。

装饰模式的主要作用
- 动态扩展对象功能：无需修改现有类的定义，便可动态地为对象添加新功能。
- 遵循开闭原则：装饰模式允许你在不修改类代码的情况下扩展功能，符合“对扩展开放，对修改封闭”的设计原则。
- 组合功能：你可以通过多个装饰器来组合对象的功能，这比继承更加灵活。

装饰模式的结构
- 抽象组件（Component）：定义一个接口，用于对象的基本功能声明，可以是具体的类或接口。
- 具体组件（ConcreteComponent）：实现抽象组件的类，表示被装饰的原始对象。
- 装饰器（Decorator）：一个抽象类，继承自组件类，并包含一个指向组件的引用。
- 具体装饰器（ConcreteDecorator）：继承自装饰器类，添加额外的功能。

示例场景
假设我们有一个基础的文本类PlainText，表示一段简单的文本。现在，我们想要动态地为这段文本添加不同的格式（如加粗、斜体、下划线等），而不修改原始文本类的代码。

C++ 实现装饰模式

```cpp
#include <iostream>
#include <string>

// 抽象组件（Component）
class Text {
public:
    virtual std::string getText() const = 0;
    virtual ~Text() = default;
};

// 具体组件（ConcreteComponent）
class PlainText : public Text {
private:
    std::string content;

public:
    PlainText(const std::string &text) : content(text) {}

    std::string getText() const override {
        return content;
    }
};

// 装饰器（Decorator）
class TextDecorator : public Text {
protected:
    Text *wrappedText;  // 被装饰的文本对象

public:
    TextDecorator(Text *text) : wrappedText(text) {}

    virtual ~TextDecorator() {
        delete wrappedText;  // 清理内存
    }
};

// 具体装饰器（ConcreteDecorator）1: 加粗
class BoldDecorator : public TextDecorator {
public:
    BoldDecorator(Text *text) : TextDecorator(text) {}

    std::string getText() const override {
        return "<b>" + wrappedText->getText() + "</b>";  // 用<b>标签包裹文本
    }
};

// 具体装饰器（ConcreteDecorator）2: 斜体
class ItalicDecorator : public TextDecorator {
public:
    ItalicDecorator(Text *text) : TextDecorator(text) {}

    std::string getText() const override {
        return "<i>" + wrappedText->getText() + "</i>";  // 用<i>标签包裹文本
    }
};

// 具体装饰器（ConcreteDecorator）3: 下划线
class UnderlineDecorator : public TextDecorator {
public:
    UnderlineDecorator(Text *text) : TextDecorator(text) {}

    std::string getText() const override {
        return "<u>" + wrappedText->getText() + "</u>";  // 用<u>标签包裹文本
    }
};

// 客户端代码
int main() {
    // 创建一个简单的文本对象
    Text *myText = new PlainText("Hello, World!");
    std::cout << "Plain Text: " << myText->getText() << "\n";

    // 为文本添加加粗效果
    myText = new BoldDecorator(myText);
    std::cout << "Bold Text: " << myText->getText() << "\n";

    // 为文本添加斜体效果
    myText = new ItalicDecorator(myText);
    std::cout << "Bold and Italic Text: " << myText->getText() << "\n";

    // 为文本添加下划线效果
    myText = new UnderlineDecorator(myText);
    std::cout << "Bold, Italic, and Underlined Text: " << myText->getText() << "\n";

    // 清理内存
    delete myText;

    return 0;
}

```

**解释**
- PlainText：这是一个具体组件，实现了Text接口。它代表一个简单的文本，内容是“Hello, World!”。
- TextDecorator：这是装饰器的基类，继承自Text接口。它包含一个指向Text对象的指针，用于包装组件并扩展其功能。
- BoldDecorator：具体装饰器类，给文本添加加粗的效果。它通过在文本内容前后加上<b>和</b>标签来实现。
- ItalicDecorator：具体装饰器类，给文本添加斜体效果。它通过在文本内容前后加上<i>和</i>标签来实现。
- UnderlineDecorator：具体装饰器类，给文本添加下划线效果。它通过在文本内容前后加上<u>和</u>标签来实现。

**输出结果**
```cpp
Plain Text: Hello, World!
Bold Text: <b>Hello, World!</b>
Bold and Italic Text: <b><i>Hello, World!</i></b>
Bold, Italic, and Underlined Text: <b><i><u>Hello, World!</u></i></b>
```

**代码说明**
- 简单文本：首先，我们创建一个PlainText对象，其内容为“Hello, World!”。
- 加粗文本：接着，我们用BoldDecorator装饰PlainText，给文本加粗，输出为<b>Hello, World!</b>。
- 加斜体：然后，我们用ItalicDecorator再装饰之前的结果，给文本加上斜体效果，输出为<b><i>Hello, World!</i></b>。
- 加下划线：最后，我们用UnderlineDecorator再次装饰，给文本加上了下划线效果，输出为<b><i><u>Hello, World!</u></i></b>。

**总结**

这个例子展示了如何使用装饰模式来动态地为文本添加不同的格式（如加粗、斜体、下划线等）。通过装饰模式，我们可以灵活地组合不同的格式，而不需要修改原始的文本类。每个装饰器只负责添加一种特定的格式，这样可以自由组合这些装饰器来扩展文本的功能。这种方法比继承更加灵活和可扩展。

### 外观模式

外观模式主要解决的是简化接口和减少系统复杂性的问题。它通过提供一个统一的接口来访问复杂的子系统，隐藏了子系统的内部细节，使客户端更容易使用子系统的功能。换句话说，外观模式的目标是简化和解耦，提供一个更简单的使用方式。

**外观模式的基本概念**

在外观模式中，外观类（Facade）提供了一个统一的接口，客户端通过这个接口来调用子系统的功能。子系统通常是由多个类组成的，而外观类则将这些复杂的操作封装在一个简单的接口中，隐藏了子系统的复杂性。

**外观模式的优点**
- 简化接口：外观模式将复杂的子系统操作封装在一个统一的接口中，简化了客户端的调用。
- 解耦：客户端与子系统之间的依赖减少了，通过外观类，客户端只需与外观类交互，不直接依赖于子系统的具体实现。
- 便于维护：子系统的改动只需修改外观类的实现，而不必更改客户端的代码，从而减少了系统的维护难度。

外观模式的C++代码示例

假设我们有一个复杂的子系统，其中包含多个类，用于处理不同的功能。我们可以使用外观模式来简化这些功能的调用。

子系统类

```cpp
#include <iostream>

class CPU {
public:
    void freeze() {
        std::cout << "CPU freezing..." << std::endl;
    }
    void jump(int position) {
        std::cout << "CPU jumping to position " << position << std::endl;
    }
    void execute() {
        std::cout << "CPU executing..." << std::endl;
    }
};

class Memory {
public:
    void load(int position, const std::string& data) {
        std::cout << "Memory loading data '" << data << "' at position " << position << std::endl;
    }
};

class HardDrive {
public:
    std::string read(int lba, int size) {
        std::cout << "HardDrive reading " << size << " bytes from LBA " << lba << std::endl;
        return "data";
    }
};
```

外观类

```cpp
class ComputerFacade {
private:
    CPU cpu;
    Memory memory;
    HardDrive hardDrive;

public:
    void startComputer() {
        cpu.freeze();
        memory.load(0, hardDrive.read(0, 1024));
        cpu.jump(0);
        cpu.execute();
    }
};
```

客户端代码

```cpp
int main() {
    ComputerFacade computer;
    computer.startComputer();
    return 0;
}
```

解释

**1.子系统类**：

- CPU, Memory, 和 HardDrive 类分别处理计算机的不同方面，如处理器的冻结和执行、内存的加载、硬盘的读取等。

**2.外观类**：

- ComputerFacade 类将这些子系统的复杂操作封装在一个简单的 startComputer 方法中。这个方法调用了子系统中的多个操作，简化了客户端的操作流程。

**3.客户端代码**：

- 在 main 函数中，客户端只需与 ComputerFacade 类交互，通过调用 startComputer 方法启动计算机，而无需直接操作 CPU, Memory, 和 HardDrive 类。这使得客户端的代码更加简洁，且与子系统解耦。

使用外观模式可以有效地将系统的复杂性隐藏在一个简单的接口后面，减少了客户端的复杂度并提高了系统的可维护性。

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


### 代理模式

代理模式（Proxy Pattern）是一种结构型设计模式，它为其他对象提供一种代理以控制对这个对象的访问。代理模式可以在不改变原始对象的前提下，为其提供额外的功能或控制。代理模式的作用主要有以下几个方面：

**代理模式的主要作用**
- 控制访问：代理可以限制或控制对某个对象的访问。例如，在远程代理中，客户端无法直接访问远程对象，代理控制这个访问并管理网络通信。

- 延迟加载：也称为“懒加载”（Lazy Initialization），在对象的初始化开销较大时，可以通过代理延迟对象的创建，只有在实际需要时才创建对象。

- 权限管理：在保护代理中，可以通过代理来检查客户端的访问权限，从而决定是否允许访问实际对象。

- 日志记录：代理可以在调用真实对象的操作之前或之后记录日志信息，用于调试或审计。

- 远程代理：代理处理客户端与远程服务之间的通信，隐藏复杂的网络细节。

**代理模式的结构**
- 抽象接口（Subject）：定义了代理类和实际对象类的共同接口。
- 真实对象（RealSubject）：实现了抽象接口，是真正需要代理的对象。
- 代理类（Proxy）：实现了抽象接口，内部持有真实对象的引用，负责控制对真实对象的访问。

示例场景

假设我们有一个银行账户类BankAccount，客户可以通过该类来存款、取款和查看余额。但是为了增加安全性，我们可以引入一个代理类BankAccountProxy，它在执行这些操作之前检查用户的权限。

C++ 实现代理模式

```cpp
#include <iostream>
#include <string>

// 抽象接口（Subject）
class BankAccount {
public:
    virtual void deposit(double amount) = 0;
    virtual void withdraw(double amount) = 0;
    virtual double getBalance() const = 0;
};

// 真实对象（RealSubject）
class RealBankAccount : public BankAccount {
private:
    double balance;

public:
    RealBankAccount() : balance(0.0) {}

    void deposit(double amount) override {
        balance += amount;
        std::cout << "Deposited: " << amount << ", New Balance: " << balance << "\n";
    }

    void withdraw(double amount) override {
        if (amount <= balance) {
            balance -= amount;
            std::cout << "Withdrew: " << amount << ", New Balance: " << balance << "\n";
        } else {
            std::cout << "Insufficient funds. Withdrawal failed.\n";
        }
    }

    double getBalance() const override {
        return balance;
    }
};

// 代理类（Proxy）
class BankAccountProxy : public BankAccount {
private:
    RealBankAccount *realAccount;
    std::string userRole;

public:
    BankAccountProxy(const std::string &role) : realAccount(new RealBankAccount()), userRole(role) {}

    ~BankAccountProxy() {
        delete realAccount;
    }

    void deposit(double amount) override {
        if (userRole == "Admin" || userRole == "User") {
            realAccount->deposit(amount);
        } else {
            std::cout << "Access denied. Only Admin or User can deposit funds.\n";
        }
    }

    void withdraw(double amount) override {
        if (userRole == "Admin") {
            realAccount->withdraw(amount);
        } else {
            std::cout << "Access denied. Only Admin can withdraw funds.\n";
        }
    }

    double getBalance() const override {
        if (userRole == "Admin" || userRole == "User") {
            return realAccount->getBalance();
        } else {
            std::cout << "Access denied. Only Admin or User can view the balance.\n";
            return -1;
        }
    }
};

// 客户端代码
int main() {
    // 创建一个代理对象，角色为普通用户
    BankAccount *userAccount = new BankAccountProxy("User");

    userAccount->deposit(100.0);  // 正常存款
    userAccount->withdraw(50.0);  // 用户不能取款
    std::cout << "Balance: " << userAccount->getBalance() << "\n";  // 查看余额

    delete userAccount;

    // 创建一个代理对象，角色为管理员
    BankAccount *adminAccount = new BankAccountProxy("Admin");

    adminAccount->deposit(500.0);  // 管理员存款
    adminAccount->withdraw(200.0);  // 管理员取款
    std::cout << "Balance: " << adminAccount->getBalance() << "\n";  // 查看余额

    delete adminAccount;

    return 0;
}
```


好的，让我们用一个不同的例子来说明C++中的代理模式。这次我们模拟一个银行账户的场景，通过代理来控制对账户的访问权限。

示例场景
假设我们有一个银行账户类BankAccount，客户可以通过该类来存款、取款和查看余额。但是为了增加安全性，我们可以引入一个代理类BankAccountProxy，它在执行这些操作之前检查用户的权限。

C++ 实现代理模式

```cpp
#include <iostream>
#include <string>

// 抽象接口（Subject）
class BankAccount {
public:
    virtual void deposit(double amount) = 0;
    virtual void withdraw(double amount) = 0;
    virtual double getBalance() const = 0;
};

// 真实对象（RealSubject）
class RealBankAccount : public BankAccount {
private:
    double balance;

public:
    RealBankAccount() : balance(0.0) {}

    void deposit(double amount) override {
        balance += amount;
        std::cout << "Deposited: " << amount << ", New Balance: " << balance << "\n";
    }

    void withdraw(double amount) override {
        if (amount <= balance) {
            balance -= amount;
            std::cout << "Withdrew: " << amount << ", New Balance: " << balance << "\n";
        } else {
            std::cout << "Insufficient funds. Withdrawal failed.\n";
        }
    }

    double getBalance() const override {
        return balance;
    }
};

// 代理类（Proxy）
class BankAccountProxy : public BankAccount {
private:
    RealBankAccount *realAccount;
    std::string userRole;

public:
    BankAccountProxy(const std::string &role) : realAccount(new RealBankAccount()), userRole(role) {}

    ~BankAccountProxy() {
        delete realAccount;
    }

    void deposit(double amount) override {
        if (userRole == "Admin" || userRole == "User") {
            realAccount->deposit(amount);
        } else {
            std::cout << "Access denied. Only Admin or User can deposit funds.\n";
        }
    }

    void withdraw(double amount) override {
        if (userRole == "Admin") {
            realAccount->withdraw(amount);
        } else {
            std::cout << "Access denied. Only Admin can withdraw funds.\n";
        }
    }

    double getBalance() const override {
        if (userRole == "Admin" || userRole == "User") {
            return realAccount->getBalance();
        } else {
            std::cout << "Access denied. Only Admin or User can view the balance.\n";
            return -1;
        }
    }
};

// 客户端代码
int main() {
    // 创建一个代理对象，角色为普通用户
    BankAccount *userAccount = new BankAccountProxy("User");

    userAccount->deposit(100.0);  // 正常存款
    userAccount->withdraw(50.0);  // 用户不能取款
    std::cout << "Balance: " << userAccount->getBalance() << "\n";  // 查看余额

    delete userAccount;

    // 创建一个代理对象，角色为管理员
    BankAccount *adminAccount = new BankAccountProxy("Admin");

    adminAccount->deposit(500.0);  // 管理员存款
    adminAccount->withdraw(200.0);  // 管理员取款
    std::cout << "Balance: " << adminAccount->getBalance() << "\n";  // 查看余额

    delete adminAccount;

    return 0;
}
```

**解释**
- RealBankAccount：这是实际的银行账户类，包含存款、取款和获取余额的功能。
- BankAccountProxy：代理类负责控制对RealBankAccount的访问。它接收用户的角色信息，根据用户的角色决定是否允许进行某些操作。
  - 如果用户角色是"Admin"（管理员），代理类允许执行所有操作。
  - 如果用户角色是"User"（普通用户），代理类只允许存款和查看余额，不允许取款。
  - 如果用户角色是其他角色，代理类拒绝所有操作。
- 客户端代码：通过代理类来操作银行账户，而不是直接操作RealBankAccount类。这样可以在不修改RealBankAccount的情况下，控制对账户的访问。

输出结果

```shell
Deposited: 100, New Balance: 100
Access denied. Only Admin can withdraw funds.
Balance: 100
Deposited: 500, New Balance: 600
Withdrew: 200, New Balance: 400
Balance: 400
```

**总结**

在这个例子中，代理模式的主要作用是控制访问权限。通过代理类BankAccountProxy，我们可以在执行账户操作之前检查用户的权限，防止未授权的操作。这种方式提高了系统的安全性，同时保持了系统设计的灵活性。

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

### 命令模式

餐厅点餐系统来说明命令模式的使用。

**示例场景**

假设你在一家餐厅用餐，服务员会将你的订单记录下来，然后将订单传递给厨房。厨房根据订单准备菜品，完成后通知服务员上菜。如果你想要取消或者修改订单，服务员也可以传递这一信息给厨房。

在这个例子中：

- **客户**是命令的发起者。
- **服务员**是调用者，他负责将客户的命令传递给执行者。
- **厨房**是命令的接收者，负责执行命令。

我们将用命令模式来模拟这一过程。

C++ 实现命令模式

```cpp
#include <iostream>
#include <string>
#include <memory>
#include <vector>

// 命令接口（Command）
class Order {
public:
    virtual void execute() = 0;  // 执行订单
    virtual void cancel() = 0;   // 取消订单
    virtual ~Order() = default;
};

// 接收者（Receiver）：厨房
class Kitchen {
public:
    void prepareDish(const std::string& dish) {
        std::cout << "Kitchen is preparing " << dish << "\n";
    }

    void cancelDish(const std::string& dish) {
        std::cout << "Kitchen cancels " << dish << "\n";
    }
};

// 具体命令（ConcreteCommand）：点菜命令
class DishOrder : public Order {
private:
    Kitchen &kitchen;
    std::string dish;

public:
    DishOrder(Kitchen &k, const std::string &d) : kitchen(k), dish(d) {}

    void execute() override {
        kitchen.prepareDish(dish);
    }

    void cancel() override {
        kitchen.cancelDish(dish);
    }
};

// 调用者（Invoker）：服务员
class Waiter {
private:
    std::vector<std::unique_ptr<Order>> orders;  // 订单队列

public:
    void takeOrder(std::unique_ptr<Order> order) {
        orders.push_back(std::move(order));
    }

    void placeOrders() {
        for (auto &order : orders) {
            order->execute();
        }
        orders.clear();  // 清空订单队列
    }

    void cancelLastOrder() {
        if (!orders.empty()) {
            orders.back()->cancel();
            orders.pop_back();
        }
    }
};

// 客户端代码
int main() {
    Kitchen kitchen;

    // 客户下订单
    std::unique_ptr<Order> order1 = std::make_unique<DishOrder>(kitchen, "Steak");
    std::unique_ptr<Order> order2 = std::make_unique<DishOrder>(kitchen, "Salad");

    // 服务员接受订单
    Waiter waiter;
    waiter.takeOrder(std::move(order1));
    waiter.takeOrder(std::move(order2));

    // 客户决定不再要沙拉
    waiter.cancelLastOrder();

    // 服务员将订单传递给厨房
    waiter.placeOrders();

    return 0;
}
```

**解释**

- Order：这是一个抽象基类，定义了execute（执行）和cancel（取消）两个方法。所有的具体订单类都要实现这个接口。
- Kitchen：这是接收者类，表示厨房。它包含两个方法：prepareDish（准备菜品）和cancelDish（取消菜品）。
- DishOrder：这是一个具体的命令类，代表点菜的命令。它封装了一个具体的菜品订单，并调用Kitchen对象的方法来执行或取消订单。
- Waiter：这是调用者类，代表服务员。它管理一系列的订单，并在适当的时候将这些订单传递给厨房执行。如果顾客想要取消最后一个订单，服务员也可以处理这一请求。

```cpp
Kitchen cancels Salad
Kitchen is preparing Steak
```

**代码说明**

- 下订单：客户首先下了两个订单——“Steak”（牛排）和“Salad”（沙拉），服务员接收了这两个订单。
- 取消订单：客户决定不再要沙拉，于是服务员调用cancelLastOrder方法取消了沙拉订单。
- 传递订单：服务员将剩下的订单（只有牛排）传递给厨房，厨房准备牛排。

更加贴近实际的特点
- **命令的取消**：这个例子展示了命令模式如何支持取消功能。客户可以随时取消自己的订单，而无需直接与厨房沟通，增加了系统的灵活性。
- **队列管理**：服务员使用一个队列来管理订单，这与现实中餐厅的做法类似，可以处理多个命令，并按顺序执行它们。

**总结**

命令模式通过将请求封装为对象，使得请求的处理可以延迟、取消或重做。这种模式非常适合需要灵活管理和执行操作的场景，比如餐厅的点餐系统、文本编辑器的撤销/重做功能等。通过解耦命令的发起者与执行者，命令模式提高了系统的扩展性和可维护性。

### 中介者模式

中介者模式（Mediator Pattern）是一种行为型设计模式，用于减少多个对象和类之间的通信复杂度。中介者模式通过引入一个中介者对象来封装对象之间的交互，从而使这些对象不再直接相互引用，从而实现解耦。

中介者模式的主要作用
- 减少对象之间的耦合：对象通过中介者进行通信，而不是直接相互调用，从而减少了对象之间的依赖性。
- 简化对象之间的交互：中介者模式通过集中控制对象之间的通信，简化了系统的复杂性。
- 提高系统的灵活性和可维护性：通过修改中介者，可以更容易地改变对象之间的交互方式，而不需要修改各个对象本身。

中介者模式的结构
- 中介者接口（Mediator）：定义了一个接口，用于通信对象的交互。
- 具体中介者（ConcreteMediator）：实现中介者接口，协调具体同事对象之间的交互。
- 同事类（Colleague）：各个参与交互的类。每个同事类都知道中介者，并通过中介者与其他同事类通信。

示例：聊天室中的中介者模式
想象一个聊天室的场景，多个用户（同事类）可以发送消息给其他用户。如果每个用户直接相互通信，系统会变得复杂且难以维护。我们可以使用中介者模式，创建一个聊天室（中介者），所有的用户都通过聊天室来发送和接收消息。

C++ 实现中介者模式

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <memory>

// 前向声明
class ChatRoomMediator;

// 同事类（Colleague）：用户
class User {
private:
    std::string name;
    ChatRoomMediator* mediator;

public:
    User(const std::string& name, ChatRoomMediator* mediator) : name(name), mediator(mediator) {}

    std::string getName() const {
        return name;
    }

    void sendMessage(const std::string& message);

    void receiveMessage(const std::string& sender, const std::string& message) {
        std::cout << name << " received a message from " << sender << ": " << message << "\n";
    }
};

// 中介者接口（Mediator）：聊天室
class ChatRoomMediator {
public:
    virtual void showMessage(User* sender, const std::string& message) = 0;
    virtual ~ChatRoomMediator() = default;
};

// 具体中介者（ConcreteMediator）：具体聊天室
class ChatRoom : public ChatRoomMediator {
private:
    std::vector<User*> users;

public:
    void addUser(User* user) {
        users.push_back(user);
    }

    void showMessage(User* sender, const std::string& message) override {
        for (User* user : users) {
            if (user != sender) { // 消息不发送给自己
                user->receiveMessage(sender->getName(), message);
            }
        }
    }
};

// 同事类方法实现：用户发送消息
void User::sendMessage(const std::string& message) {
    std::cout << name << " sends message: " << message << "\n";
    mediator->showMessage(this, message);
}

// 客户端代码
int main() {
    ChatRoom chatRoom;

    User user1("Alice", &chatRoom);
    User user2("Bob", &chatRoom);
    User user3("Charlie", &chatRoom);

    chatRoom.addUser(&user1);
    chatRoom.addUser(&user2);
    chatRoom.addUser(&user3);

    user1.sendMessage("Hello everyone!");
    user2.sendMessage("Hi Alice!");
    user3.sendMessage("Hey Bob, how's it going?");

    return 0;
}
```

**解释**
- ChatRoomMediator：这是中介者接口，定义了showMessage方法，用于协调用户之间的消息传递。
- ChatRoom：这是具体的中介者类，管理多个用户，并在用户发送消息时负责将消息传递给其他用户。
- User：这是同事类，表示聊天室中的用户。用户通过中介者（聊天室）来发送和接收消息。
- sendMessage：用户发送消息的函数，会调用中介者的showMessage方法来传递消息。

```shell
Alice sends message: Hello everyone!
Bob received a message from Alice: Hello everyone!
Charlie received a message from Alice: Hello everyone!
Bob sends message: Hi Alice!
Alice received a message from Bob: Hi Alice!
Charlie received a message from Bob: Hi Alice!
Charlie sends message: Hey Bob, how's it going?
Alice received a message from Charlie: Hey Bob, how's it going?
Bob received a message from Charlie: Hey Bob, how's it going?
```

**代码说明**
- 添加用户：在ChatRoom中添加用户对象。用户与聊天室关联后，通过聊天室与其他用户通信。
- 发送消息：用户发送消息时，消息会通过ChatRoom中介者传递给所有其他用户。每个用户通过receiveMessage方法接收消息。
- 解耦用户：用户之间并没有直接引用，所有的消息传递都通过ChatRoom这个中介者进行。这实现了用户之间的解耦，简化了用户之间的交互逻辑。

**总结**
中介者模式通过引入一个中介者对象，将对象之间复杂的通信逻辑集中到中介者内部，从而实现对象之间的解耦和通信逻辑的集中管理。它特别适合用在多对象交互复杂、通信逻辑频繁变化的场景中，例如聊天室、GUI事件处理系统等。使用中介者模式不仅简化了系统的设计，还增强了系统的可维护性和扩展性。

### 责任链模式

**责任链模式**（Chain of Responsibility Pattern）是一种行为设计模式，它允许多个对象有机会处理请求，避免请求的发送者和接收者之间的耦合。通过将这些对象连成一条链，并沿着链传递请求，直到有一个对象处理它为止。

**作用**
- 解耦请求的发送者和接收者：发送者不需要知道是哪一个接收者最终处理了请求，这使得系统更加灵活和可扩展。
- 动态组合处理者：可以在运行时决定哪个处理者来处理请求，或者根据条件选择多个处理者中的一个。
- 提高系统的可维护性：处理者的增加或删除不会影响其他处理者。

**责任链模式的结构**

责任链模式通常包括以下几个部分：
- Handler（处理者）：定义一个处理请求的接口或抽象类，可以选择将请求传递给下一个处理者。
- ConcreteHandler（具体处理者）：实现 Handler 接口，处理它所关心的请求，或者将请求传递给下一个处理者。

Client（客户端）：向链上的第一个处理者提交请求。

用 C++ 代码讲解

下面是一个简单的 C++ 实现，用于演示责任链模式。假设我们有一个日志记录器，可以记录不同级别的日志（如 INFO、DEBUG、ERROR）。不同的日志记录器会处理不同级别的日志信息。

```cpp
#include <iostream>
#include <string>

// 抽象处理者类
class Logger {
public:
    enum LogLevel { INFO, DEBUG, ERROR };
    
    Logger(LogLevel level) : logLevel(level), nextLogger(nullptr) {}
    
    void setNextLogger(Logger* next) {
        nextLogger = next;
    }
    
    void logMessage(LogLevel level, const std::string& message) {
        if (this->logLevel <= level) {
            write(message);
        }
        if (nextLogger != nullptr) {
            nextLogger->logMessage(level, message);
        }
    }
    
protected:
    virtual void write(const std::string& message) = 0;
    
private:
    LogLevel logLevel;
    Logger* nextLogger;
};

// 具体处理者类 - 控制台日志记录器
class ConsoleLogger : public Logger {
public:
    ConsoleLogger(LogLevel level) : Logger(level) {}
protected:
    void write(const std::string& message) override {
        std::cout << "Console::Logger: " << message << std::endl;
    }
};

// 具体处理者类 - 文件日志记录器
class FileLogger : public Logger {
public:
    FileLogger(LogLevel level) : Logger(level) {}
protected:
    void write(const std::string& message) override {
        std::cout << "File::Logger: " << message << std::endl;
    }
};

// 具体处理者类 - 错误日志记录器
class ErrorLogger : public Logger {
public:
    ErrorLogger(LogLevel level) : Logger(level) {}
protected:
    void write(const std::string& message) override {
        std::cout << "Error::Logger: " << message << std::endl;
    }
};

// 客户端代码
int main() {
    // 创建日志记录链
    Logger* errorLogger = new ErrorLogger(Logger::ERROR);
    Logger* fileLogger = new FileLogger(Logger::DEBUG);
    Logger* consoleLogger = new ConsoleLogger(Logger::INFO);
    
    // 设置责任链
    errorLogger->setNextLogger(fileLogger);
    fileLogger->setNextLogger(consoleLogger);
    
    // 处理不同级别的日志信息
    errorLogger->logMessage(Logger::INFO, "This is an information.");
    errorLogger->logMessage(Logger::DEBUG, "This is a debug level information.");
    errorLogger->logMessage(Logger::ERROR, "This is an error information.");
    
    // 清理资源
    delete errorLogger;
    delete fileLogger;
    delete consoleLogger;
    
    return 0;
}
```

**代码解释**
- Logger: 这是一个抽象的处理者类，定义了处理请求的接口 logMessage 和一个纯虚函数 write，用来实现具体的日志处理。它还包含一个指向下一个处理者的指针 nextLogger，用于形成责任链。

- ConsoleLogger、FileLogger、ErrorLogger: 这些是具体的处理者类，继承自 Logger，并实现了 write 函数，它们处理不同类型的日志信息。

- 责任链的创建: 在 main 函数中，我们创建了三个处理者，并将它们链接在一起，形成责任链。ErrorLogger -> FileLogger -> ConsoleLogger。

- 日志处理: 当我们调用 logMessage 方法时，它会根据日志的级别来决定由哪个处理者来处理。如果当前处理者不能处理，则将请求传递给链中的下一个处理者。

**运行结果**

```shell
Console::Logger: This is an information.
File::Logger: This is a debug level information.
Console::Logger: This is a debug level information.
Error::Logger: This is an error information.
File::Logger: This is an error information.
Console::Logger: This is an error information.
```

**总结**

责任链模式在解耦请求发送者和接收者之间的依赖方面非常有用，同时还可以通过动态调整责任链来提高系统的灵活性和可扩展性。这个模式特别适合需要多个对象对同一请求进行处理的场景，如日志处理、权限验证等。

## 设计模式的相似的模式的区别

### 装饰器模式和代理模式的区别

**装饰器模式**（Decorator Pattern）和**代理模式**（Proxy Pattern）都是**结构型设计模式**，它们有些相似，但也有不同的目的和用法。以下是它们的主要区别和特点：

**1. 目的**

**装饰器模式**：主要用于动态地扩展对象的功能，而不修改现有的对象结构。它通过将对象嵌套在一个装饰器对象中，来增加额外的行为或功能。

**代理模式**：主要用于控制对某个对象的访问，通常用于提供一个替代对象来控制对真实对象的访问。代理对象可以在访问真实对象之前或之后进行一些处理，比如缓存、权限控制、延迟加载等。

**2. 结构**

**装饰器模式**：

- 组件（Component）：定义了一个接口，用于实际组件和装饰器的基类。
- 具体组件（Concrete Component）：实现了 Component 接口的基本对象。
- 装饰器（Decorator）：实现了 Component 接口，并持有一个 Component 对象的引用，用于添加额外的功能。
- 具体装饰器（Concrete Decorator）：实现装饰器功能，添加具体的行为或状态。

**代理模式**：

- 主题接口（Subject）：定义了代理和真实对象都需要实现的接口。
- 真实主题（Real Subject）：实现了 Subject 接口，提供实际的业务逻辑。
- 代理（Proxy）：实现了 Subject 接口，持有 Real Subject 对象的引用，控制对 Real Subject 的访问，可能包括附加的操作。


**4. 主要区别**

**功能扩展 vs. 访问控制：**

- 装饰器模式：用于动态地扩展对象的功能，通过在原对象外部添加装饰器。
- 代理模式：用于控制对对象的访问，可以包括延迟加载、权限检查等。

**设计意图**：

- 装饰器模式：意图是通过装饰器链来增加或修改对象的功能。
- 代理模式：意图是控制对真实对象的访问，通过代理提供额外的功能，如延迟加载或访问控制。

**使用场景**：

- 装饰器模式：适用于需要在运行时对对象添加功能，且这些功能的组合是灵活的。
- 代理模式：适用于需要控制对真实对象的访问，可能涉及延迟初始化、权限验证、记录日志等。

**总结**

- 装饰器模式和代理模式都是非常有用的设计模式，但它们解决的问题不同。装饰器模式侧重于扩展对象功能，而代理模式侧重于控制对对象的访问。了解它们的不同可以帮助你在设计系统时选择合适的模式。


### 外观模式和适配器模式的区别

外观模式（Facade Pattern）和适配器模式（Adapter Pattern）是两种常见的设计模式，它们的目的和用法有所不同。以下是它们的主要区别：

**1. 目的**
- 外观模式：提供一个简化的接口，使得复杂系统的子系统对外界更加容易使用。外观模式的目的是简化客户端的使用，隐藏系统的复杂性。
- 适配器模式：将一个接口转换成客户期望的另一个接口。适配器模式的目的是解决接口不兼容的问题，使得原本不能一起工作的类可以协同工作。

**2. 使用场景**
- 外观模式：当你需要为一个复杂的子系统提供一个简单的接口时，可以使用外观模式。例如，提供一个统一的API，来简化与多个类的交互。
- 适配器模式：当你想要使用一个已经存在的类，但它的接口不符合你的需求时，可以使用适配器模式。例如，将一个老的系统接口适配到新的系统中。

**3. 设计结构**
- 外观模式：外观模式通常涉及创建一个“外观类”（Facade），该类提供了高层的简化接口，并委托实际的工作给系统的子类或模块。
- 适配器模式：适配器模式通常涉及创建一个“适配器类”（Adapter），该类将目标接口（Target）与被适配类（Adaptee）关联起来。适配器类实现目标接口，并在实现过程中调用被适配类的方法。