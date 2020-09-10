---
title: 如何让centOS7下全局安装的npm模块在环境变量中生效
date: 2017-09-10 16:12:53
tags:
 - Linux
 - centOS
categories: others
---


记一次在centOS7下npm安装全局模块，依然无法使用相关全局命令的问题的解决方案

<!-- more -->

### 问题详述

通过`npm i -g cnpm`安装的[goku-cli](https://www.npmjs.com/package/goku-cli)后，依然无法全局使用`goku`命令：

```bash
-bash: goku: command not found
```

> 解决方案： 需要将node路径关联到环境变量中

### 具体操作

- 使用`npm root -g`获取node目录,
```
/usr/sbin/nodejs/lib/node_modules
```

- 通过vim编辑`/etc/profile`文件, 在文件最底下新增:

```bash
# Node所在路径
export NODE_HOME=/usr/sbin/nodejs
export PATH=${NODE_HOME}/bin:$PATH
```
> 如果PATH有其他配置，通过`export PATH=<path1>:<path2>:<path3>:$PATH`方式配置

- 最后执行命令使环境变量生效

```bash
source /etc/profile
```

- 查看环境变量

```bash
echo $PATH
```

- 验证效果

![20200910175837](https://cdn.jsdelivr.net/gh/jiangawait/CDN/images/20200910175837.png)

以后通过npm全局安装的模块会自动在环境变量中生效
