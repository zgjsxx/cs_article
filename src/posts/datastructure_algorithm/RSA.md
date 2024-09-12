category: 
- algorithm
tag:
- algorithm
---

- [RSA算法](#rsa算法)
  - [同余](#同余)
  - [加密和解密过程的详细推导](#加密和解密过程的详细推导)
  - [参考文章](#参考文章)


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

$${m^{\phi(n)}}^{k} \times m \equiv {1}^{k} \times m \pmod {n} = m \pmod{n}$$

当m和n不互质时：

因为 n 是质数 p 和 q 的乘积，此时 m 必然为 kp 或者 kq。

以 m = kp 为例，此时 k 必然与 q 互质。因为 n = pq，而 m < n，所以 k 必然小于 q，而 q 是一个质数，在小于 q 的数字当中所有数都与 q 互质。

同时 kp 必然也与 q 互质，如果 kp 和 q 不互质，那么 kp 必然是 q 的倍数，因为 q 不存在其他因子，那么 kp 就是 n 的倍数，因为 n = pq，但是我们的前提是 m < n。

因为 kp 和 q 互质，根据欧拉定理

$${kp}^{q-1} \equiv 1 \pmod(q)$$

所以

$${kp}^{q-1} = tq + 1$$

两边同时进行$h(p-1)$次方

$${kp^{q-1}}^{h(p-1)} = {tq+1}^{h(p-1)}$$

同理根据二项式定理，右边展开除了 1 每一项都含有 q，所以可以得到

$${kp^{q-1}}^{h(p-1)} \equiv 1 \pmod{q}$$

从而得到

$${kp^{q-1}}^{h(p-1)} \times kp \equiv kp \pmod{q}$$

也就是

$${kp}^{ed} \equiv  kp \pmod{q}$$

改写为如下形式

$${kp}^{ed} = kp +tq$$

左边是 p 的倍数，右边 kp 是 p 的倍数，所以 tq 必然是 p 的倍数。而 q 是 p 互质的，因此 t 必然是 p 的倍数，我们记为 t = t’p，代入得到

$${kp}^{ed} = kp +t'pq$$

等同于

$${m}^{ed} = m +t'n$$

也就是:

$${m}^{ed} \equiv m \pmod{n}$$

得证

## 参考文章

https://cjting.me/2020/03/13/rsa/

https://www.ruanyifeng.com/blog/2013/07/rsa_algorithm_part_two.html