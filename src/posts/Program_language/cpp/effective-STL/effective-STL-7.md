---
category: 
- C++
tag:
- C++
- effective STL读书笔记
---

# effective STL-7 当使用new的指针的容器时,记得在销毁容器前delete那些指针

条款7：当使用new得指针的容器时，记得在销毁容器前delete那些指针
STL中的容器非常优秀。它们提供了前向和逆向遍历的迭代器（通过begin、end、rbegin等）；它们能告诉你所容纳的对象类型（通过value_type的typedef）；在插入和删除中，它们负责任何需要的内存管理；它们报告容纳了多少对象和最多可能容纳的数量（分别通过size和max_size）；而且当然当容器自己被销毁时会自动销毁容纳的每个对象。

给了这样聪明的容器，很多程序员不再担心用完以后的清除工作。呵呵，他们说，他们的容器会帮他们解决那个麻烦。在很多情况下，他们是对的，但当容器容纳的是指向通过new分配的对象的指针时，他们就错了。的确，当一个指针的容器被销毁时，会销毁它（那个容器）包含的每个元素，但指针的“析构函数”是无操作！它肯定不会调用delete。

结果，下面代码直接导致一个内存泄漏：
```cpp
void doSomething()
{
	vector<Widget*> vwp;
	for (int i = 0; i < SOME_MAGIC_NUMBER; ++i)
		vwp.push_back(new Widget);
	...					// 使用vwp
}						// Widgets在这里泄漏！
```
当vwp除了生存域后，vwp的每个元素都被销毁，但那并不改变从没有把delete作用于new得到的对象这个事实。那样的删除是你的职责，而不是vector的。这是一个特性。只有你知道一个指针是否应该被删除。

通常，你需要它们被删除。当情况如此时，可以很简单地实现：
```cpp
void doSomething() 
{
	vector<Widget*> vwp;
	... // 同上
	for (vector<Widget*>::iterator i = vwp.begin();
			i != vwp.end(),
			++i) { 
		delete *i;
	} 
}
```
这可以工作，除非你不是对你“工作”的意思很吹毛求疵。一个问题是新的for循环代码比for_each多得多，但没有使用for_each来的清楚（参见条款43）。另一个问题是这段代码不是异常安全的。如果在用指针填充了vwp和你要删除它们之间抛出了一个异常，你会再次资源泄漏。幸运的是，两个问题都可以克服。

要把你的类似for_each的循环转化为真正使用for_each，你需要把delete转入一个函数对象中。这像儿戏般简单，假设你有一个喜欢和STL一起玩的孩子：
```cpp
template<typename T>
struct DeleteObject :				// 条款40描述了为什么
	public unary_function<const T*, void> {	// 这里有这个继承
	void operator()(const T* ptr) const
	{
		delete ptr;
	}
};
```
现在你可以这么做：
```cpp
void doSomething()
{
	...	// 同上
	for_each(vwp.begin(), vwp.end(), DeleteObject<Widget>);
}
```
不幸的是，这让你指定了DeleteObject将会删除的对象的类型（在本例中是Widget）。那是很讨厌的，vwp是一个```vector<Widget*>```，所以当然DeleteObject会删除Widget*指针！咄！这种冗余就不光是讨厌了，因为它会导致很难跟踪到的bug。假设，比如，有的人恶意地故意从string继承：
```cpp
class SpecialString: public string { ... }; 
```
这是很危险的行为，因为string，就像所有的标准STL容器，缺少虚析构函数，而从没有虚析构函数的类公有继承是一个大的C++禁忌。（详细信息参考任意好的C++书。在《Effective C++》中，要看的地方是条款14。）但是，仍有一些人做这种事，所以让我们考虑一下下面代码会有什么行为：
```cpp
void doSomething()
{
	deque<SpecialString*> dssp;
	...
	for_each(dssp.begin(), dssp.end(),		// 行为未定义！通过没有
		DeleteObject<string>());		// 虚析构函数的基类
}						// 指针来删除派生对象
```
注意dssp被声明为容纳SpecialString*指针，但for_each循环的作者告诉DeleteObject它将删除string*指针。很容易知道会出现什么样的错误。SpecialString的行为当然很像string，所以如果它的用户偶尔忘了他们用的是SpecialStrings而不是string是可以原谅的。

