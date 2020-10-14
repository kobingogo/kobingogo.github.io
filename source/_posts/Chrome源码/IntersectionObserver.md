---
title: IntersectionObserver原理分析
date: 2020-10-14 16:35:29
tags: IntersectionObserver
categories: 浏览器
---

在介绍`IntersectionObserver`的时候曾提到过这个接口目前使用的最大问题就是浏览器的兼容性问题。所以，我们平时在使用的时候切记不要忘记判断这个API在我们的宿主环境中是否存在。如果不存在，我们可以通过引入其`polyfill`来作部分功能的兼容。


`IntersectionObserver-polyfill`是`w3c`官方创建的[https://github.com/w3c/IntersectionObserver](https://github.com/w3c/IntersectionObserver)。我们可以在浏览器不支持`IntersectionObserver`的情况下引入它。当然，你也可以直接引入它，其内部也只会在浏览器不支持其的情况下进行`polyfill`。

<!-- more -->


`IntersectionObserver`的使用前面做了简单的叙述

```js
const target = document.getElementById('target')

const observer = new IntersectionObserver((entries) => {
  const [entry] = entries

  if (entry.isIntersecting) {
    console.log('元素曝光了')
  }
})

observer.observe(target)
```


下面我们就从其`polyfill`的源码中来了解其基本原理

IntersectionObserver
--------------------

```js
function IntersectionObserver(callback, opt_options) {

      var options = opt_options || {};

      if (typeof callback != 'function') {
        throw new Error('callback must be a function');
      }

      if (options.root && options.root.nodeType != 1) {
        throw new Error('root must be an Element');
      }

      // Binds and throttles `this._checkForIntersections`.
      this._checkForIntersections = throttle(
          this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

      // Private properties.
      this._callback = callback;
      this._observationTargets = [];
      this._queuedEntries = [];
      this._rootMarginValues = this._parseRootMargin(options.rootMargin);

      // Public properties.
      this.thresholds = this._initThresholds(options.threshold);
      this.root = options.root || null;
      this.rootMargin = this._rootMarginValues.map(function(margin) {
        return margin.value + margin.unit;
      }).join(' ');
    }
```


`IntersectionObserver`是一个构造函数。当我们创建其实例的时候，可以传递两个参数。第一个参数必须是一个函数，否则会抛出一个错误。第二个参数是一个可选的对象，唯一的要求就是我们指定的`root`属性的值必须是一个`Element`。构造函数会在创建实例的时候添加很多私有属性。有些属性后面用到的时候会讲解，这里我们先看几个用来保存我们传递的选项的属性。

在创建`IntersectionObserver`实例的时候，我们可以在第二个参数对象中传入以下几个属性

```js
{
  root: Element,
  rootMargin: string,
  threshold: number | number[]
}
```


在构造函数中首先会调用私有方法解析我们传入的`rootMargin`属性，下面是这个方法的基本实现

```js
IntersectionObserver.prototype._parseRootMargin = function(opt_rootMargin) {
  var marginString = opt_rootMargin || '0px';
  var margins = marginString.split(/\s+/).map(function(margin) {
    var parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
    if (!parts) {
      throw new Error('rootMargin must be specified in pixels or percent');
    }
    return {value: parseFloat(parts[1]), unit: parts[2]};
  });

  // Handles shorthand.
  margins[1] = margins[1] || margins[0];
  margins[2] = margins[2] || margins[0];
  margins[3] = margins[3] || margins[1];

  return margins;
}
```


这个方法就是将我们传入的`rootMargin`解析成数组，这个数组包含四个元素代表的分别是`上，右，下，左`边距的值和单位。`rootMargin`设置的时候和`css margin`设置的方式一样，可以传入`1,2,3,4`个值。比如

    rootMargin: '10px' --> _parseRootMargin(rootMargin) --> [{value: 10, unit: 'px'},{value: 10, unit: 'px'},{value: 10, unit: 'px'},{value: 10, unit: 'px'}]

    // 传入2，3，4个值的解析规则和css margin的解析规则其实是一样的



解析完`rootMargin`后，私有属性`this._rootMarginValues`就是如下形式

    [
      {value: 10, unit: 'px'},
      {value: 10, unit: 'px'},
      {value: 10, unit: 'px'},
      {value: 10, unit: 'px'}
    ]


后面又将其转化为`this.rootMargin`的值

```js
this.rootMargin = this._rootMarginValues.map(function(margin) {
    return margin.value + margin.unit;
  }).join(' ');
```

所以，无论我们传入的`rootMargin`是什么样的形式，构造函数执行结束后都会变成`10px 10px 10px 10px`的形式。

在构造函数中还有一个步骤是初始化我们传入的`threshold`。我们知道，`threshold`可以是一个数字，也可以是由数字组成的数组。构造函数执行的时候，会统一将其转换成数组的形式并保存在`this.thresholds`属性中

```js
this.thresholds = this._initThresholds(options.threshold);
```


下面是解析`threshold`的`_initThreshold`方法的实现

```js
IntersectionObserver.prototype._initThresholds = function(opt_threshold) {
  var threshold = opt_threshold || [0];
  if (!Array.isArray(threshold)) threshold = [threshold];

  return threshold.sort().filter(function(t, i, a) {
    if (typeof t != 'number' || isNaN(t) || t < 0 || t > 1) {
      throw new Error('threshold must be a number between 0 and 1 inclusively');
    }
    return t !== a[i - 1];
  });
}
```


这个方法接收我们传入的`options.threshold`选项的值作为参数，如果我们没有传入这个值，则默认为0。如果我们传入的不是一个数组，就将其转化为数组。下面的`filter`是对一个数组进行去重的方法，即如果我们对`threshold`传入了重复的值，只会取一个。而且`threshold`中的每一个值都必须是数字，并且在`[0, 1]`之间。所以，`this.threshold`最终保存的值是如下形式

    this.threshold = [0]
    this.threshold = [0.25, 0.5, 1]


上面就是`IntersectionObserver`构造函数大致的执行过程，实例创建好后，我们会调用`observe`方法监测元素。下面我们看一下`observe`方法的具体实现

### observe

`observe`方法定义在`IntersectionObserver.prototype`上

```js
IntersectionObserver.prototype.observe = function(target) {
  var isTargetAlreadyObserved = this._observationTargets.some(function(item) {
    return item.element == target;
  });

  if (isTargetAlreadyObserved) {
    return;
  }

  if (!(target && target.nodeType == 1)) {
    throw new Error('target must be an Element');
  }

  this._registerInstance();
  this._observationTargets.push({element: target, entry: null});
  this._monitorIntersections();
  this._checkForIntersections();
}
```



接收的参数就是我们需要监测的dom元素。首先会遍历`this._observationTargets`，这个属性是一个数组，它也是在初始化`IntersectionObserver`的时候创建的

    this._observationTargets = [];

对这个属性的遍历，其实就是为了判断当前的`observer`是否已经通过`observe`方法监测过`target`元素。如果已经监测过，就直接`return`，防止同一个`observer`实例对同一个`target`元素进行多次监测。

如果没有监测过`target`元素，这里同样会对`target`的类型进行判断。如果不是一个dom结点，同样会抛出一个错误。

接着，会调用`this._registerInstance`方法。这个方法的主要作用就是将当前的`observer`实例添加到全局数组`registry`中，主要是为了防止我们的`observer`实例被垃圾回收进行清除

```js
IntersectionObserver.prototype._registerInstance = function() {
  if (registry.indexOf(this) < 0) {
    registry.push(this);
  }
}
```


然后，将我们`target`元素保存在`this._observationTargets`中。从上面代码中可以看到，`this._observationTargets`并不只是保存`target`元素。它会将`target`元素作为一个对象的`element`属性的值进行保存，同时这个对象还有一个`entry`属性。这个属性初始的时候是一个`null`，后续是`IntersectionObserverEntry`的一个实例对象。

之后调用`this._monitorIntersections`方法，这个方法后面我们会说。它的作用主要就是采用什么样的方式来检测`target`的状态。

最后调用`this._checkForIntersections`方法，这个方法同样会在后面讲解。这里它主要就是对`target`元素的状态进行一次初始的判断。如果`target`元素在初始的时候已经满足了和`root`元素的交集的状态，在调用这个方法的时候就会触发我们的回调函数。

### \_monitorIntersections

调用`observe`方法之后，我们就能够监测`target`元素的状态了。对`target`元素状态的监测，就是通过调用上面我们所提到的`this._monitorIntersections`方法。这里我们来看一下这个方法是怎么实现对元素的监测的

```js
IntersectionObserver.prototype._monitorIntersections = function() {
  if (!this._monitoringIntersections) {
    this._monitoringIntersections = true;

    // If a poll interval is set, use polling instead of listening to
    // resize and scroll events or DOM mutations.
    if (this.POLL_INTERVAL) {
      this._monitoringInterval = setInterval(
          this._checkForIntersections, this.POLL_INTERVAL);
    }
    else {
      addEvent(window, 'resize', this._checkForIntersections, true);
      addEvent(document, 'scroll', this._checkForIntersections, true);

      if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
        this._domObserver = new MutationObserver(this._checkForIntersections);
        this._domObserver.observe(document, {
          attributes: true,
          childList: true,
          characterData: true,
          subtree: true
        });
      }
    }
  }
}
```


这个方法提供了两种方式用来监测元素状态的变化。第一种很简单，也很粗暴 -- `polling`。这种方式默认是关闭的

    IntersectionObserver.prototype.POLL_INTERVAL = null;



如果你想使用`polling`的方式监测元素的状态，则需要在创建`IntersectionObserver`实例之后，调用`observe`方法之前设置`observer.POLL_INTERVAL`属性，比如

```js
const observer = new IntersectionObserver(() => {})

observer.POLL_INTERVAL = 300

observer.observe(target)
```



如果按照上面代码的设置，浏览器就会开启一个定时器，每300毫秒判断一下元素的状态

```js
this._monitoringInterval = setInterval(
          this._checkForIntersections, this.POLL_INTERVAL);
```


但是，这种方式不推荐；所以在`polyfill`的源码中默认将这种方式关闭，采用更高效的事件监听的方式来监测元素状态的变化。首先需要监听`window`的`resize`和`document`的`scroll`事件。监听这两种事件能够满足大多数对元素状态判断的情况。如果一个元素自身的属性没有变化，当窗口滚动或者大小改变的时候都会影响元素和"视窗"的交集。但是，在某些业务场景下这两种事件是无法监测到元素状态的变化的。比如选项卡切换，元素自身的显示和隐藏等。对于这种情况，`polyfill`中同样采用一种粗暴的方法

```js
if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
  this._domObserver = new MutationObserver(this._checkForIntersections);
  this._domObserver.observe(document, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  });
}
```



通过`MutationObserver`接口监测`document`元素下所有节点的`attributes`，`childList`和`characterData`的变化。每当有子节点状态变化的时候都会去检测`target`元素和`root`元素的交集状态。这种方式很粗暴，但是某些业务场景下我们也不得不这样做。

上面监测元素所有的方式中，其回调函数都是`this._checkForIntersections`方法。这个方法在上面也提到过，在调用`observe`方法的时候同样也会调用这个方法。这个方法到底做了什么，下面就详细的看一下。

### \_checkForIntersections

在详细讲解这个方法之前，先来简单的总结一下这个方法会在什么样的条件下被调用

*   调用`observer.observe(target)`方法的时候
*   采用轮询的方式监测元素，作为`setInterval`回调函数
*   采用事件的方式监测元素，作为`document`的`scroll`事件的回调函数
*   采用事件的方式监测元素，作为`window`的`resize`事件的回调函数
*   采用事件的方式监测元素，作为`MutationObserver`的回调函数

总之，在`this._checkForIntersections`方法被调用的时候，主要就是为了判断`target`元素和`root`元素的交集状态有没有发生变化，如果交集状态发生了变化，就会触发我们的回调函数。下面就详细的看一下这个方法到底做了哪些事情

```js
IntersectionObserver.prototype._checkForIntersections = function() {
  var rootIsInDom = this._rootIsInDom();
  var rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

  this._observationTargets.forEach(function(item) {
    var target = item.element;
    var targetRect = getBoundingClientRect(target);
    var rootContainsTarget = this._rootContainsTarget(target);
    var oldEntry = item.entry;
    var intersectionRect = rootIsInDom && rootContainsTarget &&
        this._computeTargetAndRootIntersection(target, rootRect);

    var newEntry = item.entry = new IntersectionObserverEntry({
      time: now(),
      target: target,
      boundingClientRect: targetRect,
      rootBounds: rootRect,
      intersectionRect: intersectionRect
    });

    if (!oldEntry) {
      this._queuedEntries.push(newEntry);
    } else if (rootIsInDom && rootContainsTarget) {
      // If the new entry intersection ratio has crossed any of the
      // thresholds, add a new entry.
      if (this._hasCrossedThreshold(oldEntry, newEntry)) {
        this._queuedEntries.push(newEntry);
      }
    } else {
      // If the root is not in the DOM or target is not contained within
      // root but the previous entry for this target had an intersection,
      // add a new record indicating removal.
      if (oldEntry && oldEntry.isIntersecting) {
        this._queuedEntries.push(newEntry);
      }
    }
  }, this);

  if (this._queuedEntries.length) {
    this._callback(this.takeRecords(), this);
  }
}
```


首先会判断`root`元素是不是在`dom`结构中

```js
IntersectionObserver.prototype._rootIsInDom = function() {
  return !this.root || containsDeep(document, this.root);
}

function containsDeep(parent, child) {
  var node = child;
  while (node) {
    if (node == parent) return true;

    node = getParentNode(node);
  }
  return false;
}

function getParentNode(node) {
  var parent = node.parentNode;

  if (parent && parent.nodeType == 11 && parent.host) {
    // If the parent is a shadow root, return the host element.
    return parent.host;
  }

  if (parent && parent.assignedSlot) {
    // If the parent is distributed in a <slot>, return the parent of a slot.
    return parent.assignedSlot.parentNode;
  }

  return parent;
}
```


上面的代码主要就是用来判断`root`元素是不是在`dom`结构中。所以这就要求我们传入的`options.root`选项一定要是`target`的祖先元素。

接着会获取`root`元素的区域数据

```js
IntersectionObserver.prototype._getRootRect = function() {
  var rootRect;
  if (this.root) {
    rootRect = getBoundingClientRect(this.root);
  } else {
    // Use <html>/<body> instead of window since scroll bars affect size.
    var html = document.documentElement;
    var body = document.body;
    rootRect = {
      top: 0,
      left: 0,
      right: html.clientWidth || body.clientWidth,
      width: html.clientWidth || body.clientWidth,
      bottom: html.clientHeight || body.clientHeight,
      height: html.clientHeight || body.clientHeight
    };
  }
  return this._expandRectByRootMargin(rootRect);
}
```


如果我们自己传递了`root`元素，就会通过`root.getBoundingClientRect`方法获取到`root`的区域数据。如果采用默认的`document`元素，则会使用视窗的区域数据。后面又调用了`_expandRectByRootMargin`方法，这个方法主要是用来将我们传入的`rootMargin`和`rootRect`数据结合得出新的`newRootRect`数据。

```js
IntersectionObserver.prototype._expandRectByRootMargin = function(rect) {
  var margins = this._rootMarginValues.map(function(margin, i) {
    return margin.unit == 'px' ? margin.value :
        margin.value * (i % 2 ? rect.width : rect.height) / 100;
  });
  var newRect = {
    top: rect.top - margins[0],
    right: rect.right + margins[1],
    bottom: rect.bottom + margins[2],
    left: rect.left - margins[3]
  };
  newRect.width = newRect.right - newRect.left;
  newRect.height = newRect.bottom - newRect.top;

  return newRect;
}
```


`_expandRectByRootMargin`方法很好理解，就是将`rootRect`和`rootMargin`结合计算出新的`rootRect`区域的大小。

在`root`的区域确定后，会遍历`this._observationTargets`属性。这个属性上面我们也提过，它用来保存被`observer`所监测的所有的`target`元素。遍历的过程先不看，后面还有一小段代码

```js
if (this._queuedEntries.length) {
  this._callback(this.takeRecords(), this);
}
```


`this._queuedEntries`这个属性一个数组，其中每一个元素都是`IntersectionObserverEntry`实例对象。只有当这个属性的长度大于0的时候，才会触发回调函数。在讲解`IntersectionObserver`方法的基本使用的时候我们曾经说过，`callback`的第一个参数是由`IntersectionObserverEntry`实例组成的数组，那这里是通过`this.takeRecords()`方法获取的，这个方法做了什么？

```js
IntersectionObserver.prototype.takeRecords = function() {
  var records = this._queuedEntries.slice();
  this._queuedEntries = [];
  return records;
}
```


这个方法很简单，就是通过`slice`方法对`this._queuedEntries`数据做个备份，然后清空`this._queuedEntries`。这表示在这个时间段内和`root`发生交集变化的`target`会在调用`this._checkForIntersections`后交给我们的`callback`统一处理。也就是说，每个时间段都是重新收集发生变化的`target`的。

下面我们来看一下对`this._observationTargets`的遍历会做哪些事情？估计大家也能想到，它主要就是用来收集在这个阶段中和`root`元素发生交集变化的`target`元素，并将新的交集状态(`IntersectionObserverEntry`实例对象) 保存在`this._queuedEntries`队列中

```js
this._observationTargets.forEach(function(item) {
  var target = item.element;
  var targetRect = getBoundingClientRect(target);
  var rootContainsTarget = this._rootContainsTarget(target);
  var oldEntry = item.entry;
  var intersectionRect = rootIsInDom && rootContainsTarget &&
      this._computeTargetAndRootIntersection(target, rootRect);

  var newEntry = item.entry = new IntersectionObserverEntry({
    time: now(),
    target: target,
    boundingClientRect: targetRect,
    rootBounds: rootRect,
    intersectionRect: intersectionRect
  });

  if (!oldEntry) {
    this._queuedEntries.push(newEntry);
  } else if (rootIsInDom && rootContainsTarget) {
    // If the new entry intersection ratio has crossed any of the
    // thresholds, add a new entry.
    if (this._hasCrossedThreshold(oldEntry, newEntry)) {
      this._queuedEntries.push(newEntry);
    }
  } else {
    // If the root is not in the DOM or target is not contained within
    // root but the previous entry for this target had an intersection,
    // add a new record indicating removal.
    if (oldEntry && oldEntry.isIntersecting) {
      this._queuedEntries.push(newEntry);
    }
  }
}, this);
```


在遍历的过程中，首先获取每个`target`元素的区域数据，然后调用`this._rootContainsTarget`方法，这个方法就是用来判断`root`元素是不是`target`元素的祖先元素

```js
IntersectionObserver.prototype._rootContainsTarget = function(target) {
  return containsDeep(this.root || document, target);
}
```



下面，我们先看一下这段代码做了啥，后面再看看`item.entry`是什么

```js
var intersectionRect = rootIsInDom && rootContainsTarget &&
      this._computeTargetAndRootIntersection(target, rootRect);
```


如果`rootIsInDom`为真（表示root元素在dom结构中）且`rootContainsTarget`为真（表示`root`是`target`元素的祖先元素），就调用`this._computeTargetAndRootIntersection`方法。这个方法从名称上应该都能理解它的作用：计算`target`元素和`root`元素的相交区域。其实就是用来计算相交面积`intersectionRect`的大小。

```js
IntersectionObserver.prototype._computeTargetAndRootIntersection =
    function(target, rootRect) {

  // If the element isn't displayed, an intersection can't happen.
  if (window.getComputedStyle(target).display == 'none') return;

  var targetRect = getBoundingClientRect(target);
  var intersectionRect = targetRect;
  var parent = getParentNode(target);
  var atRoot = false;

  while (!atRoot) {
    var parentRect = null;
    var parentComputedStyle = parent.nodeType == 1 ?
        window.getComputedStyle(parent) : {};

    // If the parent isn't displayed, an intersection can't happen.
    if (parentComputedStyle.display == 'none') return;

    if (parent == this.root || parent == document) {
      atRoot = true;
      parentRect = rootRect;
    } else {
      // If the element has a non-visible overflow, and it's not the <body>
      // or <html> element, update the intersection rect.
      // Note: <body> and <html> cannot be clipped to a rect that's not also
      // the document rect, so no need to compute a new intersection.
      if (parent != document.body &&
          parent != document.documentElement &&
          parentComputedStyle.overflow != 'visible') {
        parentRect = getBoundingClientRect(parent);
      }
    }

    // If either of the above conditionals set a new parentRect,
    // calculate new intersection data.
    if (parentRect) {
      intersectionRect = computeRectIntersection(parentRect, intersectionRect);

      if (!intersectionRect) break;
    }
    parent = getParentNode(parent);
  }
  return intersectionRect;
}
```


这个方法接收的两个参数分别是`target`元素和`root`元素区域的大小。如果元素是隐藏的，是不可能存在相交的，所以直接返回就行了。接着会获取`target`区域数据和其parentNode元素，并设置一个标志位用来表示下面的while循环是否循环到了`this.root`或者是`document`。在while循环中先会判断`target.parentNode`是否显示，如果其隐藏的话，`target`和`root`元素同样是不可能存在交集的。这里我们先假设我们采用默认的`root`即`document`，而且`parentNode`就是`document`，那么循环将会进入`if`分支，并将`parentRect`设置`rootRect`的大小，atRoot设置为`true`。接着会执行如下代码

```js
if (parentRect) {
  intersectionRect = computeRectIntersection(parentRect, intersectionRect);

  if (!intersectionRect) break;
}
parent = getParentNode(parent);
```



在这个分支中会执行`computeRectIntersection`函数，这个函数才是真正的计算`target`和`root`相交区域的大小

```js
function computeRectIntersection(rect1, rect2) {
  var top = Math.max(rect1.top, rect2.top);
  var bottom = Math.min(rect1.bottom, rect2.bottom);
  var left = Math.max(rect1.left, rect2.left);
  var right = Math.min(rect1.right, rect2.right);
  var width = right - left;
  var height = bottom - top;

  return (width >= 0 && height >= 0) && {
    top: top,
    bottom: bottom,
    left: left,
    right: right,
    width: width,
    height: height
  };
}
```



我们将这段代码用下面的图片来表示，就能看出它到底在做啥

![](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20201014163228.png)

上图中红色的线段就是相交区域的`上，下，左，右`的长度。所以，相交区域的大小就是图中橙色实心部分的大小。如果`target`位于`root`的区域外，则表示`width`或者`height`至少有一个`<=0`。那么计算出来的相交区域的大小也就为`0`。

假设`target.parentNode`不是`document`，那么while循环会执行`else`分支。其中执行`else`分支有一个条件`parentComputedStyle.overflow != 'visible'`。如果`parentComputedStyle.overflow`的值为`visible`，那么`target`和`root`最大的交叉面积就是`target`的大小，如果`parentComputedStyle.overflow`的值不为`visible`，那么`target`和`root`最大的交叉面积是多少呢？最大的交叉面积就是`target`最大能显示出来的面积的大小。

交叉面积计算出来后，我们接着分析下面的代码

```js
var oldEntry = item.entry;

var newEntry = item.entry = new IntersectionObserverEntry({
  time: now(),
  target: target,
  boundingClientRect: targetRect,
  rootBounds: rootRect,
  intersectionRect: intersectionRect
});
```



先看对`newEntry`的赋值。我们上面说过`this._observationTargets`保存的数据的结构为`{element: target, entry: null}`这种类型。从这里就能看到`entry`就是通过`new IntersectionObserverEntry`就是创建的实例对象。那`oldEntry`是什么呢？`oldEntry`就是上一次调用`this._checkForIntersections`方法的时候所创建的`entry`对象。这里为什么取新老两次`entry`对象，后面我们会分析。这里我们先看一下`IntersectionObserverEntry`构造函数的执行流程

```js
function IntersectionObserverEntry(entry) {
  this.time = entry.time;
  this.target = entry.target;
  this.rootBounds = entry.rootBounds;
  this.boundingClientRect = entry.boundingClientRect;
  this.intersectionRect = entry.intersectionRect || getEmptyRect();
  this.isIntersecting = !!entry.intersectionRect;

  // Calculates the intersection ratio.
  var targetRect = this.boundingClientRect;
  var targetArea = targetRect.width * targetRect.height;
  var intersectionRect = this.intersectionRect;
  var intersectionArea = intersectionRect.width * intersectionRect.height;

  // Sets intersection ratio.
  if (targetArea) {
    // Round the intersection ratio to avoid floating point math issues:
    // https://github.com/w3c/IntersectionObserver/issues/324
    this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
  } else {
    // If area is zero and is intersecting, sets to 1, otherwise to 0
    this.intersectionRatio = this.isIntersecting ? 1 : 0;
  }
}
```



`IntersectionObserverEntry`函数的执行流程十分简单，就是计算出其各个属性的值。其它的属性我们就不多说了，这里我们主要看以下三个属性值

```js
this.intersectionRect = entry.intersectionRect || getEmptyRect();
this.isIntersecting = !!entry.intersectionRect;

if (targetArea) {
    // Round the intersection ratio to avoid floating point math issues:
    // https://github.com/w3c/IntersectionObserver/issues/324
    this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
  } else {
    // If area is zero and is intersecting, sets to 1, otherwise to 0
    this.intersectionRatio = this.isIntersecting ? 1 : 0;
  }
```



其中`this.intersectionRect`就是上面通过`this._computeTargetAndRootIntersection`方法计算出来的。`this.isIntersecting`的判定也十分简单，如果存在相交面积，就表示相交。不存在相交面积，就表示不想交。最后是相交比`this.intersectionRatio`的计算，正常情况下(target的width和height都不为0)就是`intersectionArea`和`target`区域面积的比值。

然后就会判断`oldEntry`是否存在，`oldEntry`在什么状态下不会存在？在初始调用，也就是调用`observer.observe`方法监测`target`元素的时候`item.entry`是不存在的。然后就会将`newEntry`添加到`this._queuedEntries`队列中，当执行到

```js
if (this._queuedEntries.length) {
  this._callback(this.takeRecords(), this);
}
```



的时候，就会调用我们传入的回调函数。

如果不是在初始状态下，在`rootIsInDom && rootContainsTarget`为真的时候，会调用`this._hasCrossedThreshold`方法，那这个方法是干啥的？我们在介绍`IntersectionObserver`的时候曾经提到在创建`IntersectionObserver`实例的时候，我们传入一个选项，可以通过这个选项的`threshold`属性指定相交比达到什么样的条件才需要触发我们的回调函数。`this._hasCrossedThreshold`就是用来判断这种情况的。

```js
IntersectionObserver.prototype._hasCrossedThreshold =
    function(oldEntry, newEntry) {

  // To make comparing easier, an entry that has a ratio of 0
  // but does not actually intersect is given a value of -1
  var oldRatio = oldEntry && oldEntry.isIntersecting ?
      oldEntry.intersectionRatio || 0 : -1;
  var newRatio = newEntry.isIntersecting ?
      newEntry.intersectionRatio || 0 : -1;

  // Ignore unchanged ratios
  if (oldRatio === newRatio) return;

  for (var i = 0; i < this.thresholds.length; i++) {
    var threshold = this.thresholds[i];

    // Return true if an entry matches a threshold or if the new ratio
    // and the old ratio are on the opposite sides of a threshold.
    if (threshold == oldRatio || threshold == newRatio ||
        threshold < oldRatio !== threshold < newRatio) {
      return true;
    }
  }
}
```


从`_hasCrossedThreshold`代码中我们可以看到。如果`target`完全没有显示`oldRatio === newRatio === -1`，直接`return`。这种情况下是不会执行我们的回调函数的。如果`target`完全显示`oldRatio === newRatio === newEntry.intersectionRatio`，这种情况下也不会执行我们的回调函数。那什么时候才会执行我们的回调函数呢，从这段代码的`for`循环中我们可以总结出**只有当threshold设置的值在oldRatio和newRatio之间的时候才会执行我们的回调**。这里大家可以画图分析一下。

上面就是关于怎么监测`target`和执行回调函数时机的分析，下面我们看一下`unobserve`的过程

### unobserve

```js
IntersectionObserver.prototype.unobserve = function(target) {
  this._observationTargets =
      this._observationTargets.filter(function(item) {

    return item.element != target;
  });
  if (!this._observationTargets.length) {
    this._unmonitorIntersections();
    this._unregisterInstance();
  }
}
```


`unobserve`的执行流程十分简单，首先是从`this._observationTargets`将`target`删除。如果`this._observationTargets`队列长度为0，表示当前的`observer`没有监听任何`target`，那么就可以将当前`observer`从全局的`registry`数组中删除。如果`registry`也为空，那么就可以卸载相关事件。这个过程主要是通过`this._unmonitorIntersections`和`this._unregisterInstance`方法来实现的

```js
IntersectionObserver.prototype._unmonitorIntersections = function() {
  if (this._monitoringIntersections) {
    this._monitoringIntersections = false;

    clearInterval(this._monitoringInterval);
    this._monitoringInterval = null;

    removeEvent(window, 'resize', this._checkForIntersections, true);
    removeEvent(document, 'scroll', this._checkForIntersections, true);

    if (this._domObserver) {
      this._domObserver.disconnect();
      this._domObserver = null;
    }
  }
}



IntersectionObserver.prototype._unregisterInstance = function() {
  var index = registry.indexOf(this);
  if (index != -1) registry.splice(index, 1);
}

```

### disconnect

`disconnect`可以一次性取消`observer`对所有`target`的监测，这个方法的实现同样很简单

```js
IntersectionObserver.prototype.disconnect = function() {
  this._observationTargets = [];
  this._unmonitorIntersections();
  this._unregisterInstance();
}
```


上面就是对`IntersectionObserver polyfill`源码的大致分析。如有错误，欢迎指正。


### 使用IntersectionObserver实现一个简单的无限滚动

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <style>
    .img-area {
      width: 500px;
      height: 320px;
      margin: 0 auto;
    }

    .my-photo {
      width: 500px;
      height: 300px;
      opacity: 0;
      -webkit-transition: opacity 0.25s ease-in-out;
      -moz-transition: opacity 0.25s ease-in-out;
      -o-transition: opacity 0.25s ease-in-out;
      transition: opacity 0.25s ease-in-out;

    }
  </style>
</head>

<body class="body">
  <div class="container">
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
    <div class="img-area"><img class="my-photo" alt="loading" data-src="./img/1.png" /></div>
  </div>
  <div class="footer"></div> <!-- 页尾标志，判断是否需要新添加节点到文档流中 -->
  <script>
    function loadItems(io, count = 10) {
      let container = document.querySelector('.container')
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const li = document.createElement('div')
        li.className = 'img-area';
        const img = document.createElement('img')
        img.className = 'my-photo'
        img.alt = 'loading'
        img.dataset.src = './img/1.png'
        li.appendChild(img);
        fragment.appendChild(li);
        io.observe(img)
      }
      container.appendChild(fragment)
    }

    function lazyLoad(imgClassName) {
      const imgList = Array.from(document.querySelectorAll(imgClassName));
      var opts = {
        root: document,
        rootMargin: "500px 0px"
      };
      const io = new IntersectionObserver(function (ioes) {
        ioes.forEach(function (ioe) {
          const el = ioe.target;
          const cn = el.className;
          // const intersectionRatio = ioe.intersectionRatio;
          if (cn === 'footer') {
            if (!ioe.isIntersecting) return;
            loadItems(io);
            console.log('loaded new items');
          } else if (ioe.isIntersecting) { //对于图片节点，当其进入范围内，则load其src
            if (!el.src) {
              el.src = el.dataset.src;
              el.onload = function (e) {
                el.style.opacity = 1
              }
              io.unobserve(el); //加载图片后停止观察该节点
            }
          }
        })
      }, opts);
      imgList.forEach(function (item) {
        io.observe(item)
      });
      io.observe(document.querySelector(".footer")) //观察footer节点，判断添加新节点的时机
    }
    lazyLoad('.my-photo');
  </script>
</body>

</html>

```

效果图：
![Jietu20201014-172126](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/Jietu20201014-172126.gif)
<!-- 转发自[赵赛赛个人博客](https://zhaosaisai.com/blog/2019/IntersectionObserver-polyfill%E8%A7%A3%E6%9E%90.html) -->
