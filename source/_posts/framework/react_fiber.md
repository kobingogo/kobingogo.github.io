---
title: 深入React Fiber
date: 2022-09-05 20:16:46
tags: React Fiber
categories: react
excerpt: Fiber 是对 React 核心算法的重构，facebook 团队使用两年多的时间去重构 React 的核心算法，在React16 以上的版本中引入了 Fiber 架构，其中的设计思想是非常值得我们学习的。
---

## Fiber 设计思想

Fiber 是对 React 核心算法的重构，facebook 团队使用两年多的时间去重构 React 的核心算法，在 React16 以上的版本中引入了 Fiber 架构，其中的设计思想是非常值得我们学习的。

### 为什么需要 Fiber

我们知道，在浏览器中，页面是一帧一帧绘制出来的，渲染的帧率与设备的刷新率保持一致。一般情况下，设备的屏幕刷新率为 1s 60 次，当每秒内绘制的帧数（FPS）超过 60 时，页面渲染是流畅的；而当 FPS 小于 60 时，会出现一定程度的卡顿现象。下面来看完整的一帧中，具体做了哪些事情：

![20240730171907](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730171907.png)

1. 首先需要处理输入事件，能够让用户得到最早的反馈
2. 接下来是处理定时器，需要检查定时器是否到时间，并执行对应的回调
3. 接下来处理 Begin Frame（开始帧），即每一帧的事件，包括 window.resize、scroll、media query change 等
4. 接下来执行请求动画帧 requestAnimationFrame（rAF），即在每次绘制之前，会执行 rAF 回调
5. 紧接着进行 Layout 操作，包括计算布局和更新布局，即这个元素的样式是怎样的，它应该在页面如何展示
6. 接着进行 Paint 操作，得到树中每个节点的尺寸与位置等信息，浏览器针对每个元素进行内容填充
7. 到这时以上的六个阶段都已经完成了，接下来处于空闲阶段（Idle Peroid），可以在这时执行 requestIdleCallback 里注册的任务（后面会详细讲到这个 requestIdleCallback ，它是 React Fiber 实现的基础）

js 引擎和页面渲染引擎是在同一个渲染线程之内，两者是互斥关系。如果在某个阶段执行任务特别长，例如在定时器阶段或`Begin Frame`阶段执行时间非常长，时间已经明显超过了 16ms，那么就会阻塞页面的渲染，从而出现卡顿现象。

在 react16 引入 Fiber 架构之前，react 会采用递归对比虚拟 DOM 树，找出需要变动的节点，然后同步更新它们，这个过程 react 称为`reconcilation`（协调）。在`reconcilation`期间，react 会一直占用浏览器资源，会导致用户触发的事件得不到响应。实现的原理如下所示：
![20240730172010](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172010.png)

这里有 7 个节点，B1、B2 是 A1 的子节点，C1、C2 是 B1 的子节点，C3、C4 是 B2 的子节点。传统的做法就是采用深度优先遍历去遍历节点，具体代码如下：

```
const root = { key: 'A1', children: [{ key: 'B1', children: [{ key: 'C1', children: [] }, { key: 'C2', children: [] }] }, { key: 'B2', children: [{ key: 'C3', children: [] }, { key: 'C4', children: [] }] }] } const walk = dom => { console.log(dom.key) dom.children.forEach(child => walk(child)) } walk(root)

```

打印：

```
<span data-line-num="1">A1</span>
<span data-line-num="2">B1</span>
<span data-line-num="3">C1</span>
<span data-line-num="4">C2</span>
<span data-line-num="5">B2</span>
<span data-line-num="6">C3</span>
<span data-line-num="7">C4</span>

```

这种遍历是递归调用，执行栈会越来越深，而且不能中断，中断后就不能恢复了。递归如果非常深，就会十分卡顿。如果递归花了 100ms，则这 100ms 浏览器是无法响应的，代码执行时间越长卡顿越明显。传统的方法存在不能中断和执行栈太深的问题。

因此，为了解决以上的痛点问题，React 希望能够彻底解决主线程长时间占用问题，于是引入了 Fiber 来改变这种不可控的现状，把渲染/更新过程拆分为一个个小块的任务，通过合理的调度机制来调控时间，指定任务执行的时机，从而降低页面卡顿的概率，提升页面交互体验。通过 Fiber 架构，让`reconcilation`过程变得可被中断。适时地让出 CPU 执行权，可以让浏览器及时地响应用户的交互。