你可以通过编译器推断传给DeleteObject::operator()的指针的类型来消除这个错误（也减少DeleteObject的用户需要的击键次数）。我们需要做的所有的事就是把模板化从DeleteObject移到它的operator()：
```cpp
struct DeleteObject {				// 删除这里的
						// 模板化和基类
	template<typename T> 			// 模板化加在这里
	void operator()(const T* ptr) const 
	{ 
		delete ptr; 
	} 
}
```
编译器知道传给DeleteObject::operator()的指针的类型，所以我们可以让它通过指针的类型自动实例化一个operator()。这种类型演绎下降让我们放弃使DeleteObject可适配的能力（参见条款40）。想想DeleteObject的设计目的，会很难想象那会是一个问题。

使用新版DeleteObject，用于SpecialString的客户代码看起来像这样：
```cpp
void doSomething()
{
	deque<SpecialString*> dssp;
	...
	for_each(dssp.begin(), dssp.end(),
		DeleteObject());			// 啊！良好定义的行为！
}
```
直截了当而且类型安全，正如我们喜欢的一样。

但仍不是异常安全的。如果在SpecialString被new但在调用for_each之前抛出一个异常，就会发生泄漏。那个问题可以以多种方式被解决，但最简单的可能是用智能指针的容器来代替指针的容器，典型的是引用计数指针。（如果你不熟悉智能指针的概念，你应该可以在任何中级或高级C++书上找到描述。在《More Effective C++》中，这段材料在条款28。）

STL本身没有包含引用计数指针，而且写一个好的——一个总是可以正确工作的——非常需要技巧，除非必须否则你一定不想做。我在1996年的《More Effective C++》中发布了用于引用计数智能指针的代码，尽管是基于已制定的智能指针实现并提交给由有经验的开发人员做了很多发布前检查，小bug报告还是持续了很多年。智能指针出错的不同方式的数量很值得注意。（详细信息请参考《More Effective C++》错误列表[28]。）

幸运的是，基本上不需要你自己写，因为经过检验的实现不难找到。一个这样的智能指针是Boost库（参见条款50）中的shared_ptr。利用Boost的shared_ptr，本条款的原始例子可以重写为这样：
```cpp
void doSomething()
{
	typedef boost::shared_ ptr<Widget> SPW;	//SPW = "shared_ptr
						// to Widget"
	vector<SPW> vwp;
	for (int i = 0; i < SOME_MAGIC_NUMBER; ++i)
		vwp.push_back(SPW(new Widget));	// 从一个Widget建立SPW,
						// 然后进行一次push_back
		...			// 使用vwp
}					// 这里没有Widget泄漏，甚至
					// 在上面代码中抛出异常
```
你不能有的愚蠢思想是你可以通过建立auto_ptr的容器来形成可以自动删除的指针。那是很可怕的想法，非常危险。我在条款8讨论了为什么你应该避免它。

我们需要记住的所有事情就是STL容器很智能，但它们没有智能到知道是否应该删除它们所包含的指针。当你要删除指针的容器时要避免资源泄漏，你必须用智能引用计数指针对象（比如Boost的shared_ptr）来代替指针，或者你必须在容器销毁前手动删除容器中的每个指针。

最后，你可能会想到既然一个类似DeleteObject的结构体可以简化避免容纳对象指针的容器资源泄漏，那么是否可能建立一个类似的DeleteArray结构体来简化避免容纳指向数组的指针的容器资源泄漏呢？这当然可能，但是否明智则不是同一回事了。条款13解释了为什么动态分配数组几乎总是劣于vector和string对象，所以在你要写DeleteArray之前，请先看看条款13。运气好的话，你会知道DeleteArray是永远不会出现的结构体。