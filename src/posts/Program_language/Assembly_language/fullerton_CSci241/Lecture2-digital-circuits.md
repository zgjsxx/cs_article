---
category: 
- 汇编语言
---

# 第二讲：数字电路

## 数字电路

CPU 由一组复杂的数字电路实现。数字电路是由逻辑门构建的（逻辑门又是使用晶体管构建的）。在数字电路设计中，在数字电路设计中，我们展示逻辑信号（开/关值）如何从输入流经逻辑门到输出。如果有电流流过逻辑信号，则逻辑信号为高（开）；如果没有电流（或电流非常小），则逻辑信号为低（关）。

逻辑门的基本类型有：

- 非门(NOT)：单输入、单输出门，反转其输入。如果输入为高电平，则输出为低电平，反之亦然。
  ![NOT-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NOT-gate.png)

  非(NOT) 在 C/C++ 中运算符是```~```。这个符号是按位非，与逻辑非(```!```)不同。

- 与门(AND)：双输入、单输出门：当且仅当两个输入均为高电平时，输出为高电平，否则为低电平。
  
  ![AND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/AND-gate.png)

  AND 的 C/C++ 运算符是 &（这是按位与，与 && 逻辑与 不同）。

- 或门(OR)：双输入、单输出门：如果其中一个或两个输入都为高电平，则输出为高电平，否则（如果两个输入均为低电平）输出为低电平。

  ![OR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/OR-gate.png)

  C/C++ 中与运算符是 | （这又是按位或，不同于逻辑或 ||）

- 异或门(XOR)：双输入，单输出门。如果其中一个输入为高电平但不是两个输入都是高电平，则输出为高电平。否则，当两个输入都为高电平或者两个输入都是低电平，则输出为低电平。实际上，如果输入不同(一高一低)，则输出为高，如果输入相同，则输出为低。

  ![XOR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/XOR-gate.png)

  C/C++中代表异或的运算符是```^```（这个是按位异或， 没有逻辑上的异或)。 注意```^```不是求幂运算符，C/C++中没有求幂的运算符。

- 与非门(NAND)：输出端带有非门的与门。也就是说，如果两个输入都为高电平，则输出为低电平，否则为高电平。

  ![NAND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NAND-gate.png)

  C/C++没有直接的与非运算符。可以使用```&```和```~```组合起来起到相同的效果。

- 或非(NOR)：在或门的输出端带有一个非门。如果两个输入均为低电平，则输出为高电平，否则为低电平。

  ![NOR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NOR-gate.png)

  C/C++没有直接的或非运算符。可以使用```|```和```~```组合起来起到相同的效果。

- 同或(XNOR)：输出端带有非门的异或门。如果两个输入相同（均为低电平或均为高电平），则输出为高电平，否则为低电平。
  
  ![XNOR-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/XNOR-gate.png)

  C/C++没有直接的同或运算符。可以使用```^```和```~```组合起来起到相同的效果。

你可能会熟悉前三种逻辑门。有几点需要注意：

- 与门(AND)和或门(OR)可以扩展为超过2个输入端，n输入的与门，当它的所有的n个输入端都是高电平时，则该与门输出高电平，否则为低电平。同样，一个n输入端的或门，只要有一个输入端是高电平，则该或门将输出高电平。如果所有的输入都是低电平，则该或门输出低电平。

下图说明了如何构建 3 输入与门：

![3-input-AND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/3-input-AND-gate.png)

问题：如果异或门以相同的配置排列，所得的 3 输入、1 输出电路会起什么作用？

