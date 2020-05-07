---
title: 一些 JS 关键技术的底层实现汇总
date: 2020-05-06 22:40:35
tags:
  - JavaScript
  - 基础
categories: 基础
---

在这里汇总一些 JS 常用技术的源码实现，通过源码了解其内部原理，可以加深对其的理解。

<!-- more -->

- [Function.prototype.call()](#functionprototypecall)
- [Function.prototype.apply()](#functionprototypeapply)
- [Function.prototype.bind()](#functionprototypebind)
- [new 的原理](#new-%e7%9a%84%e5%8e%9f%e7%90%86)
- [reduce 实现原理](#reduce-%e5%ae%9e%e7%8e%b0%e5%8e%9f%e7%90%86)
- [双向绑定](#%e5%8f%8c%e5%90%91%e7%bb%91%e5%ae%9a)
- [继承](#%e7%bb%a7%e6%89%bf)
- [Object.create](#objectcreate)
- [instanceof 实现](#instanceof-%e5%ae%9e%e7%8e%b0)
- [Array.isArray 实现](#arrayisarray-%e5%ae%9e%e7%8e%b0)
- [getOwnPropertyNames 实现](#getownpropertynames-%e5%ae%9e%e7%8e%b0)
- [Promise 实现](#promise-%e5%ae%9e%e7%8e%b0)
- [防抖/节流](#%e9%98%b2%e6%8a%96%e8%8a%82%e6%b5%81)
- [函数柯里化实现](#%e5%87%bd%e6%95%b0%e6%9f%af%e9%87%8c%e5%8c%96%e5%ae%9e%e7%8e%b0)
- [实现简单深拷贝](#%e5%ae%9e%e7%8e%b0%e7%ae%80%e5%8d%95%e6%b7%b1%e6%8b%b7%e8%b4%9d)

<!-- # 一些 JS 关键技术的底层实现汇总 -->

## Function.prototype.call()

`call()` 方法调用一个函数, 其具有一个指定的 this 值和分别地提供的参数。

语法：`fun.call(thisArg, arg1, arg2, ...)`

```javascript
/**
 * call的实现原理
 */
const getGlobal = function () {
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
};
Function.prototype.mcall = function (context) {
  context = context ? Object(context) : getGlobal();
  context.fn = this;
  let args = [...arguments].slice(1);

  let r = context.fn(...args);
  delete context.fn;
  return r;
};
/**
 * 一个用call实现继承的例子
 * @param {*} name
 * @param {*} price
 */
function Product(name, price) {
  this.name = name;
  this.price = price;
}
function Fruit(name, price) {
  Product.mcall(this, name, price);
  this.category = "fruit";
}
var apple = new Fruit("apple", 5);
console.log(apple);
```

## Function.prototype.apply()

`apply()`调用一个指定 this 值的函数, 接收作为一个数组或者类数组对象提供的参数.

语法： `func.apply(thisArg, [argsArray])`

```javascript
const getGlobal = function () {
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
};
/**
 * apply原理
 */
Function.prototype.apply = function (context, arr) {
  context = context ? Object(context) : getGlobal();
  console.log("context", context);

  context.fn = this;
  // let args = [...arguments][1];

  if (!arr) {
    let r = context.fn();
    delete context.fn;
    return r;
  }
  let r = context.fn(...arr);
  delete context.fn;
  return r;
};
//使用例子
var array = ["a", "b"];
var elements = [0, 1, 2];
array.push.apply(array, elements);
console.log("array", array); // ["a", "b", 0, 1, 2]

function A(x, y) {
  console.log(this.b + " " + x + " " + y);
}
var B = { b: 1 };
A.apply(B, [2, 3]);
```

## Function.prototype.bind()

`bind()`方法创建一个新函数, 在调用时设置 this 关键字为提供的值。

语法：`fun.bind(thisArg, arg1, arg2, ...)`

```js
const getGlobal = function () {
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
};
/**
 * bind实现原理
 */
Function.prototype.bind = function (context) {
  context = context ? Object(context) : getGlobal();
  const me = this;
  const args = [...arguments].slice(1);
  return function () {
    me.apply(context, [...args, ...arguments]);
  };
};
function A(x, y) {
  console.log(this.b + ", " + x + ", " + y);
}
var B = { b: 1 };
let fnc = A.bind(B, 2); //1 2 3
fnc(3);
```

## new 的原理

在了解 new 原理之前先看看 js 的内部机制图

![js内部机制](https://user-gold-cdn.xitu.io/2019/3/14/1697cc831ea2af8e?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

    我们需要知道当 new 的时候做了什么事情

1. 创建一个新对象；
2. 将构造函数的作用域赋给新对象（因此 this 就指向了这个新对象）
3. 执行构造函数中的代码（为这个新对象添加属性）
4. 返回新对象。

new 没法重写，这里是有 mockNew 函数来模拟

```js
/**
 * new实现原理
 */
function mockNew() {
  //创建一个实例
  const obj = {};
  //获得构造器
  const constructor = [].shift.call(arguments);
  //实现继承，实例可以访问构造器熟悉
  obj.__proto__ = constructor.prototype;
  //调用构造器，改变this指向为实例
  const res = constructor.apply(obj, arguments);
  //如果构造器函数返回值为对象，则返回这个对象，否则返回新的实例对象
  return res instanceof Object ? res : obj;
}
/**
 * 使用例子
 * @param {*} color
 * @param {*} name
 */
function Car(color, name) {
  this.color = color;
  return {
    name: name,
  };
}

let car = mockNew(Car, "black", "BMW");
console.log(car.color);
// undefined
console.log(car.name);
// "BMW"
```

## reduce 实现原理

```js
/**
 * 实现原理
 */
Array.prototype.mockReduce = function (callback) {
  const length = this.length;
  let reducer = undefined, //累加器，最终返回这个值
    k = 0, //数组下标
    initVal = [...arguments].length > 1 ? [...arguments][1] : undefined; //传入reduce的初始值
  if (typeof callback !== "function") {
    throw new TypeError(callback + " is not a function");
  }
  if (length === 0 && !initVal) {
    throw new TypeError("Reduce of empty array with no initial value");
  }
  if (initVal) {
    reducer = initVal;
  } else {
    reducer = this[0];
    k++;
  }
  while (k < length) {
    if (this.hasOwnProperty(k)) {
      const kValue = this[k];
      reducer = callback(reducer, kValue);
    }
    k++;
  }
  return reducer;
};

const rReduce = [].reduce((a, b) => a + b, 3);
const mReduce = [].mockReduce((a, b) => a + b);

console.log(rReduce, mReduce);
```

## 双向绑定

`defineProperty`实现

```js
// 数据
const data = {
  text: "hello",
};
const input = document.getElementById("input");
const p = document.getElementById("p");
// 数据劫持
Object.defineProperty(data, "text", {
  // 数据变化 --> 修改视图
  set(newVal) {
    input.value = newVal;
    p.innerHTML = newVal;
  },
});
// 视图更改 --> 数据变化
input.addEventListener("keyup", function (e) {
  data.text = e.target.value;
});
```

`proxy`实现

```js
// 数据
const data = {
  text: "default",
};
const input = document.getElementById("input");
const p = document.getElementById("p");
// 数据劫持
const handler = {
  set(target, key, value) {
    target[key] = value;
    // 数据变化 --> 修改视图
    input.value = value;
    p.innerHTML = value;
    return value;
  },
};
const proxy = new Proxy(data, handler);

// 视图更改 --> 数据变化
input.addEventListener("keyup", function (e) {
  proxy.text = e.target.value;
});
```

## 继承

```js
function inheritPrototype(subType, superType) {
  var protoType = Object.create(superType.prototype); //创建对象
  protoType.constructor = subType; //增强对象
  subType.prototype = protoType; //指定对象
}
function SuperType(name) {
  this.name = name;
  this.colors = ["red", "blue", "green"];
}
SuperType.prototype.sayName = function () {
  alert(this.name);
};

function SubType(name, age) {
  SuperType.call(this, name);
  this.age = age;
}
inheritPrototype(SubType, SuperType);
SubType.prototype.sayAge = function () {
  alert(this.age);
};

var instance = new SubType("Bob", 18);
instance.sayName();
instance.sayAge();
```

## Object.create

```js
if (typeof Object.create !== "function") {
  Object.create = function (prototype, properties) {
    if (typeof prototype !== "object") {
      throw TypeError();
    }
    function Ctor() {}
    Ctor.prototype = prototype;
    var o = new Ctor();
    if (prototype) {
      o.constructor = Ctor;
    }
    if (properties !== undefined) {
      if (properties !== Object(properties)) {
        throw TypeError();
      }
      Object.defineProperties(o, properties);
    }
    return o;
  };
}
```

## instanceof 实现

原理： L 的 \_\_proto\_\_ 是不是等于 R.prototype，不等于再找 L.\_\_proto\_\_.\_\_proto\_\_ 直到 \_\_proto\_\_ 为 null

```js
// L 表示左表达式，R 表示右表达式
function instance_of(L, R) {
  var O = R.prototype;
  L = L.__proto__;
  while (true) {
    if (L === null) return false;
    // 这里重点：当 O 严格等于 L 时，返回 true
    if (O === L) return true;
    L = L.__proto__;
  }
}
```

## Array.isArray 实现

```js
Array.myIsArray = function (o) {
  return Object.prototype.toString.call(Object(o)) === "[object Array]";
};

console.log(Array.myIsArray([])); // true
```

## getOwnPropertyNames 实现

```js
if (typeof Object.getOwnPropertyNames !== "function") {
  Object.getOwnPropertyNames = function (o) {
    if (o !== Object(o)) {
      throw TypeError("Object.getOwnPropertyNames called on non-object");
    }
    var props = [],
      p;
    for (p in o) {
      if (Object.prototype.hasOwnProperty.call(o, p)) {
        props.push(p);
      }
    }
    return props;
  };
}
```

## Promise 实现

实现原理：其实就是一个发布订阅者模式

1. 构造函数接收一个 executor 函数，并会在 new Promise() 时立即执行该函数
2. then 时收集依赖，将回调函数收集到 成功/失败队列
3. executor 函数中调用 resolve/reject 函数
4. resolve/reject 函数被调用时会通知触发队列中的回调

```js
const isFunction = variable => typeof variable === 'function';

// 定义Promise的三种状态常量
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
  // 构造函数，new 时触发
  constructor(handle: Function) {
    try {
      handle(this._resolve, this._reject);
    } catch (err) {
      this._reject(err);
    }
  }
  // 状态 pending fulfilled rejected
  private _status: string = PENDING;
  // 储存 value，用于 then 返回
  private _value: string | undefined = undefined;
  // 失败队列，在 then 时注入，resolve 时触发
  private _rejectedQueues: any = [];
  // 成功队列，在 then 时注入，resolve 时触发
  private _fulfilledQueues: any = [];
  // resovle 时执行的函数
  private _resolve = val => {
    const run = () => {
      if (this._status !== PENDING) return;
      this._status = FULFILLED;
      // 依次执行成功队列中的函数，并清空队列
      const runFulfilled = value => {
        let cb;
        while ((cb = this._fulfilledQueues.shift())) {
          cb(value);
        }
      };
      // 依次执行失败队列中的函数，并清空队列
      const runRejected = error => {
        let cb;
        while ((cb = this._rejectedQueues.shift())) {
          cb(error);
        }
      };
      /*
       * 如果resolve的参数为Promise对象，
       * 则必须等待该Promise对象状态改变后当前Promsie的状态才会改变
       * 且状态取决于参数Promsie对象的状态
       */
      if (val instanceof MyPromise) {
        val.then(
          value => {
            this._value = value;
            runFulfilled(value);
          },
          err => {
            this._value = err;
            runRejected(err);
          }
        );
      } else {
        this._value = val;
        runFulfilled(val);
      }
    };
    // 异步调用
    setTimeout(run);
  };
  // reject 时执行的函数
  private _reject = err => {
    if (this._status !== PENDING) return;
    // 依次执行失败队列中的函数，并清空队列
    const run = () => {
      this._status = REJECTED;
      this._value = err;
      let cb;
      while ((cb = this._rejectedQueues.shift())) {
        cb(err);
      }
    };
    // 为了支持同步的Promise，这里采用异步调用
    setTimeout(run);
  };
  // then 方法
  then(onFulfilled?, onRejected?) {
    const { _value, _status } = this;
    // 返回一个新的Promise对象
    return new MyPromise((onFulfilledNext, onRejectedNext) => {
      // 封装一个成功时执行的函数
      const fulfilled = value => {
        try {
          if (!isFunction(onFulfilled)) {
            onFulfilledNext(value);
          } else {
            const res = onFulfilled(value);
            if (res instanceof MyPromise) {
              // 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
              res.then(onFulfilledNext, onRejectedNext);
            } else {
              //否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
              onFulfilledNext(res);
            }
          }
        } catch (err) {
          // 如果函数执行出错，新的Promise对象的状态为失败
          onRejectedNext(err);
        }
      };

      // 封装一个失败时执行的函数
      const rejected = error => {
        try {
          if (!isFunction(onRejected)) {
            onRejectedNext(error);
          } else {
            const res = onRejected(error);
            if (res instanceof MyPromise) {
              // 如果当前回调函数返回MyPromise对象，必须等待其状态改变后在执行下一个回调
              res.then(onFulfilledNext, onRejectedNext);
            } else {
              //否则会将返回结果直接作为参数，传入下一个then的回调函数，并立即执行下一个then的回调函数
              onFulfilledNext(res);
            }
          }
        } catch (err) {
          // 如果函数执行出错，新的Promise对象的状态为失败
          onRejectedNext(err);
        }
      };

      switch (_status) {
        // 当状态为pending时，将then方法回调函数加入执行队列等待执行
        case PENDING:
          this._fulfilledQueues.push(fulfilled);
          this._rejectedQueues.push(rejected);
          break;
        // 当状态已经改变时，立即执行对应的回调函数
        case FULFILLED:
          fulfilled(_value);
          break;
        case REJECTED:
          rejected(_value);
          break;
      }
    });
  }
  // catch 方法
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
  // finally 方法
  finally(cb) {
    return this.then(
      value => MyPromise.resolve(cb()).then(() => value),
      reason =>
        MyPromise.resolve(cb()).then(() => {
          throw reason;
        })
    );
  }
  // 静态 resolve 方法
  static resolve(value) {
    // 如果参数是MyPromise实例，直接返回这个实例
    if (value instanceof MyPromise) return value;
    return new MyPromise(resolve => resolve(value));
  }
  // 静态 reject 方法
  static reject(value) {
    return new MyPromise((resolve, reject) => reject(value));
  }
  // 静态 all 方法
  static all(list) {
    return new MyPromise((resolve, reject) => {
      // 返回值的集合
      let values = [];
      let count = 0;
      for (let [i, p] of list.entries()) {
        // 数组参数如果不是MyPromise实例，先调用MyPromise.resolve
        this.resolve(p).then(
          res => {
            values[i] = res;
            count++;
            // 所有状态都变成fulfilled时返回的MyPromise状态就变成fulfilled
            if (count === list.length) resolve(values);
          },
          err => {
            // 有一个被rejected时返回的MyPromise状态就变成rejected
            reject(err);
          }
        );
      }
    });
  }
  // 添加静态race方法
  static race(list) {
    return new MyPromise((resolve, reject) => {
      for (let p of list) {
        // 只要有一个实例率先改变状态，新的MyPromise的状态就跟着改变
        this.resolve(p).then(
          res => {
            resolve(res);
          },
          err => {
            reject(err);
          }
        );
      }
    });
  }
}

```

## 防抖/节流

    防抖函数 onscroll 结束时触发一次，延迟执行

```js
function debounce(callback, wait) {
  let timeout;
  return function () {
    let context = this;
    let args = arguments;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback.apply(context, args);
    }, wait);
  };
}
// 使用
window.onscroll = debounce(function () {
  console.log("debounce");
}, 1000);
```

    节流函数 onscroll 时，每隔一段时间触发一次，像水滴一样

```js
function throttle(callback, delay) {
  var prevTime = Date.now();
  return function () {
    var curTime = Date.now();
    if (curTime - prevTime > delay) {
      callback.apply(this, arguments);
      prevTime = curTime;
    }
  };
}
// 使用
window.onscroll = throttle(function () {
  console.log("throtte");
}, 1000);
```

## 函数柯里化实现

    其实我们无时无刻不在使用柯里化函数，只是没有将它总结出来而已。它的本质就是将一个参数很多的函数分解成单一参数的多个函数。

应用场景：

- 延迟计算 （用闭包把传入参数保存起来，当传入参数的数量足够执行函数时，开始执行函数）
- 动态创建函数 （参数不够时会返回接受剩下参数的函数）
- 参数复用（每个参数可以多次复用）

```js
const curry = (fn) =>
  (judge = (...args) =>
    args.length >= fn.length
      ? fn(...args)
      : (...arg) => judge(...args, ...arg));

const sum = (a, b, c, d) => a + b + c + d;
const currySum = curry(sum);

currySum(1)(2)(3)(4); // 10
currySum(1, 2)(3)(4); // 10
currySum(1)(2, 3)(4); // 10
```

## 实现简单深拷贝

```js
function getType(obj) {
  const str = Object.prototype.toString.call(obj);
  const map = {
    "[object Boolean]": "boolean",
    "[object Number]": "number",
    "[object String]": "string",
    "[object Function]": "function",
    "[object Array]": "array",
    "[object Date]": "date",
    "[object RegExp]": "regExp",
    "[object Undefined]": "undefined",
    "[object Null]": "null",
    "[object Object]": "object",
  };
  if (obj instanceof Element) {
    // 判断是否是dom元素，如div等
    return "element";
  }
  return map[str];
}
function deepCopy(original) {
  const type = getType(original);
  let copy;
  switch (type) {
    case "array":
      return copyArray(original, copy);
    case "object":
      return copyObject(original, copy);
    case "function":
      return copyFunction(original, copy);
    default:
      return original;
  }
}

function copyArray(original, copy = []) {
  for (const [index, value] of original.entries()) {
    copy[index] = deepCopy(value);
  }
  return copy;
}

function copyObject(original, copy = {}) {
  for (const [key, value] of Object.entries(original)) {
    copy[key] = deepCopy(value);
  }
  return copy;
}

function copyFunction(original, copy = () => {}) {
  const fn = eval(original.toString());
  fn.prototype = original.prototype;
  return fn;
}
const arr1 = [1, 2, [3, 4], { i: 6, j: 6 }, (k, m) => k + m];
console.log(deepCopy(arr1));
```
