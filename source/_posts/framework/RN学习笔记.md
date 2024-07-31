---
title: React Native学习笔记
date: 2023-08-01 16:48:35
tags: React Native
categories: React
excerpt: React Native 是 Facebook 于 2015 年推出的一款开源 JavaScript 框架，旨在让开发者使用 JavaScript 和 React 创建跨平台的移动应用。它结合了 React 的开发效率与 Native 应用的优良用户体验，通过 Virtual DOM 实现了真正意义上的“Learn Once, Write Anywhere”。
---

## React Native 介绍

### 什么是 React Native？

React Native 是 Facebook 于 2015 年推出的一款开源 JavaScript 框架，旨在让开发者使用 JavaScript 和 React 创建跨平台的移动应用。它结合了 React 的开发效率与 Native 应用的优良用户体验，通过 Virtual DOM 实现了真正意义上的“Learn Once, Write Anywhere”。

### React Native 的特点

#### **跨平台**

使用 Virtual DOM 技术，只需编写一套代码，即可生成适用于不同平台的应用，极大地提高了开发效率，并降低了维护成本。

#### **学习门槛低**

JavaScript 的学习成本相对较低，语法灵活。Web 开发者可以利用现有经验快速上手 React Native，若熟悉 React，即可快速掌握 React Native。

#### **原生应用体验**

React Native 提供的组件是对原生 API 的封装，尽管使用 JavaScript 编写代码，最终调用的还是原生 API 和 UI 组件，因此在体验和性能上接近原生应用。

#### **热更新**

React Native 应用支持热更新，开发者只需更新 bundle 文件，而无需用户重新下载整个应用即可实现功能迭代或 bug 修复。不过，App Store 对调用私有 API、修改原生代码和改变应用行为的热更新有一定限制。

## React Native 原理

### **JavaScriptCore**

JavaScriptCore 是 React Native 使用的 JavaScript 引擎，负责解析和执行 JS 代码。React Native 利用 JavaScriptCore 的能力，通过 Bridge 与原生代码进行交互，实现 UI 渲染和功能调用。

**JS Engine**

React Native 需要一个 JS 的运行环境，因为 React Native 会把应用的 JS 代码编译成一个 JS 文件（x x.bundle），React Native 框架的目标就是解释运行这个 JS 脚本文件，如果是 Native 拓展的 API，则直接通过 bridge 调用 Native 方法，最基础的比如绘制 UI 界面，映射 Virtual DOM 到真实的 UI 组件中。

![20240731165137](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165137.png)

绿色的是我们应用开发的部分，我们写的代码基本上都是在这一层。

蓝色代表公用的跨平台的代码和工具引擎，一般我们不会动蓝色部分的代码。

黄色代表平台相关的 bridge 代码，做定制化的时候会添加修改代码。

红色代表系统平台的功能，另外红色上面有一个虚线，表示所有平台相关的东西都通过 bridge 隔离开来了，红色部分是独立于 React Native 的。

**脱离 React Native，纯原生端是如何与 JS 交互的？来看下 iOS 里面是如何实现的。**

在 Native 创建一个 JS 上下文：

```
// 创建一个ctx的JS上下文
JSContent *ctx = [[JSContent alloc] init];
// 创建一个变量name
[ctx evaluateScript:@"var name = 'Hellen'"];
// 创建一个方法
[ctx evaluateScript:@"var hello = function(name) { return 'hello ' + name }"];

```

Native 调用 JavaScript 方法：

```
// 通过ctx上下文对象，获取到hello方法
JSValue *helloFUnction = ctx[@"hello"];
// 运行js方法
JSValue *greetings = [helloFunction callWithArguments:@[@"bytedancers"]; // hello bytedancers

```

所以，JavaScript 代码只要将变量暴露在 JS 上下文全局，Native 就能获取到，并运行 JS 的代码。

JavaScript 调用 Native，首先需要在 Native 端，将一个变量暴露在 JS 上下文全局，在 JavaScript 全局变量里面就能获取到并执行这个方法：

```
ctx[@"createdByNative"] = ^(NSString *name) {
    // do something
    return someResult
}

```

