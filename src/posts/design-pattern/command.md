
---
category: 
  - 设计模式
tag:
  - 设计模式
---

# 设计模式 - 命令模式(行为型)

命令模式主要解决了什么问题？

在软件系统中，**行为的请求者**和**行为的执行者**通常是一种**紧耦合**的关系，但某些场合，比如需要对行为进行记录、撤销或重做、事务等处理时，这种无法抵御变化的紧耦合的设计就不太合适。

在网上也看到其他一些对于命令模式的理解，我觉得也有一定道理。

>命令模式用到最核心的实现手段，就是将**函数封装成对象**。我们知道，在大部分编程语言中，函数是没法作为参数传递给其他函数的，也没法赋值给变量。借助命令模式，我们将函数封装成对象，这样就可以实现把函数像对象一样使用。

>命令模式的主要作用和应用场景，是用来控制命令的执行，比如，异步、延迟、排队执行命令、撤销重做命令、存储命令、给命令记录日志等等，这才是命令模式能发挥独一无二作用的地方。


命令模式的优点：
- 单一职责原则。 你可以解耦触发和执行操作的类。
- 开闭原则。 你可以在不修改已有客户端代码的情况下在程序中创建新的命令。
- 你可以实现撤销和恢复功能。
- 你可以实现操作的延迟执行。
- 你可以将一组简单命令组合成一个复杂命令。

命令模式的缺点:
- 代码可能会变得更加复杂， 因为你在发送者和接收者之间增加了一个全新的层次。


这里给出了一个实际的代码，这里的Invoker代表游戏的玩家，Receiver代表游戏中的角色，游戏玩家通过发送前进和跳跃的命令给游戏的角色使得游戏角色可以进行活动。

其UML图如下所示：

![命令模式UML图](https://github.com/zgjsxx/static-img-repo/raw/main/blog/design-pattern/command.png)

```cpp
#include <iostream>
#include <vector>
#include <string>

class GameRole
{
public:
    GameRole(std::string name):name_(name)
    {

    }
    ~GameRole() = default;
public:
    void move(int i) const
    {
        std::cout << "game role "<< name_ <<" move forward " << i << " step" << std::endl;
    }
    void jump() const
    {
        std::cout << "game role " << name_ << " jump" << std::endl;
    }
private:
    std::string name_{};
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
    explicit MoveCommand(GameRole* role, int step): step_(step),role_(role)
    {

    }
    ~MoveCommand()
    {

    }

public:
    virtual void execute() const override
    {
        role_->move(step_);
    }
private:
    int step_;
    GameRole* role_{};
};


class JumpCommand : public Command
{
public:
    explicit JumpCommand(GameRole* role):role_(role)
    {

    }
    ~JumpCommand()
    {

    }

public:
    virtual void execute() const override
    {
        role_->jump();
    }
private:
    GameRole* role_{};
};

class Invoker
{
public:
    Invoker() = default;
    ~Invoker() = default;
public:
    void setCmd(Command* cmd)
    {
        command_vec_.emplace_back(cmd);
    }

    void executeCmd() const
    {
        for(auto &cmd : command_vec_)
        {
            cmd->execute();
        }
    }
private:
    std::vector<Command*> command_vec_;
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