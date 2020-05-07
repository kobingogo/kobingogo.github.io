---
title: hexo操作实录
date: 2019-04-03 19:18:05
tags:
  - Hexo
categories:
  - Hexo
excerpt: "Hexo 是一个快速、简洁且高效的博客框架。Hexo 使用 Markdown（或其他渲染引擎）解析文章，在几秒内，即可利用靓丽的主题生成静态网页。本文记录了使用 Hexo 创建个人博客并发布到 GitHub pages 上的全过程。"
---

<!-- ## hexo 操作实录 -->

### 什么是 Hexo？

Hexo 是一个快速、简洁且高效的博客框架。Hexo 使用 Markdown（或其他渲染引擎）解析文章，在几秒内，即可利用靓丽的主题生成静态网页。

### 安装

#### 安装前提

安装 Hexo 前，请先确保您的电脑上已经安装了下列应用程序：

- [Node.js](http://nodejs.org/) (Node.js 版本需不低于 8.10，建议使用 Node.js 10.0 及以上版本)
- [Git](https://git-scm.com/)

_注： 如果您的电脑未安装 Node 或者 Git，请先安装后再阅读下面内容_

#### 安装 Hexo

使用 npm:

```
$ npm install -g hexo-cli
```

使用 yarn:

```
$ yarn global add hexo-cli
```

### 建站

安装 Hexo 完成后，请执行下列命令，Hexo 将会在指定文件夹中新建所需要的文件。

```
$ hexo init <folder>
$ cd <folder>
$ npm install
```

新建完成后，指定文件夹的目录如下：

```
.
├── _config.yml
├── package.json
├── scaffolds
├── source
|   ├── _drafts
|   └── _posts
└── themes
```

#### \_config.yml

网站的 [配置](https://hexo.io/zh-cn/docs/configuration) 信息，您可以在此配置大部分的参数。

#### scaffolds

[模版](https://hexo.io/zh-cn/docs/writing) 文件夹。当您新建文章时，Hexo 会根据 scaffold 来建立文件。

#### source

资源文件夹是存放用户资源的地方。除 _posts 文件夹之外，开头命名为 _ (下划线)的文件 / 文件夹和隐藏的文件将会被忽略。Markdown 和 HTML 文件会被解析并放到 public 文件夹，而其他文件会被拷贝过去

#### themes

[主题](https://hexo.io/zh-cn/docs/themes) 文件夹。Hexo 会根据主题来生成静态页面。

### 常用命令

#### new

新建一篇文章

```
$ hexo new [layout] <title>
```

#### generate

生成静态文件。

```
$ hexo generate
```

#### publish

发表草稿。

```
$ hexo publish [layout] <filename>
```

#### server

启动服务器。默认情况下，访问网址为： http://localhost:4000/。

```
$ hexo server
```

#### deploy

部署网站。

```
$ hexo deploy
```

#### clean

清除缓存文件 (db.json) 和已生成的静态文件 (public)。
在某些情况（尤其是更换主题后），如果发现您对站点的更改无论如何也不生效，您可能需要运行该命令。

```
$ hexo clean
```

#### list

列出网站资料。

```
$ hexo list <type>
```

_注： 更多命令见[官网](https://hexo.io/zh-cn/docs/commands)_

### 部署 GitHub pages

#### 新建 GitHub 项目

打开 GitHub 点击右上角的`new repository`
![UTOOLS1588764262695.png](http://yanxuan.nosdn.127.net/e4ab3a5d71b66640072d74bd000cae04.png)

然后在下图所示中，输入项目名称（后面一定要加.github.io 后缀），勾选 readme 初始化，点击完成创建
![UTOOLS1588764393885.png](http://yanxuan.nosdn.127.net/5204b23ad8733af70ec1d2132e9dacff.png)

#### 安装 hexo-deployer-git。

```
$ npm install hexo-deployer-git --save
```

#### 修改\_config.yml 配置

```
deploy:
  type: git
  repo: git@github.com:jiangawait/jiangawait.github.io.git
  branch: master
```

#### 执行命令

执行 hexo deploy 将生成的文件部署上去

```
hexo clean && hexo deploy
```

#### 效果图

![YERAts.png](https://s1.ax1x.com/2020/05/06/YERAts.png)
