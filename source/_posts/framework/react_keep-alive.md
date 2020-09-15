---
title: 在 React 中实现 keep alive
date: 2020-09-15 23:25:43
tags:
  - react
  - keep alice
categories: react
---

本文介绍一种在react中实现Vue的keep alive功能的方案。

<!-- more -->

### 什么是 keep alive

在 Vue 中，我们可以使用 keep-alive 包裹一个动态组件，从而缓存不活跃的实例，而不是直接销毁他们：

```html
<keep-alive>
  <component :is="view"></component>
</keep-alive>
```

这对于某些路由切换等场景非常好用，例如，如果我们需要实现一个列表页和详情页，但在用户从详情页返回列表的时候，我们不希望重新请求接口获取，也不希望重置列表的过滤、排序等条件，那这时就可以对列表页的组件用 keep-alive 包裹一下，这样，当路由切换时，Vue 会将这个组件“失活”并缓存起来，而不是直接卸载掉。

### 最简单的方案

而在 React 中，其实一直以来都没有官方的 keep alive 解决方案，大部分开发者可能都会直接使用 display: none 来将 DOM 隐藏：
```jsx
<div style={shouldHide ? {display: 'none'} : {}}>
  <Foo/>
</div>
```

但这种方案其实只是在“视觉上”将元素隐藏起来了，并没有真正的移除，那有没有可能把 DOM 树真的移除掉，同时又让组件不被销毁呢？

### Portal实现

> Portal 提供了一种将子节点渲染到存在于父组件以外的 DOM 节点的优秀的方案。

这是 React [官方文档](https://zh-hans.reactjs.org/docs/portals.html)上对 Portal 特性的介绍，值得注意的是，这里只是说“父组件以外的 DOM 节点”，但没有要求这个 DOM 节点是真的在页面上，还是只是存在于内存中。 因此，我们可以先通过 document.createElement 在内存中创建一个元素，然后再通过 React.createPoral 把 React 子节点渲染到这个元素上，这样就实现了“空渲染”。

```jsx
const targetElement = document.createElement('div')
ReactDOM.createPortal(child, targetElement)
```

基于这种方案，我们可以进一步封装出一个 Conditional 组件，从而实现通用性的条件渲染逻辑：

```jsx
export const Conditional = props => {
  const [targetElement] = useState(() => document.createElement('div'))
  const containerRef = useRef()
  useLayoutEffect(() => {
    if (props.active) {
      containerRef.current.appendChild(targetElement)
    } else {
      try {
        containerRef.current.removeChild(targetElement)
      } catch (e) {}
    }
  }, [props.active])
  return (
    <>
      <div ref={containerRef} />
      {ReactDOM.createPortal(props.children, targetElement)}
    </>
  )
}
```

首先，我们创建了一个 targetElement ，并且通过 createPortal 将 children 渲染到 targetElement 。 然后，我们会创建一个容器 div 元素，并且通过 containerRef 拿到它的引用。 最后，当 active 为 true 时，我们会把 targetElement 手动添加到 containerRef.current 的内部，反之，则会从其内部移除掉 targetElement 。 实际使用的方式如下：

```jsx
<Conditional active={!shouldHide}>
  <Foo/>
</Conditional>
```

### 懒加载

细心的读者可能会发现，目前我们的 Conditional 组件还有一点小小的瑕疵：当组件初次渲染时，不论当前的 active 是 true 还是 false ， Conditional 组件都会将 props.children 渲染。这对大型应用可能会带来非常明显的性能问题，所以，我们可以为其增加“懒加载”的特性：

```jsx
export const Conditional = props => {
  const [targetElement] = useState(() => document.createElement('div'))
  const containerRef = useRef()

  // 增加一个 ref 记录组件是否“被激活过”
  const activatedRef = useRef(false)
  activatedRef.current = activatedRef.current || props.active

  useLayoutEffect(() => {
    if (props.active) {
      containerRef.current.appendChild(targetElement)
    } else {
      try {
        containerRef.current.removeChild(targetElement)
      } catch (e) {}
    }
  }, [props.active])
  return (
    <>
      <div ref={containerRef} />
      {activatedRef.current && ( // 如果“被激活过”，才渲染 children
        ReactDOM.createPortal(props.children, targetElement)
      )}
    </>
  )
}
```

### 一些遗憾

不得不承认的是，基于 Portal 方案的 Conditional 组件并不能包治百病，和 Vue 的 keep-alive 相比，也存在不少缺憾：

1. 需要手动控制 active ，不能直接基于子组件销毁/创建的生命周期事件
2. 缺少失活/激活的生命周期时间，子组件无法感知自己是不是被缓存起来了
3. 依赖了 ReactDOM ，对 SSR 不够友好


原文转载自知乎：[在 React 中实现 keep alive](https://zhuanlan.zhihu.com/p/214166951)