React Native 同样借助 JS Engine 的能力，基于 JavaScriptCore 来执行 JS，但是是通过 Bridge 来进行交互的，JS 不会直接引用 Native 层的对象实例，Native 也不会直接引用 JS 层的对象实例(在 React Native 里所有 Native 和 JS 互调都是通过 Bridge 层的几个最基础的方法衔接的)。

**Hermes Engine**

Hermes 是 Facebook 在 2019 年发布的轻量级 JavaScript 引擎，专为 React Native 优化，特别是提升了 Android 平台上的启动速度、内存占用和应用大小。

**Hermes vs JavaScriptCore vs V8**

经过官方的数据验证，Faceback 团队提出的关键性指标相较于原先的 JavaScriptCore 方案都有了显著提高。首先，是产物文件的大小方面，RN 所依赖的必要 so 库，Hermes 比 JavaScriptCore 减少了约 16%，V8 则要远大于 Hermes 和 JavaScriptCore。

![20240731165309](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165309.png)

### Bridge

React Native 中的 Bridge 用于连接 JavaScript 和原生代码。所有的本地存储、图片资源访问、图形绘制、网络访问等功能，都是通过 Bridge 封装成 JS 接口提供给 JavaScript 使用。Bridge 隔离了 JS 和原生代码，确保两者之间的通信是安全且高效的。

**React Native 中的 Native 模块如何暴露给 JS？**

我们知道，React Native 可以调用 Native 侧的方法，并且只要 Native 侧只要遵循一定的规则，是可以将方法暴露给 JS 调用的：

```
// iOS端原生代码
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface NativeLogModule : NSObject<RCTBridgeModule>

@end

#import "NativeLogBridge.h"

@implementation NativeLogModule
RCT_EXPORT_MODULE()
RCT_EXPORT_METHOD(nativeLog:(id)obj) {
  NSLog(@"%@",obj);
}
@end

// JS端调用
import { NativeModules } from 'react-native';
NativeModules.NativeLogModule.nativeLog('从JS侧来的消息');

```

可以看到，上面的代码中使用了**RCT_EXPORT_MODULE()** 宏将 Native 类以 module 的形式暴露给了 JS，然后使用了**RCT_EXPORT_METHOD**将 Native 的方法暴露给 JS，最后在 JS 侧直接引用一个模块，便可以直接调用暴露的方法与 Native 通信。

**React Native 是如何实现 Native <---> JS 通信的呢？**

上面我们有提到 JS Engine，Native 可以把原生方法暴露到全局，同样的 JS 也可以把方法暴露给 Native，但是 React Native 并没有这样做，原因之一是这样会导致大量的全局变量污染，所以为了规范这个通信过程，React Native 自己实现了 Bridge。

**Native 调用 JS**

在 React Native 里面，JS 的方法可以通过 `global.batchedBridge.callFunctionReturnFlushedQueue` 这个方法进行调用，所以在 Native 侧，只需将 React Native 里面的 global.batchedBridge 对象中的方法和 Native 侧的 JSIExecutor 方法进行绑定（本质上 Native 指针指向 JS 函数）

```ini
JSIExecutor::callFunctionReturnFlushedQueue_ = global.batchedBridge.callFunctionReturnFlushedQueue
```

Native 侧的 callFunctionReturnFlushedQueue 主要做了这样的事情：

- 通过 moduleid 和 methodid 完成方法的调用，通过这两个参数可以找到 JS 侧定义的方法模块。

**JS 调用 Native**

当 JS 调用 Native 模块的时候，会调用一个 Native 暴露出来的全局方法：nativeFlushQueueImmediate，并通过传入要调用的 moduleName 、methodName、callback 参数给这个方法，然后这个方法再通知给 Native 侧找到相应的模块并执行。

### Virtual DOM

在认识 Virtual DOM 之前，我们先来看看浏览器的工作原理：

- 浏览器有一套完整的 UI 控件，样式和功能都是按照 HTML 标准实现的。

- 浏览器能够解析 HTML 和 CSS，通过 HTML 告诉浏览器需要生成什么类型的 UI 控件，并通过 CSS 样式文件来描述该 UI 控件的外观（大小，背景，布局等等...）。

- 浏览器的主要作用就是解析 HTML 和 CSS 来形成渲染树，并通过 Render Engine 将页面渲染出来。

了解浏览器的工作原理之后，Virtual DOM 是如何工作的？

