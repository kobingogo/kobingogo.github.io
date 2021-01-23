---
title: git设置代理
date: 2017-09-10 16:12:53
tags:
 - git
 - github
categories: others
---


本文讲解如何为github设置代理，让` git clone` 飞起来

<!-- more -->

# macOS 给 Git(Github) 设置代理（HTTP/SSH）

> macOS 给 Git(Github) 设置代理（HTTP/SSH）. GitHub Gist: instantly share code, notes, and snippets.

分辨需要设置的代理
---------

*   HTTP 形式：
    
    > git clone [https://github.com/owner/git.git](https://github.com/owner/git.git)
    
*   SSH 形式：
    
    > git clone [git@github.com](mailto:git@github.com):owner/git.git
    

一、HTTP 形式
---------

### 走 HTTP 代理

git config --global http.proxy "http://127.0.0.1:8080"
git config --global https.proxy "http://127.0.0.1:8080"

### 走 socks5 代理（如 Shadowsocks）

git config --global http.proxy "socks5://127.0.0.1:1080"
git config --global https.proxy "socks5://127.0.0.1:1080"

### 取消设置

git config --global --unset http.proxy
git config --global --unset https.proxy

二、SSH 形式
--------

修改 `~/.ssh/config` 文件（不存在则新建）：

    # 必须是 github.com
    Host github.com
       HostName github.com
       User git
       # 走 HTTP 代理
       # ProxyCommand socat - PROXY:127.0.0.1:%h:%p,proxyport=8080
       # 走 socks5 代理（如 Shadowsocks）
       # ProxyCommand nc -v -x 127.0.0.1:1080 %h %p


对于Windows用户，要使用socks5代理却没有 nc 的，可以将
`ProxyCommand nc -v -x 127.0.0.1:1080 %h %p`
换成
`ProxyCommand connect -S 127.0.0.1:1080 %h %p`


详细配置：
```yml
Host *
  ServerAliveInterval 120
  ServerAliveCountMax 5

# macOS 给 Git(Github) 设置代理（HTTP/SSH）
# https://gist.github.com/chuyik/02d0d37a49edc162546441092efae6a1
# 0x00 克隆 repo 的两种方式：https 和 ssh 方式
# https 方式：git clone https://github.com/owner/git.git
# ssh   方式：git clone     git@github.com:owner/git.git

# 0x01 https 方式克隆的 repo，走 http 或 sock5 代理，任选一个
# 0x0101 http 代理
# git config --global http.proxy "http://127.0.0.1:1087"
# git config --global https.proxy "http://127.0.0.1:1087"
# 0x0102 sock5 代理
# git config --global http.proxy "socks5://127.0.0.1:1086"
# git config --global https.proxy "socks5://127.0.0.1:1086"
# 0x0103 取消使用代理
# git config --global --unset http.proxy
# git config --global --unset https.proxy

# 0x02 ssh 克隆方式的代理设置，直接在全局设置文件配置，即 ~/.ssh/config 文件
Host github.com
   HostName github.com
   User git
   # 走 HTTP 代理，需要 brew install socat
   # ProxyCommand socat - PROXY:127.0.0.1:%h:%p,proxyport=1087
   # 走 socks5 代理（如 Shadowsocks）
   ProxyCommand nc -v -x 127.0.0.1:1086 %h %p
   # 走 socks5 代理（如 Shadowsocks），Windows 平台没有 nc 命令
   # ProxyCommand connect -S 127.0.0.1:1086 %h %p
```

[Source](https://gist.github.com/chuyik/02d0d37a49edc162546441092efae6a1)