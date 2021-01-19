---
title: 基于hexo搭建个人博客并使用GitHub Actions一键发布到GitHub pages & 阿里云ECS
date: 2019-04-28 15:15:23
tags:
  - 博客搭建
categories:
  - others
---

Hexo 是一个快速、简洁且高效的博客框架。Hexo 使用 Markdown（或其他渲染引擎）解析文章，在几秒内，即可利用靓丽的主题生成静态网页。本文记录了使用 Hexo 创建个人博客并使用GitHub Actions一键发布到 GitHub pages 和 阿里云ECS上的全过程。

<!-- more -->

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

如果您只是想部署到GitHub Actions上，那么可以直接用这节的方法。如果还想部署到阿里云等私人服务器上，那么可以跳过这步，直接看下一节。

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

执行 hexo deploy 将生成的文件部署到上一步配置的仓库对应的分支上去。

```
hexo clean && hexo deploy
```

> 至此，已经实现了个人博客的搭建并完成了一键发布到GitHub Pages的功能，如果只需要发布到GitHub Pages，那么至此已经可以愉快地写文章了。
>
> 但是由于总所周知的原因，GitHub在国内的访问速度总是时好时坏，不够畅快。
>
> 那么如果你手里恰好有闲置的云服务器，那么接下去就更进一步吧！🙂


### GitHub Actions登场

GitHub Actions 是 GitHub 于2018年10月推出的持续集成服务。功能非常强大，具体的基础用法不赘述，可以参阅[阮一峰老师的教程](http://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)。

这里主要介绍如何配置GitHub Actions实现自动部署功能。

#### 创建workflow 文件
GitHub Actions 的配置文件叫做 workflow 文件, 存放在代码仓库的.github/workflows目录。

新建.github/workflows/deploy.yml, 具体配置如下：
```yml
name: Hexo build and deploy

on:
  push:
    branches:
      - blog # blog分支是本人的hexo源码分支

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # 切换分支
      - name: Checkout
        uses: actions/checkout@v2 # If you're using actions/checkout@v2 you must set persist-credentials to false in most cases for the deployment to work correctly.
        with:
          persist-credentials: false
          # checkout到你的hexo代码分支
          ref: blog
          # hexo需要加载内部子模块
          submodules: true

      # 使用 node:10
      - name: use Node.js 10
        uses: actions/setup-node@v1
        with:
          node-version: 10

      # 安装npm包 & 生成静态文件
      - name: Install and publish
        run: |
          npm install
          npm run build

      # 将静态文件部署到阿里云
      - name: Deploy to aliyun server
        uses: easingthemes/ssh-deploy@v2.0.7
        env:
          SSH_PRIVATE_KEY: ${{ secrets.ALIYUN_SERVER_ACCESS_TOKEN }}
          ARGS: "-avz --delete"
          SOURCE: "public"
          REMOTE_HOST: ${{ secrets.ALIYUN_SERVER_HOST }}
          REMOTE_USER: "root"
          TARGET: "/code/hexo-blog" # 静态资源存放目录

      # 将静态文件部署到github pages
      - name: Deploy to Github Pages
        uses: JamesIves/github-pages-deploy-action@releases/v3
        with:
          ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
          BASE_BRANCH: blog
          BRANCH: master
          FOLDER: public
```

#### 配置参数说明

  - ALIYUN_SERVER_HOST： 阿里云服务器公网IP；
  - ALIYUN_SERVER_ACCESS_TOKEN：阿里云.ssh下的私钥(id_rsa);
    - 如果未生成过，可以执行如下命令：
    ```bash
    ssh-keygen -m PEM -t rsa -b 4096
    ```
    - 把公钥复制一份到authorized_keys中:
    ```bash
    cat id_rsa.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    ```
  - ACCESS_TOKEN:  GitHub 密钥, 按照[官方文档](https://help.github.com/cn/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)生成一个秘钥。

以上三个参数都保存到自己仓库->settings->Secrets里面：

![UTOOLS1590676585606.png](http://yanxuan.nosdn.127.net/682b4ddff33a7fb61d5a76ca59374e83.png)


#### 构建结果
将整个仓库推送到GitHub，GitHub 发现了 workflow 文件以后，就会自动运行。
![UTOOLS1590679294118.png](http://yanxuan.nosdn.127.net/afd80ff8efb75954b5ca1723d264e119.png)

至此，我们已经将博客部署到GitHub Actions和阿里云上了。阿里云上我们可以使用Nginx托管静态资源：

```bash
server {
    listen       80;
    server_name  blog.kobingo.xyz;
    location / {
        root /code/hexo-blog/public; # 静态资源存放目录
        index index.html;
    }
}
```

一切大功告成！收工😄