- 首先 Virtual DOM 和真实 DOM 都有一个共同点：都是用来描述页面 UI 控件。

- Virtual DOM 具有平台无关性：它描述的 UI 控件只是数据结构层的，具体渲染工作是交给了原生渲染引擎（浏览器、iOS、Android）去处理。

**React (Native)的 Virtual DOM**

在 React Native 里面，是如何把 Virtual DOM 渲染成真实的 UI 的呢？

首先，在 React 里面，用来表示 dom 属性的对象有以下关键属性：

```
var ele = {
    ...
    type: type, // 元素的类型
    key: key, // 元素key标示
    ref: ref, // 元素的引用
    props: props, // 元素的参数，包含children
    ...
}

// example 1
<div>hello</div>
// 会被描述为

{type: 'div',
    props: {
        children: ['hello']
    }
}

// example 2
<CustomerComponents />
// 会被描述为
{
    type: CustomerComponents
}

```

React 里面的 Virtual DOM 把真实 DOM 分为了以下几种类型：

- 原子类型

  - 类型为字符串，结构上不可再分解，渲染由平台底层支持。
  - 在浏览器端：原子类型表示为浏览器支持的原始标签，例如 div、ul、li、p、a、span 等等。
  - 在 Native 端：原子类型表示为 Native 端的各种基础 UI 组件，例如 RCTText、RCTView 等等

- 组合类型

  - 类型为函数构造器，它给我们提供了一种自定义元素 UI 和行为的能力，当渲染器遇到组合类型的元素时，会使用它的构造器创建一个实例并运行 render 方法得到一个新元素（原子类型，或者组合类型），然后再拿该元素继续进行渲染或者分解。
  - 用户自定义的组件元素。

**渲染器**

在浏览器端和 Native 端，React (Native)中 Virtual DOM 用来渲染真实 DOM 的渲染器是不一样的：

在浏览器端：

![20240731165723](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165723.png)

```// 文本类型渲染器工作原理
mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context
) {
    // 获取到DOM对象
    var lazyTree = DOMLazyTree(ownerDocument.createDocumentFragment());
    // 判断是不是文本类型
    if (this._stringText) {
        DOMLazyTree.queueChild(
            lazyTree,
            DOMLazyTree(ownerDocument.createTextNode(this._stringText))
        );
    }
    return lazyTree
}

// 原子类型渲染器工作原理
mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context
) {
    var ownerDocument = hostContainerInfo._ownerDocument;
    // 创建原子type类型dom
    var el =
ownerDocument.createElement(this._currentElement.type)
    ...

    // 创建子节点
    this._createInitialChildren(transaction, props, context, lazyTree);
    ...
}

// 组合类型渲染器工作原理
mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context
) {

    // 运行构造器，获取到组件实例

    var inst = this._constructComponent({
        doConstruct,
        publicProps,
        publicContext,
        updateQueue,
    });

    ...

    // 获取到虚拟dom
    if (renderedElement === undefined) {
      renderedElement = this._renderValidatedComponent();
    }

    ...

    // 获取到分解后的组件类型（ReactXXXComponent,可以看作是三种组件类型的集合）
    this._renderedComponent = this._instantiateReactComponent(
      renderedElement
    );
    // 最后通过ReactReconciler.mountComponent间接的调用不同类型的渲染器的mountComponent方法获取到生产的node节点，并返回。
    var markup = ReactReconciler.mountComponent(
      this._renderedComponent,
      rootID,
      transaction,
      this._processChildContext(context)
    );

    return markup
}

```

看以下代码结构：

![20240731165823](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165823.png)

![20240731165832](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165832.png)

在 Native 端：

![20240731165846](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165846.png)

在浏览器里面，JavaScript 可以调用 DOM API 去完成创建 UI 的工作，而在 React Native 里面，是通过 UI Manager 来创建视图的，基于 Virtual DOM ，React Native 把不同平台创建视图的逻辑封装了一层，不同平台通过 Bridge 调用 UI Manager 来创建不同的 Native 视图。

![20240731165857](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165857.png)

**三个线程**

在 React Native 里面，真正有三个重要的线程在执行，他们分别是 Shadow thread、UI thread 和 JS thread。

**JS thread：** 其实是 JavaScript 线程，负责 JS 和原生代码的交互线程，因为 JS 是单线程模型，所以需要一个单独的线程来驱动，并且 JS 和 Native 交互是异步的。

