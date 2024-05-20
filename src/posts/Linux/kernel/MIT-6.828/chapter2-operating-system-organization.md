---
category:
  - Linux
  - 操作系统
tag:
  - xv6
---

- [第二章：操作系统的组织](#第二章操作系统的组织)
  - [2.1 抽象化物理资源](#21-抽象化物理资源)
  - [2.2 用户模式、特权模式和系统调用](#22-用户模式特权模式和系统调用)
  - [2.3 内核组织结构](#23-内核组织结构)
  - [2.4 xv6的代码组织](#24-xv6的代码组织)
  - [2.5 进程概述](#25-进程概述)
  - [2.6 代码：启动 xv6 和第一个进程](#26-代码启动-xv6-和第一个进程)


# 第二章：操作系统的组织

操作系统的一个关键要求是同时支持多个活动。例如，使用第1章描述的系统调用接口，一个进程可以使用fork启动新的进程。操作系统必须在这些进程之间进行资源的时间共享。例如，即使有比硬件CPU更多的进程，操作系统也必须确保所有进程都有机会执行。操作系统还必须安排进程之间的隔离。也就是说，如果一个进程有错误并且发生故障，它不应影响不依赖于有错误的进程的进程。然而，完全隔离太严格了，因为应该允许进程有意地相互作用；管道就是一个例子。因此，操作系统必须满足三个要求：多路复用、隔离和交互。

本章概述了操作系统如何组织来实现这三个要求。事实证明，有许多方法可以实现这一点，但本文侧重于围绕单内核的主流设计，许多Unix操作系统都使用这种设计。本章还概述了xv6进程的概念，xv6中的进程是隔离的单位，并介绍了xv6启动时创建第一个进程的过程。

Xv6运行在多核RISC-V微处理器上，它的许多低级功能（例如，进程实现）是特定于RISC-V的。RISC-V是一种64位CPU，而xv6是用“LP64” C编写的，这意味着C编程语言中的长整型（L）和指针（P）都是64位，但整型（int）是32位。本书假定读者已经在某种架构上进行了一些机器级编程，并会在需要时介绍RISC-V特定的概念。RISC-V的一个有用的参考资料是《The RISC-V Reader: An Open Architecture Atlas》。用户级ISA和特权架构是官方规范。

完整计算机中的CPU周围包围着大量的支持硬件，其中大部分以I/O接口的形式存在。Xv6是为qemu的“-machine virt”选项模拟的支持硬件编写的。这包括RAM、包含引导代码的ROM、与用户键盘/屏幕的串行连接，以及用于存储的磁盘。

## 2.1 抽象化物理资源

当遇到操作系统时，人们可能会问的第一个问题是为什么需要它？也就是说，可以将图1.2中的系统调用实现为一个库，应用程序与之链接。在这个计划中，每个应用程序甚至可以有自己定制的库以满足其需求。应用程序可以直接与硬件资源交互，并以最适合应用程序的方式使用这些资源（例如，实现高性能或可预测性）。一些嵌入式设备或实时系统的操作系统就是以这种方式组织的。

这种库的方法的缺点是，如果有多个应用程序在运行，那么这些应用程序必须表现良好。例如，每个应用程序必须定期放弃CPU，以便其他应用程序可以运行。如果所有应用程序彼此信任且没有错误，这种合作式的时间共享方案可能是可行的。但是，应用程序彼此不信任且可能存在错误的情况更为典型，因此人们通常希望获得比合作方案提供的更强的隔离。

为了实现强大的隔离，禁止应用程序直接访问敏感的硬件资源，并将资源抽象为服务是很有帮助的。例如，Unix应用程序只通过文件系统的open、read、write和close系统调用与存储交互，而不是直接读写磁盘。这为应用程序提供了路径名的便利，并允许操作系统（作为接口的实现者）管理磁盘。即使隔离不是一个问题，有意交互的程序（或者只是希望相互独立）也很可能会发现文件系统比直接使用磁盘更方便。

类似地，Unix会在进程之间透明地切换硬件CPU，根据需要保存和恢复寄存器状态，这样应用程序就不必关心时间共享。这种透明性使操作系统可以在一些应用程序陷入无限循环的情况下共享CPU。

另一个例子是，Unix进程使用exec来构建它们的内存映像，而不是直接与物理内存交互。这允许操作系统决定将进程放置在内存的何处；如果内存紧张，操作系统甚至可能将进程的一部分数据存储在磁盘上。Exec还为用户提供了使用文件系统存储可执行程序映像的便利。

许多形式的Unix进程之间的交互是通过文件描述符进行的。文件描述符不仅抽象了许多细节（例如，管道或文件中的数据存储在哪里），而且它们的定义方式简化了交互。例如，如果管道中的一个应用程序失败，内核会为管道中的下一个进程生成一个文件结束信号。

图1.2中的系统调用接口经过精心设计，既提供了程序员的便利性，又具有强大的隔离性。Unix接口并不是抽象资源的唯一方式，但它已经被证明是一个非常好的方式。

## 2.2 用户模式、特权模式和系统调用

强大的隔离需要在应用程序和操作系统之间建立严格的边界。如果应用程序出现错误，我们不希望操作系统或其他应用程序也出现故障。相反，操作系统应该能够清理失败的应用程序并继续运行其他应用程序。为了实现强大的隔离，操作系统必须安排应用程序不能修改（甚至读取）操作系统的数据结构和指令，并且应用程序不能访问其他进程的内存。

CPU提供硬件支持来实现强大的隔离。例如，RISC-V有三种模式，CPU可以在这些模式下执行指令：机器模式（machine mode）、特权模式（supervisor mode）和用户模式（user mode）。在机器模式下执行的指令具有完全的特权；CPU在启动时处于机器模式。机器模式主要用于配置计算机。Xv6在机器模式下执行了几行指令，然后切换到特权模式。

在特权模式下，CPU被允许执行特权指令，例如启用和禁用中断、读写保存页面表地址的寄存器等。如果用户模式下的应用程序试图执行特权指令，CPU不会执行该指令，而是切换到特权模式，以便特权模式的代码可以终止应用程序，因为它执行了不应该执行的操作。第1章中的图1.1说明了这种组织结构。应用程序只能执行用户模式指令（例如，加法运算等），并称之为在用户空间运行，而在特权模式的软件还可以执行特权指令，并称之为在内核空间运行。在内核空间运行的软件（或在特权模式下）称为内核。

一个希望调用内核函数（例如，在xv6中的read系统调用）的应用程序必须转换到内核模式。CPU提供了一个特殊的指令，可以将CPU从用户模式切换到特权模式，并在内核指定的入口点进入内核（例如，RISC-V提供了ecall指令用于此目的）。一旦CPU切换到特权模式，内核就可以验证系统调用的参数，决定是否允许应用程序执行请求的操作，然后拒绝或执行它。重要的是，内核控制转换到特权模式的入口点；如果应用程序可以决定内核的入口点，那么恶意应用程序可能会在跳过参数验证的地方进入内核。

## 2.3 内核组织结构

一个关键的设计问题是操作系统的哪部分应该在监管模式下运行。一种可能性是整个操作系统都驻留在内核中，以便所有系统调用的实现都在监管模式下运行。这种组织结构称为单内核/宏内核（monolithic kernel）。

在这种组织结构中，整个操作系统都以完全的硬件特权运行。这种组织结构很方便，因为操作系统设计者不必决定操作系统的哪一部分不需要完全的硬件特权。此外，不同部分的操作系统更容易合作。例如，操作系统可能有一个可以由文件系统和虚拟内存系统共享的缓冲区缓存。

宏内核组织结构的一个缺点是操作系统不同部分之间的接口通常很复杂（正如我们在本文的其余部分中所看到的），因此操作系统开发者很容易犯错。在宏内核中，一个错误是致命的，因为特权模式下的错误通常会导致内核失败。如果内核失败，计算机就会停止工作，因此所有应用程序也会失败。计算机必须重新启动才能重新开始运行。

为了降低内核中出错的风险，操作系统设计者可以将在监管模式下运行的操作系统代码的数量降至最低，并将大部分操作系统代码在用户模式下执行。这种内核组织结构称为微内核。

图2.1说明了这种微内核设计。在图中，文件系统作为一个用户级进程运行。作为进程运行的操作系统服务称为服务器。为了允许应用程序与文件服务器进行交互，内核提供了一种进程间通信机制，可以将消息从一个用户模式进程发送到另一个用户模式进程。例如，如果一个应用程序（如shell）想要读取或写入一个文件，它会发送一条消息给文件服务器，并等待响应。

![图 2.1  拥有文件系统服务的微内核](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/MIT-6.828/chapter2/microkernel.png)

在微内核中，内核接口由一些低级函数组成，用于启动应用程序、发送消息、访问设备硬件等。这种组织结构使得内核相对简单，因为大部分操作系统驻留在用户级服务器中。

Xv6被实现为一个宏内核，与大多数Unix操作系统一样。因此，xv6的内核接口对应于操作系统接口，而内核实现了完整的操作系统。由于xv6并未提供许多服务，因此其内核比一些微内核要小，但在概念上xv6是宏内核的。

## 2.4 xv6的代码组织

xv6内核源代码位于kernel/子目录中。源代码按照模块化的概念进行了划分，Figure 2.2列出了这些文件。模块间的接口在defs.h（kernel/defs.h）中定义。

表2.2 Xv6 内核源代码

|File| Description|
|--|--|
|bio.c |文件系统的磁盘块缓存。|
|console.c |连接用户键盘和屏幕。|
|entry.S |最初的引导指令。|
|exec.c| exec() 系统调用。|
|file.c| 文件描述符支持。|
|fs.c |文件系统。|
|kalloc.c| 物理页面分配器。|
|kernelvec.S |处理来自内核的陷阱和定时器中断。|
|log.c |文件系统日志记录和崩溃恢复。|
|main.c|在引导期间控制其他模块的初始化。|
|pipe.c |管道。|
|plic.c |RISC-V中断控制器。|
|printf.c| 向控制台输出格式化输出。|
|proc.c| 进程和调度|
|sleeplock.c |能够让出CPU的锁。|
|spinlock.c |不会让出CPU的锁。|
|start.c |早期机器模式引导代码。|
|string.c |C字符串和字节数组库。|
|swtch.S |线程切换。|
|syscall.c| 将系统调用分派给处理函数。|
|sysfile.c |与文件相关的系统调用。|
|sysproc.c |与进程相关的系统调用。|
|trampoline.S| 在用户模式和内核模式之间切换的汇编代码。|
|trap.c| 处理和返回陷阱和中断的C代码。|
|uart.c |串口控制台设备驱动程序。|
|virtio_disk.c |磁盘设备驱动程序。|
|vm.c |管理页表和地址空间。|

## 2.5 进程概述

在xv6中（以及其他Unix操作系统中），隔离的单位是进程。进程抽象防止一个进程破坏或窥视另一个进程的内存、CPU、文件描述符等。它还防止一个进程破坏内核本身，以至于一个进程无法破坏内核的隔离机制。内核必须谨慎地实现进程抽象，因为一个有缺陷或恶意的应用程序可能会欺骗内核或硬件做一些坏事（例如，绕过隔离）。内核用于实现进程的机制包括用户/监管模式标志、地址空间和线程的时间切片。

为了帮助强制实施隔离，进程抽象提供了一个假象，即程序拥有自己的私有机器。进程向程序提供了一个看起来是私有的内存系统，或者称为地址空间，其他进程无法读取或写入。进程还向程序提供了一个看起来是自己的CPU来执行程序的指令。

Xv6使用页面表（由硬件实现）为每个进程提供自己的地址空间。RISC-V页面表将虚拟地址（RISC-V指令操作的地址）转换（或“映射”）为物理地址（CPU芯片发送到主存储器的地址）。

Xv6为每个进程维护一个单独的页面表，定义了该进程的地址空间。如图2.3所示，一个地址空间包括进程从虚拟地址零开始的用户内存。指令首先出现，然后是全局变量，然后是堆栈，最后是一个堆区域（用于```malloc```），进程可以根据需要扩展。有几个因素限制了进程地址空间的最大大小：RISC-V上的指针宽度为64位；硬件在查找页面表中的虚拟地址时仅使用低39位；xv6仅使用了这39位中的38位。因此，最大地址为```2^38 - 1 = 0x3fffffffff```，即MAXVA（kernel/riscv.h:348）。在地址空间的顶部，xv6为一个```trampoline```保留一个页面，并为一个页面映射了进程的trapframe以进行到内核的切换，我们将在第4章中解释。

![图 2.3  拥有文件系统服务的微内核](https://github.com/zgjsxx/static-img-repo/raw/main/blog/Linux/kernel/MIT-6.828/chapter2/layout_process.png)

v6内核为每个进程维护许多状态信息，它们被聚集到一个```struct proc```（kernel/proc.h:86）中。进程最重要的内核状态包括其页面表、内核栈和运行状态。我们将使用```p->xxx```的符号来引用proc结构的元素；例如，```p->pagetable```是指向进程页面表的指针。

每个进程都有一个执行线程（简称线程），用于执行进程的指令。线程可以挂起，稍后恢复。为了在进程之间透明地切换，内核会挂起当前正在运行的线程，并恢复另一个进程的线程。线程的大部分状态（局部变量、函数调用返回地址）存储在线程的栈上。每个进程有两个栈：一个用户栈和一个内核栈（p->kstack）。当进程执行用户指令时，只有其用户栈在使用，而其内核栈为空。当进程进入内核（进行系统调用或中断）时，内核代码在进程的内核栈上执行；当进程在内核中时，其用户栈仍然包含保存的数据，但不会被主动使用。进程的线程在使用其用户栈和内核栈之间交替切换。内核栈是单独的（并受到用户代码的保护），因此即使进程破坏了其用户栈，内核仍然可以执行。

进程可以通过执行RISC-V的ecall指令来进行系统调用。该指令提升硬件特权级别，并将程序计数器更改为内核定义的入口点。入口点处的代码切换到内核栈，并执行实现系统调用的内核指令。当系统调用完成时，内核切换回用户栈，并通过调用sret指令返回到用户空间，该指令降低硬件特权级别，并在系统调用指令之后继续执行用户指令。进程的线程可以在内核中“阻塞”以等待I/O，并在I/O完成后从离开的地方恢复执行。

p->state指示进程是否分配、准备运行、正在运行、正在等待I/O或正在退出。

p->pagetable保存进程的页表，格式符合RISC-V硬件的预期。当在用户空间执行进程时，xv6会使分页硬件使用进程的p->pagetable。进程的页表还充当记录分配给存储进程内存的物理页面地址的记录。

## 2.6 代码：启动 xv6 和第一个进程

为了使 xv6 更加具体，我们将概述内核如何启动并运行第一个进程。随后的章节将更详细地描述在这个概述中出现的机制。

当 RISC-V 计算机启动时，它会进行初始化，并运行存储在只读内存中的引导加载程序。引导加载程序将 xv6 内核加载到内存中。然后，在机器模式下，CPU 从 _entry（kernel/entry.S:6）开始执行 xv6。RISC-V 在启动时分页硬件处于禁用状态：虚拟地址直接映射到物理地址。

加载程序将 xv6 内核加载到物理地址 ```0x80000000``` 处的内存中。它将内核放置在 ```0x80000000``` 而不是 0x0 的原因是因为地址范围 ```0x0:0x80000000``` 包含 I/O 设备。

```_entry``` 指令设置了一个堆栈，以便 xv6 能够运行 C 代码。在文件 start.c（kernel/start.c:11）中，xv6 为初始堆栈 stack0 声明了空间。在 _entry 处的代码将堆栈指针寄存器 sp 加载到 stack0+4096 的地址上，这是堆栈的顶部，因为在 RISC-V 上，堆栈是向下增长的。现在内核有了一个堆栈，_entry 就会调用 start 处（kernel/start.c:21）的 C 代码。

函数 start 执行一些只允许在机器模式下进行的配置，然后切换到特权模式。为了进入特权模式，RISC-V 提供了指令 mret。这个指令通常用于从之前的特权模式调用返回到机器模式。start 函数不是从这样的调用中返回，而是设置了一些东西，就好像有一个这样的调用一样：它将先前的特权模式设置为特权模式，并将其写入寄存器 mstatus；通过将 main 函数的地址写入寄存器 mepc，将返回地址设置为 main 函数；通过将 0 写入页表寄存器 satp，在特权模式下禁用虚拟地址转换；并将所有中断和异常委托给特权模式。
