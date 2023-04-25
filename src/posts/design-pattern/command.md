
---
category: 
  - 设计模式
tag:
  - 设计模式
---

# 设计模式 - 适配器模式(行为型)

命令模式用到最核心的实现手段，就是将**函数封装成对象**。
我们知道，在大部分编程语言中，函数是没法作为参数传递给其他函数的，也没法赋值给变量。借助命令模式，我们将函数封装成对象，这样就可以实现把函数像对象一样使用。

命令模式的主要作用和应用场景，是用来控制命令的执行，比如，异步、延迟、排队执行命令、撤销重做命令、存储命令、给命令记录日志等等，这才是命令模式能发挥独一无二作用的地方。



命令模式的优点：
- 单一职责原则。 你可以解耦触发和执行操作的类。
- 开闭原则。 你可以在不修改已有客户端代码的情况下在程序中创建新的命令。
- 你可以实现撤销和恢复功能。
- 你可以实现操作的延迟执行。
- 你可以将一组简单命令组合成一个复杂命令。

命令模式的缺点:
- 代码可能会变得更加复杂， 因为你在发送者和接收者之间增加了一个全新的层次。


demo code
```cpp
#include <iostream>
#include <vector>
#include <string>

class GameRole
{
public:
    GameRole(std::string name):_name(name)
    {

    }
    ~GameRole() = default;
public:
    void move(int i) const
    {
        std::cout << "game role "<< _name <<" move forward " << i << " step" << std::endl;
    }
    void jump() const
    {
        std::cout << "game role " << _name << " jump" << std::endl;
    }
private:
    std::string _name{};
};

class Command
{
public:
    Command() = default;
    virtual ~Command() = default;
public:
    virtual void execute() const = 0;
};

class MoveCommand : public Command
{
public:
    explicit MoveCommand(GameRole* role, int step): _step(step),_role(role)
    {

    }
    ~MoveCommand()
    {

    }

public:
    virtual void execute() const override
    {
        _role->move(_step);
    }
private:
    int _step;
    GameRole* _role{};
};


class JumpCommand : public Command
{
public:
    explicit JumpCommand(GameRole* role):_role(role)
    {

    }
    ~JumpCommand()
    {

    }

public:
    virtual void execute() const override
    {
        _role->jump();
    }
private:
    GameRole* _role{};
};

class Invoker
{
public:
    Invoker() = default;
    ~Invoker() = default;
public:
    void setCmd(Command* cmd)
    {
        _command_vec.emplace_back(cmd);
    }

    void executeCmd() const
    {
        for(auto &cmd : _command_vec)
        {
            cmd->execute();
        }
    }
private:
    std::vector<Command*> _command_vec;
};
int main()
{
    GameRole* role1 = new GameRole("role1");
    GameRole* role2 = new GameRole("role2");   
    Command*  moveCommand1 = new MoveCommand(role1,1);
    Command*  moveCommand2 = new MoveCommand(role1,2);
    Command*  jumpCommand = new JumpCommand(role1);

    Command*  moveCommand3 = new MoveCommand(role2,2);
    Command*  jumpCommand2 = new JumpCommand(role2);

    Invoker* invoker = new Invoker();
    invoker->setCmd(moveCommand1);
    invoker->setCmd(moveCommand2);   
    invoker->setCmd(jumpCommand); 
    invoker->setCmd(moveCommand3);   
    invoker->setCmd(jumpCommand2);       
    invoker->executeCmd();

    delete moveCommand1;
    delete moveCommand2;
    delete jumpCommand;
}
```