**Shadow thread**: 这个线程是负责 Native 布局，提供给 yoga 引擎使用。

**UI thread**：这个可以看作是主线程，可以看作是 UI Manager 线程，负责页面的交互和控件绘制逻辑。

### 热更新

React Native 的 bundle 文件是 JS 逻辑代码与 React Native 运行时的集合，应用启动时会获取最新的 bundle 文件，从而实现热更新。开发者可以通过云端更新 bundle 文件，实现无感知的功能更新和 bug 修复。

![20240731165934](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731165934.png)

**增量更新（拆包）**

对于 React Native 的代码打包之后只会生成一个 Bundle 文件，这里面包含了基础业务逻辑、React Native 的基础库类，所以我们可以把一个包拆分成：一个基础包+ n 个业务包，其中基础包是不变的，这就是 runtime，业务包就是具体的业务，后面如果有更新，也只需要再打出一个业务包就行。

目前行业的解决方案有 facebook 官方提供的 metro bundle：[facebook.github.io/metro/](https://facebook.github.io/metro/)

![20240731170019](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20240731170019.png)

## 总结 & 拓展

### React Native 的不足

由于 React Native 和原生交互依赖的只有一个 Bridge，而且 JS 和 Native 交互是异步的，所以对需要和 Native 大量实时交互的功能可能会有性能上的不足，比如动画效率，**性能是不如原生的**。

React Native 始终是依赖原生的能力，所以摆脱不了对原生的依赖，相对 Flutter 的自己来画 UI 来说，React Native 显得有些尴尬。

### React Native 的未来

**JSI 是什么？**

在 RN 中， JSI 是 JavaScript Interface 的缩写，JSI 是 React Native 未来发展的一个关键技术，JSI 是一个轻量级的通用的 API 框架，可以在任何 JavaScript 虚拟机中使用，通过 JSI，JavaScript 和 Native 代码可以直接交互，无需通过 JSON 序列化传递消息，从而消除了 Bridge 的性能瓶颈

JSI 是用 C++写的，用于取代原先的 bridge，提高通信效率，已在 RN 的 `0.58` 中实现。

**JSI 能做什么？**

JSI 本身不是 React Native 的一部分——它是一个统一的、轻量的、通用适用于任何(理论上) JavaScript 虚拟机的接口层。

当把 JSI 加入到新架构中后，它使得一些真正重要的改进成为可能。

第一个改进很直观——javaScriptCore 现在可以更容易地被替换成其它引擎，其它选项包括微软的 ChakraCore 和谷歌的 V8。

第二个改进，可以说是整个新架构的基石，是通过使用 JSI，JavaScript 可以持有对 C++ 宿主对象的引用，并且对它进行调用。

这意味着：JavaScript 和 Native 之间真正地相互知晓，并且不再需要通过 JSON 序列化传递消息，这会消除 Bridge 的阻塞问题。

### 和其他跨端技术比较

**Flutter vs React Native**

首先来简单了解下 Flutter 和 React Native 的背景，Flutter 是由谷歌开发的软件开发工具包（SDK）。它可以帮助开发人员使用单一代码库构建 iOS 和 Android 应用程序。React Native 与 Flutter 具有相同的目的，但方式不同。它是由 Facebook 建立的，基于 React 用于创建移动应用程序，而不会影响应用程序的外观和感觉。

**开发体验**

React Native 延续了 React 的开发风格，支持 CSS-in-JS 和 React Hooks。Flutter 则将所有 UI 元素封装为 Widget，虽然提供了丰富的组件库，但代码嵌套可能显得复杂。

**状态管理**

两者的状态管理方式类似，都支持获取和设置组件状态来更新 UI。

**产物**

React Native 产生的是 bundle 文件，实际上就是 JS bundle 文件；而 Flutter 编译后 Android 产生的主要是一些应用程序指令段、数据段，虚拟机数据段、指令段，iOS 则是 App.framework，其实也是一些原生的数据集。

**原生能力 & 性能**

React Native 由于需要通过 Bridge 与原生代码交互，因此性能稍逊于 Flutter，但在灵活性上略有优势。

总的来说，React Native 和 Flutter 各有所长，开发者可根据项目需求选择合适的框架。
