---
title: centOS7安装Java环境
date: 2020-05-22 16:28:42
tags: java
categories: others
---

记录一次在阿里云（系统CentOS 7.4 64位）安装配置Java环境的过程
<!-- more -->

### 1. 选择合适的jdk版本

> [jdk下载地址](https://www.oracle.com/java/technologies/javase/javase-jdk8-downloads.html)

选择一下版本获取下载链接
![UTOOLS1590136537164.png](http://yanxuan.nosdn.127.net/3f479b3d56b3bfc9acad57e9a09fa94f.png)


### 2. 下载

```shell
  wget https://download.oracle.com/otn/java/jdk/8u251-b08/3d5a2bb8f8d4428bbe94aed7ec7ae784/jdk-8u251-linux-x64.tar.gz?AuthParam=1590135363_2f6dbe12605da3b1164a50e7c1a8db7b
```
> 此链接地址可能失效，请自行在步骤1中获取最新下载链接

下载后检查安装包大小是否符合预期（判断安装包是否损坏）
```shell
ls -lht
```
![UTOOLS1590136951543.png](http://yanxuan.nosdn.127.net/a9167b8a26ab786fadfaad86f432d0e9.png)

### 3. 安装

3.1. 创建安装目录：
```shell
mkdir /usr/local/java/
```
3.2 解压到安装目录：
```shell
tar -zxvf jdk-8u251-linux-x64.tar.gz?AuthParam=1590135363_2f6dbe12605da3b1164a50e7c1a8db7b -C /usr/local/java
```

### 4. 配置环境变量
打开profile文件
```vim
vim /etc/profile
```
在末尾添加一下代码：
```shell
export JAVA_HOME=/usr/local/java/jdk1.8.0_251
export JRE_HOME=${JAVA_HOME}/jre
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib
export PATH=${JAVA_HOME}/bin:$PATH
```

使环境变量生效
```shell
source /etc/profile
```
添加软链接
```shell
ln -s /usr/local/java/jdk1.8.0_251/bin/java /usr/bin/java
```

验证是否安装成功
```shell
java -version
```
![UTOOLS1590137306874.png](http://yanxuan.nosdn.127.net/7e0334391843b73fbfbc4963591ab65e.png)
