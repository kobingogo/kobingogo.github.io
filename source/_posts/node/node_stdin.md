---
title: Nodejs读取控制台输入(stdin)的方法总结
date: 2019-09-23 14:35:46
tags:
  - node
  - stdin
categories: node
---
在用 Nodejs 写 CLI 应用或者做OJ的时候经常会遇到要从 stdin 读取输入的情况，这里总结了几种不依赖第三方库来按行读取输入的方法。
<!-- more -->

### Readline基础使用

- 优点：简洁方便，平台无关。可用于编写 REPL 应用。
- 缺点：某些 OJ 的 node 版本可能不支持readline，对此请参考OJ专用的方法。

```js
require("readline")
  .createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  .on("line", function (line) {
    console.log("the input is: ", line.trim());
    this.close();
  });
```


### 实现互动问答

- 优点：便于引导用户正确输入。

```js
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const question = (query) =>
  new Promise((resolve) => rl.question(query, (answer) => resolve(answer)));

(async () => {
  let answer = await question("你觉得node是最棒的吗？ ");
  console.log(`您的答案是：${answer}`);

  answer = await question("async/await好不好用啊 ");
  console.log(`您的答案是：${answer}`);

  answer = await question("等待多少秒继续执行？ ");
  rl.pause();
  await wait(parseInt(answer) * 1000);
  rl.resume();

  while ((await question("输入bye退出 ")).trim() !== "bye");

  console.log("Good day.");

  rl.close();
})();
```

### process.stdin

```js
process.stdin.setEncoding("utf8");

process.stdin.on("readable", () => {
  var chunk = process.stdin.read();
  if (typeof chunk === "string") {
    chunk = chunk.slice(0, -1);
    process.stdout.write(`stringLength:${chunk.length}\n`);
  }
  if (chunk === "") {
    process.stdin.emit("end");
    return;
  }
  if (chunk !== null) {
    process.stdout.write(`data: ${chunk}\n`);
  }
});

process.stdin.on("end", () => {
  process.stdout.write("end");
});
```
