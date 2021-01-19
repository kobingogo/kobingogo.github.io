---
title: css实现两个圆重叠
date: 2021-01-07 17:04:27
tags: css
categories: css
---

工作中有一个需求，实现两个椭圆相交，并且相交区域颜色不同，类似于一个简单的`韦恩图`，如何用css实现这个效果？ 经过一番探索，找到了答案。

<!-- more -->

要实现这个效果，需要用到的神技：[`css-blend-mode`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/mix-blend-mode#%E4%B8%8D%E5%90%8Cmix-blend-mode%E5%80%BC%E7%9A%84%E6%95%88%E6%9E%9C), 它是一个css属性，描述了元素的内容应该与元素的直系父元素的内容和元素的背景如何混合。

有了这个，就可以愉快的直接上代码了：
```html
<div class="isolate">
  <div class="circle circle-1"></div>
  <div class="circle circle-2"></div>
</div>
```

```css
.circle {
  width: 110px;
  height: 70px;
  border-radius: 50% / 35px;
  mix-blend-mode: color-dodge;
  position: absolute;
  border: 1px solid #fff;
}

.circle-1 {
  background: #39518A;
}

.circle-2 {
  background: #0091FF;
  top: 40px;
}


.isolate {
  isolation: isolate; /* Without isolation, the background color will be taken into account */
  position: relative;
}
```

具体效果参见：[例子](https://codepen.io/jiangawait/pen/zYKaRZx)

当然css-blend-mode不仅仅只有这点作用，它还能用作背景混合，纹理叠加，视频混合等场景，具体可参考：

[大神的文章](https://www.zhangxinxu.com/wordpress/2019/05/css-mix-blend-mode-screen/)

打完收工😊
