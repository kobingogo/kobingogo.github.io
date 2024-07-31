---
title: Vue中的虚拟DOM与Diff算法
date: 2024-03-31 19:58:07
tags: vue
categories: vue
excerpt:
---

## 虚拟 DOM

虚拟 DOM (Virtual DOM，简称 VDOM) 是一种编程概念，意为将目标所需的 UI 通过数据结构“虚拟”地表示出来，保存在内存中，然后将真实的`DOM`与之保持同步。具体来说，`虚拟 DOM` 是由一系列的 JavaScript 对象组成的树状结构，每个对象代表着一个`DOM`元素，包括元素的标签名、属性、子节点等信息。`虚拟 DOM` 中的每个节点都是一个 JavaScript 对象，它们可以轻松地被创建、更新和销毁，而不涉及到实际的`DOM`操作。

### 主要作用

`虚拟 DOM` 的主要作用是在数据发生变化时，通过与上一次渲染的`虚拟 DOM` 进行对比，找出发生变化的部分，并最小化地更新`实际 DOM`。这种方式可以减少`实际 DOM` 操作的次数，从而提高页面渲染的性能和效率。  
总的来说，`虚拟 DOM` 是一种用 JavaScript 对象模拟`真实 DOM` 结构和状态的技术，它通过在内存中操作`虚拟 DOM 树`来减少`实际 DOM` 操作，从而提高页面的性能和用户体验。

## 虚拟 DOM 树

顾名思义，也就是一个虚拟 DOM 作为根节点，包含有一个或多个的子虚拟 DOM。

## Diff

在 Vue 3 中，diff（差异比较）是指在进行虚拟 DOM 更新时，对比新旧虚拟 DOM 树的差异，然后只对实际发生变化的部分进行更新，以尽可能地减少对真实 DOM 的操作，提高页面的性能和效率。`diff`整体策略为：深度优先，同层比较。也就是说，比较只会在同层级进行, 不会跨层级比较；比较的过程中，循环从两边向中间收拢。

### 流程解析

Diff 算法的实现流程可以概括为以下几个步骤：

1.  **比较根节点：** 首先，对比新旧虚拟 DOM 树的根节点，判断它们是否相同。
2.  **逐层对比子节点：** 如果根节点相同，则逐层对比子节点。

    - 比较子节点类型：

      - 如果节点类型不同，则直接替换整个节点。
      - 如果节点类型相同，继续对比节点的属性和事件。

    - 对比子节点列表：

      - 通过双指针法对比新旧节点列表，查找相同位置的节点。
      - 如果节点相同，进行递归对比子节点。
      - 如果节点不同，根据情况执行插入、删除或移动节点的操作。

3.  **处理新增、删除和移动的节点：**

    - 如果新节点列表中存在旧节点列表中没有的节点，执行新增操作。
    - 如果旧节点列表中存在新节点列表中没有的节点，执行删除操作。
    - 如果新旧节点列表中都存在相同的节点，但顺序不同，执行移动节点的操作。

4.  **更新节点属性和事件：**

    - 如果节点相同但属性或事件发生了变化，更新节点的属性和事件。

5.  **递归对比子节点：**

    - 如果节点类型相同且是容器节点（例如 div、ul 等），则递归对比子节点。

## 源码解析

在源码中 patchVnode 是 diff 发生的地方，下面是 patchVnode 的源码：

```js
function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
	// 如果新旧节点一致，什么都不做
	if (oldVnode === vnode) {
		return;
	}

	// 让vnode.el引用到现在的真实dom，当el修改时，vnode.el会同步变化
	const elm = (vnode.elm = oldVnode.elm);

	// 异步占位符
	if (isTrue(oldVnode.isAsyncPlaceholder)) {
		if (isDef(vnode.asyncFactory.resolved)) {
			hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
		} else {
			vnode.isAsyncPlaceholder = true;
		}
		return;
	}
	// 如果新旧都是静态节点，并且具有相同的key
	// 当vnode是克隆节点或是v-once指令控制的节点时，只需要把oldVnode.elm和oldVnode.child都复制到vnode上
	// 也不用再有其他操作
	if (
		isTrue(vnode.isStatic) &&
		isTrue(oldVnode.isStatic) &&
		vnode.key === oldVnode.key &&
		(isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
	) {
		vnode.componentInstance = oldVnode.componentInstance;
		return;
	}

	let i;
	const data = vnode.data;
	if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
		i(oldVnode, vnode);
	}

	const oldCh = oldVnode.children;
	const ch = vnode.children;
	if (isDef(data) && isPatchable(vnode)) {
		for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
		if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode);
	}
	// 如果vnode不是文本节点或者注释节点
	if (isUndef(vnode.text)) {
		// 并且都有子节点
		if (isDef(oldCh) && isDef(ch)) {
			// 并且子节点不完全一致，则调用updateChildren
			if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);

			// 如果只有新的vnode有子节点
		} else if (isDef(ch)) {
			if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '');
			// elm已经引用了老的dom节点，在老的dom节点上添加子节点
			addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);

			// 如果新vnode没有子节点，而vnode有子节点，直接删除老的oldCh
		} else if (isDef(oldCh)) {
			removeVnodes(elm, oldCh, 0, oldCh.length - 1);

			// 如果老节点是文本节点
		} else if (isDef(oldVnode.text)) {
			nodeOps.setTextContent(elm, '');
		}

		// 如果新vnode和老vnode是文本节点或注释节点
		// 但是vnode.text != oldVnode.text时，只需要更新vnode.elm的文本内容就可以
	} else if (oldVnode.text !== vnode.text) {
		nodeOps.setTextContent(elm, vnode.text);
	}
	if (isDef(data)) {
		if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode);
	}
}
```

