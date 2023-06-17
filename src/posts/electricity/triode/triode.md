---
category: 
- electronic technique
---

# 理解空穴电流

近日闲来无事，翻起来模电看了起来，在看到关于三极管的一张图时，对三极管的${I}_{EP}$电流无法理解。

![三极管电流](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/triode/triode5.png)

${I}_{EP}$电流，教材上的解释是基区空穴形成的空穴电流。

于是我就收集了相关资料，去研究了一下...

## 本征半导体

我首先收集了本征半导体的相关资料，如下图所示，本征半导体，例如Si，其外层拥有四个电子，这个四个电子与其它Si原子形成了共价键，结合在了一起。

当得到一定的能量（比如：热量、光照等），少量的价电子就会摆脱束缚跑出来，成为自由移动的电子，称之为本征激发。当外加电场时，带负电的自由电子逆向移动，形成电流。

![本征半导体](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/triode/triode1.png)


## P型半导体

P型半导体则是在本征半导体的基础上掺入微量的三价元素，比如B（硼）或者In（铟）。如下图所示，由于三价元素的掺入，Si的外层有一个电子可能无法配对，于是就形成了空穴。

但是由于本征激发的存在，P型半导体中也存在自由电子。

因此，P型半导体中，空穴是多子，而自由电子是少子。

![p型半导体](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/triode/triode2.png)


## N型半导体

N型半导体则是在本征半导体的基础上掺入微量的五价元素，比如P（磷）或者As（砷）。如下图所示，由于五价元素的掺入，五价元素的外层多了一个电子无法配对，就形成了自由电子。

同理由于本征激发的存在，N型半导体中也有空穴。

因此，N型半导体中，自由电子是多子，而空穴是少子。

![N型半导体](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/triode/triode3.png)


## PN结正偏时的电子运动情况

我们知道，二极管想要导通，就需要让PN结正偏，以抵消内电场。

下面我们分析正偏时的电流是如何形成的。如下图所示：

当PN结正偏，对于电子而言电场力的方向是从N指向P的。于是N区所有的电子都收到了一个向左的力。

自由电子受到电场力之后向左移动，形成了电流。

下面是关键部分，少部分共价键中的电子，由于受到了电场力，也可能挣脱共价键的约束，从而向左移动，这个时候原地就留下了空穴。当这部分电子抵达N区时，填充了N区中的空穴，与N区的电子形成了共价键，于是N区的空穴就消失了。这看起来就好像，空穴从左侧移动到右侧一样。

![加上电场](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/triode/triode4.png)

其实空穴电流本质上还是电子的运动，在N区中，共价键中的电子挣脱共价键的约束，进入了P区，形成的电流。

回头再来看这张图，就很好理解了。

${I}_{EN}$是N区中自由电子移动受电场力作用所形成的电流。

${I}_{EP}$是N区中共价键中的电子挣脱共价键的约束，进入了P区，形成的电流。

${I}_{CBO}$有两部分组成，一部分是P区中的少子(自由电子)受电场力的作用形成的电流，一部分是P区中共价键中的电子挣脱共价键的约束，向N区移动形成的电流(空穴电流)。

![三极管电流](https://github.com/zgjsxx/static-img-repo/raw/main/blog/electricity/triode/triode5.png)


本人非电子工程专业，上面仅为个人理解，如有错误，请指教，thanks~