React16 中使用了 Fiber，但是 Vue 是没有 Fiber 的，为什么呢？原因是二者的优化思路不一样：

1. Vue 是基于 template 和 watcher 的组件级更新，把每个更新任务分割得足够小，不需要使用到 Fiber 架构，将任务进行更细粒度的拆分
2. React 是不管在哪里调用 setState，都是从根节点开始更新的，更新任务还是很大，需要使用到 Fiber 将大任务分割为多个小任务，可以中断和恢复，不阻塞主进程执行高优先级的任务

下面，让我们走进 Fiber 的世界，看看具体是怎么实现的。

### 什么是 Fiber

Fiber 可以理解为是一个执行单元，也可以理解为是一种数据结构。

### 一个执行单元

Fiber 可以理解为一个执行单元，每次执行完一个执行单元，react 就会检查现在还剩多少时间，如果没有时间则将控制权让出去。React Fiber 与浏览器的核心交互流程如下：

![20240730172031](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172031.png)

首先 React 向浏览器请求调度，浏览器在一帧中如果还有空闲时间，会去判断是否存在待执行任务，不存在就直接将控制权交给浏览器，如果存在就会执行对应的任务，执行完成后会判断是否还有时间，有时间且有待执行任务则会继续执行下一个任务，否则就会将控制权交给浏览器。这里会有点绕，可以结合上述的图进行理解。

Fiber 可以被理解为划分一个个更小的执行单元，它是把一个大任务拆分为了很多个小块任务，一个小块任务的执行必须是一次完成的，不能出现暂停，但是一个小块任务执行完后可以移交控制权给浏览器去响应用户，从而不用像之前一样要等那个大任务一直执行完成再去响应用户。

### 一种数据结构

Fiber 还可以理解为是一种数据结构，React Fiber 就是采用链表实现的。每个 Virtual DOM 都可以表示为一个 fiber，如下图所示，每个节点都是一个 fiber。一个 fiber 包括了 child（第一个子节点）、sibling（兄弟节点）、return（父节点）等属性，React Fiber 机制的实现，就是依赖于以下的数据结构。在下文中会讲到基于这个链表结构，Fiber 究竟是如何实现的。

PS：这里需要说明一下，Fiber 是 React 进行重构的核心算法，fiber 是指数据结构中的每一个节点，如下图所示的 A1、B1 都是一个 fiber。

![20240730172050](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172050.png)

### requestAnimationFrame

