

- [RSA算法](#rsa算法)
  - [同余](#同余)
  - [加密和解密过程的详细推导](#加密和解密过程的详细推导)


# RSA算法

## 同余

两个整数a,b, 若它们除以正整数m所得的余数相等，则称a,b对于模m同余，记作：

$a \equiv b \pmod{m}$

读作a同余b模m，或a与b关于模m同余。

如使用计算机的%操作符，则上述式子的含义是

$a \% m == b \% m$

例如```26 % 12 == 14 % 12 == 2```，因此

$26 \equiv 14 \pmod{12}$

同余具有下面的性质
- 同余保持运算

$$
a \equiv b \pmod{m} \Rightarrow \begin{cases}
an \equiv bn \pmod{m} \\
{a}^{n} \equiv {b} ^ {n} \pmod{m}\\
P(a) \equiv P(b) \pmod{n}
\end{cases}
$$

## 加密和解密过程的详细推导

**加密过程**

m被加密为密文c:

$c = {m}^{e}  \pmod{n}$

这意味着 c 是 ${m}^{e}$ 除以 n 后的余数， 即${m}^{e} - c = kn$

**解密过程**

$m = {c}^{d} \pmod {n}$


**为什么解密公式可以恢复原始明文m**

因为m小于n，因此证明解密过程的正确性，实际上就是要证明下面的式子：

${c}^{d} \equiv m \pmod{n}$

将c使用加密过程的表达式进行带入：

${c}^{d}  
= ({m}^{e} - kn)^{d}
$

根据 二项式定理，左边展开后的每一项，除了${m}^{ed}$以外，都含有$kn$，因此，证明上面的式子等同于证明

${m} ^{ed}  \equiv m\pmod{n}$

根据RSA的算法

$d \times e \equiv 1 (mod {\kern 5pt} \phi(n))$

这意味着：

$d \times e = k \times \phi (n) + 1$

带入上述解密化简后的公式可以得到：

${m} ^{ed} {\kern 5pt} mod {\kern 5pt}  n = {m} ^ {k \times \phi(n) } \times m$


当m和n互质时：

那么根据欧拉定理：

${m}^{\phi(n)} \equiv 1 {\kern 5pt} (mod {\kern 5pt}n)$

因此

${{m}^{\phi(n)}}^{k} \times m \equiv {1}^{k} \times m {\kern 5pt} (mod {\kern 5pt}n) = m \pmod{n}$

当m和n不互质时：


https://cjting.me/2020/03/13/rsa/


参考文章
https://www.ruanyifeng.com/blog/2013/07/rsa_algorithm_part_two.html