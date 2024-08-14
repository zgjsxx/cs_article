---
category: 
  - 设计模式
tag:
  - 设计模式
---

# 桥接模式


## 问答题：假设有一个GUI库，GUI库需要运行在windows/linux/mac上，现在需要设计一个button类，该button有click和draw两个方法，怎么使用桥接模式进行设计？


假设我们正在设计一个GUI库，并需要实现一个Button组件。我们希望Button可以在不同的平台（如Windows、MacOS、Linux）上运行，并且可以支持不同的外观和行为（如经典风格、现代风格）。这正是桥接模式的典型应用场景。

**1.设计思路**

我们可以将Button的抽象部分与其具体实现分离开来，使得Button的逻辑（例如，点击事件）和外观（例如，按钮的绘制方式）可以独立变化。为此，我们需要两个层次的类结构：

- 抽象部分：定义Button的公共接口，包括用户可以与之交互的逻辑操作。
- 实现部分：定义如何在不同平台上绘制Button以及它的具体行为。

**2.类结构设计**
- 抽象部分（Abstraction）：Button类，表示按钮的公共接口。
- 实现部分（Implementor）：ButtonImplementor接口，定义了绘制和处理按钮的操作。
- 具体实现部分（ConcreteImplementor）：具体的实现类，比如WindowsButtonImplementor、MacButtonImplementor、LinuxButtonImplementor等，负责在不同平台上绘制按钮。
- 扩展抽象部分（RefinedAbstraction）：可以进一步扩展Button类，支持不同风格的按钮，如经典风格、现代风格等。

代码实现：

```cpp
#include <iostream>

// 实现部分接口（Implementor）
class ButtonImplementor {
public:
    virtual void drawButton() = 0;  // 绘制按钮的抽象方法
    virtual void clickButton() = 0; // 按钮点击的抽象方法
    virtual ~ButtonImplementor() = default;
};

// 具体实现部分（ConcreteImplementor） - Windows 平台
class WindowsButtonImplementor : public ButtonImplementor {
public:
    void drawButton() override {
        std::cout << "Drawing a button in Windows style." << std::endl;
    }

    void clickButton() override {
        std::cout << "Handling button click in Windows style." << std::endl;
    }
};

// 具体实现部分（ConcreteImplementor） - Mac 平台
class MacButtonImplementor : public ButtonImplementor {
public:
    void drawButton() override {
        std::cout << "Drawing a button in MacOS style." << std::endl;
    }

    void clickButton() override {
        std::cout << "Handling button click in MacOS style." << std::endl;
    }
};

// 抽象部分（Abstraction）
class Button {
protected:
    ButtonImplementor* implementor;  // 持有实现部分的引用

public:
    Button(ButtonImplementor* imp) : implementor(imp) {}

    virtual void draw() {
        implementor->drawButton();  // 调用实现部分的方法
    }

    virtual void click() {
        implementor->clickButton();  // 调用实现部分的方法
    }

    virtual ~Button() = default;
};

// 扩展抽象部分（RefinedAbstraction） - 带风格的按钮
class StyledButton : public Button {
private:
    std::string style;

public:
    StyledButton(ButtonImplementor* imp, const std::string& style)
        : Button(imp), style(style) {}

    void draw() override {
        std::cout << "Applying style: " << style << std::endl;
        implementor->drawButton();
    }

    void click() override {
        std::cout << "Button with style '" << style << "' clicked." << std::endl;
        implementor->clickButton();
    }
};

// 客户端代码
int main() {
    // 创建一个Windows平台的按钮
    ButtonImplementor* windowsImp = new WindowsButtonImplementor();
    Button* windowsButton = new Button(windowsImp);
    windowsButton->draw();
    windowsButton->click();

    // 创建一个Mac平台的带风格的按钮
    ButtonImplementor* macImp = new MacButtonImplementor();
    StyledButton* styledMacButton = new StyledButton(macImp, "Modern");
    styledMacButton->draw();
    styledMacButton->click();

    delete windowsButton;
    delete styledMacButton;
    delete windowsImp;
    delete macImp;

    return 0;
}
```

**代码解释**

ButtonImplementor接口定义了按钮的核心操作（如绘制和点击）。这是实现部分的抽象接口，具体平台（Windows、MacOS、Linux）将提供该接口的实现。

具体实现类（WindowsButtonImplementor、MacButtonImplementor）实现了ButtonImplementor接口，分别在不同的平台上提供具体的绘制和点击操作的实现。

Button类作为抽象部分的基类，定义了按钮的基本行为，如绘制和点击操作。Button类持有ButtonImplementor对象的引用，并通过该对象将操作委托给实现部分。

StyledButton类是Button类的扩展，用于支持带有特定风格的按钮。在调用draw()方法时，它首先应用风格，然后调用具体实现部分的绘制方法。

**桥接模式的作用总结**

通过使用桥接模式，这个Button类型实现了抽象与实现的分离，从而具备了以下优势：

- 独立扩展：可以独立地添加新的平台支持（通过创建新的ButtonImplementor实现），或添加新的按钮类型（通过扩展Button类），而不需要修改已有的代码。
- 可维护性强：将平台相关的代码与按钮的抽象行为分离，平台相关代码只需维护在具体实现类中，而抽象行为则集中在Button及其扩展类中。
- 灵活性高：可以根据需要自由组合不同的实现和抽象部分，例如，添加新的风格、在不同平台上使用不同的实现等。

**使用场景**

桥接模式特别适用于以下场景：

- 跨平台开发：当需要支持多个平台的实现，并且这些实现可能独立变化时，桥接模式是非常有效的。
- 需要在运行时动态切换实现：例如，可以在运行时决定使用哪种风格的按钮或在哪个平台上运行。
- 避免复杂的继承层次：通过桥接模式，可以避免将平台实现和按钮逻辑混合在一个继承层次中，从而减少类的复杂度。