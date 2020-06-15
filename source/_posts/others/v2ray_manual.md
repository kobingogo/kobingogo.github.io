---
title: Vulter + v2ray / Trojan 使用教程
date: 2020-06-11 18:25:33
tags: 梯子
categories: others
---

最近一直在使用的梯子服务临近到期，想要续费发现价格又涨了一波，再加上平时使用中并不是很稳定。就萌生了自建一个梯子的想法。

<!-- more -->

### 前言

要想自建梯子有两个前提：
  - 境外VPS服务器(虚拟专用服务器)
  - 科学上网工具

#### VPS服务器

对比了阿里云国际版、谷歌云、AWS等巨头产品，以及VULTR、搬瓦工等服务商，最终选择了`VULTR`，主要原因在于：
  1. 价格便宜： 最便宜的有$2.5/月的服务，价格是王道；
  2. 机房众多：拥有日本、美国、欧洲等 17 个机房；
  3. 架构优秀：全部采用 KVM 架构、SSD 固态硬盘、500G/月流量起步；
  4. 后台强大 ：拥有系统快照、一键装机部署脚本、备份、防火墙等强大功能，从 VPS 这点丝毫不输给阿里云。
  5. 计费灵活 : 采用小时计费模式，可以任意的添加和删除机器 , 并且是单向流量收费 , 也就是只计算下载的的流量;
  6. 支持支付宝/微信支付，国内用户购买方便；

注册购买请进入官网自行操作：[vultr官网](https://www.vultr.com/)


#### 科学上网工具

本文主要实现v2ray 和 Trojan 两个工具的搭建


### SSH免密登录vultr服务器

1. 在本机生成密钥（如果已经有了不用重复生成）：

```bash
ssh-keygen -t rsa
```

2. 将本地公钥拷贝到服务器的`~/.ssh/authorized_keys`目录中：

```bash
# 方法一
ssh-copy-id user@ip

# 法二
# 将 本机 ~/.ssh目录中的 id_rsa.pub 这个文件拷贝到服务器 的~/.ssh目录中
scp ~/.ssh/id_rsa.pub user@ip:~/.ssh/

# 在服务器运行以下命令来将公钥导入到~/.ssh/authorized_keys这个文件中
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys


# authorized_keys的权限要是600。
chmod 600 .ssh/authorized_keys
```
user: 服务器用户名，默认为root
ip: 服务器公网IP

至此，就可以用下面命令免密登录了：
```bash
ssh user@ip
```

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfopr1r33xj30pk0gpaar.jpg)


### v2ray安装与配置

登录了云服务后，就可以开始下载安装v2ray了，执行以下命令：
```bash
wget https://install.direct/go.sh

chmod +x go.sh

./go.sh
```

执行成功后，会输出 V2Ray v4.24.2 is installed. 等字样。

安装V2Ray后， 会在`/etc/v2ray/config.json`默认生成配置文件，我们需要编辑这个文件：

```bash
vi /etc/v2ray/config.json
```

然后连续按 d 键，将原本的文件内容清空，然后按 i 键开启编辑模式，复制以下配置

```json
{
  "log": {
    "access": "/var/log/v2ray/access.log",
    "error": "/var/log/v2ray/error.log",
    "loglevel": "warning"
  },
  "inbound": {
    "port": 9751,
    "protocol": "vmess",
    "settings": {
      "clients": [
        {
          "id": "392029fa-a9e0-42e3-93cb-97a9288795ed",
          "level": 1,
          "alterId": 100
        }
      ]
    },
    "streamSettings": {
      "network": "tcp"
    },
    "detour": {
      "to": "vmess-detour-118345"
    }
  },
  "outbound": {
    "protocol": "freedom",
    "settings": {}
  },
  "inboundDetour": [
    {
      "protocol": "vmess",
      "port": "10000-10010",
      "tag": "vmess-detour-118345",
      "settings": {},
      "allocate": {
        "strategy": "random",
        "concurrency": 5,
        "refresh": 5
      },
      "streamSettings": {
        "network": "kcp"
      }
    }
  ],
  "outboundDetour": [
    {
      "protocol": "blackhole",
      "settings": {},
      "tag": "blocked"
    }
  ],
  "routing": {
    "strategy": "rules",
    "settings": {
      "rules": [
        {
          "type": "field",
          "ip": [
            "0.0.0.0/8",
            "10.0.0.0/8",
            "100.64.0.0/10",
            "127.0.0.0/8",
            "169.254.0.0/16",
            "172.16.0.0/12",
            "192.0.0.0/24",
            "192.0.2.0/24",
            "192.168.0.0/16",
            "198.18.0.0/15",
            "198.51.100.0/24",
            "203.0.113.0/24",
            "::1/128",
            "fc00::/7",
            "fe80::/10"
          ],
          "outboundTag": "blocked"
        }
      ]
    }
  }
}
```

上述配置中可根据自己的喜好进行相应修改，也可直接使用不做修改。

保存并退出编辑模式，再启动v2ray服务，服务端的配置就完成了。
```bash
systemctl start v2ray
```

v2ray进程管理命令：
```bash
# 查看 v2ray 进程状态
systemctl status v2ray

# 启动
systemctl start v2ray

# 重启
systemctl restart v2ray

# 关闭
systemctl stop v2ray
```


### 配置防火墙

CentOS 7 系统默认会开启防火墙，需要开放上面配置的端口：

```bash
firewall-cmd --permanent --add-service=https
# 或者
firewall-cmd --zone=public --add-port=9751/tcp --permanent
```

– zone #作用域

– add-port=80/tcp #添加端口，格式为：端口/通讯协议