以上代码主要就是用于比较新旧虚拟 DOM 节点并进行更新。让我逐步解释这个函数的实现：

1.  **判断是否需要更新：** 首先，函数会比较新旧虚拟 DOM 节点是否相同，如果相同则直接返回，无需进行后续操作。
2.  **获取旧节点的真实 DOM 引用：** 通过 `elm = vnode.elm = oldVnode.elm` 将新节点 `vnode` 的真实 DOM 引用指向旧节点的真实 DOM。
3.  **处理异步占位符：** 如果旧节点是异步占位符（`asyncPlaceholder`），并且新节点的异步工厂已经解析，则通过 `hydrate` 函数进行同步操作；否则，将新节点标记为异步占位符并返回。
4.  **处理静态节点：** 如果新旧节点都是静态节点（`isStatic` 为真），并且具有相同的 key，则将新节点的组件实例引用指向旧节点的组件实例。
5.  **触发 prepatch 钩子：** 如果新节点的数据对象中定义了 `hook` 并且 `prepatch` 钩子存在，则执行该钩子函数，用于预处理新旧节点之间的差异。
6.  **更新节点的属性和事件：** 如果新节点的数据对象中定义了 `hook` 并且 `update` 钩子存在，则执行该钩子函数，用于更新节点的属性和事件。
7.  **处理子节点：** 如果新旧节点都有子节点，则比较它们之间的差异并进行更新，调用 `updateChildren` 函数。如果只有新节点有子节点，则将新节点的子节点添加到旧节点上。如果只有旧节点有子节点，则删除旧节点的子节点。如果旧节点是文本节点，则清空其内容。
8.  **更新文本内容：** 如果新旧节点都是文本节点或注释节点，并且它们的文本内容不同，则更新新节点的文本内容。
9.  **触发 postpatch 钩子：** 如果新节点的数据对象中定义了 `hook` 并且 `postpatch` 钩子存在，则执行该钩子函数，用于处理节点更新后的操作。

### Diff 算法示例

下面是一个详细的例子，假设有以下两个虚拟 DOM 树，我们将对它们进行 diff 算法的比较：

#### 旧的虚拟 DOM 树：

```json
{
	"type": "div",
	"props": { "id": "container" },
	"children": [
		{ "type": "p", "props": { "class": "text" }, "children": ["old Dom"] },
		{ "type": "button", "props": { "disabled": true }, "children": ["click"] }
	]
}
```

#### 新的虚拟 DOM 树：

```json
{
	"type": "div",
	"props": { "id": "container" },
	"children": [
		{ "type": "p", "props": { "class": "text" }, "children": ["new DOM"] },
		{ "type": "button", "props": { "disabled": false }, "children": ["click"] },
		{ "type": "span", "props": { "class": "msg" }, "children": ["msg"] }
	]
}
```

**Diff 算法执行：**

1.  比较根节点：根节点相同，继续比较子节点。
2.  比较子节点：

    - 第一个子节点类型相同，但内容不同，更新内容为 'new DOM'。
    - 第二个子节点相同，属性发生变化，更新 disabled 属性为 false。
    - 第三个子节点是新增节点，执行插入操作。

3.  更新节点属性和事件：第二个子节点的属性发生变化，更新 disabled 属性。
4.  递归对比子节点：针对新增的 span 节点，继续递归对比其子节点。

**最终结果：**

```js
{
  type: 'div',
  props: { id: 'container' },
  children: [
    { type: 'p', props: { class: 'text' }, children: ['new DOM'] },
    { type: 'button', props: { disabled: false }, children: ['click'] },
     { type: 'span', props: { class: 'msg' }, children: ['msg'] }
  ]
}

```

## 结语

总的来说，Diff 算法的核心思想是 Diff 就是将新老虚拟 DOM 的不同点找到并生成一个补丁，并根据这个补丁生成更新操作，以最小化对实际 DOM 的操作，提高页面渲染的性能和效率。通过深度优先、同层比较的策略，Diff 算法能够高效地处理虚拟 DOM 树的更新，使得页面在数据变化时能够快速响应并更新对应的视图。
