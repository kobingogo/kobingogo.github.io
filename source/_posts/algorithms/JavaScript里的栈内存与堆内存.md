---
title: JavaScript里的栈内存与堆内存
date: 2019-12-07 15:37:25
tags:
  - 栈内存
  - 堆内存
categories:
  - 数据结构与算法
---

本文主要介绍堆与栈，以及他们在JavaScript语言底层的应用。

<!-- more -->

### 栈

- 定义
  - 后进者先出，先进者后出，简称 后进先出（LIFO），这就是典型的栈结构。
  - 在栈里，新元素都靠近栈顶，旧元素都接近栈底。
  - 从栈的操作特性来看，是一种 操作受限的线性表，只允许在一端插入和删除数据。
  - 不包含任何元素的栈称为空栈。

栈被用在编程语言的编译器和内存中保存变量、方法调用等，比如函数的调用栈、前端路由等。

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfhfvwdizbj30lc0i43zg.jpg)


### 堆

- 定义
  - 堆数据结构是一种树状结构
  - 它的存取数据的方式，与书架相似：我们不关心书的放置顺序是怎样的，只需知道书的名字就可以取出我们想要的书

- 堆与栈比较
  - 栈，线性结构，后进先出，便于管理。
  - 堆，非线性结构，杂乱无章，方便存储和开辟内存空间。
  - 堆是动态分配内存，内存大小不一，不会自动释放。
  - 栈是自动分配相对固定大小的内存空间，并由系统自动释放。

### 栈内存与堆内存

JavaScript 中的变量分为基本类型和引用类型。

`基本类型`是保存在栈内存中的简单数据段，它们的值都有固定的大小，通过按值访问，并由系统自动分配和自动释放。 这样带来的好处就是，内存可以及时得到回收，相对于堆来说，更加`容易管理内存空间`。 JavaScript 中的 `Boolean、Null、Undefined、Number、String、Symbol` 都是基本类型。

`引用类型`（如对象、数组、函数等）是保存在堆内存中的对象，值大小不固定，栈内存中存放的该对象的访问地址指向堆内存中的对象，JavaScript 不允许直接访问堆内存中的位置，因此操作对象时，实际操`作对象的引用`。 JavaScript 中的 `Object、Array、Function、RegExp、Date `是引用类型。

示例：
```js
let a1 = 0; // 栈内存
let a2 = "this is string" // 栈内存
let a3 = null; // 栈内存
let b = { x: 10 }; // 变量 b 存在于栈中，{ x: 10 } 作为对象存在于堆中
let c = [1, 2, 3]; // 变量 c 存在于栈中，[1, 2, 3] 作为对象存在于堆中
```

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfjs20edmrj30yg0d2400.jpg)

当我们要访问堆内存中的引用数据类型时:
  1. 从栈中获取该对象的地址引用;
  2. 再从堆内存中取得我们需要的数据;


- 复制基本类型

```js
let a = 20;
let b = a;
b = 30;
console.log(a); // 20
```
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfjs47bav7j30yg0ajq43.jpg)
在栈内存中的数据发生复制行为时，系统会自动为新的变量分配一个新值，最后这些变量都是 相互独立，互不影响的。

- 复制引用类型

```js
let a = { x: 10, y: 20 }
let b = a;
b.x = 5;
console.log(a.x); // 5
```

引用类型的复制，同样为新的变量 b 分配一个新的值，保存在栈内存中，不同的是，这个值仅仅是引用类型的一个`地址指针`。
他们两个指向`同一个堆内存空间`，在堆内存中访问到的具体对象实际上是`同一个`。
因此改变 b.x 时，a.x 也发生了变化，这就是引用类型的特性。

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfjsc37dtkj30yg0u0dio.jpg)

- 总结

|栈内存|堆内存|
|:--|:--|
|存储基础数据类型|存储引用数据类型|
|按值访问|按引用访问|
|存储的值大小固定|存储的值大小不定，可动态调整|
|由系统自动分配内存空间|由代码进行指定分配|
|空间小，运行效率高|空间大，运行效率相对较低|
|先进后出，后进先出|无序存储，可根据引用直接获取|

### 浅拷贝 VS 深拷贝

上面讲的引用类型的复制就是`浅拷贝`，复制得到的访问地址都指向同一个内存空间。所以修改了其中一个的值，另外一个也跟着改变了。

`深拷贝`：复制得到的访问地址指向不同的内存空间，互不相干。所以修改其中一个值，另外一个不会改变。

浅拷贝的优势在于性能出色，但是并不能都满足日常需求，很多时候我们需要改变拷贝数组的时候，原数组不受影响，这时候就需要用到深拷贝了。

- 一个通用深拷贝的实现
主要思想：
  - 通过判断拷贝对象的类型，如果是基本类型，直接赋值，如果是引用类型(array/object/function),则进入核心步骤
  - 深拷贝的实现最重要的是处理`循环引用`的问题，以下用WeakMap的方式阻止循环引用:
  ```js
  // 阻止循环引用
  if (cache.has(target)) {
    return cache.get(target);
  }
  cache.set(target, copy);
  ```

完整实现代码如下：

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
  return map[str];
}

function deepCopy(target, cache = new WeakMap()) {
  const type = getType(target);
  // 值类型数组
  const valTypes = [
    "undefined",
    "null",
    "boolean",
    "number",
    "string",
    "symbol",
    "bigInt",
  ];
  if (valTypes.includes(type)) {
    return target;
  }
  let copy;
  // 初始化clone值
  if (type === "function") {
    copy = {};
  } else {
    copy = new target.constructor();
  }
  // 阻止循环引用
  if (cache.has(target)) {
    return cache.get(target);
  }
  cache.set(target, copy);

  switch (type) {
    case "array":
      return copyArray(target, copy, cache);
    case "object":
      return copyObject(target, copy, cache);
    case "function":
      return copyFunction(target, cache);
    default:
      return target;
  }
}

function copyArray(target, copy = [], cache) {
  for (const [index, value] of target.entries()) {
    copy[index] = deepCopy(value, cache);
  }
  return copy;
}

function copyObject(target, copy = {}, cache) {
  for (const [key, value] of Object.entries(target)) {
    copy[key] = deepCopy(value, cache);
  }
  return copy;
}

function copyFunction(target, copy = () => {}) {
  const fn = eval(target.toString());
  fn.prototype = target.prototype;
  return fn;
}
```
