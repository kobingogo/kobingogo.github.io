---
title: promise高级用法
date: 2019-08-02 22:49:39
tags:
  - promise
  - JavaScript
categories:
  - JavaScript
excerpt: "对于Promise高级用法的使用汇总，包括多个promise串行执行、多个promise并行执行以及限制并行等"
---

## 实现多个promise串行执行

在 async/await 以前 Promise 串行执行还是比较麻烦的，除了依赖 [async](https://github.com/caolan/async)、[promise-fun](https://github.com/sindresorhus/promise-fun) 等工具库，我们还可以使用 Array.prototype.reduce() 自己实现一个简单的串行Promise了：

```js
/**
 * 核心代码
 **/
function runPromiseByQueue(myPromises) {
  myPromises.reduce(
    (previousPromise, nextPromise) => previousPromise.then(() => nextPromise()),
    Promise.resolve()
  );
}
```
当上一个 Promise 开始执行（previousPromise.then），当其执行完毕后再调用下一个 Promise，并作为一个新 Promise 返回，下次迭代就会继续这个循环。

举个例子：
```js
const createPromise = (time, id) => () =>
  new Promise((solve) => {
    console.time("time" + id);
    setTimeout(() => {
      console.log("promise", id);
      console.timeEnd("time" + id);
      if (id == 3) {
        console.timeEnd("timeall");
      }
      solve();
    }, time);
  });

console.time("timeall");
runPromiseByQueue([
  createPromise(3000, 1),
  createPromise(2000, 2),
  createPromise(1000, 3),
]);
```
最后的输出结果如下：
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfexoo9xmvj307702yt8p.jpg)

说明确实是串行依次执行了三个promise。


## 实现多个promise并行执行

这个目前ES官方已经实现了promise.all/promise.allSettled/promise.race等方法，以promise.all()为例：
```js
const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise((resolve, reject) => {
  setTimeout(resolve, 100, 'foo');
});

Promise.all([promise1, promise2, promise3]).then((values) => {
  console.log(values);
});
// expected output: Array [3, 42, "foo"]
```
`Promise.all`可以保证，`promises`数组中所有promise对象都达到`resolve`状态，才执行`then`回调。

那么如果`promises`数组是包含几十个甚至几百个http请求，直接用`Promise.all`的话，会瞬间发出所有的http请求，造成请求拥堵甚至失败。

这时候就需要对`Promise.all`做并发限制。


## promise.all并行限制

首先需要明白的是，promise并不是在调用Promise.all才执行，而是在实例化promise对象的时候就执行了，在理解这一点的基础上，就可以从promise实例化上下手实现并发限制。具体实现代码如下：

```js
/**
 * Promise并发限制
 * @param {Array} array
 * @param {Number} poolLimit
 */
function LimitPromiseAll(array, poolLimit) {
  let i = 0; //待执行元素的数组下标
  const results = []; // promise.all的promises数组
  const executing = []; // 存放正在执行
  const enqueue = function () {
    // 边界处理，array为空数组
    if (i === array.length) {
      return Promise.resolve();
    }
    // 每调一次enqueue，初始化一个promise
    const fn = array[i++];
    // 如果curPromise不是Promise对象。则转成Promise 对象
    // 等同于 const p = Promise.resolve(fn());
    const p = Promise.resolve().then(() => fn());
    // 放入promises数组
    results.push(p);
    // promise执行完毕，从executing数组中删除
    const e = p.then((res) => {
      executing.splice(executing.indexOf(e), 1);
    });
    //正在执行的promise, 插入executing数组
    executing.push(e);

    // 当executing数组中promise数量低于poolLimit，就实例化新的promise并执行,
    // 否则调用promise.race()获取到最快执行完成的promise（将其从executing数组删除，便可继续后续执行）
    let r = Promise.resolve();
    if (executing.length >= poolLimit) {
      r = Promise.race(executing);
    }
    // 递归，直到遍历完array
    return r.then(() => enqueue());
  };

  return enqueue().then(() => Promise.all(results));
}
```

使用例子：
```js
console.time("all-time");
const timeout = (i) =>
  new Promise((resolve) => setTimeout(() => resolve(i), i));

LimitPromiseAll(
  [
    timeout.bind(null, 1000),
    timeout.bind(null, 5000),
    timeout.bind(null, 2000),
    timeout.bind(null, 4000),
  ],
  2
).then((res) => {
  console.log(res);
  console.timeEnd("all-time");
});
/**
输出： [ 1000, 5000, 2000, 4000 ]
      all-time: 7037.285ms
 **/
```

其实，目前社区里已经有一些开源包实现了这个功能，比如[async-pool](https://github.com/rxaviers/async-pool)、[es6-promise-pool](https://github.com/timdp/es6-promise-pool)、[p-limit](https://github.com/sindresorhus/p-limit)。上述实现代码也是参考async-pool的实现。


## 使用Promise实现fetch超时处理

因为`fetch`默认没有请求超时设置，以及中断请求操作，在这里我们尝试使用`Promise`结合[AbortController](https://developer.mozilla.org/zh-CN/docs/Web/API/FetchController)封装一个简单的请求超时和中断请求的`fetch`。

> AbortController接口代表一个控制器对象，允许你在需要时中止一个或多个DOM请求
> 目前IE外的主流浏览器基本都实现了AbortController功能；

AbortController的浏览器兼容情况：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfg4gbzyt9j30s70c5tax.jpg)


```js
function TimeoutFetch(params) {
  this.controller = new AbortController(); //实例化AbortController
  this.signal = this.controller.signal; //signal用来 abort 请求
  this.timeout = 5000; //默认超时时间
}
/**
 * 设置超时时间
 */
TimeoutFetch.prototype.setTimeout = function (ms) {
  this.timeout = ms;
};

/**
 * 封装fetch请求
 */
TimeoutFetch.prototype.fetch = function (url, data = {}) {
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 1,
        msg: `timeout of ${this.timeout}ms`,
      });
      this.controller.abort();
    }, this.timeout);
  });
  const fetchPromise = fetch(url, {
    signal: this.signal, //设置信号
    ...data,
  });
  return Promise.race([fetchPromise, timeoutPromise]);
};
/**
 * 手动中断请求
 */
TimeoutFetch.prototype.abort = function () {
  this.controller.abort();
};
```

使用例子：

```js
const timeoutFetch = new TimeoutFetch();
timeoutFetch.setTimeout(30);
timeoutFetch.fetch("http://localhost/data").then((res) => {
  console.log(res);
});
```