- 与非门和或非门具有通用性：所有其他门都可以仅由 NAND 或 NOR 构建。事实上，为了简化制造，仅使用 NAND 门构建电路是很常见的。

  例如，下面是一个相当于仅使用 NAND 门实现的 A OR B 的电路（您应该验证该电路是否为输入 A 和 B 的所有四种组合生成正确的输出）

  ![NAND-OR-gate.png](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/NAND-OR-gate.png)

  您可以在[维基百科](https://en.wikipedia.org/wiki/Logic_gate#Universal_logic_gates)上找到有关如何将所有其他类型的逻辑门转换为 NAND 和 NOR 门的完整参考。作业 1 将要求您将使用 NOT、AND 和 OR 的电路转换为仅使用 NAND 门的电路。

电路真值表：

任何（无状态）m 输入、n 输出电路的行为也可以使用表格来说明，该表格显示每个输入组合如何映射到特定的输出集。因为每个输入可以是低 (0) 或高 (1)，所以该表将有 2m 行和 m + n 列。例如，上面显示的 3 输入 AND：

![3-input-AND-gate](https://raw.githubusercontent.com/zgjsxx/static-img-repo/main/blog/language/assembly/fullerton_CSci241/lecture1/3-input-AND-gate.png)


<table>
    <tr>
        <th colspan="3">Input</th><th>Output</th>
    </tr>
    <tr>
        <th>A</th><th>B</th><th>C</th><th>Q</th>
    </tr>
    <tr>
        <td>0</td><td>0</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>0</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>0</td><td>1</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>1</td><td>0</td><td>0</td>
    </tr>
    <tr>
        <td>0</td><td>0</td><td>1</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>0</td><td>1</td><td>0</td>
    </tr>
    <tr>
        <td>0</td><td>1</td><td>1</td><td>0</td>
    </tr>
    <tr>
        <td>1</td><td>1</td><td>1</td><td>1</td>
    </tr>
</table>

从表格中可以知道，仅当所有三个输入均为高电平 (1) 时，输出才为高电平 (1)。

## 硬件电路

如果您尝试在实际电子硬件中实现逻辑电路，您会遇到上面未提及的几个问题：

为了解决这个不可预测的时期，大多数数字电路都是同步的：他们使用时钟来控制何时执行计算。时钟是一个 0 输入、1 输出的逻辑器件，它输出一个信号，该信号以规则的时钟速率交替出现低、高、低、高……
通常，当时钟信号从低电平变为高电平（时钟信号的“上升沿”）时，电路的其余部分将执行其计算，但直到下一个时钟周期的上升沿才会读取计算的输出。

- 电流不仅仅从 A 点流到 B 点（如逻辑图所示），而且仅在存在闭合电路时才流动。为了使得电路在实际中能够工作，必须提供电路的最终输出返回到输入电源之间的连接。在真实的电路中，这些连接当然会存在，但在逻辑图中，我们忽略它们，因为它们不会影响电路的逻辑及其实际计算的内容。
  许多门电路都需要电源连接(始终为高电平的输入)为其供电，这会使得现实中的电路更加复杂。
- 如果你想尝试只购买一个或门， 你会发现你无法仅仅买一个或门。门电路通常是在集成电路上使用，通常会将多个相同类型的门电路绑定在一起。例如，您可以购买在单个芯片上具有四个、八个或更多 NAND 门的 IC（集成电路）。这是有道理的，因为在实际的电路设计中，您很少只需要一个门。(该芯片将具有一个由所有栅极共享的单电源输入)。
- 理想情况下，我们将逻辑电路描述为信号瞬间从低电平切换到高电平，反之亦然，但在现实系统中这是不可能的。电路的上升时间是线路从低电平变为高电平所需的时间。在此过渡期间，流过连接的电流量介于 0 和 1 之间，这可能会导致电路输出在短时间内不可预测。
- 为了解决这个不可预测的时期，大多数数字电路都是同步的：他们使用时钟来控制何时执行计算。时钟是一个 0 输入、1 输出的逻辑器件，它输出一个信号，该信号以规则的时钟速率交替出现低、高、低、高……通常，当时钟信号从低电平变为高电平（时钟信号的“上升沿”）时，电路的其余部分将执行其计算，但直到下一个时钟周期的上升沿才会读取计算的输出。因此，输出有 1 个完整时钟周期来稳定在正确的值。
  事实上，即使信号很高，它仍然不会处于恒定水平；它只是高于某个标记“低”和“高”之间分界线的阈值。
- 在电气方面，单个输出无法连接到无限数量的其他设备；输出的“扇出”是有限制的。
- 逻辑门可以通过多种不同的方式以电子方式实现，从而产生不同的逻辑系列，每个都有自己的电气特性。例如，对于不同的系列，“低”与“高”的电压水平可能非常不同。另请注意，在大多数系列中，“低”电平不是 0V，而是低于“高”电平的某些电压电平。例如，晶体管-晶体管-逻辑 (TTL) 系列使用 0 至 0.8V（相对于地）之间的低电压电平，以及 2 至 5V 的高电压电平。 0.8 至 2V 之间的输入信号处于“不可预测”范围内，可能会被视为高或低，甚至在两者之间波动。

## 逻辑电路的问题

您可以尝试构建以下一些电路，以测试您对逻辑电路的理解：

这些问题有许多不同的可能解决方案。数字电路的进阶课程将教授优化电路设计的方法，以便最大限度地减少所使用的门的数量。