– permanent #永久生效，没有此参数重启后失效

防火墙其他相关命令：

```bash
systemctl status firewalld # 查看防火墙状态
firewall-cmd --reload #重启firewall
systemctl restart firewalld # 重启2
systemctl stop firewalld.service #停止firewall
systemctl disable firewalld.service #禁止firewall开机启动
firewall-cmd --state #查看默认防火墙状态（关闭后显示notrunning，开启后显示running）

firewall-cmd --list-ports  # 查看已经开放的端口
```

至此，服务端部分就算完成了。下面开始客户端配置。

### V2Ray 客户端

- Mac端

Mac端使用的是[ClashX](https://github.com/yichengchen/clashX/releases)客户端。安装下载后打开配置文件夹：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfoqnszotfj30ad0c0mya.jpg)

新建一个`.yaml`配置文件，具体配置如下：

```yaml
port: 7890
socks-port: 7891
redir-port: 7892
allow-lan: false
mode: Rule
log-level: info
external-controller: 127.0.0.1:9090
secret: ""
cfw-bypass:
  - localhost
  - 127.*
  - 10.*
  - 172.16.*
  - 172.17.*
  - 172.18.*
  - 172.19.*
  - 172.20.*
  - 172.21.*
  - 172.22.*
  - 172.23.*
  - 172.24.*
  - 172.25.*
  - 172.26.*
  - 172.27.*
  - 172.28.*
  - 172.29.*
  - 172.30.*
  - 172.31.*
  - 192.168.*
  - <local>
cfw-latency-timeout: 3000
Proxy:
  - name: V2-NewJersey
    type: vmess
    server: 208.167.222.200 # 服务器公网IP
    port: "9751" # v2ray配置的端口
    uuid: 392029fa-a9e0-42e3-93cb-97a9288795ed # v2ray的uuid
    alterId: "100" # v2ray的额外ID
    cipher: auto
    network: tcp # 传输协议
Proxy Group:
  - name: CroLAX
    type: select
    proxies:
      - V2-NewJersey
Rule:
  - DOMAIN,hls.itunes.apple.com,CroLAX
  - DOMAIN,itunes.apple.com,CroLAX
  - DOMAIN,itunes.com,CroLAX
  - DOMAIN-SUFFIX,icloud.com,DIRECT
  - DOMAIN-SUFFIX,icloud-content.com,DIRECT
  - DOMAIN-SUFFIX,me.com,DIRECT
  - DOMAIN-SUFFIX,mzstatic.com,DIRECT
  - DOMAIN-SUFFIX,akadns.net,DIRECT
  - DOMAIN-SUFFIX,aaplimg.com,DIRECT
  - DOMAIN-SUFFIX,cdn-apple.com,DIRECT
  - DOMAIN-SUFFIX,apple.com,DIRECT
  ## 国内网站
  - DOMAIN-SUFFIX,cn,DIRECT
  - DOMAIN-KEYWORD,-cn,DIRECT
  - DOMAIN-SUFFIX,126.com,DIRECT
  - DOMAIN-SUFFIX,126.net,DIRECT
  - DOMAIN-SUFFIX,127.net,DIRECT
  - DOMAIN-SUFFIX,163.com,DIRECT
  - DOMAIN-SUFFIX,360buyimg.com,DIRECT
  - DOMAIN-SUFFIX,36kr.com,DIRECT
  - DOMAIN-SUFFIX,acfun.tv,DIRECT
  - DOMAIN-SUFFIX,air-matters.com,DIRECT
  - DOMAIN-SUFFIX,aixifan.com,DIRECT
  - DOMAIN-SUFFIX,akamaized.net,DIRECT
  - DOMAIN-KEYWORD,alicdn,DIRECT
  - DOMAIN-KEYWORD,alipay,DIRECT
  - DOMAIN-KEYWORD,taobao,DIRECT
  - DOMAIN-SUFFIX,amap.com,DIRECT
  - DOMAIN-SUFFIX,autonavi.com,DIRECT
  - DOMAIN-KEYWORD,baidu,DIRECT
  - DOMAIN-SUFFIX,bdimg.com,DIRECT
  - DOMAIN-SUFFIX,bdstatic.com,DIRECT
  - DOMAIN-SUFFIX,bilibili.com,DIRECT
  - DOMAIN-SUFFIX,caiyunapp.com,DIRECT
  - DOMAIN-SUFFIX,clouddn.com,DIRECT
  - DOMAIN-SUFFIX,cnbeta.com,DIRECT
  - DOMAIN-SUFFIX,cnbetacdn.com,DIRECT
  - DOMAIN-SUFFIX,cootekservice.com,DIRECT
  - DOMAIN-SUFFIX,csdn.net,DIRECT
  - DOMAIN-SUFFIX,ctrip.com,DIRECT
  - DOMAIN-SUFFIX,dgtle.com,DIRECT
  - DOMAIN-SUFFIX,dianping.com,DIRECT
  - DOMAIN-SUFFIX,douban.com,DIRECT
  - DOMAIN-SUFFIX,doubanio.com,DIRECT
  - DOMAIN-SUFFIX,duokan.com,DIRECT
  - DOMAIN-SUFFIX,easou.com,DIRECT
  - DOMAIN-SUFFIX,ele.me,DIRECT
  - DOMAIN-SUFFIX,feng.com,DIRECT
  - DOMAIN-SUFFIX,fir.im,DIRECT
  - DOMAIN-SUFFIX,frdic.com,DIRECT
  - DOMAIN-SUFFIX,g-cores.com,DIRECT
  - DOMAIN-SUFFIX,godic.net,DIRECT
  - DOMAIN-SUFFIX,gtimg.com,DIRECT
  - DOMAIN-SUFFIX,hongxiu.com,DIRECT
  - DOMAIN-SUFFIX,hxcdn.net,DIRECT
  - DOMAIN-SUFFIX,iciba.com,DIRECT
  - DOMAIN-SUFFIX,ifeng.com,DIRECT
  - DOMAIN-SUFFIX,ifengimg.com,DIRECT
  - DOMAIN-SUFFIX,ipip.net,DIRECT
  - DOMAIN-SUFFIX,iqiyi.com,DIRECT
  - DOMAIN-SUFFIX,jd.com,DIRECT
  - DOMAIN-SUFFIX,jianshu.com,DIRECT
  - DOMAIN-SUFFIX,knewone.com,DIRECT
  - DOMAIN-SUFFIX,le.com,DIRECT
  - DOMAIN-SUFFIX,lecloud.com,DIRECT
  - DOMAIN-SUFFIX,lemicp.com,DIRECT
  - DOMAIN-SUFFIX,licdn.com,DIRECT
  - DOMAIN-SUFFIX,linkedin.com,DIRECT
  - DOMAIN-SUFFIX,luoo.net,DIRECT
  - DOMAIN-SUFFIX,meituan.com,DIRECT
  - DOMAIN-SUFFIX,meituan.net,DIRECT
  - DOMAIN-SUFFIX,mi.com,DIRECT
  - DOMAIN-SUFFIX,miaopai.com,DIRECT
  - DOMAIN-SUFFIX,microsoft.com,DIRECT
  - DOMAIN-SUFFIX,microsoftonline.com,DIRECT
  - DOMAIN-SUFFIX,miui.com,DIRECT
  - DOMAIN-SUFFIX,miwifi.com,DIRECT
  - DOMAIN-SUFFIX,mob.com,DIRECT
  - DOMAIN-SUFFIX,netease.com,DIRECT
  - DOMAIN-SUFFIX,office.com,DIRECT
  - DOMAIN-KEYWORD,officecdn,DIRECT
  - DOMAIN-SUFFIX,office365.com,DIRECT
  - DOMAIN-SUFFIX,oschina.net,DIRECT
  - DOMAIN-SUFFIX,ppsimg.com,DIRECT
  - DOMAIN-SUFFIX,pstatp.com,DIRECT
  - DOMAIN-SUFFIX,qcloud.com,DIRECT
  - DOMAIN-SUFFIX,qdaily.com,DIRECT
  - DOMAIN-SUFFIX,qdmm.com,DIRECT
  - DOMAIN-SUFFIX,qhimg.com,DIRECT
  - DOMAIN-SUFFIX,qhres.com,DIRECT
  - DOMAIN-SUFFIX,qidian.com,DIRECT
  - DOMAIN-SUFFIX,qihucdn.com,DIRECT
  - DOMAIN-SUFFIX,qiniu.com,DIRECT
  - DOMAIN-SUFFIX,qiniucdn.com,DIRECT
  - DOMAIN-SUFFIX,qiyipic.com,DIRECT
  - DOMAIN-SUFFIX,qq.com,DIRECT
  - DOMAIN-SUFFIX,qqurl.com,DIRECT
  - DOMAIN-SUFFIX,rarbg.to,DIRECT
  - DOMAIN-SUFFIX,ruguoapp.com,DIRECT
  - DOMAIN-SUFFIX,segmentfault.com,DIRECT
  - DOMAIN-SUFFIX,sinaapp.com,DIRECT
  - DOMAIN-SUFFIX,smzdm.com,DIRECT
  - DOMAIN-SUFFIX,sogou.com,DIRECT
  - DOMAIN-SUFFIX,sogoucdn.com,DIRECT
  - DOMAIN-SUFFIX,sohu.com,DIRECT
  - DOMAIN-SUFFIX,soku.com,DIRECT
  - DOMAIN-SUFFIX,speedtest.net,DIRECT
  - DOMAIN-SUFFIX,sspai.com,DIRECT
  - DOMAIN-SUFFIX,suning.com,DIRECT
  - DOMAIN-SUFFIX,taobao.com,DIRECT
  - DOMAIN-SUFFIX,tencent.com,DIRECT
  - DOMAIN-SUFFIX,tenpay.com,DIRECT
  - DOMAIN-SUFFIX,tianyancha.com,DIRECT
  - DOMAIN-SUFFIX,tmall.com,DIRECT
  - DOMAIN-SUFFIX,tudou.com,DIRECT
  - DOMAIN-SUFFIX,umetrip.com,DIRECT
  - DOMAIN-SUFFIX,upaiyun.com,DIRECT
  - DOMAIN-SUFFIX,upyun.com,DIRECT
  - DOMAIN-SUFFIX,v2ex.com,DIRECT
  - DOMAIN-SUFFIX,veryzhun.com,DIRECT
  - DOMAIN-SUFFIX,weather.com,DIRECT
  - DOMAIN-SUFFIX,weibo.com,DIRECT
  - DOMAIN-SUFFIX,xiami.com,DIRECT
  - DOMAIN-SUFFIX,xiami.net,DIRECT
  - DOMAIN-SUFFIX,xiaomicp.com,DIRECT
  - DOMAIN-SUFFIX,ximalaya.com,DIRECT
  - DOMAIN-SUFFIX,xmcdn.com,DIRECT
  - DOMAIN-SUFFIX,xunlei.com,DIRECT
  - DOMAIN-SUFFIX,yhd.com,DIRECT
  - DOMAIN-SUFFIX,yihaodianimg.com,DIRECT
  - DOMAIN-SUFFIX,yinxiang.com,DIRECT
  - DOMAIN-SUFFIX,ykimg.com,DIRECT
  - DOMAIN-SUFFIX,youdao.com,DIRECT
  - DOMAIN-SUFFIX,youku.com,DIRECT
  - DOMAIN-SUFFIX,zealer.com,DIRECT
  - DOMAIN-SUFFIX,zhihu.com,DIRECT
  - DOMAIN-SUFFIX,zhimg.com,DIRECT
  - DOMAIN-SUFFIX,zimuzu.tv,DIRECT
  - DOMAIN-KEYWORD,netflix,CroLAX
  - DOMAIN-KEYWORD,nflx,CroLAX
  ## 抗 DNS 污染
  - DOMAIN-KEYWORD,amazon,CroLAX
  - DOMAIN-KEYWORD,google,CroLAX
  - DOMAIN-KEYWORD,gmail,CroLAX
  - DOMAIN-KEYWORD,youtube,CroLAX
  - DOMAIN-KEYWORD,facebook,CroLAX
  - DOMAIN-SUFFIX,fb.me,CroLAX
  - DOMAIN-SUFFIX,fbcdn.net,CroLAX
  - DOMAIN-KEYWORD,twitter,CroLAX
  - DOMAIN-KEYWORD,instagram,CroLAX
  - DOMAIN-KEYWORD,dropbox,CroLAX
  - DOMAIN-SUFFIX,twimg.com,CroLAX
  - DOMAIN-KEYWORD,blogspot,CroLAX
  - DOMAIN-SUFFIX,youtu.be,CroLAX
  - DOMAIN-KEYWORD,whatsapp,CroLAX
  ## 国外网站
  - DOMAIN-SUFFIX,9to5mac.com,CroLAX
  - DOMAIN-SUFFIX,abpchina.org,CroLAX
  - DOMAIN-SUFFIX,adblockplus.org,CroLAX
  - DOMAIN-SUFFIX,adobe.com,CroLAX
  - DOMAIN-SUFFIX,alfredapp.com,CroLAX
  - DOMAIN-SUFFIX,amplitude.com,CroLAX
  - DOMAIN-SUFFIX,ampproject.org,CroLAX
  - DOMAIN-SUFFIX,android.com,CroLAX
  - DOMAIN-SUFFIX,angularjs.org,CroLAX
  - DOMAIN-SUFFIX,aolcdn.com,CroLAX
  - DOMAIN-SUFFIX,apkpure.com,CroLAX
  - DOMAIN-SUFFIX,appledaily.com,CroLAX
  - DOMAIN-SUFFIX,appshopper.com,CroLAX
  - DOMAIN-SUFFIX,appspot.com,CroLAX
  - DOMAIN-SUFFIX,arcgis.com,CroLAX
  - DOMAIN-SUFFIX,archive.org,CroLAX
  - DOMAIN-SUFFIX,armorgames.com,CroLAX
  - DOMAIN-SUFFIX,aspnetcdn.com,CroLAX
  - DOMAIN-SUFFIX,att.com,CroLAX
  - DOMAIN-SUFFIX,awsstatic.com,CroLAX
  - DOMAIN-SUFFIX,azureedge.net,CroLAX
  - DOMAIN-SUFFIX,azurewebsites.net,CroLAX
  - DOMAIN-SUFFIX,bing.com,CroLAX
  - DOMAIN-SUFFIX,bintray.com,CroLAX
  - DOMAIN-SUFFIX,bit.com,CroLAX
  - DOMAIN-SUFFIX,bit.ly,CroLAX
  - DOMAIN-SUFFIX,bitbucket.org,CroLAX
  - DOMAIN-SUFFIX,bjango.com,CroLAX
  - DOMAIN-SUFFIX,bkrtx.com,CroLAX
  - DOMAIN-SUFFIX,blog.com,CroLAX
  - DOMAIN-SUFFIX,blogcdn.com,CroLAX
  - DOMAIN-SUFFIX,blogger.com,CroLAX
  - DOMAIN-SUFFIX,blogsmithmedia.com,CroLAX
  - DOMAIN-SUFFIX,blogspot.com,CroLAX
  - DOMAIN-SUFFIX,blogspot.hk,CroLAX
  - DOMAIN-SUFFIX,bloomberg.com,CroLAX
  - DOMAIN-SUFFIX,box.com,CroLAX
  - DOMAIN-SUFFIX,box.net,CroLAX
  - DOMAIN-SUFFIX,cachefly.net,CroLAX
  - DOMAIN-SUFFIX,chromium.org,CroLAX
  - DOMAIN-SUFFIX,cl.ly,CroLAX
  - DOMAIN-SUFFIX,cloudflare.com,CroLAX
  - DOMAIN-SUFFIX,cloudfront.net,CroLAX
  - DOMAIN-SUFFIX,cloudmagic.com,CroLAX
  - DOMAIN-SUFFIX,cmail19.com,CroLAX
  - DOMAIN-SUFFIX,cnet.com,CroLAX
  - DOMAIN-SUFFIX,cocoapods.org,CroLAX
  - DOMAIN-SUFFIX,comodoca.com,CroLAX
  - DOMAIN-SUFFIX,crashlytics.com,CroLAX
  - DOMAIN-SUFFIX,culturedcode.com,CroLAX
  - DOMAIN-SUFFIX,d.pr,CroLAX
  - DOMAIN-SUFFIX,danilo.to,CroLAX
  - DOMAIN-SUFFIX,dayone.me,CroLAX
  - DOMAIN-SUFFIX,db.tt,CroLAX
  - DOMAIN-SUFFIX,deskconnect.com,CroLAX
  - DOMAIN-SUFFIX,disq.us,CroLAX
  - DOMAIN-SUFFIX,disqus.com,CroLAX
  - DOMAIN-SUFFIX,disquscdn.com,CroLAX
  - DOMAIN-SUFFIX,dnsimple.com,CroLAX
  - DOMAIN-SUFFIX,docker.com,CroLAX
  - DOMAIN-SUFFIX,dribbble.com,CroLAX
  - DOMAIN-SUFFIX,droplr.com,CroLAX
  - DOMAIN-SUFFIX,duckduckgo.com,CroLAX
  - DOMAIN-SUFFIX,dueapp.com,CroLAX
  - DOMAIN-SUFFIX,dytt8.net,CroLAX
  - DOMAIN-SUFFIX,edgecastcdn.net,CroLAX
  - DOMAIN-SUFFIX,edgekey.net,CroLAX
  - DOMAIN-SUFFIX,edgesuite.net,CroLAX
  - DOMAIN-SUFFIX,engadget.com,CroLAX
  - DOMAIN-SUFFIX,entrust.net,CroLAX
  - DOMAIN-SUFFIX,eurekavpt.com,CroLAX
  - DOMAIN-SUFFIX,evernote.com,CroLAX
  - DOMAIN-SUFFIX,fabric.io,CroLAX
  - DOMAIN-SUFFIX,fast.com,CroLAX
  - DOMAIN-SUFFIX,fastly.net,CroLAX
  - DOMAIN-SUFFIX,fc2.com,CroLAX
  - DOMAIN-SUFFIX,feedburner.com,CroLAX
  - DOMAIN-SUFFIX,feedly.com,CroLAX
  - DOMAIN-SUFFIX,feedsportal.com,CroLAX
  - DOMAIN-SUFFIX,fiftythree.com,CroLAX
  - DOMAIN-SUFFIX,firebaseio.com,CroLAX
  - DOMAIN-SUFFIX,flexibits.com,CroLAX
  - DOMAIN-SUFFIX,flickr.com,CroLAX
  - DOMAIN-SUFFIX,flipboard.com,CroLAX
  - DOMAIN-SUFFIX,g.co,CroLAX
  - DOMAIN-SUFFIX,gabia.net,CroLAX
  - DOMAIN-SUFFIX,geni.us,CroLAX
  - DOMAIN-SUFFIX,gfx.ms,CroLAX
  - DOMAIN-SUFFIX,ggpht.com,CroLAX
  - DOMAIN-SUFFIX,ghostnoteapp.com,CroLAX
  - DOMAIN-SUFFIX,git.io,CroLAX
  - DOMAIN-KEYWORD,github,CroLAX
  - DOMAIN-SUFFIX,globalsign.com,CroLAX
  - DOMAIN-SUFFIX,gmodules.com,CroLAX
  - DOMAIN-SUFFIX,godaddy.com,CroLAX
  - DOMAIN-SUFFIX,golang.org,CroLAX
  - DOMAIN-SUFFIX,gongm.in,CroLAX
  - DOMAIN-SUFFIX,goo.gl,CroLAX
  - DOMAIN-SUFFIX,goodreaders.com,CroLAX
  - DOMAIN-SUFFIX,goodreads.com,CroLAX
  - DOMAIN-SUFFIX,gravatar.com,CroLAX
  - DOMAIN-SUFFIX,gstatic.com,CroLAX
  - DOMAIN-SUFFIX,gvt0.com,CroLAX
  - DOMAIN-SUFFIX,hockeyapp.net,CroLAX
  - DOMAIN-SUFFIX,hotmail.com,CroLAX
  - DOMAIN-SUFFIX,icons8.com,CroLAX
  - DOMAIN-SUFFIX,ift.tt,CroLAX
  - DOMAIN-SUFFIX,ifttt.com,CroLAX
  - DOMAIN-SUFFIX,iherb.com,CroLAX
  - DOMAIN-SUFFIX,imageshack.us,CroLAX
  - DOMAIN-SUFFIX,img.ly,CroLAX
  - DOMAIN-SUFFIX,imgur.com,CroLAX
  - DOMAIN-SUFFIX,imore.com,CroLAX
  - DOMAIN-SUFFIX,instapaper.com,CroLAX
  - DOMAIN-SUFFIX,ipn.li,CroLAX
  - DOMAIN-SUFFIX,is.gd,CroLAX
  - DOMAIN-SUFFIX,issuu.com,CroLAX
  - DOMAIN-SUFFIX,itgonglun.com,CroLAX
  - DOMAIN-SUFFIX,itun.es,CroLAX
  - DOMAIN-SUFFIX,ixquick.com,CroLAX
  - DOMAIN-SUFFIX,j.mp,CroLAX
  - DOMAIN-SUFFIX,js.revsci.net,CroLAX
  - DOMAIN-SUFFIX,jshint.com,CroLAX
  - DOMAIN-SUFFIX,jtvnw.net,CroLAX
  - DOMAIN-SUFFIX,justgetflux.com,CroLAX
  - DOMAIN-SUFFIX,kat.cr,CroLAX
  - DOMAIN-SUFFIX,klip.me,CroLAX
  - DOMAIN-SUFFIX,libsyn.com,CroLAX
  - DOMAIN-SUFFIX,linode.com,CroLAX
  - DOMAIN-SUFFIX,lithium.com,CroLAX
  - DOMAIN-SUFFIX,littlehj.com,CroLAX
  - DOMAIN-SUFFIX,live.com,CroLAX
  - DOMAIN-SUFFIX,live.net,CroLAX
  - DOMAIN-SUFFIX,livefilestore.com,CroLAX
  - DOMAIN-SUFFIX,llnwd.net,CroLAX
  - DOMAIN-SUFFIX,macid.co,CroLAX
  - DOMAIN-SUFFIX,macromedia.com,CroLAX
  - DOMAIN-SUFFIX,macrumors.com,CroLAX
  - DOMAIN-SUFFIX,mashable.com,CroLAX
  - DOMAIN-SUFFIX,mathjax.org,CroLAX
  - DOMAIN-SUFFIX,medium.com,CroLAX
  - DOMAIN-SUFFIX,mega.co.nz,CroLAX
  - DOMAIN-SUFFIX,mega.nz,CroLAX
  - DOMAIN-SUFFIX,megaupload.com,CroLAX
  - DOMAIN-SUFFIX,microsofttranslator.com,CroLAX
  - DOMAIN-SUFFIX,mindnode.com,CroLAX
  - DOMAIN-SUFFIX,mobile01.com,CroLAX
  - DOMAIN-SUFFIX,modmyi.com,CroLAX
  - DOMAIN-SUFFIX,msedge.net,CroLAX
  - DOMAIN-SUFFIX,myfontastic.com,CroLAX
  - DOMAIN-SUFFIX,name.com,CroLAX
  - DOMAIN-SUFFIX,nextmedia.com,CroLAX
  - DOMAIN-SUFFIX,nsstatic.net,CroLAX
  - DOMAIN-SUFFIX,nssurge.com,CroLAX
  - DOMAIN-SUFFIX,nyt.com,CroLAX
  - DOMAIN-SUFFIX,nytimes.com,CroLAX
  - DOMAIN-SUFFIX,omnigroup.com,CroLAX
  - DOMAIN-SUFFIX,onedrive.com,CroLAX
  - DOMAIN-SUFFIX,onenote.com,CroLAX
  - DOMAIN-SUFFIX,ooyala.com,CroLAX
  - DOMAIN-SUFFIX,openvpn.net,CroLAX
  - DOMAIN-SUFFIX,openwrt.org,CroLAX
  - DOMAIN-SUFFIX,orkut.com,CroLAX
  - DOMAIN-SUFFIX,osxdaily.com,CroLAX
  - DOMAIN-SUFFIX,outlook.com,CroLAX
  - DOMAIN-SUFFIX,ow.ly,CroLAX
  - DOMAIN-SUFFIX,paddleapi.com,CroLAX
  - DOMAIN-SUFFIX,parallels.com,CroLAX
  - DOMAIN-SUFFIX,parse.com,CroLAX
  - DOMAIN-SUFFIX,pdfexpert.com,CroLAX
  - DOMAIN-SUFFIX,periscope.tv,CroLAX
  - DOMAIN-SUFFIX,pinboard.in,CroLAX
  - DOMAIN-SUFFIX,pinterest.com,CroLAX
  - DOMAIN-SUFFIX,pixelmator.com,CroLAX
  - DOMAIN-SUFFIX,pixiv.net,CroLAX
  - DOMAIN-SUFFIX,playpcesor.com,CroLAX
  - DOMAIN-SUFFIX,playstation.com,CroLAX
  - DOMAIN-SUFFIX,playstation.com.hk,CroLAX
  - DOMAIN-SUFFIX,playstation.net,CroLAX
  - DOMAIN-SUFFIX,playstationnetwork.com,CroLAX
  - DOMAIN-SUFFIX,pushwoosh.com,CroLAX
  - DOMAIN-SUFFIX,rime.im,CroLAX
  - DOMAIN-SUFFIX,servebom.com,CroLAX
  - DOMAIN-SUFFIX,sfx.ms,CroLAX
  - DOMAIN-SUFFIX,shadowsocks.org,CroLAX
  - DOMAIN-SUFFIX,sharethis.com,CroLAX
  - DOMAIN-SUFFIX,shazam.com,CroLAX
  - DOMAIN-SUFFIX,skype.com,CroLAX
  - DOMAIN-SUFFIX,smartdnsProxy.com,CroLAX
  - DOMAIN-SUFFIX,smartmailcloud.com,CroLAX
  - DOMAIN-SUFFIX,sndcdn.com,CroLAX
  - DOMAIN-SUFFIX,sony.com,CroLAX
  - DOMAIN-SUFFIX,soundcloud.com,CroLAX
  - DOMAIN-SUFFIX,sourceforge.net,CroLAX
  - DOMAIN-SUFFIX,spotify.com,CroLAX
  - DOMAIN-SUFFIX,squarespace.com,CroLAX
  - DOMAIN-SUFFIX,sstatic.net,CroLAX
  - DOMAIN-SUFFIX,st.luluku.pw,CroLAX
  - DOMAIN-SUFFIX,stackoverflow.com,CroLAX
  - DOMAIN-SUFFIX,startpage.com,CroLAX
  - DOMAIN-SUFFIX,staticflickr.com,CroLAX
  - DOMAIN-SUFFIX,steamcommunity.com,CroLAX
  - DOMAIN-SUFFIX,symauth.com,CroLAX
  - DOMAIN-SUFFIX,symcb.com,CroLAX
  - DOMAIN-SUFFIX,symcd.com,CroLAX
  - DOMAIN-SUFFIX,tapbots.com,CroLAX
  - DOMAIN-SUFFIX,tapbots.net,CroLAX
  - DOMAIN-SUFFIX,tdesktop.com,CroLAX
  - DOMAIN-SUFFIX,techcrunch.com,CroLAX
  - DOMAIN-SUFFIX,techsmith.com,CroLAX
  - DOMAIN-SUFFIX,thepiratebay.org,CroLAX
  - DOMAIN-SUFFIX,theverge.com,CroLAX
  - DOMAIN-SUFFIX,time.com,CroLAX
  - DOMAIN-SUFFIX,timeinc.net,CroLAX
  - DOMAIN-SUFFIX,tiny.cc,CroLAX
  - DOMAIN-SUFFIX,tinypic.com,CroLAX
  - DOMAIN-SUFFIX,tmblr.co,CroLAX
  - DOMAIN-SUFFIX,todoist.com,CroLAX
  - DOMAIN-SUFFIX,trello.com,CroLAX
  - DOMAIN-SUFFIX,trustasiassl.com,CroLAX
  - DOMAIN-SUFFIX,tumblr.co,CroLAX
  - DOMAIN-SUFFIX,tumblr.com,CroLAX
  - DOMAIN-SUFFIX,tweetdeck.com,CroLAX
  - DOMAIN-SUFFIX,tweetmarker.net,CroLAX
  - DOMAIN-SUFFIX,twitch.tv,CroLAX
  - DOMAIN-SUFFIX,txmblr.com,CroLAX
  - DOMAIN-SUFFIX,typekit.net,CroLAX
  - DOMAIN-SUFFIX,ubertags.com,CroLAX
  - DOMAIN-SUFFIX,ublock.org,CroLAX
  - DOMAIN-SUFFIX,ubnt.com,CroLAX
  - DOMAIN-SUFFIX,ulyssesapp.com,CroLAX
  - DOMAIN-SUFFIX,urchin.com,CroLAX
  - DOMAIN-SUFFIX,usertrust.com,CroLAX
  - DOMAIN-SUFFIX,v.gd,CroLAX
  - DOMAIN-SUFFIX,vimeo.com,CroLAX
  - DOMAIN-SUFFIX,vimeocdn.com,CroLAX
  - DOMAIN-SUFFIX,vine.co,CroLAX
  - DOMAIN-SUFFIX,vivaldi.com,CroLAX
  - DOMAIN-SUFFIX,vox-cdn.com,CroLAX
  - DOMAIN-SUFFIX,vsco.co,CroLAX
  - DOMAIN-SUFFIX,vultr.com,CroLAX
  - DOMAIN-SUFFIX,w.org,CroLAX
  - DOMAIN-SUFFIX,w3schools.com,CroLAX
  - DOMAIN-SUFFIX,webtype.com,CroLAX
  - DOMAIN-SUFFIX,wikiwand.com,CroLAX
  - DOMAIN-SUFFIX,wikileaks.org,CroLAX
  - DOMAIN-SUFFIX,wikimedia.org,CroLAX
  - DOMAIN-SUFFIX,wikipedia.com,CroLAX
  - DOMAIN-SUFFIX,wikipedia.org,CroLAX
  - DOMAIN-SUFFIX,windows.com,CroLAX
  - DOMAIN-SUFFIX,windows.net,CroLAX
  - DOMAIN-SUFFIX,wire.com,CroLAX
  - DOMAIN-SUFFIX,wordpress.com,CroLAX
  - DOMAIN-SUFFIX,workflowy.com,CroLAX
  - DOMAIN-SUFFIX,wp.com,CroLAX
  - DOMAIN-SUFFIX,wsj.com,CroLAX
  - DOMAIN-SUFFIX,wsj.net,CroLAX
  - DOMAIN-SUFFIX,xda-developers.com,CroLAX
  - DOMAIN-SUFFIX,xeeno.com,CroLAX
  - DOMAIN-SUFFIX,xiti.com,CroLAX
  - DOMAIN-SUFFIX,yahoo.com,CroLAX
  - DOMAIN-SUFFIX,yimg.com,CroLAX
  - DOMAIN-SUFFIX,ying.com,CroLAX
  - DOMAIN-SUFFIX,yoyo.org,CroLAX
  - DOMAIN-SUFFIX,ytimg.com,CroLAX
  - DOMAIN-SUFFIX,telegram.me,CroLAX
  - IP-CIDR,91.108.4.0/22,CroLAX
  - IP-CIDR,91.108.8.0/22,CroLAX
  - IP-CIDR,91.108.56.0/22,CroLAX
  - IP-CIDR,109.239.140.0/24,CroLAX
  - IP-CIDR,149.154.160.0/20,CroLAX
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,17.0.0.0/8,DIRECT
  - IP-CIDR,100.64.0.0/10,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,,CroLAX
```

主要关注注释代码部分，更加详细的ClashX配置说明请参加 [此文](https://www.v2rayssr.com/clashxx.html)。


- windows端

windows端使用[v2rayN](https://github.com/2dust/v2rayN/releases)软件，安装后点击服务器 -> 添加[VMess]服务器, 具体配置如下：

![](https://tva1.sinaimg.cn/large/007S8ZIlly1gformgphhaj30kh0gqq3b.jpg)


### 配置 BBR 加速

TCP BBR 是谷歌在 2016 年 9 月开源的一个优化 TCP 拥塞的算法，并且 Linux 内核从 4.9 版本开始集成该算法，据多方网友反馈，网速甚至可以提升好几个数量级，

一般新版的Linux操作系统以及自带了BBR，不需要手动安装，如果是老系统，可以执行下面命令：
```bash
# 下载脚本
wget --no-check-certificate https://github.com/teddysun/across/raw/master/bbr.sh

# 添加可执行权限
chmod +x bbr.sh

# 运行bbr脚本
./bbr.sh
```

```bash
wget --no-check-certificate https://raw.githubusercontent.com/cx9208/Linux-NetSpeed/master/tcp.sh

chmod +x tcp.sh

./tcp.sh
```

我这边系统以及自带，运行bbr脚本后提示已经安装了，结果如下：
![](https://tva1.sinaimg.cn/large/007S8ZIlly1gfortv177sj30k109vq3t.jpg)

可以验证一下是否成功安装最新内核并开启 TCP BBR，输入以下命令：
```bash
uname -r  # >> 4.18.0-147.8.1.el8_1.x86_64

sysctl net.ipv4.tcp_available_congestion_control  # >> net.ipv4.tcp_available_congestion_control = reno cubic bbr

sysctl net.ipv4.tcp_congestion_control # >> net.ipv4.tcp_congestion_control = bbr

sysctl net.core.default_qdisc # >> net.core.default_qdisc = fq

lsmod | grep bbr # >> tcp_bbr                20480  9
```
返回值有 tcp_bbr 模块即说明bbr已启动。

### Trojan安装教程

Trojan是一个近两年兴起的网络工具，项目官网（[https://github.com/trojan-gfw](https://github.com/trojan-gfw)）。与强调加密和混淆的SS/SSR等工具不同，trojan将通信流量伪装成互联网上最常见的https流量，从而有效防止流量被检测和干扰。

使用Trojan需要一个指向服务器IP的[域名](https://www.hijk.pw/namesilo-buy-domain-tutorial/)以及域名证书。

#### 使用Let’s Encrypt获取免费证书

- 开发端口

certbot 默认使用http方式对域名所有权进行验证，该操作需要绑定vps的80端口。需要开发防火墙端口

```bash
firewall-cmd --zone=public --add-port=80/tcp --permanent
firewall-cmd --zone=public --add-port=443/tcp --permanent
```

如果80端口已被占用，请先停止占用的进程，例如停止Nginx：
```bash
killall nginx
```


- 安装certbot

```bash
yum install -y python3 && pip3 install certbot
```

查看certbot使用方法：

```bash
certbot --help
```

为指定域名生成证书：

```bash
certbot certonly --standalone -d 域名1 -d 域名2
```

查看域名证书的路径和国旗时间

```bash
certbot certificates
```



#### 安装trojan服务端
```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/trojan-gfw/trojan-quickstart/master/trojan-quickstart.sh)"
```

该命令会下载最新版的trojan并安装。安装完毕后，trojan配置文件路径是 /usr/local/etc/trojan/config.json，其初始内容为：
```json
{
    "run_type": "server",
    "local_addr": "0.0.0.0",
    "local_port": 443,
    "remote_addr": "127.0.0.1",
    "remote_port": 80,
    "password": [
        "password1",
        "password2"
    ],
    "log_level": 1,
    "ssl": {
        "cert": "/path/to/certificate.crt",
        "key": "/path/to/private.key",
        "key_password": "",
        "cipher": "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384",
        "cipher_tls13": "TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384",
        "prefer_server_cipher": true,
        "alpn": [
            "http/1.1"
        ],
        "reuse_session": true,
        "session_ticket": false,
        "session_timeout": 600,
        "plain_http_response": "",
        "curves": "",
        "dhparam": ""
    },
    "tcp": {
        "prefer_ipv4": false,
        "no_delay": true,
        "keep_alive": true,
        "reuse_port": false,
        "fast_open": false,
        "fast_open_qlen": 20
    },
    "mysql": {
        "enabled": false,
        "server_addr": "127.0.0.1",
        "server_port": 3306,
        "database": "trojan",
        "username": "trojan",
        "password": ""
    }
}
```

- local_port：监听的端口，默认是443，除非端口被墙，不建议改成其他端口；
- remote_addr和remote_port：非trojan协议时，将请求转发处理的地址和端口。可以是任意有效的ip/域名和端口号，默认是本机和80端口；
- password：密码。需要几个密码就填几行，最后一行结尾不能有逗号；
- cert和key：域名的证书和密钥，Let’s Encrypt申请的证书可用 certbot certificates 查看证书路径；
- key_password：默认没有密码（如果证书文件有密码就要填上）；
- alpn：建议填两行：http/1.1和h2，保持默认也没有问题。

根据自己的情况修改配置，保存，然后设置开机启动：
```bash
systemctl enable trojan
```
启动Trojan：
```bash
systemctl start trojan
```
检查是否运行：
```bash
ss -lp | grep trojan
```


#### 证书自动更新

Let’s Encrypt证书的有效期是三个月，超过期限则需要续签。证书续期可以手动完成，例如：

```bash
systemctl stop trojan
certbot renew
systemctl restart trojan
```

也可以配置crontab任务自动续签，在/etc/crontab文件末添加一行：

```bash
0 0 1 */2 0 root systemctl stop trojan; /usr/local/bin/certbot renew; systemctl restart trojan
```

### Trojan客户端

以Mac端使用ClashX客户端为例，配置如下：

```yaml
Proxy:
  - name: trojan_NJ5
    type: trojan
    server: nj5.kobingo.xyz
    port: 443
    password: OF54OAJN3WZ66882
    # udp: true
    # sni: example.com # aka server name
    alpn:
      - h2
      - http/1.1
    # skip-cert-verify: true
```

### 参考文章

- [Trojan官网](https://trojan-gfw.github.io/trojan/)
- [trojan教程](https://tlanyan.me/trojan-tutorial/)
- [https://github.com/hijkpw/scripts](https://github.com/hijkpw/scripts)
- [trojan一键脚本](https://www.hijk.pw/trojan-one-click-scrip/)
- [Namesilo购买域名详细教程](https://www.hijk.pw/namesilo-buy-domain-tutorial/)
