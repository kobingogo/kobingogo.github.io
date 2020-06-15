---
title: 打造赏心悦目的Mac终端
date: 2020-06-10 11:36:19
tags:
  - Mac终端
categories: others
---

本文主要讲解如何基于iTerm2 + Oh My Zsh 打造赏心悦目的Mac终端，以及如何配置终端代理等。
<!-- more -->

### 下载iTerm2

可以直接去官网下载：https://www.iterm2.com/

安装完成后，在/bin目录下会多出一个zsh的文件。

Mac系统自带很多Shell，可以通过命令查看：
```bash
cat /etc/shells
```
结果如下：
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfnavctvytj30ep05wdg2.jpg)

由于Mac默认使用dash作为终端，所以首先修改为默认使用zsh：

```bash
chsh -s /bin/zsh
```

这就是iTerm2初始的样子，下面我们来美化它，让它变得好用又好看！

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn91wrixhj30vo0p40u7.jpg)

### 安装Oh my zsh

oh-my-zsh开源地址：https://github.com/robbyrussell/oh-my-zsh

主要有`curl`和`wget`两种安装方式，可任选一种进行安装：

```bash
# curl 安装方式
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

```bash
# wget 安装方式
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
```

安装命令和安装完成后的截图：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn92cdy3oj312a0q27a7.jpg)


### 安装PowerLine

[Powerline](http://powerline.readthedocs.io/en/latest/installation.html)是agnoster主题的依赖。具体可以在repo里查询到：
https://github.com/agnoster/agnoster-zsh-theme


安装powerline的方式依然简单，也只需要一条命令：

```bash
pip install powerline-status --user
```

没有安装pip的同学可能会碰到zsh: command not found: pip。
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn92zc4clj30dg024dg6.jpg)

使用命令安装pip即可：

```bash
sudo easy_install pip
```

安装后再次执行安装powerline的命令即可。

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn93bjfetj31mg08u77d.jpg)

### 安装PowerFonts

安装字体库需要首先将项目git clone至本地，然后执行源码中的install.sh。

在你习惯的位置新建一个文件夹，如：~/Desktop/OpenSource/

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn93sc6fgj30di038aah.jpg)

在此文件夹下执行git clone命令：

```bash
# git clone
git clone https://github.com/powerline/fonts.git --depth=1
# cd to folder
cd fonts
# run install shell
./install.sh
```

执行结果如下：
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn93zramcj31z60fyago.jpg)

安装好字体库之后，我们来设置iTerm2的字体，具体的操作是iTerm2 -> Preferences -> Profiles -> Text，在Font区域选中Change Font，然后找到Meslo LG字体。有L、M、S可选，看个人喜好：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn94aieloj310f0u011l.jpg)

### 安装配色方案

配色方案在使用VIM或Colorful Log时会变得非常有用，同时界面也不会一片黑绿一样死板。

同样使用git clone的方式下载源码进行安装：

```bash
cd ~/Desktop/OpenSource
git clone https://github.com/altercation/solarized
cd solarized/iterm2-colors-solarized/
open .
```

在打开的finder窗口中，双击Solarized Dark.itermcolors和Solarized Light.itermcolors即可安装明暗两种配色：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn94su0j7j31570u07f1.jpg)

再次进入iTerm2 -> Preferences -> Profiles -> Colors -> Color Presets中根据个人喜好选择这两种配色中的一种即可：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn950gf0ej30zx0u04db.jpg)

### 安装主题

下载agnoster主题，执行脚本安装：

```bash
cd ~/Desktop/OpenSource
git clone https://github.com/fcamblor/oh-my-zsh-agnoster-fcamblor.git
cd oh-my-zsh-agnoster-fcamblor/
./install
```

执行上面的命令会将主题拷贝到oh my zsh的themes中：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfn95ek4pfj30vo0ra7a0.jpg)

拷贝完成后，执行命令打开zshrc配置文件，将ZSH_THEME后面的字段改为agnoster。

```bash
vi ~/.zshrc
```

![ImageInitIterm](https://raw.githubusercontent.com/sirius1024/pubimgs/master/blogs/iterm2/11.png)

修改完成后按一下esc调出vi命令，输入:wq保存并退出vi模式。

此时command+Q或source配置文件后，iTerm2变了模样：

![ImageInitIterm](https://raw.githubusercontent.com/sirius1024/pubimgs/master/blogs/iterm2/12.png)

### 安装高亮插件

这是oh my zsh的一个插件，安装方式与theme大同小异：

```bash
cd ~/.oh-my-zsh/custom/plugins/
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git
vi ~/.zshrc
```

这时我们再次打开zshrc文件进行编辑。找到plugins，此时plugins中应该已经有了git，我们需要把高亮插件也加上：

![ImageInitIterm](https://raw.githubusercontent.com/sirius1024/pubimgs/master/blogs/iterm2/13.png)

请务必保证插件顺序，zsh-syntax-highlighting必须在最后一个。

然后在文件的最后一行添加：source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

按一下esc调出vi命令，输入:wq保存并退出vi模式。

执行命令使刚才的修改生效：

```bash
source ~/.zshrc
```

至此大功告成，请看最终效果图：

![ImageInitIterm](https://raw.githubusercontent.com/sirius1024/pubimgs/master/blogs/iterm2/14.png)

背景图片取自微软Surface Studio的4K壁纸(将近12MB大小)，非常漂亮，需要的可以自取：

https://pan.baidu.com/s/1LKd4ghGyyNI6UwHhOHvfaA
提取码: snrd

更换背景图片方式：iTerm2 -> Preferences -> Profiles -> Window -> BackGround Image勾选图片即可。

### 可选择、命令补全

跟代码高亮的安装方式一样，这也是一个zsh的插件，叫做zsh-autosuggestion，用于命令建议和补全。

```bash
cd ~/.oh-my-zsh/custom/plugins/
git clone https://github.com/zsh-users/zsh-autosuggestions
vi ~/.zshrc
```

找到plugins，加上这个插件即可：

![ImageInitIterm](https://raw.githubusercontent.com/sirius1024/pubimgs/master/blogs/iterm2/15.png)

插件效果：

![ImageInitIterm](https://raw.githubusercontent.com/sirius1024/pubimgs/master/blogs/iterm2/16.png)

有同学说补全命令的字体不太清晰，与背景颜色太过相近，其实可以自己调整一下字体颜色。

Preferences -> Profiles -> Colors 中有Foreground是标准字体颜色，ANSI Colors中Bright的第一个是补全的字体颜色。

### VScode显示异常问题

在经过上面配置后，发现VScode上的终端显示异常，主要原因是前面配置的agnoster主题需要PowerFonts字体的支持。
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfna0fzj8zj30jc06bt8v.jpg)

所以需要在VScode里设置字体（比如：`Meslo LG L for Powerline`）：
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfna2gfm6lj30kh0cg75k.jpg)

完成后，显示正常：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfna3j770hj30ll05rdg1.jpg)

### 使用代理

由于GFW的存在，平时用终端安装npm包，或者clone GitHub上的仓库等操作时，经常速度是可怜的10K/s甚至不到的速度，即便开了 SS / V2Ray 等代理服务，貌似在终端上没什么卵用😭（其实主要原因是这些代理服务走的是会话层，而item的命令走在网络层，层级更低，所以流量无法用过代理转发）。

> 如果你用的是VPN方式代理，那么估计你没有这个烦恼
>
> 原因是主流的VPN协议（包括PPTP / L2TP / OPENVPN / SSTP）跑在第二层（数据链路层）和第三层（网络层），基本可以说是全流量代理。

那有没有什么方法可以让iterm上的流量能走代理从而提高下载速度呢？

答案是有的！

> 下面的操作的前提是你自己有有可用的代理服务




编辑~/.zshrc:
```bash
vim ~/.zshrc
```
在配置的最下面添加如下代码：

```shell

function useProxy() {
  export https_proxy=http://127.0.0.1:7890;
  export http_proxy=http://127.0.0.1:7890;
  export all_proxy=socks5://127.0.0.1:7891;
  echo 'open proxy successful';
}
function closeProxy() {
  unset https_proxy;
  unset http_proxy;
  unset all_proxy;
  echo 'close proxy successful';
}


alias openP='useProxy'
alias closeP='closeProxy'
```

保存更改，执行：
```bash
source ~/.zshrc
```
接着只要在终端执行`openP`就能打开终端代理，执行`closeP`就能关闭终端代理

### ZSH常用技能

- 自动补全
  - ZSH的补全功能非常贴心，按TAB可以补全命令、路径还有参数。
- 杀进程
  - Bash杀进程需要先用`ps aux | grep xxx`查找进程的PID，然后才能用`kill PID`。ZSH可以直接就`kill xxx`后按TAB会显示对应的PID，非常方便。
- 历史记录
  - ZSH的history可以跨session，可以共享，这样就一进行历史记录的受限查询。比如，输入git，再按向上箭头，会搜索前面所有的git命令。
- 通配符搜索
  - l *.png查找当前目录下所有png文件，l **/*.png递归查找。
