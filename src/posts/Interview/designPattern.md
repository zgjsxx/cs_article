---
category: 
- 面经
tag:
- 设计模式面经
---

- [设计模式面经](#设计模式面经)
  - [设计模式的几大原则](#设计模式的几大原则)
  - [设计模式的分类](#设计模式的分类)
  - [创建型模式](#创建型模式)
    - [单例模式](#单例模式)
    - [工厂方法](#工厂方法)
    - [抽象工厂方法](#抽象工厂方法)
    - [原型模式](#原型模式)
    - [建造者模式](#建造者模式)
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
    - [模板方法模式](#模板方法模式)
    - [访问者模式](#访问者模式)
    - [备忘录模式](#备忘录模式)
    - [状态模式](#状态模式)
    - [迭代器模式](#迭代器模式)
    - [观察者模式简介](#观察者模式简介)
  - [问题](#问题)
    - [工厂方法和抽象工厂方法的区别](#工厂方法和抽象工厂方法的区别)
    - [装饰器模式和代理模式的区别](#装饰器模式和代理模式的区别)
    - [外观模式和适配器模式的区别](#外观模式和适配器模式的区别)
    - [说说grpc中的建造者模式](#说说grpc中的建造者模式)
    - [依赖反转原则是什么](#依赖反转原则是什么)

# 设计模式面经

## 设计模式的几大原则

设计模式的原则是软件设计中用于创建更灵活、可维护和可扩展的系统的基本指导原则。这些原则帮助开发者在设计过程中做出更好的决策，避免常见的设计错误。以下是一些重要的设计模式原则：

**1. 单一职责原则 (Single Responsibility Principle, SRP)**
- 定义：一个类应该只有一个引起它变化的原因，即一个类只负责一项职责。
- 目的：减少类的复杂性，使其更易于理解和维护。如果一个类承担多种职责，那么每种职责的变化都可能影响到这个类。

**2. 开放封闭原则 (Open/Closed Principle, OCP)**
- 定义：软件实体（类、模块、函数等）应该对扩展开放，对修改封闭。
- 目的：当需求变化时，可以通过扩展原有功能而不是修改已有代码来实现新的需求，从而提高系统的稳定性和灵活性。

**3. 里氏替换原则 (Liskov Substitution Principle, LSP)**
- 定义：子类型必须能够替换掉它们的基类型，且不影响程序的正确性。
- 目的：确保继承关系的正确性，即子类对象能完全替代父类对象，使得父类的调用者能够透明地使用子类的实例。

**4. 依赖倒置原则 (Dependency Inversion Principle, DIP)**
- 定义：高层模块不应该依赖于低层模块，两者都应该依赖于抽象。抽象不应该依赖于细节，细节应该依赖于抽象。
- 目的：通过依赖抽象（接口或抽象类），而不是具体实现，来减少类之间的耦合性，提高系统的灵活性和可维护性。

**5. 接口隔离原则 (Interface Segregation Principle, ISP)**
- 定义：客户端不应该被迫依赖于它不使用的方法，应该将庞大的接口拆分为更小、更具体的接口，使得客户端只需了解它所需的接口。
- 目的：通过接口分离降低系统的复杂性，避免由于接口臃肿导致的实现类的复杂性。

**6. 合成复用原则 (Composite Reuse Principle, CRP)**
- 定义：优先使用对象组合（即“has-a”关系）而不是继承（即“is-a”关系）来达到代码复用的目的。
- 目的：通过组合来提高代码的复用性和灵活性，减少继承带来的紧耦合问题。

**7. 迪米特法则 (Law of Demeter, LoD)**
- 定义：一个对象应该对其他对象有尽可能少的了解，即“最少知识原则”。
- 目的：减少对象之间的依赖关系，降低系统的耦合度，从而提高系统的模块化和维护性。

**8. 优先使用组合而不是继承**
- 定义：与继承相比，优先使用对象组合来复用代码。
- 目的：通过组合，类之间的依赖性较低，系统结构更灵活，容易扩展。

**总结**

这些设计原则在实践中相互作用，共同促进了高质量的代码设计。理解并运用这些原则，可以帮助开发者设计出更易维护、更具弹性的软件系统。

## 设计模式的分类

在软件设计中，创建型、结构型和行为型是设计模式的三种主要分类。这三类模式根据其用途和作用范围的不同，解决软件开发中的不同问题。

**创建型模式**

定义：创建型模式关注对象的创建过程，主要解决对象创建时的复杂性问题。

作用：
- 为创建对象提供更灵活、更高效、更符合扩展需求的方法。
- 通过抽象化的方式控制对象创建的细节和时机。

常见创建型模式：
- 工厂方法模式（Factory Method）：定义一个用于创建对象的接口，让子类决定实例化哪一个类。
- 抽象工厂模式（Abstract Factory）：提供一个创建相关或依赖对象的接口，而无需指定具体类。
- 单例模式（Singleton）：确保一个类只有一个实例，并提供一个全局访问点。
- 建造者模式（Builder）：将一个复杂对象的构建过程与其表示分离，使得同样的构建过程可以创建不同的表示。
- 原型模式（Prototype）：通过复制现有对象来创建新对象，而不是通过实例化类。

**结构型模式**

定义：结构型模式关注对象的组织方式，主要解决如何更好地组织类和对象，使其更灵活、更高效。

作用：
- 处理对象的组合、继承和接口适配问题。
- 简化系统的结构，增强系统的可维护性和扩展性。

常见结构型模式：
- 适配器模式（Adapter）：将一个类的接口转换成客户期望的另一个接口。
- 桥接模式（Bridge）：将抽象部分与实现部分分离，使它们可以独立变化。
- 组合模式（Composite）：将对象组合成树形结构以表示“整体-部分”层次结构，使客户可以一致地处理单个对象和组合对象。
- 装饰器模式（Decorator）：动态地为对象添加新的职责，而不改变其结构。
- 外观模式（Facade）：为子系统提供一个统一的接口，简化子系统的使用。
- 享元模式（Flyweight）：通过共享尽量多的相似对象，减少内存使用。
- 代理模式（Proxy）：为另一个对象提供一个替身或占位符，以控制对该对象的访问。

**行为型模式**

定义：行为型模式关注的是对象之间的职责分配和通信方式，主要解决对象交互和职责分配的问题。

作用：
- 处理对象之间的动态交互关系。
- 增强对象之间的松耦合，简化复杂的控制流。
- 关注如何通过对象之间的协作完成任务。

常见行为型模式：
- 策略模式（Strategy）：定义一组算法，将每个算法封装到独立的类中，并且可以相互替换。
- 观察者模式（Observer）：定义对象间一对多的依赖关系，当一个对象状态变化时，所有依赖它的对象都会收到通知。
- 命令模式（Command）：将请求封装为对象，以便支持参数化的命令、队列、日志等功能。
- 责任链模式（Chain of Responsibility）：将请求沿着处理者链传递，直到被某个处理者处理。
- 状态模式（State）：允许对象在内部状态改变时改变其行为。
- 模板方法模式（Template Method）：定义算法的框架，将一些步骤推迟到子类中实现。
- 中介者模式（Mediator）：通过中介者对象封装对象之间的交互，使其解耦。
- 迭代器模式（Iterator）：提供一种访问集合对象元素的方法，而不暴露其内部表示。
- 备忘录模式（Memento）：保存对象的某个状态，以便在以后可以恢复。
- 访问者模式（Visitor）：定义一个新操作，可以作用于一组对象，而不改变这些对象的类。

三者的对比如下：

|分类|关注点|目标|模式示例|
|--|--|--|--|
|行为型|对象之间的职责分配与动态交互|简化对象间通信、增强灵活性与松耦合|策略、观察者、命令、状态、责任链、模板方法等|
|结构型|对象与类的组合方式|简化系统结构、优化对象之间的依赖关系|适配器、桥接、组合、装饰器、外观、代理等|
|创建型|对象的创建方式|提高对象创建的灵活性、控制复杂对象的创建过程|工厂方法、抽象工厂、单例、建造者、原型等|

## 创建型模式
### 单例模式

单例模式（Singleton Pattern）是一种创建型设计模式，确保一个类只有一个实例，并提供全局访问点。

使用 C++11 引入的 ```std::once_flag``` 和 ```std::call_once```，可以实现线程安全的单例模式。```std::once_flag``` 是 C++ 标准库中的同步工具，用于确保某段代码只执行一次，通常用于初始化。

```cpp
#include <iostream>
#include <mutex>
#include <memory> // std::unique_ptr

class Singleton {
private:
    static std::unique_ptr<Singleton> instance; // 静态实例指针
    static std::once_flag initFlag;            // 用于线程安全初始化的标志

    // 私有构造函数，防止直接实例化
    Singleton() {
        std::cout << "Singleton constructor called!" << std::endl;
    }

public:
    // 禁用拷贝构造和赋值运算符
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

    // 获取单例实例的方法
    static Singleton* getInstance() {
        // 保证初始化代码只执行一次
        std::call_once(initFlag, []() {
            instance.reset(new Singleton());
        });
        return instance.get();
    }

    // 业务方法
    void doSomething() {
        std::cout << "Singleton instance doing something!" << std::endl;
    }
};

// 初始化静态成员
std::unique_ptr<Singleton> Singleton::instance = nullptr;
std::once_flag Singleton::initFlag;

int main() {
    // 获取单例实例
    Singleton* s1 = Singleton::getInstance();
    Singleton* s2 = Singleton::getInstance();

    // 调用方法
    s1->doSomething();

    // 验证实例是否相同
    if (s1 == s2) {
        std::cout << "s1 and s2 are the same instance!" << std::endl;
    }

    return 0;
}
```

### 工厂方法

工厂方法模式（Factory Method Pattern）定义了一个创建对象的接口，但由子类决定实例化哪一个类。工厂方法将对象的实例化推迟到子类。

我们以 UI 控件（按钮 Button） 为例：
- 系统需要支持多种平台（如 Windows 和 Mac）。
- 不同平台的按钮具有不同的外观和行为。
- 客户端代码应该与按钮的具体实现无关，只需调用按钮的通用接口。

工厂方法模式的核心思路
- 将创建按钮的逻辑抽象为一个工厂方法，让子类工厂决定创建哪种具体按钮。
- 客户端只需通过工厂接口创建按钮，无需了解具体按钮的实现细节。

工厂方法模式代码实现

```cpp
// 1. 定义按钮接口（抽象产品类）
#include <iostream>
#include <memory>

// 按钮接口
class Button {
public:
    virtual ~Button() = default;
    virtual void render() = 0;  // 渲染按钮
    virtual void onClick() = 0; // 按钮点击事件
};
// 2. 创建具体按钮类（具体产品类）
// Windows 风格按钮
class WindowsButton : public Button {
public:
    void render() override {
        std::cout << "Rendering Windows Button" << std::endl;
    }
    void onClick() override {
        std::cout << "Windows Button Clicked!" << std::endl;
    }
};

// Mac 风格按钮
class MacButton : public Button {
public:
    void render() override {
        std::cout << "Rendering Mac Button" << std::endl;
    }
    void onClick() override {
        std::cout << "Mac Button Clicked!" << std::endl;
    }
};

// 3. 创建按钮工厂接口（抽象工厂类）
// 按钮工厂接口
class ButtonFactory {
public:
    virtual ~ButtonFactory() = default;
    virtual std::unique_ptr<Button> createButton() = 0; // 工厂方法：创建按钮
};

// 4. 创建具体工厂类（具体工厂类）
// Windows 按钮工厂
class WindowsButtonFactory : public ButtonFactory {
public:
    std::unique_ptr<Button> createButton() override {
        return std::make_unique<WindowsButton>();
    }
};

// Mac 按钮工厂
class MacButtonFactory : public ButtonFactory {
public:
    std::unique_ptr<Button> createButton() override {
        return std::make_unique<MacButton>();
    }
};

int main() {
    // 创建 Windows 风格按钮的工厂
    std::unique_ptr<ButtonFactory> factory = std::make_unique<WindowsButtonFactory>();
    auto button = factory->createButton(); // 使用工厂方法创建按钮
    button->render();
    button->onClick();

    // 创建 Mac 风格按钮的工厂
    factory = std::make_unique<MacButtonFactory>();
    button = factory->createButton(); // 使用工厂方法创建按钮
    button->render();
    button->onClick();

    return 0;
}
```

工厂方法模式的特点和分析
- 封装对象创建：客户端代码只与工厂接口和产品接口交互，不关心具体产品类的实现。
- 扩展性好：新增产品（如 Linux 按钮）时，只需添加对应的具体产品类和具体工厂类，无需修改现有代码。
- 符合开闭原则：扩展具体产品和具体工厂时，不需要修改抽象工厂和抽象产品的定义。

### 抽象工厂方法

抽象工厂模式（Abstract Factory Pattern）是一种创建型设计模式，提供一个接口，用于创建一组相关或相互依赖的对象，而无需指定具体类。

核心思想
- 抽象工厂：定义创建对象的接口。
- 具体工厂：实现接口，负责生成具体产品。
- 产品接口：定义具体产品的通用方法。
- 具体产品：实现产品接口，表示具体的产品实例。
- 客户端：通过抽象工厂使用产品，而不依赖具体工厂或产品的实现。

抽象工厂模式的优势是将产品族的创建与使用分离，方便扩展。

使用场景
- 需要生成一组相关或相互依赖的对象（例如不同风格的按钮和文本框）。
- 需要避免依赖具体类，隐藏对象创建的实现细节。
- 需要支持产品族的扩展。

以下是使用抽象工厂模式的 C++ 实现示例。假设我们要创建两种风格的用户界面组件：Windows 风格和 Mac 风格。

```cpp
#include <iostream>
#include <memory>

// 产品接口：按钮
class Button {
public:
    virtual ~Button() = default;
    virtual void render() = 0; // 渲染按钮
};

// 产品接口：文本框
class TextBox {
public:
    virtual ~TextBox() = default;
    virtual void render() = 0; // 渲染文本框
};

// 具体产品：Windows 按钮
class WindowsButton : public Button {
public:
    void render() override {
        std::cout << "Rendering Windows Button" << std::endl;
    }
};

// 具体产品：Windows 文本框
class WindowsTextBox : public TextBox {
public:
    void render() override {
        std::cout << "Rendering Windows TextBox" << std::endl;
    }
};

// 具体产品：Mac 按钮
class MacButton : public Button {
public:
    void render() override {
        std::cout << "Rendering Mac Button" << std::endl;
    }
};

// 具体产品：Mac 文本框
class MacTextBox : public TextBox {
public:
    void render() override {
        std::cout << "Rendering Mac TextBox" << std::endl;
    }
};

// 抽象工厂：UI 工厂
class UIFactory {
public:
    virtual ~UIFactory() = default;
    virtual std::unique_ptr<Button> createButton() = 0;   // 创建按钮
    virtual std::unique_ptr<TextBox> createTextBox() = 0; // 创建文本框
};

// 具体工厂：Windows UI 工厂
class WindowsUIFactory : public UIFactory {
public:
    std::unique_ptr<Button> createButton() override {
        return std::make_unique<WindowsButton>();
    }
    std::unique_ptr<TextBox> createTextBox() override {
        return std::make_unique<WindowsTextBox>();
    }
};

// 具体工厂：Mac UI 工厂
class MacUIFactory : public UIFactory {
public:
    std::unique_ptr<Button> createButton() override {
        return std::make_unique<MacButton>();
    }
    std::unique_ptr<TextBox> createTextBox() override {
        return std::make_unique<MacTextBox>();
    }
};

// 客户端
void renderUI(UIFactory& factory) {
    auto button = factory.createButton();   // 创建按钮
    auto textBox = factory.createTextBox(); // 创建文本框

    button->render();
    textBox->render();
}

int main() {
    WindowsUIFactory windowsFactory;
    MacUIFactory macFactory;

    std::cout << "Rendering Windows UI:" << std::endl;
    renderUI(windowsFactory); // 使用 Windows 工厂

    std::cout << "\nRendering Mac UI:" << std::endl;
    renderUI(macFactory); // 使用 Mac 工厂

    return 0;
}

```

代码解析
- 产品接口：
  - Button 和 TextBox 是两个独立的产品接口，分别定义了按钮和文本框的通用行为。
- 具体产品：
  - WindowsButton 和 MacButton 分别是 Windows 和 Mac 风格的按钮实现。
  - WindowsTextBox 和 MacTextBox 分别是 Windows 和 Mac 风格的文本框实现。
- 抽象工厂：
  - UIFactory 定义了创建按钮和文本框的方法。
- 具体工厂：
  - WindowsUIFactory 和 MacUIFactory 实现了具体的产品创建逻辑。
- 客户端：
  - renderUI 函数通过抽象工厂接口创建按钮和文本框，而不依赖于具体工厂或具体产品。

### 原型模式

原型模式允许通过复制现有对象来创建新对象，而不是直接实例化类。这种模式提供了一种简化对象创建的方式，尤其是在对象的创建过程非常复杂时。

组成部分:
- 原型接口（Prototype）：定义一个 clone 方法，用于克隆自身。
- 具体原型（Concrete Prototype）：实现 clone 方法，定义如何复制自身。
- 客户端（Client）：使用原型接口创建新对象。

适用场景:
- 创建对象的成本较高，直接创建对象不够高效（例如需要大量计算或访问数据库）。
- 系统需要大量相似对象，且对象的状态可通过复制得到。
- 想隐藏具体类的实现细节，通过抽象接口操作对象。


C++实现示例:

假设我们有一个复杂的图形类需要频繁创建，例如一个带有位置和颜色的形状对象。

```cpp
#include <iostream>
#include <string>
#include <memory>

// 原型接口
class Shape {
public:
    virtual ~Shape() = default;
    virtual Shape* clone() const = 0;  // 克隆方法
    virtual void draw() const = 0;     // 展示形状信息
};

// 具体原型：圆形
class Circle : public Shape {
private:
    int x_, y_, radius_;
    std::string color_;

public:
    Circle(int x, int y, int radius, const std::string& color)
        : x_(x), y_(y), radius_(radius), color_(color) {}

    // 实现克隆方法
    Circle* clone() const override {
        return new Circle(*this); // 使用拷贝构造函数实现深拷贝
    }

    void draw() const override {
        std::cout << "Circle: Position(" << x_ << ", " << y_ 
                  << "), Radius: " << radius_ 
                  << ", Color: " << color_ << std::endl;
    }
};

// 具体原型：矩形
class Rectangle : public Shape {
private:
    int x_, y_, width_, height_;
    std::string color_;

public:
    Rectangle(int x, int y, int width, int height, const std::string& color)
        : x_(x), y_(y), width_(width), height_(height), color_(color) {}

    // 实现克隆方法
    Rectangle* clone() const override {
        return new Rectangle(*this); // 使用拷贝构造函数实现深拷贝
    }

    void draw() const override {
        std::cout << "Rectangle: Position(" << x_ << ", " << y_ 
                  << "), Width: " << width_ 
                  << ", Height: " << height_ 
                  << ", Color: " << color_ << std::endl;
    }
};

// 客户端
int main() {
    // 创建一个圆形原型
    Shape* circlePrototype = new Circle(10, 20, 15, "Red");
    Shape* rectanglePrototype = new Rectangle(5, 5, 30, 40, "Blue");

    // 克隆圆形对象
    Shape* clonedCircle = circlePrototype->clone();
    Shape* clonedRectangle = rectanglePrototype->clone();

    // 显示克隆对象信息
    clonedCircle->draw();
    clonedRectangle->draw();

    // 清理资源
    delete circlePrototype;
    delete rectanglePrototype;
    delete clonedCircle;
    delete clonedRectangle;

    return 0;
}
```

### 建造者模式

**什么是建造者模式？**

建造者模式（Builder Pattern）是一种创建型设计模式，它允许我们一步一步地构建复杂对象。与直接用构造函数创建对象不同，建造者模式将对象的创建过程与其表示分离，使得同样的构建过程可以创建不同的表示。

**解决的问题**

在对象创建过程中，某些对象的构造过程可能会变得复杂且繁琐，比如需要设置多个属性或依赖于其他对象。构造函数的参数列表可能会变得过长，不仅难以维护，还容易出现错误。

**建造者模式解决了以下问题**：

- 简化对象创建过程：将复杂对象的创建步骤分解并封装在不同的方法中，使对象的创建过程更加清晰。
- 解耦对象的创建和表示：将对象的创建过程与它们的最终表示形式分离开来，使得同样的构建过程可以创建不同的对象。
- 提高代码可读性和维护性：通过将对象的构建步骤分离出来，使代码更具可读性和维护性。

**建造者模式的组成**

建造者模式通常包含以下几部分：

- 产品（Product）：最终构建出来的复杂对象。通常是一个包含多个部分的对象。
- 抽象建造者（Builder）：定义创建产品各个部分的抽象方法。
- 具体建造者（ConcreteBuilder）：实现抽象建造者接口，负责具体构建产品的各个部分，并提供一个用于获取最终产品的接口。
- 指挥者（Director）：负责管理构建过程。它使用建造者来构建产品，通常会按照特定的顺序构建产品的各个部分。
- 客户端（Client）：使用建造者来构建产品，但不需要关心产品的具体构建细节。

C++ 代码示例:

假设我们需要构建一个复杂的对象，表示一个“汽车”对象，包含发动机、车轮和车身等部件。我们使用建造者模式来解耦汽车的构建过程。

```cpp
#include <iostream>
#include <string>

// 产品类：汽车
class Car {
public:
    void setEngine(const std::string& engine) {
        engine_ = engine;
    }

    void setWheels(int wheels) {
        wheels_ = wheels;
    }

    void setBody(const std::string& body) {
        body_ = body;
    }

    void show() {
        std::cout << "Car details: " << std::endl;
        std::cout << "Engine: " << engine_ << std::endl;
        std::cout << "Wheels: " << wheels_ << std::endl;
        std::cout << "Body: " << body_ << std::endl;
    }

private:
    std::string engine_;
    int wheels_;
    std::string body_;
};

// 抽象建造者：建造者类
class CarBuilder {
public:
    virtual void buildEngine() = 0;
    virtual void buildWheels() = 0;
    virtual void buildBody() = 0;
    virtual Car* getResult() = 0;
    virtual ~CarBuilder() = default;
};

// 具体建造者：构建具体汽车
class SportsCarBuilder : public CarBuilder {
private:
    Car* car;

public:
    SportsCarBuilder() {
        car = new Car();
    }

    void buildEngine() override {
        car->setEngine("V8 Engine");
    }

    void buildWheels() override {
        car->setWheels(4);  // 运动型车需要四个轮子
    }

    void buildBody() override {
        car->setBody("Sports Body");
    }

    Car* getResult() override {
        return car;
    }

    ~SportsCarBuilder() {
        delete car;
    }
};

// 具体建造者：构建SUV
class SUVCarBuilder : public CarBuilder {
private:
    Car* car;

public:
    SUVCarBuilder() {
        car = new Car();
    }

    void buildEngine() override {
        car->setEngine("V6 Engine");
    }

    void buildWheels() override {
        car->setWheels(4);  // SUV车也需要四个轮子
    }

    void buildBody() override {
        car->setBody("SUV Body");
    }

    Car* getResult() override {
        return car;
    }

    ~SUVCarBuilder() {
        delete car;
    }
};

// 指挥者：指导建造过程
class CarDirector {
private:
    CarBuilder* builder;

public:
    CarDirector(CarBuilder* builder) : builder(builder) {}

    // 指挥者负责建造整个汽车
    void construct() {
        builder->buildEngine();
        builder->buildWheels();
        builder->buildBody();
    }

    Car* getCar() {
        return builder->getResult();
    }
};

// 客户端
int main() {
    // 选择建造者
    CarBuilder* builder = new SportsCarBuilder();
    CarDirector director(builder);

    director.construct();
    Car* car = director.getCar();
    car->show();

    // 清理资源
    delete car;
    delete builder;

    // 构建另一种类型的车
    builder = new SUVCarBuilder();
    director = CarDirector(builder);

    director.construct();
    car = director.getCar();
    car->show();

    delete car;
    delete builder;

    return 0;
}

```

代码解析
- Car 是产品类，它包含汽车的多个部分（如发动机、车轮和车身）。
- CarBuilder 是抽象建造者，定义了构建汽车各个部分的接口。
- SportsCarBuilder 和 SUVCarBuilder 是具体建造者，负责实现如何构建不同类型的汽车。
- CarDirector 是指挥者，负责协调构建过程并决定构建的顺序。
- Client 使用建造者模式来创建具体的汽车。


**总结**

建造者模式提供了一种灵活的方式来创建复杂对象。它将对象的创建过程分解成多个步骤，并允许这些步骤以不同的顺序或方式组合，从而使得同样的构造过程可以生成不同的对象。通过建造者模式，代码的可读性和可维护性得到了提升，并且减少了创建复杂对象时可能出现的错误。

## 结构型模式

### 适配器模式

适配器模式的核心作用是将一个类的接口转换为客户端所期望的另一个接口，使得原本接口不兼容的类可以一起工作。其主要作用表现为如下三点：
- 解决接口不兼容的问题
- 重用已有的类
- 增强系统的灵活性和可扩展性

适配器模式可以分为对象适配器模式(has-a)和类适配器模式(is-a)两种。

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

桥接模式的主要作用是解耦抽象和实现，使得它们可以独立地变化和扩展。通过桥接模式，可以在实现高层结构的灵活性的同时，避免类的爆炸性增长，增强系统的可扩展性和维护性。以下是桥接模式的具体作用：
- 分离抽象与实现。避免了直接依赖具体实现。这样在不影响抽象接口的情况下，可以自由更换实现。
- 支持独立扩展和变化。在桥接模式中，抽象和实现都可以独立扩展，不会相互影响。
- 如果不使用桥接模式，通常需要为每个具体组合创建一个子类，比如"红色圆形"、"绿色矩形"等，可能导致大量的组合类。桥接模式通过将不同维度的实现进行组合，可以大大减少类的数量。
- 提高系统的可维护性和扩展性。桥接模式的松耦合特性使得代码更易维护，因为抽象和实现彼此独立。更新实现或新增实现时，不需要更改抽象部分。
- 实现运行时动态组合。桥接模式支持运行时动态组合，抽象部分可以在运行时选择不同的实现。通过组合不同的实现，系统可以实现不同的行为和效果，具有极大的灵活性。
- 适合跨平台的系统设计。桥接模式可以隐藏不同平台的差异，将平台的具体实现细节封装在实现部分。通过这一模式，可以轻松地在不同平台上使用不同的实现，而不影响系统的抽象部分。

例如，我们有一个图形绘制系统，支持不同的颜色(如绿色和红色)，支持不同类型的形状（如圆形和矩形），支持不同的材料(如木制和金属)。使用桥接模式，可以将颜色、形状以及材料分开，使得三者可以独立变化。

```cpp
#include <iostream>
#include <memory>

// 第一个维度：颜色
class Color {
public:
    virtual void applyColor() = 0;
    virtual ~Color() = default;
};

class RedColor : public Color {
public:
    void applyColor() override {
        std::cout << "Applying Red Color";
    }
};

class GreenColor : public Color {
public:
    void applyColor() override {
        std::cout << "Applying Green Color";
    }
};

// 第二个维度：材质
class Material {
public:
    virtual void applyMaterial() = 0;
    virtual ~Material() = default;
};

class WoodMaterial : public Material {
public:
    void applyMaterial() override {
        std::cout << " with Wood Material" << std::endl;
    }
};

class MetalMaterial : public Material {
public:
    void applyMaterial() override {
        std::cout << " with Metal Material" << std::endl;
    }
};

// 第三个维度：形状
class Shape {
protected:
    std::shared_ptr<Color> color;        // 持有颜色的实现
    std::shared_ptr<Material> material;  // 持有材质的实现

public:
    Shape(std::shared_ptr<Color> c, std::shared_ptr<Material> m) 
        : color(c), material(m) {}

    virtual void draw() = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    Circle(std::shared_ptr<Color> c, std::shared_ptr<Material> m) 
        : Shape(c, m) {}

    void draw() override {
        std::cout << "Drawing Circle with ";
        color->applyColor();
        material->applyMaterial();
    }
};

class Rectangle : public Shape {
public:
    Rectangle(std::shared_ptr<Color> c, std::shared_ptr<Material> m) 
        : Shape(c, m) {}

    void draw() override {
        std::cout << "Drawing Rectangle with ";
        color->applyColor();
        material->applyMaterial();
    }
};

int main() {
    // 创建颜色和材质的具体实现
    std::shared_ptr<Color> red = std::make_shared<RedColor>();
    std::shared_ptr<Color> green = std::make_shared<GreenColor>();

    std::shared_ptr<Material> wood = std::make_shared<WoodMaterial>();
    std::shared_ptr<Material> metal = std::make_shared<MetalMaterial>();

    // 组合不同的形状、颜色和材质
    std::shared_ptr<Shape> woodenRedCircle = std::make_shared<Circle>(red, wood);
    std::shared_ptr<Shape> metalGreenRectangle = std::make_shared<Rectangle>(green, metal);

    // 使用组合
    woodenRedCircle->draw();
    // 输出：Drawing Circle with Applying Red Color with Wood Material

    metalGreenRectangle->draw();
    // 输出：Drawing Rectangle with Applying Green Color with Metal Material

    // 动态改变材质和颜色
    std::shared_ptr<Shape> metalRedCircle = std::make_shared<Circle>(red, metal);
    metalRedCircle->draw();
    // 输出：Drawing Circle with Applying Red Color with Metal Material

    return 0;
}
```

**代码解析**
从Implementor、ConcreteImplementor、Abstraction、和RefinedAbstraction这四个角色的角度去解析上述代码：
- Implementor： Color类就是Implementor，它定义了applyColor()接口；Material类也是Implementor，它定义了applyMaterial()接口
- ConcreteImplementor： RedColor和GreenColor就是Color类的具体实现；WoodMaterial和MetalMaterial就是Material的具体实现。
- Abstraction：Shape类是Abstraction，它持有一个指向Color的指针和一个指向Material类的指针，并且定义了draw()方法作为抽象接口。
- RefinedAbstraction： Circle和Rectangle类是RefinedAbstraction，它们继承自Shape（Abstraction），并实现了具体的draw()方法。实现了不同颜色和不同材质的绘制效果。

### 组合模式

组合模式（Composite Pattern）允许你将对象组合成树形结构来表示"部分-整体"的层次结构。组合模式使得客户端可以以统一的方式对待单个对象和对象集合，能够让客户端在不关心组合对象内部结构的情况下，像操作单个对象一样操作整个对象树。

组合模式解决的问题
- 统一管理对象： 组合模式将单个对象和由对象组合而成的复合对象统一成相同的接口，允许客户端以相同的方式处理单个对象和对象集合。这样，客户端可以方便地处理树形结构中的所有元素，而无需关心这些元素是简单对象还是复合对象。
- 构建层次结构： 组合模式特别适用于树形结构的对象，如文件系统、UI组件等。通过组合模式，可以方便地创建这种层次结构。
- 递归结构： 组合模式使得递归结构的管理和操作变得非常简单。例如，树形结构的每个节点（无论是叶子节点还是复合节点）都可以统一地进行遍历、添加、删除等操作。

我们以一个文件系统为例，其中包含文件和文件夹。文件夹可以包含多个文件或子文件夹，文件夹和文件都可以统一处理成“文件系统元素”。这个场景适合使用组合模式。

步骤：
- 定义一个 Component 抽象类，表示文件系统中的所有元素（文件或文件夹）。
- 定义 Leaf 类（文件），实现 Component 接口。
- 定义 Composite 类（文件夹），实现 Component 接口，并且可以包含多个子元素（文件或文件夹）。

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <memory>

// Component: 文件系统元素基类
class IFileSystem {
public:
    virtual ~IFileSystem() {}
    virtual void show(int indent = 0) const = 0;
};

// Leaf: 叶子节点类（文件）
class File : public IFileSystem {
private:
    std::string name;
public:
    File(const std::string& name) : name(name) {}
    
    void show(int indent = 0) const override {
        std::string indentation(indent, ' ');
        std::cout << indentation << "File: " << name << std::endl;
    }
};

// Composite: 组合节点类（文件夹）
class Folder : public IFileSystem {
private:
    std::string name;
    std::vector<std::shared_ptr<IFileSystem>> children;  // 子元素

public:
    Folder(const std::string& name) : name(name) {}
    
    void add(std::shared_ptr<FileSystemElement> element) {
        children.push_back(element);
    }

    void show(int indent = 0) const override {
        std::string indentation(indent, ' ');
        std::cout << indentation << "Folder: " << name << std::endl;
        for (const auto& child : children) {
            child->show(indent + 2);  // 子元素的缩进增加
        }
    }
};

int main() {
    // 创建文件和文件夹
    auto file1 = std::make_shared<File>("file1.txt");
    auto file2 = std::make_shared<File>("file2.txt");
    
    auto folder1 = std::make_shared<Folder>("Folder1");
    folder1->add(file1);
    folder1->add(file2);
    
    auto folder2 = std::make_shared<Folder>("Folder2");
    auto file3 = std::make_shared<File>("file3.txt");
    folder2->add(file3);
    
    auto root = std::make_shared<Folder>("RootFolder");
    root->add(folder1);
    root->add(folder2);

    // 展示文件系统结构
    root->show();

    return 0;
}
```

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

将请求封装为对象，以便支持参数化的命令、队列、日志等功能。

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

### 模板方法模式

**模板方法模式针对的问题**

模板方法模式主要解决了代码复用和算法变体的问题。当你有一组**相似的操作**，它们在**大部分步骤上是相同**的，但在某些步骤上有所不同时，模板方法模式能够帮助你将通用的代码结构提取到基类中，并允许子类重写某些特定步骤。这不仅减少了代码的重复，还让算法的结构和可变部分解耦，使代码更具可读性和可维护性。

不使用模板方法的代码

假设我们有两种饮料（茶和咖啡），它们的制作过程如下：
- 煮水
- 冲泡
- 倒入杯中
- 添加调料

但是茶和咖啡在“冲泡”和“添加调料”步骤上有所不同。我们来看一下如果不使用模板方法模式的代码会是什么样子。

```cpp
#include <iostream>

// 茶的制作过程
class Tea {
public:
    void prepareRecipe() {
        boilWater();
        steepTeaBag();
        pourInCup();
        addLemon();
    }

private:
    void boilWater() {
        std::cout << "Boiling water" << std::endl;
    }

    void steepTeaBag() {
        std::cout << "Steeping the tea" << std::endl;
    }

    void pourInCup() {
        std::cout << "Pouring into cup" << std::endl;
    }

    void addLemon() {
        std::cout << "Adding lemon" << std::endl;
    }
};

// 咖啡的制作过程
class Coffee {
public:
    void prepareRecipe() {
        boilWater();
        brewCoffeeGrinds();
        pourInCup();
        addSugarAndMilk();
    }

private:
    void boilWater() {
        std::cout << "Boiling water" << std::endl;
    }

    void brewCoffeeGrinds() {
        std::cout << "Dripping coffee through filter" << std::endl;
    }

    void pourInCup() {
        std::cout << "Pouring into cup" << std::endl;
    }

    void addSugarAndMilk() {
        std::cout << "Adding sugar and milk" << std::endl;
    }
};

int main() {
    Tea tea;
    Coffee coffee;

    std::cout << "Making tea..." << std::endl;
    tea.prepareRecipe();

    std::cout << "\nMaking coffee..." << std::endl;
    coffee.prepareRecipe();

    return 0;
}
```

**不使用模板方法的缺点**
- 代码重复：boilWater() 和 pourInCup() 方法在 Tea 和 Coffee 类中完全相同，这样的代码在两个类中重复了。
- 难以维护：如果需要修改煮水或倒水的过程，你必须在每个类中单独修改这些方法。
- 算法耦合：算法的结构和步骤的实现耦合在一起，不易扩展。

**使用模板方法的代码**

现在我们来看看使用模板方法模式的代码。

```cpp
#include <iostream>

// 抽象类：饮料
class Beverage {
public:
    // 模板方法：定义算法的步骤
    void prepareRecipe() {
        boilWater();     // 烧水
        brew();          // 冲泡饮品 子类实现
        pourInCup();     // 倒入杯中
        addCondiments(); // 添加调料 子类实现
    }

protected:
    void boilWater() {
        std::cout << "Boiling water" << std::endl;
    }

    void pourInCup() {
        std::cout << "Pouring into cup" << std::endl;
    }

    // 这两个步骤由子类实现
    virtual void brew() = 0;
    virtual void addCondiments() = 0;

    virtual ~Beverage() = default;
};

// 具体类：茶
class Tea : public Beverage {
protected:
    void brew() override {
        std::cout << "Steeping the tea" << std::endl;
    }

    void addCondiments() override {
        std::cout << "Adding lemon" << std::endl;
    }
};

// 具体类：咖啡
class Coffee : public Beverage {
protected:
    void brew() override {
        std::cout << "Dripping coffee through filter" << std::endl;
    }

    void addCondiments() override {
        std::cout << "Adding sugar and milk" << std::endl;
    }
};

int main() {
    Tea tea;
    Coffee coffee;

    std::cout << "Making tea..." << std::endl;
    tea.prepareRecipe();

    std::cout << "\nMaking coffee..." << std::endl;
    coffee.prepareRecipe();

    return 0;
}
```
**使用模板方法的优点**
- 减少代码重复：boilWater() 和 pourInCup() 方法被提取到基类 Beverage 中，避免了代码重复。
- 易于维护：如果需要修改煮水或倒水的过程，只需在基类中修改一次。
- 扩展性更好：如果要添加新的饮料类，只需继承 Beverage 并实现 brew() 和 addCondiments() 方法即可，不需要修改已有的代码。
- 算法与步骤解耦：算法的步骤顺序（模板方法）与具体实现分离，使得算法框架和具体步骤实现的变化独立。

**总结**

使用模板方法模式后，代码的结构变得更加清晰，复用性和扩展性都得到了提升。这种模式特别适合那些需要定义一组操作步骤但在某些步骤上存在差异的场景。通过模板方法模式，可以在基类中定义通用的算法框架，并让子类实现具体的细节，从而达到了既复用代码又灵活定制的目的。


### 访问者模式

访问者模式（Visitor Pattern） 是一种行为型设计模式，主要用于将操作从数据结构中分离出来，使得不改变数据结构的前提下，能够对其增加新的操作。

访问者模式主要解决以下问题：

- 操作扩展：在对象结构（如树形结构、列表等）中，有时需要对其中的每个对象执行一些操作。这些操作可能随着时间的推移而变化或增加。如果将操作直接定义在对象类中，修改或新增操作将导致修改对象类，这不符合开闭原则。

- 对象结构不易修改：对象结构比较稳定或难以修改，但操作可能频繁变化或增加。访问者模式允许在不修改对象结构的情况下，添加新的操作。

- 避免类型判断：在一个对象结构中，不同类型的对象可能需要执行不同的操作。如果不使用访问者模式，通常需要进行类型判断来决定执行哪个操作，这会导致代码复杂且难以维护。访问者模式通过双重分派机制，避免了显式的类型检查。

访问者模式的结构

访问者模式的关键在于将对象结构与要执行的操作分离。它的主要组成部分包括：

- Visitor（访问者）：定义对各类元素的访问操作接口。每种元素类型都有对应的访问方法。

- ConcreteVisitor（具体访问者）：实现访问者接口中的具体操作。每个具体访问者类实现不同的操作。

- Element（元素）：定义一个接受访问者的方法（accept），这个方法将访问者作为参数。

- ConcreteElement（具体元素）：实现元素接口，提供具体的accept方法的实现。在accept方法中调用访问者对应的方法。

- Object Structure（对象结构）：通常是一个包含不同类型元素的集合，可以遍历这些元素并执行访问者的操作。

**访问者模式的示例**

假设我们有一个图形对象结构，其中包含Circle和Rectangle，我们希望对这些图形对象进行不同的操作（如计算面积、绘制等）。

```cpp
#include <iostream>
#include <vector>
#include <memory>

// Forward declaration of Visitor
class Circle;
class Rectangle;

class Visitor {
public:
    virtual void visit(Circle* circle) = 0;
    virtual void visit(Rectangle* rectangle) = 0;
    virtual ~Visitor() = default;
};

// Element interface
class Shape {
public:
    virtual void accept(Visitor* visitor) = 0;
    virtual ~Shape() = default;
};

// ConcreteElement - Circle
class Circle : public Shape {
public:
    void accept(Visitor* visitor) override {
        visitor->visit(this);
    }
    int radius() const { return 5; }  // Example property
};

// ConcreteElement - Rectangle
class Rectangle : public Shape {
public:
    void accept(Visitor* visitor) override {
        visitor->visit(this);
    }
    int width() const { return 4; }
    int height() const { return 3; }
};

// ConcreteVisitor - AreaCalculator
class AreaCalculator : public Visitor {
public:
    void visit(Circle* circle) override {
        int area = 3.14 * circle->radius() * circle->radius();
        std::cout << "Circle Area: " << area << std::endl;
    }
    void visit(Rectangle* rectangle) override {
        int area = rectangle->width() * rectangle->height();
        std::cout << "Rectangle Area: " << area << std::endl;
    }
};

// Client code
int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>());
    shapes.push_back(std::make_unique<Rectangle>());

    AreaCalculator calculator;
    for (auto& shape : shapes) {
        shape->accept(&calculator);
    }

    return 0;
}

```

**代码解析**

- Visitor接口：Visitor接口定义了访问Circle和Rectangle的方法。

- 具体访问者（AreaCalculator）：AreaCalculator实现了访问者接口中的方法，提供了计算图形面积的功能。

- 元素接口和具体元素：Shape类是元素接口，Circle和Rectangle是具体元素类。它们实现了accept方法，并在其中调用了访问者的相应方法。

- 客户端代码：客户端创建了图形对象，并遍历它们，调用每个对象的accept方法。这使得具体的访问者操作（如面积计算）得以应用到每个对象上。

**总结**

访问者模式通过将操作与对象结构分离，使得在不修改对象结构的前提下添加新操作变得容易。它尤其适合于对象结构较为稳定但操作经常变化的场景。通过访问者模式，可以避免繁琐的类型检查和复杂的条件逻辑，增强系统的可扩展性和维护性。

### 备忘录模式

备忘录模式（Memento Pattern）是一种行为型设计模式，主要用于在不破坏封装的前提下捕获对象的内部状态，并在以后需要时恢复到该状态。它广泛应用于需要撤销（undo）操作的场景，例如文本编辑器、游戏的存档系统等。

备忘录模式的关键点是将状态存储到一个备忘录对象中，同时确保这些状态对外部是透明且不可直接修改的。

备忘录模式通常包含以下三个主要角色：

- Originator（发起者）：
  - 定义需要保存状态的对象。
  - 能创建一个备忘录以存储其当前状态。
  - 能使用备忘录恢复其状态。

- Memento（备忘录）：
  - 存储发起者的内部状态。
  - 对外部提供只读接口，防止被外部修改。

- Caretaker（负责人）：
  - 负责保存和管理备忘录对象。
  - 不对备忘录的内容进行修改或访问。

```cpp
#include <iostream>
#include <string>
#include <stack> // 用于保存备忘录

// 备忘录类：保存状态
class Memento {
private:
    std::string state; // 保存的状态
public:
    Memento(const std::string& state) : state(state) {}
    std::string getState() const { return state; }
};

// 发起者类：需要保存和恢复状态的对象
class Originator {
private:
    std::string state; // 当前状态
public:
    void setState(const std::string& newState) {
        state = newState;
        std::cout << "State set to: " << state << std::endl;
    }

    std::string getState() const { return state; }

    // 保存当前状态到备忘录
    Memento saveStateToMemento() {
        return Memento(state);
    }

    // 从备忘录恢复状态
    void restoreStateFromMemento(const Memento& memento) {
        state = memento.getState();
        std::cout << "State restored to: " << state << std::endl;
    }
};

// 负责人类：管理备忘录
class Caretaker {
private:
    std::stack<Memento> mementoStack; // 使用栈管理备忘录
public:
    void save(const Memento& memento) {
        mementoStack.push(memento);
    }

    Memento undo() {
        if (!mementoStack.empty()) {
            Memento memento = mementoStack.top();
            mementoStack.pop();
            return memento;
        } else {
            throw std::runtime_error("No mementos to undo!");
        }
    }
};

int main() {
    Originator editor;
    Caretaker history;

    // 初始状态
    editor.setState("Version 1");
    history.save(editor.saveStateToMemento()); // 保存状态

    // 修改状态
    editor.setState("Version 2");
    history.save(editor.saveStateToMemento()); // 保存状态

    // 再次修改状态
    editor.setState("Version 3");

    // 撤销操作
    editor.restoreStateFromMemento(history.undo());
    editor.restoreStateFromMemento(history.undo());

    return 0;
}
```

### 状态模式

**状态模式（State Pattern）** 是一种行为设计模式，它允许对象在内部状态发生改变时改变其行为，使得对象看起来好像修改了它的类。

它的核心思想是：将与特定状态相关的行为抽取到独立的状态类中，并让上下文（Context）对象通过组合不同的状态类来切换行为。

状态模式的结构
状态模式由以下几个部分组成：

- 1.上下文（Context）：维护当前状态实例，可以根据内部状态变化切换到不同的状态。
- 2.抽象状态类（State）：定义状态的公共接口。
- 3.具体状态类（ConcreteState）：实现具体的状态相关行为。

适用场景
- 对象的行为依赖于它的状态，并且需要在运行时根据状态切换行为。
- 避免在对象中使用大量的条件语句（if 或 switch）来管理状态。


用C++实现状态模式

我们以一个简单的例子来说明：设计一个文档的工作流状态管理系统。文档有三种状态：
- 1.草稿（Draft）
- 2.审核中（Moderation）
- 3.已发布（Published）

每个状态下有不同的行为，例如提交审核和发布。

```cpp
#include <iostream>
#include <string>
#include <memory>

// 抽象状态类
class State {
public:
    virtual ~State() = default;

    // 状态相关的行为接口
    virtual void submitReview(class Document* doc) = 0;
    virtual void publish(class Document* doc) = 0;
    virtual std::string getStateName() const = 0;
};

// 前置声明
class Document;

// 草稿状态
class DraftState : public State {
public:
    void submitReview(Document* doc) override;
    void publish(Document* doc) override {
        std::cout << "草稿状态不能直接发布。\n";
    }
    std::string getStateName() const override {
        return "草稿状态";
    }
};

// 审核中状态
class ModerationState : public State {
public:
    void submitReview(Document* doc) override {
        std::cout << "文档已经在审核中。\n";
    }
    void publish(Document* doc) override;
    std::string getStateName() const override {
        return "审核中状态";
    }
};

// 已发布状态
class PublishedState : public State {
public:
    void submitReview(Document* doc) override {
        std::cout << "已发布的文档不能提交审核。\n";
    }
    void publish(Document* doc) override {
        std::cout << "文档已经是发布状态。\n";
    }
    std::string getStateName() const override {
        return "已发布状态";
    }
};

// 上下文类
class Document {
private:
    std::unique_ptr<State> state; // 当前状态
public:
    Document(std::unique_ptr<State> initState) : state(std::move(initState)) {}

    void setState(std::unique_ptr<State> newState) {
        state = std::move(newState);
    }

    void submitReview() {
        state->submitReview(this);
    }

    void publish() {
        state->publish(this);
    }

    std::string getCurrentState() const {
        return state->getStateName();
    }
};

// 各具体状态实现状态转换
void DraftState::submitReview(Document* doc) {
    std::cout << "文档从草稿状态提交到审核中状态。\n";
    doc->setState(std::make_unique<ModerationState>());
}

void ModerationState::publish(Document* doc) {
    std::cout << "文档从审核中状态变为已发布状态。\n";
    doc->setState(std::make_unique<PublishedState>());
}

// 主函数测试
int main() {
    // 创建文档，并初始化为草稿状态
    Document doc(std::make_unique<DraftState>());

    std::cout << "当前状态: " << doc.getCurrentState() << "\n";
    doc.submitReview();

    std::cout << "当前状态: " << doc.getCurrentState() << "\n";
    doc.publish();

    std::cout << "当前状态: " << doc.getCurrentState() << "\n";
    doc.submitReview();
}
```

代码解析
- 1.抽象状态类 State 定义了两个行为接口（submitReview 和 publish），具体行为由子类实现。
- 2.上下文类 Document 维护一个指向状态的指针，并通过 setState 方法动态切换状态。
- 3.每个具体状态类实现了特定状态下的行为，并负责在条件满足时改变上下文的状态。

通过状态模式，避免了在 Document 类中使用大量的 if-else 逻辑，从而使代码更清晰、易扩展。

如果不用状态模式，处理多种状态下的行为逻辑通常会集中在一个类中，通过条件语句（如 if-else 或 switch-case）来处理不同状态对应的行为。这种方式在简单场景下是可以接受的，但随着状态的增加，代码的复杂度会显著提升，变得难以维护和扩展。

以下是不用状态模式实现文档工作流的代码版本。

如果不用状态模式，代码可能是下面这样的：

```cpp
#include <iostream>
#include <string>

// 定义状态枚举
enum class DocumentState {
    Draft,       // 草稿状态
    Moderation,  // 审核中状态
    Published    // 已发布状态
};

// 文档类
class Document {
private:
    DocumentState state; // 当前状态

public:
    Document() : state(DocumentState::Draft) {}

    // 提交审核操作
    void submitReview() {
        switch (state) {
            case DocumentState::Draft:
                std::cout << "文档从草稿状态提交到审核中状态。\n";
                state = DocumentState::Moderation;
                break;
            case DocumentState::Moderation:
                std::cout << "文档已经在审核中，不能重复提交。\n";
                break;
            case DocumentState::Published:
                std::cout << "已发布的文档不能提交审核。\n";
                break;
        }
    }

    // 发布操作
    void publish() {
        switch (state) {
            case DocumentState::Draft:
                std::cout << "草稿状态不能直接发布。\n";
                break;
            case DocumentState::Moderation:
                std::cout << "文档从审核中状态变为已发布状态。\n";
                state = DocumentState::Published;
                break;
            case DocumentState::Published:
                std::cout << "文档已经是发布状态。\n";
                break;
        }
    }

    // 获取当前状态
    std::string getCurrentState() const {
        switch (state) {
            case DocumentState::Draft: return "草稿状态";
            case DocumentState::Moderation: return "审核中状态";
            case DocumentState::Published: return "已发布状态";
        }
        return "未知状态";
    }
};

// 测试代码
int main() {
    Document doc;

    std::cout << "当前状态: " << doc.getCurrentState() << "\n";
    doc.submitReview();

    std::cout << "当前状态: " << doc.getCurrentState() << "\n";
    doc.publish();

    std::cout << "当前状态: " << doc.getCurrentState() << "\n";
    doc.submitReview();
}
```

### 迭代器模式

迭代器模式是一种行为型设计模式，主要目的是提供一种方法，可以顺序访问一个集合对象中的各个元素，而无需暴露其内部的实现细节。

它的核心思想是：将遍历行为抽象为一个迭代器类，使集合对象和遍历算法分离。这样既可以使用不同的迭代器实现多种遍历方式，也可以轻松地更改和扩展集合的遍历方法。

迭代器模式的组成
- 1迭代器接口 (Iterator): 定义了访问和遍历集合的方法（如next()、hasNext()等）。
- 2.具体迭代器 (Concrete Iterator): 实现迭代器接口，维护遍历的状态（如当前索引位置）。
- 3.集合接口 (Aggregate): 定义创建迭代器的方法。
- 4.具体集合 (Concrete Aggregate): 实现集合接口，返回一个具体迭代器的实例。

C++ 中的迭代器模式实现

以下用一个简单的例子展示如何用 C++ 实现迭代器模式：创建一个数字集合，并实现一个可以顺序遍历的迭代器。

```cpp
#include <iostream>
#include <vector>
using namespace std;

// 迭代器接口
class Iterator {
public:
    virtual bool hasNext() = 0;  // 是否还有下一个元素
    virtual int next() = 0;      // 获取下一个元素
    virtual ~Iterator() = default;
};

// 集合接口
class Aggregate {
public:
    virtual Iterator* createIterator() = 0; // 创建迭代器
    virtual ~Aggregate() = default;
};

// 具体迭代器
class ConcreteIterator : public Iterator {
private:
    vector<int>& collection; // 引用集合
    size_t index;            // 当前索引位置
public:
    explicit ConcreteIterator(vector<int>& collection) 
        : collection(collection), index(0) {}

    bool hasNext() override {
        return index < collection.size();
    }

    int next() override {
        return hasNext() ? collection[index++] : -1;
    }
};

// 具体集合
class ConcreteAggregate : public Aggregate {
private:
    vector<int> collection; // 内部存储的集合
public:
    void addItem(int item) {
        collection.push_back(item);
    }

    Iterator* createIterator() override {
        return new ConcreteIterator(collection); // 返回具体迭代器
    }
};

int main() {
    // 创建集合
    ConcreteAggregate aggregate;
    aggregate.addItem(10);
    aggregate.addItem(20);
    aggregate.addItem(30);

    // 创建迭代器
    Iterator* iterator = aggregate.createIterator();

    // 使用迭代器遍历集合
    while (iterator->hasNext()) {
        cout << iterator->next() << " ";
    }
    cout << endl;

    delete iterator; // 清理迭代器
    return 0;
}
```

```shell
10 20 30
```

代码解析：

- 1.Iterator 接口:定义了遍历集合的方法：hasNext 和 next。
- 2.ConcreteIterator 类:持有对集合的引用，记录当前的遍历状态（index）。
- 3.Aggregate 接口:提供创建迭代器的抽象方法，保证集合可以生成迭代器。
- 4.ConcreteAggregate 类:实现了集合的存储功能，并返回具体迭代器。
- 5.客户端:客户端代码无需了解集合的内部结构，只通过迭代器访问集合的元素。

优点与适用场景
优点
- 1.封装性：集合的遍历逻辑与集合本身的实现分离。
- 2.一致性：客户端无需了解集合的结构，通过统一的接口操作集合。
- 3.灵活性：可以为集合实现多种迭代方式（如顺序、逆序等）。

适用场景
- 需要访问一个集合对象的内容，但不想暴露其内部实现。
- 想提供多种遍历集合的方式。
- 需要遍历不同类型的集合。

C++ 中的 STL（标准模板库）中的迭代器就是这一模式的一个实际应用。例如，```std::vector<int>::iterator``` 提供了一种标准化的遍历方式，这正是迭代器模式的典范实现。

### 观察者模式简介

**观察者模式**是一种行为型设计模式，它定义了一种一对多的依赖关系。当一个对象的状态发生改变时，它的所有依赖者（观察者）都会收到通知并自动更新。

**核心思想**：发布-订阅机制

观察者模式的组成
- 1.主题（Subject）：被观察的对象，管理所有依赖它的观察者，并在自身状态改变时通知这些观察者。
- 2.观察者（Observer）：接收主题的通知并做出响应的对象。
- 3.具体主题（Concrete Subject）：主题的具体实现，存储状态并通知观察者。
- 4.具体观察者（Concrete Observer）：实现了观察者接口，接收到通知后执行具体的更新操作。

C++ 中的观察者模式实现

下面的例子展示如何用 C++ 实现观察者模式：一个主题（如新闻发布者）有多个观察者（如订阅用户），当新闻更新时通知所有订阅者。

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// 观察者接口
class Observer {
public:
    virtual void update(const string& message) = 0; // 接收通知的接口
    virtual ~Observer() = default;
};

// 主题接口
class Subject {
public:
    virtual void attach(Observer* observer) = 0;   // 添加观察者
    virtual void detach(Observer* observer) = 0;   // 移除观察者
    virtual void notify() = 0;                     // 通知所有观察者
    virtual ~Subject() = default;
};

// 具体主题
class NewsPublisher : public Subject {
private:
    vector<Observer*> observers;  // 存储观察者列表
    string latestNews;            // 最新新闻内容
public:
    void attach(Observer* observer) override {
        observers.push_back(observer);
    }

    void detach(Observer* observer) override {
        observers.erase(remove(observers.begin(), observers.end(), observer), observers.end());
    }

    void notify() override {
        for (Observer* observer : observers) {
            observer->update(latestNews);
        }
    }

    // 设置新闻并通知观察者
    void setNews(const string& news) {
        latestNews = news;
        notify();
    }
};

// 具体观察者
class Subscriber : public Observer {
private:
    string name;  // 订阅者的名字
public:
    explicit Subscriber(const string& name) : name(name) {}

    void update(const string& message) override {
        cout << "Subscriber " << name << " received news: " << message << endl;
    }
};

int main() {
    // 创建主题
    NewsPublisher publisher;

    // 创建观察者
    Subscriber subscriber1("Alice");
    Subscriber subscriber2("Bob");
    Subscriber subscriber3("Charlie");

    // 注册观察者
    publisher.attach(&subscriber1);
    publisher.attach(&subscriber2);
    publisher.attach(&subscriber3);

    // 更新新闻并通知观察者
    publisher.setNews("Breaking News: Design Patterns are awesome!");

    // 移除观察者
    publisher.detach(&subscriber2);

    // 再次更新新闻并通知观察者
    publisher.setNews("Update: C++ is powerful!");

    return 0;
}

```

运行结果

```shell
Subscriber Alice received news: Breaking News: Design Patterns are awesome!
Subscriber Bob received news: Breaking News: Design Patterns are awesome!
Subscriber Charlie received news: Breaking News: Design Patterns are awesome!
Subscriber Alice received news: Update: C++ is powerful!
Subscriber Charlie received news: Update: C++ is powerful!
```

代码解析

- Observer 接口：定义了更新方法 update，由观察者实现。
- Subject 接口：定义了管理观察者的方法（attach、detach）和通知观察者的方法 notify。
- Concrete Subject（NewsPublisher）：
  - 持有观察者列表并负责通知。
  - 提供 setNews 方法，用于改变主题状态并触发通知。
- Concrete Observer（Subscriber）：
  - 实现 update 方法，当收到通知时执行具体操作。
- 客户端：
  - 创建主题和观察者，注册观察者到主题中，通过改变主题状态触发通知。

优点与缺点
优点
- 1.解耦：观察者与主题分离，主题无需知道观察者的具体实现。
- 2.灵活性：观察者可以动态添加或移除。
- 3.一对多通知：一个主题可以通知多个观察者。

缺点
- 1.可能引起性能问题：观察者数量多时，通知的开销较大。
- 2.通知顺序问题：观察者的通知顺序可能需要额外管理。
- 3.循环依赖：观察者和主题可能相互依赖，需小心避免死循环。

适用场景
- 一个对象的状态改变需要通知其他对象，但对象之间是松耦合的。
- 需要动态添加、移除依赖关系的场景。
- 广泛用于 GUI 事件处理、MVC 框架中的 View 更新、消息队列系统等。

## 问题

### 工厂方法和抽象工厂方法的区别

抽象工厂模式和工厂方法模式都是设计模式中的创建型模式，它们用于封装对象的创建过程。然而，这两者之间存在显著的区别，主要体现在以下几个方面：

- 1.目的
  
    工厂方法模式
    - 目的是定义一个用于创建对象的接口，由子类决定要实例化的具体类。它针对的是单一产品，强调延迟到子类来实现创建过程。

    抽象工厂模式
    - 目的是提供一个接口，用于创建一组相关或相互依赖的对象，而不指定它们的具体类。它针对的是产品族，强调创建一组产品的过程是相互关联的。

- 2. 结构

    工厂方法模式
    - 每个具体产品对应一个具体工厂类。每个具体工厂类负责生产一种具体产品。

    示例结构：

    ```shell
    工厂方法
    ├── 抽象工厂类（Creator）
    ├── 抽象产品类（Product）
    ├── 具体工厂类（ConcreteCreator1, ConcreteCreator2）
    └── 具体产品类（ConcreteProduct1, ConcreteProduct2）
    ```

    抽象工厂模式
    - 一个具体工厂类可以生产多个相关的产品。工厂接口定义了一组方法，每个方法负责创建一个产品族中的某个产品。

    示例结构：
    ```shell
    抽象工厂
    ├── 抽象工厂类（AbstractFactory）
    │   ├── 创建产品 A（createProductA）
    │   └── 创建产品 B（createProductB）
    ├── 抽象产品类（ProductA, ProductB）
    ├── 具体工厂类（ConcreteFactory1, ConcreteFactory2）
    └── 具体产品类（ConcreteProductA1, ConcreteProductB1, ConcreteProductA2, ConcreteProductB2）
    ```

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

### 说说grpc中的建造者模式

gRPC中使用了建造者模式，尤其是在客户端和服务端的配置和调用过程中。这种模式帮助简化了复杂对象的创建过程，并提高了代码的可读性和可维护性。

gRPC 中的建造者模式

**1. Channel 构建**

在 gRPC 中，客户端需要通过一个 Channel 来与服务端通信。创建一个 Channel 通常需要指定目标地址、认证方式、连接参数等。gRPC 使用建造者模式来构建 Channel，使得构建过程更加清晰和可控。

```cpp
#include <grpcpp/grpcpp.h>

int main() {
    auto channel = grpc::CreateChannel("localhost:50051", grpc::InsecureChannelCredentials());

    // channel now can be used to create a stub and make RPC calls
    return 0;
}
```

在上面的代码中，CreateChannel 函数通过建造者模式创建了一个 Channel。你可以通过传入不同的参数来配置 Channel 的各个属性，比如目标地址和认证方式。

**2. Server 构建**

在服务端，Server 的创建也是通过建造者模式完成的。gRPC 提供了 ServerBuilder 类来帮助用户一步步地构建一个服务端实例。

```cpp
#include <grpcpp/grpcpp.h>
#include "your_service.grpc.pb.h" // 包含生成的服务代码

class YourServiceImpl final : public YourService::Service {
    // 实现服务端逻辑
};

int main() {
    std::string server_address("0.0.0.0:50051");
    YourServiceImpl service;

    grpc::ServerBuilder builder;
    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
    builder.RegisterService(&service);

    std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
    std::cout << "Server listening on " << server_address << std::endl;

    server->Wait();
    return 0;
}
```

在这个例子中，ServerBuilder 充当了建造者的角色，它提供了一系列的方法来逐步配置和创建 Server 对象：
- AddListeningPort：指定服务端监听的地址和端口。
- RegisterService：注册具体的服务实现。
- BuildAndStart：构建并启动 Server 对象。

**gRPC 中使用建造者模式的优点**
- 简化配置过程：通过建造者模式，gRPC 提供了简洁且清晰的 API 接口，使得用户可以通过链式调用的方式一步步配置复杂的对象（如 Server 和 Channel）。
- 增强可读性和可维护性：建造者模式将对象的创建过程分离成多个独立的步骤，每个步骤都负责一个特定的配置项，使代码更加易读且易于维护。
- 灵活性：用户可以根据需要选择性地配置某些属性，而不必关心其他不相关的配置，从而实现更高的灵活性。

**总结**

gRPC 中广泛使用了建造者模式，特别是在 Channel 和 Server 的构建过程中。通过这种模式，gRPC 简化了复杂对象的创建过程，提高了代码的可读性、可维护性和灵活性。使用建造者模式，开发者可以轻松配置和管理 gRPC 的各类组件，从而专注于服务的实现逻辑。

### 依赖反转原则是什么

**依赖反转原则**（Dependency Inversion Principle，DIP）是面向对象设计原则中的重要一环，它的核心思想是：

高层模块不应该依赖于低层模块；两者都应该依赖于抽象。抽象不应该依赖于细节；细节应该依赖于抽象。

这意味着我们在设计代码时，要通过接口或抽象类（抽象）来隔离高层模块和低层模块的直接依赖，从而实现灵活性和可维护性。

**1.没有遵循依赖反转原则的设计**

假设我们有一个场景：有一个高层模块 Notification（发送通知），它需要依赖具体的消息发送方式（比如 Email 类）。

```cpp
#include <iostream>
using namespace std;

// 低层模块：Email（发送邮件）
class Email {
public:
    void sendEmail(const string& message) {
        cout << "Sending Email: " << message << endl;
    }
};

// 高层模块：Notification
class Notification {
private:
    Email email;  // 直接依赖于具体的 Email 类
public:
    void notify(const string& message) {
        email.sendEmail(message);  // 发送通知依赖于 Email 的实现
    }
};

int main() {
    Notification notification;
    notification.notify("Hello, you have a new message!");
    return 0;
}
```

问题：
- 1.高层模块直接依赖低层模块：Notification 类直接依赖 Email 类。如果未来要增加新的通知方式（如短信 SMS 或推送通知 PushNotification），我们就需要修改 Notification 类。
- 2.**扩展性差：**这种紧耦合设计导致代码难以扩展和维护。


- 2.遵循依赖反转原则的设计

我们可以通过引入接口或抽象类，让高层模块依赖于抽象，而不是具体实现。这样，低层模块（如 Email 和 SMS）可以实现这个抽象，高层模块 Notification 则无需知道低层的具体细节。

改进代码：

```cpp
#include <iostream>
#include <memory>  // 用于智能指针
using namespace std;

// 抽象接口：MessageSender
class MessageSender {
public:
    virtual void sendMessage(const string& message) = 0;  // 纯虚函数
    virtual ~MessageSender() = default;  // 虚析构函数，保证子类的析构被调用
};

// 低层模块：Email
class Email : public MessageSender {
public:
    void sendMessage(const string& message) override {
        cout << "Sending Email: " << message << endl;
    }
};

// 低层模块：SMS
class SMS : public MessageSender {
public:
    void sendMessage(const string& message) override {
        cout << "Sending SMS: " << message << endl;
    }
};

// 高层模块：Notification
class Notification {
private:
    shared_ptr<MessageSender> messageSender;  // 依赖于抽象，而不是具体实现
public:
    Notification(shared_ptr<MessageSender> sender) : messageSender(sender) {}

    void notify(const string& message) {
        messageSender->sendMessage(message);  // 调用抽象接口的方法
    }
};

int main() {
    // 使用 Email 发送通知
    shared_ptr<MessageSender> emailSender = make_shared<Email>();
    Notification emailNotification(emailSender);
    emailNotification.notify("Hello, you have a new email!");

    // 使用 SMS 发送通知
    shared_ptr<MessageSender> smsSender = make_shared<SMS>();
    Notification smsNotification(smsSender);
    smsNotification.notify("Hello, you have a new SMS!");

    return 0;
}
```

改进后的好处：
- 高层模块和低层模块解耦：Notification 类只依赖于 MessageSender 接口，不关心具体实现（如 Email 或 SMS）。
- 扩展性增强：如果未来需要支持更多通知方式，比如 PushNotification，只需新增一个实现 MessageSender 的类，而无需修改 Notification 类。
- 遵循开闭原则：系统对扩展开放（可以新增通知方式），对修改关闭（Notification 类无需修改）。