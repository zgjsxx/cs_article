

- [RSA算法](#rsa算法)
  - [加密和解密过程的详细推导](#加密和解密过程的详细推导)


# RSA算法

## 加密和解密过程的详细推导

**加密过程**

m被加密为密文c:

$c = {m}^{e} {\kern 5pt} mod {\kern 5pt} n$

这意味着 c 是 ${m}^{e}$ 除以 n 后的余数， 即${m}^{e} - c = kn$

**解密过程**

$m = {c}^{d} {\kern 5pt} mod {\kern 5pt} n$


为什么解密公式可以恢复原始明文m。

${c}^{d} {\kern 5pt} mod {\kern 5pt} n 
= ({m}^{e} - kn)^{d} {\kern 5pt} mod {\kern 5pt} n
= ({m}^{ed} - k{n}^{d}) {\kern 5pt} mod {\kern 5pt} n 
$

根据模运算的运算规则，减法可以进行分解：

$(a - b) {\kern 5pt} mod {\kern 5pt} n = (a {\kern 5pt} mod {\kern 5pt} n - b {\kern 5pt} mod {\kern 5pt} n ) {\kern 5pt} mod {\kern 5pt}n$

因此

$$
\begin{align}
& {\kern 10pt} ({m}^{ed} - k{n}^{d}) {\kern 5pt} mod {\kern 5pt} n \\
& = ({m}^{ed} {\kern 5pt} mod {\kern 5pt} n - k{n} ^{d} {\kern 5pt} mod {\kern 5pt} n) {\kern 5pt} mod {\kern 5pt} n \\
& = ({m}^{ed} {\kern 5pt} mod {\kern 5pt} n - 0) {\kern 5pt}  mod {\kern 5pt} n \\
& = {m} ^{ed} {\kern 5pt} mod {\kern 5pt}  n \\
\end{align}
$$

$d \times e = k \times \phi (n) + 1$


https://www.ruanyifeng.com/blog/2013/07/rsa_algorithm_part_two.html