在 Fiber 中使用到了[requestAnimationFrame](https://kobingogo.github.io/%E6%B5%8F%E8%A7%88%E5%99%A8-requestIdleCallback%E5%92%8CrequestAnimationFrame%E8%AF%A6%E8%A7%A3/)，它是浏览器提供的绘制动画的 api 。它要求浏览器在下次重绘之前（即下一帧）调用指定的回调函数更新动画。

例如我想让浏览器在每一帧中，将页面 div 元素的宽变长 1px，直到宽度达到 100px 停止，这时就可以采用`requestAnimationFrame`来实现这个功能。

```html
<body>
	<div id="div" class="progress-bar "></div>
	<button id="start">开始动画</button>
</body>
<script>
	let btn = document.getElementById('start') let div = document.getElementById('div') let start = 0 let allInterval = [] const progress = () => { div.style.width = div.offsetWidth + 1 + 'px' div.innerHTML = (div.offsetWidth) + '%' if (div.offsetWidth < 100) { let current = Date.now() allInterval.push(current - start) start = current requestAnimationFrame(progress) } else { console.log(allInterval) // 打印requestAnimationFrame的全部时间间隔 } } btn.addEventListener('click', () => { div.style.width = 0 let currrent = Date.now() start = currrent requestAnimationFrame(progress) console.log(allInterval) })
</script>
```

浏览器会在每一帧中，将 div 的宽度变宽 1px，知道到达 100px 为止。打印出每一帧的时间间隔如下，大约是 16ms 左右。

![20240730172119](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172119.png)### requestIdleCallback

[requestIdleCallback](https://kobingogo.github.io/%E6%B5%8F%E8%A7%88%E5%99%A8-requestIdleCallback%E5%92%8CrequestAnimationFrame%E8%AF%A6%E8%A7%A3/) 也是 react Fiber 实现的基础 api 。我们希望能够快速响应用户，让用户觉得够快，不能阻塞用户的交互，`requestIdleCallback`能使开发者在主事件循环上执行后台和低优先级的工作，而不影响延迟关键事件，如动画和输入响应。正常帧任务完成后没超过 16ms，说明有多余的空闲时间，此时就会执行`requestIdleCallback`里注册的任务。

具体的执行流程如下，开发者采用`requestIdleCallback`方法注册对应的任务，告诉浏览器我的这个任务优先级不高，如果每一帧内存在空闲时间，就可以执行注册的这个任务。另外，开发者是可以传入`timeout`参数去定义超时时间的，如果到了超时时间了，浏览器必须立即执行，使用方法如下：`window.requestIdleCallback(callback, { timeout: 1000 })`。浏览器执行完这个方法后，如果没有剩余时间了，或者已经没有下一个可执行的任务了，React 应该归还控制权，并同样使用`requestIdleCallback`去申请下一个时间片。具体的流程如下图：

![20240730172256](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172256.png)

`window.requestIdleCallback(callback)`的`callback`中会接收到默认参数 deadline ，其中包含了以下两个属性：

- timeRamining 返回当前帧还剩多少时间供用户使用
- didTimeout 返回 callback 任务是否超时

`requestIdleCallback` 方法非常重要，下面分别讲两个例子来理解这个方法，在每个例子中都需要执行多个任务，但是任务的执行时间是不一样的，下面来看浏览器是如何分配时间执行这些任务的：

### 一帧执行

直接执行 task1、task2、task3，各任务的时间均小于 16ms：

```js

```

上面定义了一个任务队列`taskQueue`，并定义了`workloop`函数，其中采用 `window.requestIdleCallback(workloop, { timeout: 1000 })`去执行`taskQueue`中的任务。每个任务中仅仅做了`console.log`的工作，�� 间是非常短的，浏览器计算此帧中还剩余 15.52ms，足以一次执行完这三个任务，因此在此帧的空闲时间中，`taskQueue`中定义的三个任务均执行完毕。打印结果如下：

![20240730172234](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172234.png)

### 多帧执行

在 task1、task2、task3 中加入睡眠时间，各自执行时间超过 16ms：

```js
let taskQueue = [
	() => {
		console.log('task1 start');
		console.log('task1 end');
	},
	() => {
		console.log('task2 start');
		console.log('task2 end');
	},
	() => {
		console.log('task3 start');
		console.log('task3 end');
	},
];
const performUnitWork = () => {
	// 取出第一个队列中的第一个任务并执行 taskQueue.shift()()
};
const workloop = deadline => {
	console.log(`此帧的剩余时间为: ${deadline.timeRemaining()}`); // 如果此帧剩余时间大于0或者已经到了定义的超时时间（上文定义了timeout时间为1000，到达时间时必须强制执行），且当时存在任务，则直接执行这个任务
	// 如果没有剩余时间，则应该放弃执行任务控制权，把执行权交还给浏览器
	while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && taskQueue.length > 0) {
		performUnitWork();
	} // 如果还有未完成的任务，继续调用requestIdleCallback申请下一个时间片
	if (taskQueue.length > 0) {
		window.requestIdleCallback(workloop, { timeout: 1000 });
	}
};
requestIdleCallback(workloop, { timeout: 1000 });
```

基于以上的例子做了部分改造，让`taskQueue`中的每个任务的执行时间都超过 16.6ms，看打印结果知道浏览器第一帧的空闲时间为 14ms，只能执行一个任务，同理，在第二帧、第三帧的时间也只够执行一个任务。所有这三个任务分别是在三帧中分别完成的。打印结果如下：

![20240730172326](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172326.png)

浏览器一帧的时间并不严格是 16ms，是可以动态控制的（如第三帧剩余时间为 49.95ms）。如果子任务的时间超过了一帧的剩余时间，则会一直卡在这里执行，直到子任务执行完毕。如果代码存在死循环，则浏览器会卡死。如果此帧的剩余时间大于 0（有空闲时间）或者已经超时（上文定义了 timeout 时间为 1000，必须强制执行了），且当时存在任务，则直接执行该任务。如果没有剩余时间，则应该放弃执行任务控制权，把执行权交还给浏览器。如果多个任务执行总时间小于空闲时间的话，是可以在一帧内执行多个任务的。

### Fiber 链表结构设计

Fiber 结构是使用链表实现的，`Fiber tree`实际上是个单链表树结构，详见[ReactFiber.js 源码](https%3A%2F%2Fgithub.com%2Ffacebook%2Freact%2Fblob%2Fmaster%2Fpackages%2Freact-reconciler%2Fsrc%2FReactFiber.new.js)，在这里我们看看 Fiber 的链表结构是怎样的，了解了这个链表结构后，能更快地理解后续 Fiber 的遍历过程。

![20240730172400](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172400.png)

以上每一个单元包含了`payload`（数据）和`nextUpdate`（指向下一个单元的指针），定义结构如下：

```js
class Update {
	constructor(payload, nextUpdate) {
		this.payload = payload; // payload 数据
		this.nextUpdate = nextUpdate; // 指向下一个节点的指针
	}
}
```

接下来定义一个队列，把每个单元串联起来，其中定义了两个指针：头指针`firstUpdate`和尾指针`lastUpdate`，作用是指向第一个单元和最后一个单元，并加入了`baseState`属性存储 React 中的 state 状态。如下所示：

```
class UpdateQueue {
	constructor() {
		this.baseState = null; // state
		this.firstUpdate = null; // 第一个更新
		this.lastUpdate = null; // 最后一个更新
	}
}

```

接下来定义两个方法：插入节点单元（enqueueUpdate）、更新队列（forceUpdate）。插入节点单元时需要考虑是否已经存在节点，如果不存在直接将`firstUpdate`、`lastUpdate`指向此节点即可。更新队列是遍历这个链表，根据`payload`中的内容去更新`state`的值。

```js
class UpdateQueue {
	//.....
	enqueueUpdate(update) {
		// 当前链表是空链表
		if (!this.firstUpdate) {
			this.firstUpdate = this.lastUpdate = update;
		} else {
			// 当前链表不为空
			this.lastUpdate.nextUpdate = update;
			this.lastUpdate = update;
		}
	}
	// 获取state，然后遍历这个链表，进行更新
	forceUpdate() {
		let currentState = this.baseState || {};
		let currentUpdate = this.firstUpdate;
		while (currentUpdate) {
			// 判断是函数还是对象，是函数则需要执行，是对象则直接返回
			let nextState =
				typeof currentUpdate.payload === 'function'
					? currentUpdate.payload(currentState)
					: currentUpdate.payload;
			currentState = { ...currentState, ...nextState };
			currentUpdate = currentUpdate.nextUpdate;
		}
		// 更新完成后清空链表
		this.firstUpdate = this.lastUpdate = null;
		this.baseState = currentState;
		return currentState;
	}
}
```

最后写一个 demo，实例化一个队列，向其中加入很多节点，再更新这个队列：

```js
let queue = new UpdateQueue();
queue.enqueueUpdate(new Update({ name: 'www' }));
queue.enqueueUpdate(new Update({ age: 10 }));
queue.enqueueUpdate(new Update(state => ({ age: state.age + 1 })));
queue.enqueueUpdate(new Update(state => ({ age: state.age + 1 })));
queue.forceUpdate();
console.log(queue.baseState);
```

打印结果如下：

```css
{ name:'www',age:12 }

```

### Fiber 节点设计

Fiber 的拆分单位是 fiber（`fiber tree`上的一个节点），实际上就是按虚拟 DOM 节点拆，我们需要根据虚拟 dom 去生成 Fiber 树。下文中我们把每一个节点叫做 fiber 。fiber 节点结构如下，源码详见[ReactInternalTypes.js](https%3A%2F%2Fgithub.com%2Ffacebook%2Freact%2Fblob%2Fmaster%2Fpackages%2Freact-reconciler%2Fsrc%2FReactInternalTypes.js)。

```js
{

    type: any, // 对于类组件，它指向构造函数；对于DOM元素，它指定HTML tag
    key: null | string, // 唯一标识符
    stateNode: any, // 保存对组件的类实例，DOM节点或与fiber节点关联的其他React元素类型的引用
    child: Fiber | null, // 大儿子
    sibling: Fiber | null, // 下一个兄弟
    return: Fiber | null, // 父节点
    tag: WorkTag, // 定义fiber操作的类型, 详见https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactWorkTags.js
    nextEffect: Fiber | null, // 指向下一个节点的指针
    updateQueue: mixed, // 用于状态更新，回调函数，DOM更新的队列
    memoizedState: any, // 用于创建输出的fiber状态
    pendingProps: any, // 已从React元素中的新数据更新，并且需要应用于子组件或DOM元素的props
    memoizedProps: any, // 在前一次渲染期间用于创建输出的props
    // ……
}

```

fiber 节点包括了以下的属性：

（1）type & key

- fiber 的 type 和 key 与 React 元素的作用相同。fiber 的 type 描述了它对应的组件，对于复合组件，type 是函数或类组件本身。对于原生标签（div，span 等），type 是一个字符串。随着 type 的不同，在 reconciliation 期间使用 key 来确定 fiber 是否可以重新使用。

（2）stateNode

- stateNode 保存对组件的类实例，DOM 节点或与 fiber 节点关联的其他 React 元素类型的引用。一般来说，可以认为这个属性用于保存与 fiber 相关的本地状态。

（3）child & sibling & return

- child 属性指向此节点的第一个子节点（大儿子）。
- sibling 属性指向此节点的下一个兄弟节点（大儿子指向二儿子、二儿子指向三儿子）。
- return 属性指向此节点的父节点，即当前节点处理完毕后，应该向谁提交自己的成果。如果 fiber 具有多个子 fiber，则每个子 fiber 的 return fiber 是 parent 。

所有 fiber 节点都通过以下属性：child，sibling 和 return 来构成一个 fiber node 的 linked list(后面我们称之为链表)。如下图所示：

![20240730172437](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172437.png)

其他的属性还有`memoizedState`（创建输出的 fiber 的状态）、`pendingProps`（将要改变的 props ）、`memoizedProps`（上次渲染创建输出的 props ）、`pendingWorkPriority`（定义 fiber 工作优先级）等等，在这里就不展开描述了。

## Fiber 执行原理

从根节点开始渲染和调度的过程可以分为两个阶段：render 阶段、commit 阶段。

- render 阶段：这个阶段是可中断的，会找出所有节点的变更
- commit 阶段：这个阶段是不可中断的，会执行所有的变更

### render 阶段

此阶段会找出所有节点的变更，如节点新增、删除、属性变更等，这些变更 react 统称为副作用（effect），此阶段会构建一棵`Fiber tree`，以虚拟 dom 节点为维度对任务进行拆分，即一个虚拟 dom 节点对应一个任务，最后产出的结果是`effect list`，从中可以知道哪些节点更新、哪些节点增加、哪些节点删除了。

### 遍历流程

`React Fiber`首先是将虚拟 DOM 树转化为`Fiber tree`，因此每个节点都有`child`、`sibling`、`return`属性，遍历`Fiber tree`时采用的是后序遍历方法：

1. 从顶点开始遍历
2. 如果有大儿子，先遍历大儿子；如果没有大儿子，则表示遍历完成
3. 大儿子： a. 如果有弟弟，则返回弟弟，跳到 2 b. 如果没有弟弟，则返回父节点，并标志完成父节点遍历，跳到 2 d. 如果没有父节点则标志遍历结束

![20240730172459](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172459.png)

定义树结构：

```
const A1 = { type: 'div', key: 'A1' }
const B1 = { type: 'div', key: 'B1', return: A1 }
const B2 = { type: 'div', key: 'B2', return: A1 }
const C1 = { type: 'div', key: 'C1', return: B1 }
const C2 = { type: 'div', key: 'C2', return: B1 }
const C3 = { type: 'div', key: 'C3', return: B2 }
const C4 = { type: 'div', key: 'C4', return: B2 }

A1.child = B1
B1.sibling = B2
B1.child = C1
C1.sibling = C2
B2.child = C3
C3.sibling = C4

module.exports = A1


```

写遍历方法：

```
let rootFiber = require('./element')

const beginWork = (Fiber) => {
  console.log(`${Fiber.key} start`)
}

const completeUnitWork = (Fiber) => {
  console.log(`${Fiber.key} end`)
}

// 遍历函数
const performUnitOfWork = (Fiber) => {
  beginWork(Fiber)
  if (Fiber.child) {
    return Fiber.child
  }
  while (Fiber) {
    completeUnitWork(Fiber)
    if (Fiber.sibling) {
      return Fiber.sibling
    }
    Fiber = Fiber.return
  }
}

const workloop = (nextUnitOfWork) => {
  // 如果有待执行的执行单元则执行，返回下一个执行单元
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }
  if (!nextUnitOfWork) {
    console.log('reconciliation阶段结束')
  }
}

workloop(rootFiber)

```

打印结果：

```arduino
A1 start
B1 start
C1 start
C1 end // C1完成
C2 start
C2 end // C2完成
B1 end // B1完成
B2 start
C3 start
C3 end // C3完成
C4 start
C4 end // C4完成
B2 end // B2完成
A1 end // A1完成
reconciliation阶段结束

```

### 收集 effect list

知道了遍历方法之后，接下来需要做的工作就是在遍历过程中，收集所有节点的变更产出`effect list`，注意其中只包含了需要变更的节点。通过每个节点更新结束时向上归并`effect list`来收集任务结果，最后根节点的`effect list`里就记录了包括了所有需要变更的结果。

收集`effect list`的具体步骤为：

1. 如果当前节点需要更新，则打`tag`更新当前节点状态（props, state, context 等）
2. 为每个子节点创建 fiber。如果没有产生`child fiber`，则结束该节点，把`effect list`归并到`return`，把此节点的`sibling`节点作为下一个遍历节点；否则把`child`节点作为下一个遍历节点
3. 如果有剩余时间，则开始下一个节点，否则等下一次主线程空闲再开始下一个节点
4. 如果没有下一个节点了，进入`pendingCommit`状态，此时`effect list`收集完毕，结束。

收集`effect list`的遍历顺序如下所示：

![20240730172513](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240730172513.png)遍历子虚拟 DOM 元素数组，为每个虚拟 DOM 元素创建子 fiber：

```js
const reconcileChildren = (currentFiber, newChildren) => {
	let newChildIndex = 0;
	let prevSibling; // 上一个子fiber

	// 遍历子虚拟DOM元素数组，为每个虚拟DOM元素创建子fiber
	while (newChildIndex < newChildren.length) {
		let newChild = newChildren[newChildIndex];
		let tag;
		// 打tag，定义 fiber类型
		if (newChild.type === ELEMENT_TEXT) {
			// 这是文本节点
			tag = TAG_TEXT;
		} else if (typeof newChild.type === 'string') {
			// 如果type是字符串，则是原生DOM节点
			tag = TAG_HOST;
		}
		let newFiber = {
			tag,
			type: newChild.type,
			props: newChild.props,
			stateNode: null, // 还未创建DOM元素
			return: currentFiber, // 父亲fiber
			effectTag: INSERT, // 副作用标识，包括新增、删除、更新
			nextEffect: null, // 指向下一个fiber，effect list通过nextEffect指针进行连接
		};
		if (newFiber) {
			if (newChildIndex === 0) {
				currentFiber.child = newFiber; // child为大儿子
			} else {
				prevSibling.sibling = newFiber; // 让大儿子的sibling指向二儿子
			}
			prevSibling = newFiber;
		}
		newChildIndex++;
	}
};
```

定义一个方法收集此 fiber 节点下所有的副作用，并组成`effect list`。注意每个 fiber 有两个属性：

- firstEffect：指向第一个有副作用的子 fiber
- lastEffect：指向最后一个有副作用的子 fiber

中间的使用`nextEffect`做成一个单链表。

```js
// 在完成的时候要收集有副作用的fiber，组成effect list
const completeUnitOfWork = currentFiber => {
	// 后续遍历，儿子们完成之后，自己才能完成。最后会得到以上图中的链条结构。
	let returnFiber = currentFiber.return;
	if (returnFiber) {
		// 如果父亲fiber的firstEffect没有值，则将其指向当前fiber的firstEffect
		if (!returnFiber.firstEffect) {
			returnFiber.firstEffect = currentFiber.firstEffect;
		}
		// 如果当前fiber的lastEffect有值
		if (currentFiber.lastEffect) {
			if (returnFiber.lastEffect) {
				returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
			}
			returnFiber.lastEffect = currentFiber.lastEffect;
		}
		const effectTag = currentFiber.effectTag;
		if (effectTag) {
			// 说明有副作用
			// 每个fiber有两个属性：
			// 1）firstEffect：指向第一个有副作用的子fiber
			// 2）lastEffect：指向最后一个有副作用的子fiber
			// 中间的使用nextEffect做成一个单链表
			if (returnFiber.lastEffect) {
				returnFiber.lastEffect.nextEffect = currentFiber;
			} else {
				returnFiber.lastEffect = currentFiber;
			}
			returnFiber.lastEffect = currentFiber;
		}
	}
};
```

接下来定义一个递归函数，从根节点出发，把全部的 fiber 节点遍历一遍，产出最终全部的`effect list`：

```js
// 把该节点和子节点任务都执行完
const performUnitOfWork = currentFiber => {
	beginWork(currentFiber);
	if (currentFiber.child) {
		return currentFiber.child;
	}
	while (currentFiber) {
		completeUnitOfWork(currentFiber); // 让自己完成
		if (currentFiber.sibling) {
			// 有弟弟则返回弟弟
			return currentFiber.sibling;
		}
		currentFiber = currentFiber.return; // 没有弟弟，则找到父亲，让父亲完成，父亲会去找他的弟弟即叔叔
	}
};
```

### commit 阶段

commit 阶段需要将上阶段计算出来的需要处理的副作用一次性执行，此阶段不能暂停，否则会出现 UI 更新不连续的现象。此阶段需要根据`effect list`，将所有更新都 commit 到 DOM 树上。

### 根据一个 fiber 的 effect list 更新视图

根据一个 fiber 的`effect list`列表去更新视图（这里只列举了新增节点、删除节点、更新节点的三种操作）：

```js
const commitWork = currentFiber => {
	if (!currentFiber) return;
	let returnFiber = currentFiber.return;
	let returnDOM = returnFiber.stateNode; // 父节点元素
	if (currentFiber.effectTag === INSERT) {
		// 如果当前fiber的effectTag标识位INSERT，则代表其是需要插入的节点
		returnDOM.appendChild(currentFiber.stateNode);
	} else if (currentFiber.effectTag === DELETE) {
		// 如果当前fiber的effectTag标识位DELETE，则代表其是需要删除的节点
		returnDOM.removeChild(currentFiber.stateNode);
	} else if (currentFiber.effectTag === UPDATE) {
		// 如果当前fiber的effectTag标识位UPDATE，则代表其是需要更新的节点
		if (currentFiber.type === ELEMENT_TEXT) {
			if (currentFiber.alternate.props.text !== currentFiber.props.text) {
				currentFiber.stateNode.textContent = currentFiber.props.text;
			}
		}
	}
	currentFiber.effectTag = null;
};
```

### 根据全部 fiber 的 effect list 更新视图

写一个递归函数，从根节点出发，根据`effect list`完成全部更新：

```js
const commitRoot = () => {
	let currentFiber = workInProgressRoot.firstEffect;
	while (currentFiber) {
		commitWork(currentFiber);
		currentFiber = currentFiber.nextEffect;
	}
	currentRoot = workInProgressRoot; // 把当前渲染成功的根fiber赋给currentRoot
	workInProgressRoot = null;
};
```

### 完成视图更新

接下来定义循环执行工作，当计算完成每个 fiber 的`effect list`后，调用 commitRoot 完成视图更新：

```js
const workloop = deadline => {
	let shouldYield = false; // 是否需要让出控制权
	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1; // 如果执行完任务后，剩余时间小于1ms，则需要让出控制权给浏览器
	}
	if (!nextUnitOfWork && workInProgressRoot) {
		console.log('render阶段结束');
		commitRoot(); // 没有下一个任务了，根据effect list结果批量更新视图
	}
	// 请求浏览器进行再次调度
	requestIdleCallback(workloop, { timeout: 1000 });
};
```

到这时，已经根据收集到的变更信息，完成了视图的刷新操作。

[原文](https://juejin.cn/post/6943896410987659277#heading-10)
