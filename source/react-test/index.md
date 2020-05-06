---
title: react-test
date: 2020-05-01 16:59:10
---

# XSS 即（Cross Site Scripting）：跨站脚本攻击

- 原理

  恶意攻击者在 web 页面中会插入一些恶意的 script 代码。当用户浏览该页面的时候，那么嵌入到 web 页面中 script 代码会执行，因此会达到恶意攻击用户的目的。

- 分类

  存储型（持久性 XSS 攻击）、反射型(非持久性 XSS 攻击）
  及 DOM-based 型

## 反射性

反射型 XSS 只是简单地把用户输入的数据 “反射” 给浏览器，这种攻击方式往往需要攻击者诱使用户点击一个恶意链接，或者提交一个表单，或者进入一个恶意网站时，注入脚本进入被攻击者的网站。
例子：
![UTOOLS1583724484356.png](https://user-gold-cdn.xitu.io/2020/3/9/170bd55d8ab6b2de?w=910&h=548&f=png&s=44094)

恶意链接的地址指向了 localhost:8001/?q=111&p=222。然后，我再启一个简单的 Node 服务处理恶意链接的请求：

```js
const http = require("http");
function handleReequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
  res.write('<script>alert("反射型 XSS 攻击")</script>');
  res.end();
}

const server = new http.Server();
server.listen(8001, "127.0.0.1");
server.on("request", handleReequest);
```

当用户点击恶意链接时，页面跳转到攻击者预先准备的页面，会发现在攻击者的页面执行了 js 脚本
![UTOOLS1583724582782.png](https://user-gold-cdn.xitu.io/2020/3/9/170bd5758db4e9df?w=1708&h=448&f=png&s=39757)

这样就产生了反射型 XSS 攻击。攻击者可以注入任意的恶意脚本进行攻击，可能注入恶作剧脚本，或者注入能获取用户隐私数据(如 cookie)的脚本，这取决于攻击者的目的。

## 存储型

存储型 XSS 会把用户输入的数据 "存储" 在服务器端，当浏览器请求数据时，脚本从服务器上传回并执行。这种 XSS 攻击具有很强的稳定性。

比较常见的一个场景是攻击者在社区或论坛上写下一篇包含恶意 JavaScript 代码的文章或评论，文章或评论发表后，所有访问该文章或评论的用户，都会在他们的浏览器中执行这段恶意的 JavaScript 代码。

![UTOOLS1583724831710.png](https://user-images.githubusercontent.com/7871813/42720476-eb71a5c8-8759-11e8-8763-eb08b3480201.gif)

## 基于 DOM

基于 DOM 的 XSS 攻击是指通过恶意脚本修改页面的 DOM 结构，是纯粹发生在客户端的攻击。

```html
<h2>XSS:</h2>
<input type="text" id="input" />
<button id="btn">Submit</button>
<div id="div"></div>
<script>
  const input = document.getElementById("input");
  const btn = document.getElementById("btn");
  const div = document.getElementById("div");

  let val;

  input.addEventListener(
    "change",
    (e) => {
      val = e.target.value;
    },
    false
  );

  btn.addEventListener(
    "click",
    () => {
      div.innerHTML = `<a href=${val}>testLink</a>`;
    },
    false
  );
</script>
```

点击 Submit 按钮后，会在当前页面插入一个链接，其地址为用户的输入内容。如果用户在输入时构造了如下内容

`'' onclick=alert(/xss/)`

用户提交之后，页面代码就变成了：

`<a href onlick="alert(/xss/)">testLink</a>`

此时，用户点击生成的链接，就会执行对应的脚本：

![42721109-cb7ce572-8766-11e8-96d9-9ada8a787827.gif](https://user-images.githubusercontent.com/7871813/42721109-cb7ce572-8766-11e8-96d9-9ada8a787827.gif)

## SQL 注入

SQL 注入是通过客户端的输入把 SQL 命令注入到一个应用的数据库中，从而执行恶意的 SQL 语句,一个例子：

我们有一个登录框，需要输入用户名和密码对吧，然后我们的密码输入 'or '123' = '123 这样的。

我们在查询用户名和密码是否正确的时候，本来执行的 sql 语句是：select _ from user where username = '' and password = ''. 这样的 sql 语句，现在我们输入密码是如上这样的，然后我们会通过参数进行拼接，拼接后的 sql 语句就是：
select _ from user where username = '' and password = ' ' or '123' = '123 '; 这样的了，那么会有一个 or 语句，只要这两个有一个是正确的话，就条件成立，因此 123 = 123 是成立的。因此验证就会被跳过。这只是一个简单的列子，比如还有密码比如是这样的：'; drop table user;, 这样的话，那么 sql 命令就变成了：
select \* from user where username = '' and password = ''; drop table user;' , 那么这个时候我们会把 user 表直接删除了。

sql 被攻击的原因是：sql 语句伪造参数，然后对参数进行拼接后形成 xss 攻击的 sql 语句。最后会导致数据库被攻击了。

防范的方法：

1. 我们可以使用预编译语句(PreparedStatement，这样的话即使我们使用 sql 语句伪造成参数，到了服务端的时候，这个伪造 sql 语句的参数也只是简单的字符，并不能起到攻击的作用。
2. 数据库中密码不应明文存储的，可以对密码使用 md5 进行加密，为了加大破解成本，所以可以采用加盐的方式。

## XSS 攻击的防范

- cookie 安全策略
  - http-only: 只允许 http 或 https 请求读取 cookie、JS 代码是无法读取 cookie 的(document.cookie 会显示 http-only 的 cookie 项被自动过滤掉)。发送请求时自动发送 cookie.
  - secure-only: 只允许 https 请求读取，发送请求时自动发送 cookie。
  - host-only: 只允许主机域名与 domain 设置完成一致的网站才能访问该 cookie。
- 输入检查
  - 对于用户的任何输入要进行检查、过滤和转义。
- 输出检查
  - 利用 sanitize-html 对输出内容进行有规则的过滤之后再输出到页面中。
- 开启 CSP 网页安全政策防止 XSS 攻击
  - CSP 是网页安全政策(Content Security Policy)的缩写。主要用来防止 XSS 攻击。是一种由开发者定义的安全性政策申明，通过 CSP 所约束的责任指定可信的内容来源，通过 Content-Security-Policy 网页的开发者可以控制整个页面中 外部资源 的加载和执行。
  - `<meta http-equiv="Content-Security-Policy" content=" default-src http: https: *.xxx.com 'self' 'unsafe-inline' ; style-src 'self' 'unsafe-inline' *.yyy.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; ">`

# CSRF(跨站请求伪造)

完成一次 CSRF 攻击，需要完成如下事情：

1. 登录受信任的网站 A，并且在本地生成 cookie。
2. 在不登出网站 A 的情况下，继续访问危险网站 B。

CSRF 基本原理是：假设 A 网站是一个银行网站，而我是该网站的用户，当我以受信任的身份登录了该网站的时候，这时候 A 网站是通过 cookie 保留了我们的登录状态，这个时候我去登录了恶意网站 B 的时候，B 网站就会拿到我登录 A 网站的 cookie 信息到，因此 B 网站就把拿到的 cookie 信息去重新请求 A 网站的接口，但是在该接口后面的参数做一些修改，因此就这样达到攻击的目的。

## CSRF 防范措施

- 服务端验证 HTTP Referer 字段
- 加验证码
- 使用 Token
