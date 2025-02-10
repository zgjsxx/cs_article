- [lec16-SQL injection/Command injection](#lec16-sql-injectioncommand-injection)
  - [什么是 SQL 注入（SQL Injection）？](#什么是-sql-注入sql-injection)
  - [SQL 注入的工作原理](#sql-注入的工作原理)
    - [示例：](#示例)
  - [SQL 注入的影响](#sql-注入的影响)
  - [如何防范 SQL 注入？](#如何防范-sql-注入)
    - [1. **使用预处理语句（Prepared Statements）**](#1-使用预处理语句prepared-statements)
    - [2. **使用存储过程**](#2-使用存储过程)
    - [3. **输入验证和过滤**](#3-输入验证和过滤)
    - [4. **最小权限原则**](#4-最小权限原则)
    - [5. **使用 Web 应用防火墙（WAF）**](#5-使用-web-应用防火墙waf)
    - [6. **错误信息处理**](#6-错误信息处理)
    - [7. **定期安全审计与测试**](#7-定期安全审计与测试)
  - [总结](#总结)
  - [command injection](#command-injection)

# lec16-SQL injection/Command injection

## 什么是 SQL 注入（SQL Injection）？

SQL 注入（SQL Injection）是一种常见的攻击技术，攻击者通过将恶意的 SQL 语句插入到应用程序的输入字段中，诱使数据库执行不被授权的操作。SQL 注入利用了应用程序在处理用户输入时没有对输入数据进行充分验证和清理，导致恶意代码被执行，可能给数据库系统带来严重的安全漏洞。

简而言之，SQL 注入就是攻击者通过构造特殊的 SQL 查询语句来控制数据库执行恶意命令，从而窃取、修改甚至删除数据。

## SQL 注入的工作原理

SQL 注入通常利用的是应用程序中的输入字段（如登录表单、搜索框、URL 参数等）来注入恶意 SQL 代码。攻击者的目标通常是利用应用程序与数据库的交互漏洞，执行未授权的 SQL 操作。

### 示例：
假设有一个登录系统，正常的 SQL 查询语句可能像这样：

```sql
SELECT * FROM users WHERE username = 'user' AND password = 'password';
```

在这个例子中，应用程序根据用户输入的用户名和密码去查询数据库。如果攻击者在登录表单的 `username` 或 `password` 字段中输入了恶意 SQL 代码：

```text
用户名: ' OR 1=1 --
密码: （可以为空）
```

数据库会生成以下 SQL 查询：

```sql
SELECT * FROM users WHERE username = '' OR 1=1 -- AND password = '';
```

在这个查询中：
- `OR 1=1` 总是返回 `TRUE`，这使得 SQL 查询绕过了正常的用户名和密码验证。
- `--` 是 SQL 的注释符号，后面的内容会被忽略，从而使得密码条件被忽略。

这样，攻击者就能够绕过身份验证，登录到系统中，甚至获得管理员权限。

## SQL 注入的影响

SQL 注入可能导致的后果非常严重，主要包括：
1. **数据泄露**：攻击者可以查询到敏感数据（如用户的个人信息、密码、信用卡信息等）。
2. **数据篡改或删除**：攻击者可以修改或删除数据库中的数据，影响系统的正常运行。
3. **身份验证绕过**：攻击者可以绕过登录系统，获取管理员权限。
4. **恶意代码执行**：在某些情况下，攻击者甚至可以通过注入 SQL 来执行操作系统命令，可能导致远程代码执行（RCE）漏洞。
5. **拒绝服务**：攻击者可能通过构造耗时的查询导致数据库服务器的性能问题，甚至使数据库宕机。

## 如何防范 SQL 注入？

SQL 注入漏洞的根本原因是输入的未充分验证，下面是几种有效的防范 SQL 注入的措施：

### 1. **使用预处理语句（Prepared Statements）**
预处理语句通过将 SQL 语句和数据分开处理，能够有效防止 SQL 注入。在执行 SQL 查询时，所有的参数都作为参数传递给数据库，而不是直接拼接到 SQL 查询中，这样可以防止恶意代码的注入。

例如，在 PHP 中使用 MySQLi 或 PDO（PHP 数据对象）进行预处理：

```php
// 使用 PDO 进行预处理
$stmt = $pdo->prepare('SELECT * FROM users WHERE username = :username AND password = :password');
$stmt->bindParam(':username', $username);
$stmt->bindParam(':password', $password);
$stmt->execute();
```

在这个例子中，`$username` 和 `$password` 是通过绑定参数传递的，数据库引擎会自动将它们当做数据处理，而不是 SQL 代码，从而防止注入。

### 2. **使用存储过程**
存储过程是在数据库中预编译的 SQL 查询。通过调用存储过程而不是动态生成 SQL 查询，可以减少 SQL 注入的风险。存储过程有时比普通 SQL 查询更安全，因为它们通常不会直接将用户输入作为 SQL 语句的一部分。

例如，使用 SQL Server 或 MySQL 存储过程：

```sql
CREATE PROCEDURE GetUserDetails
  @username NVARCHAR(50),
  @password NVARCHAR(50)
AS
BEGIN
  SELECT * FROM users WHERE username = @username AND password = @password;
END
```

调用存储过程时，参数会被安全地传递给数据库，而不需要担心 SQL 注入。

### 3. **输入验证和过滤**
在接受用户输入时，必须对所有输入进行严格的验证和过滤。根据具体情况，可以使用白名单（只允许特定格式的输入）或正则表达式来验证用户输入的有效性。

- 对于数字输入，确保输入的值是纯数字。
- 对于文本输入，避免特殊字符如单引号（`'`）、双引号（`"`）、分号（`;`）等。
- 对于电子邮件、URL 等字段，可以用正则表达式进行格式验证。

例如，在 JavaScript 中可以使用正则表达式来过滤输入：

```javascript
function isValidUsername(username) {
  var regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
}
```

### 4. **最小权限原则**
数据库账户应该遵循最小权限原则。应用程序访问数据库时，应使用权限最小的数据库账户，只授予其所需的权限。这样即使发生了 SQL 注入攻击，攻击者能做的事情也会被限制到最低限度。

例如，如果应用程序只需要查询数据，那么数据库账户就不应有 `DELETE` 或 `UPDATE` 权限。

### 5. **使用 Web 应用防火墙（WAF）**
Web 应用防火墙（WAF）是一种过滤器，可以帮助检测和阻止 SQL 注入攻击。WAF 通过分析 HTTP 请求，检测是否包含恶意的 SQL 注入尝试并阻止它们。

虽然 WAF 不能完全代替代码中的防护措施，但它可以作为额外的安全层，帮助过滤潜在的 SQL 注入攻击。

### 6. **错误信息处理**
避免将详细的数据库错误信息暴露给最终用户。攻击者可能通过错误信息获得有关数据库结构的线索，进而进行攻击。通过设置合适的错误处理机制，避免泄露敏感信息。

例如，在 PHP 中，可以关闭显示错误，并将错误记录到日志文件：

```php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
```

### 7. **定期安全审计与测试**
定期对应用程序和数据库进行安全审计，检测潜在的 SQL 注入漏洞。可以使用一些自动化工具（如 OWASP ZAP、Burp Suite）进行渗透测试，找出可能的 SQL 注入漏洞并及时修复。

## 总结

SQL 注入是一种危害极大的安全漏洞，攻击者可以通过注入恶意 SQL 代码来执行未经授权的操作，严重时可能会导致数据泄露、篡改或删除。为了有效防范 SQL 注入，开发者应采取以下措施：
- 使用预处理语句（Prepared Statements）或存储过程；
- 严格验证和过滤用户输入；
- 遵循最小权限原则；
- 使用 Web 应用防火墙（WAF）；
- 控制错误信息的输出；
- 定期进行安全审计和测试。

通过这些方法，可以显著降低 SQL 注入攻击的风险，提升应用程序的安全性。

## command injection