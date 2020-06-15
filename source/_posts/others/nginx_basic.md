---
title: nginx初试
date: 2019-05-25 18:35:46
tags:
  - 全栈
  - nginx
categories:
  - others
# excerpt: ""
---

> "Nginx 是一款轻量级的 HTTP 服务器，采用事件驱动的异步非阻塞处理方式框架，这让其具有极好的 IO 性能，时常用于服务端的反向代理和负载均衡。"

作为前端开发，即使没用过 Nginx，但一定听说过 Nginx。上述这段描述，基本构成了所有人对 Nginx 的第一印象。笔者对于 Nginx 也是慕名已久，直到现在才开始试尝这道大餐，本文是记录笔者学习并使用 Nginx 的过程，通过此文可以简单入门并搭建一套 Nginx 服务。

 <!-- more -->

### 一、初试 Nginx

想要成为一个合格的大前端，又怎能不会 Nginx 呢？

Nginx 从 2004 年发展至今，从一开始的完善沉淀，再迅速蹿升为“网红”，再到现在占服务器市场中接近 1/3 份额，成为互联网网站搭建的必选技术之一。发展可谓相当迅速，之所以能取得如此成就，主要还是相对于其他 HTTP 服务器其有着不可替代的优势：

- 支持海量高并发：采用 IO 多路复用 epoll。官方测试 Nginx 能够支持 5 万并发链接，实际生产环境中可以支撑 2-4 万并发连接数。
- 内存消耗少：在主流的服务器中 Nginx 目前是内存消耗最小的了，比如我们用 Nginx+PHP，在 3 万并发链接下，开启 10 个 Nginx 进程消耗 150M 内存。
- 免费使用可以商业化：Nginx 为开源软件，采用的是 2-clause BSD-like 协议，可以免费使用，并且可以用于商业。
- 配置文件简单：网络和程序配置通俗易懂，即使非专业运维也能看懂。

而对于前端童鞋，在实际工作上，更倾向于用 Nodejs 来搭建服务器，进而实现一些需求，对 Nginx 有天然的疏远感。的确，Nginx 中的绝大部分功能，如果单纯的使用 Node.js 也可以满足和实现。但实际上，Nginx 和 Node.js 并不冲突，都有自己擅长的领域：Nginx 更擅长于底层服务器端资源的处理（静态资源处理转发、反向代理，负载均衡等），Node.js 更擅长于上层具体业务逻辑的处理。如果将两者组合一起，则可以更加助力前端开发。

开始动手之前先交代下具体的系统环境：

> 系统环境说明：
> 服务器：阿里云 ECS
> 操作系统： CentOS 7.4 64 位
> Nginx 版本：nginx/1.16.1

### 二、Nginx 的安装

首先可以查看下系统的 yum 源下是否有可用的 Nginx 包

```bash
yum list | grep nginx
```

如果结果类似如图内容，说明 yum 源是存在的
![UTOOLS1590462877021.png](http://yanxuan.nosdn.127.net/a46cc75592cd4639abc0dd6f64b5cbff.png)

如果不存在或者没有需要的 Nginx 版本，则可以自己配一个 yum 源。

打开终端，输入

```bash
vim /etc/yum.repos.d/nginx.repo
```

往里面添加如下脚本：

```bash
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/${OS}/${OSRELEASE}/$basearch/
gpgcheck=0
enabled=1
```

> 需要注意：
> OS: 操作系统名称，如：centos
> OSRELEASE: 操作系统版本，如： 7
> 对应的 baseurl: baseurl=http://nginx.org/packages/centos/7/$basearch/

保存修改后，就可以安装 Nginx 了，安装命令：

```bash
yum install nginx
```

安装完成后查看安装的 Nginx 版本:

```bash
nginx -v
```

### 三、Nginx 基本配置

安装完 Nginx 后，需要知道系统中多了那些文件，它们都安装到了那里。可以使用下面的命令进行查看：

```bash
rpm -ql nginx
```

rpm 是 linux 的 rpm 包管理工具，-q 代表询问模式，-l 代表返回列表，这样我们就可以找到 nginx 的所有安装位置了。

下面重点罗列下一些重要的文件

**nginx.conf**

nginx.conf 文件是 Nginx 总配置文件，在我们搭建服务器时经常调整的文件。

进入 etc/nginx 目录下，然后用 vim 进行打开

```bash
cd /etc/nginx
vim nginx.conf
```

下面是文件的详细注释:

```bash
#运行用户，默认即是nginx，可以不进行设置
user  nginx;
#Nginx进程，一般设置为和CPU核数一样
worker_processes  1;
#错误日志存放目录
error_log  /var/log/nginx/error.log warn;
#进程pid存放位置
pid        /var/run/nginx.pid;


events {
    worker_connections  1024; # 单个后台进程的最大并发数
}


http {
    include       /etc/nginx/mime.types;   #文件扩展名与类型映射表
    default_type  application/octet-stream;  #默认文件类型
    #设置日志模式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;   #nginx访问日志存放位置

    sendfile        on;   #开启高效传输模式
    #tcp_nopush     on;    #减少网络报文段的数量

    keepalive_timeout  65;  #保持连接的时间，也叫超时时间

    #gzip  on;  #开启gzip压缩

    include /etc/nginx/conf.d/*.conf; #包含的子配置项位置和文件
}
```

**default.conf**
进入 conf.d 目录，打开 default.conf，内容如下：

```bash
server {
    listen       80;   #配置监听端口
    server_name  localhost;  //配置域名

    #charset koi8-r;
    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;     #服务默认启动目录
        index  index.html index.htm;    #默认访问文件
    }

    #error_page  404              /404.html;   # 配置404页面

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;   #错误状态码的显示页面，配置后需要重启
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

### 四、Nginx 常用操作

#### 启动 Nginx 服务

- Nginx 直接启动（CentOS7.4 以上版本）

```bash
nginx
```

- 使用 systemctl 命令启动

```bash
systemctl start nginx.service
```

- 查看服务运行状态

```bash
ps aux | grep nginx
```

![UTOOLS1590464174436.png](http://yanxuan.nosdn.127.net/98dfae9ae9ddbe95796aa142053b583a.png)

#### 关停 Nginx 服务

- 立即停止服务

```bash
nginx  -s stop
```

这种方法比较强硬，无论进程是否在工作，都直接停止进程。

- 从容停止服务

```bash
nginx -s quit
```

这种方法较 stop 相比就比较温和一些了，需要进程完成当前工作后再停止。

- killall 方法杀死进程

```bash
killall nginx
```

这种方法也是比较野蛮的，直接杀死进程。

- systemctl 停止

```bash
systemctl stop nginx.service
```

#### 重启 Nginx 服务

```bash
systemctl restart nginx.service
```

#### 重新载入配置文件

在重新编写或者修改 Nginx 的配置文件后，需要作一下重新载入，这时候可以用这个命令。

```bash
nginx -s reload
```

#### 查看端口号

如果 80 端口被占用，可以使用此命令查看端口占用情况

```bash
netstat -tlnp 80
```

### 五、自定义错误页面以及访问控制

- 多错误指向一个页面

```bash
error_page   500 502 503 504  /50x.html;
```

- 单独为错误置顶处理方式

```bash
error_page 404  /404_error.html;
```

- 把错误码换成一个地址

```bash
error_page  404 http://kobin.top;
```

- 简单实现访问控制

有时候我们的服务器只允许特定主机访问，比如内部 OA 系统，或者应用的管理后台系统，更或者是某些应用接口，这时候我们就需要控制一些 IP 访问，我们可以直接在 location 里进行配置。

可以直接在 default.conf 里进行配置。

```bash
location / {
        deny   123.9.51.42;
        allow  45.76.202.231;
    }
```

- 指令优先级

```bash
location / {
        allow  45.76.202.231;
        deny   all;
    }
```

上面的配置表示只允许`45.76.202.231`进行访问，其他的 IP 是禁止访问的。但是如果我们把`deny all`指令，移动到 `allow 45.76.202.231`之前，会发生什么那？

会发现所有的 IP 都不允许访问了。这说明了一个问题：就是在同一个块下的两个权限指令，先出现的设置会覆盖后出现的设置（`也就是谁先触发，谁起作用`）。

- 复杂访问控制权限匹配

在工作中，访问权限的控制需求更加复杂，例如，对于网站下的 img（图片目录）是运行所有用户访问，但对于网站下的 admin 目录则只允许公司内部固定 IP 访问。这时候仅靠 deny 和 allow 这两个指令，是无法实现的。我们需要 location 块来完成相关的需求匹配。

上面的需求，配置代码如下：

```bash
    location =/img{
        allow all;
    }
    location =/admin{
        deny all;
    }
```

- 使用正则表达式设置访问权限

只有精确匹配(=)有时是完不成我们的工作任务的，比如现在我们要禁止访问所有 php 的页面，php 的页面大多是后台的管理或者接口代码，所以为了安全我们经常要禁止所有用户访问，而只开放公司内部访问的。

代码如下：

```bash
 location ~\.php$ {
        deny all;
    }
```

这样我们再访问的时候就不能访问以 php 结尾的文件了。是不是让网站变的安全很多了那？

### 六、Nginx 配置虚拟主机

虚拟主机是指在一台物理主机服务器上划分出多个磁盘空间，每个磁盘空间都是一个虚拟主机，每台虚拟主机都可以对外提供 Web 服务，并且互不干扰。用户能够利用虚拟主机把多个不同域名的网站部署在同一台服务器上。可以大大节约服务器成本与维护成本。

- 基于端口号配置虚拟主机

基于端口号来配置虚拟主机，算是 Nginx 中最简单的一种方式了。原理就是 Nginx 监听多个端口，根据不同的端口号，来区分不同的网站

我习惯在 conf.d 里新建一个配置文件来配置新的虚拟主机，但也可以配置在主配置 `etc/nginx/nginx.conf`里，也可以配置在`etc/nginx/conf.d/default.conf`里。

```bash
server{
	listen 8088;
	server_name localhost;
	location / {
          root /usr/share/nginx/html/html8001;
          index index.html;
	}
}
```

- 基于 IP 的虚拟主机

基于 IP 和基于端口的配置几乎一样，只是把`server_name`选项，配置成 IP 就可以了。

```bash
server{
        listen 80;
        server_name 112.74.164.244;
        location / {
            root /usr/share/nginx/html/html8001;
            index index.html;
        }
}
```

- 基于域名的虚拟主机

域名设置虚拟主机也非常简单，主要操作的是配置文件的 `server_name` 项

```bash
server{
        listen 80;
        server_name nginx.kobin.com;
        location / {
                root /usr/share/nginx/html/html;
                index index.html index.htm;
        }
}
server{
        listen 80;
        server_name nginx2.kobin.com;
        location / {
                root /usr/share/nginx/html/html8001;
                index index.html index.htm;
        }
}
```

### 七、Nginx 反向代理的设置

什么是反向代理？ 互联网应用基本都基于 CS 基本结构，即 client 端和 server 端。代理其实就是在 client 端和真正的 server 端之前增加一层提供特定服务的服务器，即代理服务器。

在了解反向代理前先了解什么是正向代理。

- 正向代理

翻墙工具就是一个典型的正向代理工具。它会把我们不能访问的墙外服务器 server 的网页请求，代理到一个可以访问该网站的代理服务器 proxy，这个代理服务器 proxy 把墙外服务器 server 上的网页内容获取，再转发给客户。具体的流程如下图。
![UTOOLS1590478206582.png](http://yanxuan.nosdn.127.net/20284ff2217ab7398f7ed808018b0dc0.png)

其特点如下：

- 客户端和代理服务器可以直接互相访问，属于一个 LAN（局域网）
- 代理对用户是非透明的，即用户需要自己操作或者感知得到自己的请求被发送到代理服务器
- 代理服务器通过代理用户端的请求来向域外服务器请求响应内容。

> 一句话总结： 代理的是客户端

- 反向代理

反向代理正好相反，客户端发送的请求，想要访问 server 服务器上的内容。发送的内容被发送到代理服务器上，这个代理服务器再把请求发送到自己设置好的内部服务器上，而用户真实想获得的内容就在这些设置好的服务器上。
![UTOOLS1590478385142.png](http://yanxuan.nosdn.127.net/5f949b17f0ce40d745549acd519bc0ca.png)

其特点如下：

- 代理服务器和真正 server 服务器可以直接互相访问，属于一个 LAN（服务器内网）
- 代理对用户是透明的，即无感知。不论加不加这个反向代理，用户都是通过相同的请求进行的，且不需要任何额外的操作；
- 代理服务器通过代理内部服务器接受域外客户端的请求，并将请求发送到对应的内部服务器上。

> 一句话总结： 代理的是服务器

- 反向代理的好处：

  - 安全及权限
    使用反向代理后，用户端将无法直接通过请求访问真正的内容服务器，而必须通过 Nginx。可以通过在 Nginx 层上将危险或者没有权限的请求内容过滤掉，从而保证了服务器的安全。

  - 负载均衡
    一个网站的内容被部署在若干服务器上，可以把这些机子看成一个集群，那 Nginx 可以将接收到的客户端请求“均匀地”分配到这个集群中所有的服务器上，从而实现服务器压力的平均分配

- 简单实现反向代理

举个例子，我们访问 home.kobin.top 这个网站，然后反向代理到 baidu.com 上。可做如下配置：

```bash
server{
        listen 80;
        server_name home.kobin.top;
        location / {
               proxy_pass https://www.baidu.com;
        }
}
```

结果如下：
![UTOOLS1590479272673.png](http://yanxuan.nosdn.127.net/5f2dbe03d87bf90594f84aa9d94442de.png)

其他常用的反向代理配置：

- proxy_set_header :在将客户端请求发送给后端服务器之前，更改来自客户端的请求头信息。

- proxy_connect_timeout:配置 Nginx 与后端代理服务器尝试建立连接的超时时间。

- proxy_read_timeout : 配置 Nginx 向后端服务器组发出 read 请求后，等待相应的超时时间。

- proxy_send_timeout：配置 Nginx 向后端服务器组发出 write 请求后，等待相应的超时时间。

- proxy_redirect :用于修改后端服务器返回的响应头中的 Location 和 Refresh。

### 八、Nginx 适配移动端与 PC 端

Nginx 通过内置变量`$http_user_agent`，可以获取到请求客户端的`userAgent`，就可以用户目前处于移动端还是 PC 端，进而展示不同的页面给用户。

在 conf.d 目录下新建一个 demo.conf 文件，内容如下：

```bash
server {
	listen 80;
	server_name blog.kobin.top;
	location / {
		root /yangling/app/pc; # 默认展示PC端页面
		if ($http_user_agent ~* '(Android|webOS|iPhone|iPod|BlackBerry)') { # 如果匹配到mobile端的user_agent则展示mobile页面
			root /yangling/app/mobile;
		}
		index index.html;
	}
}
```

### 九、Nginx 实现 Gzip 压缩

Gzip 是网页的一种网页压缩技术，经过 gzip 压缩后，页面大小可以变为原来的 30%甚至更小。更小的网页会让用户浏览的体验更好，速度更快。gzip 网页压缩的实现需要浏览器和服务器的支持。

gzip 是需要服务器和浏览器同事支持的。当浏览器支持 gzip 压缩时，会在请求消息中包含 Accept-Encoding:gzip,这样 Nginx 就会向浏览器发送听过 gzip 后的内容，同时在相应信息头中加入 Content-Encoding:gzip，声明这是 gzip 后的内容，告知浏览器要先解压后才能解析输出。

gzip 配置：

- gzip : 该指令用于开启或 关闭 gzip 模块。
- gzip_buffers : 设置系统获取几个单位的缓存用于存储 gzip 的压缩结果数据流。
- gzip_comp_level : gzip 压缩比，压缩级别是 1-9，1 的压缩级别最低，9 的压缩级别最高。压缩级别越高压缩率越大，压缩时间越长。
- gzip_disable : 可以通过该指令对一些特定的 User-Agent 不使用压缩功能。
- gzip_min_length:设置允许压缩的页面最小字节数，页面字节数从相应消息头的 Content-length 中进行获取。
- gzip_http_version：识别 HTTP 协议版本，其值可以是 1.1.或 1.0.
- gzip_proxied : 用于设置启用或禁用从代理服务器上收到相应内容 gzip 压缩。
- gzip_vary : 用于在响应消息头中添加 Vary：Accept-Encoding,使代理服务器根据请求头中的 Accept-Encoding 识别是否启用 gzip 压缩。

简单配置：

```bash
http {
   .....
    gzip on;
    gzip_types text/plain application/javascript text/css;
   .....
}
```

`gzip on`是启用 gizp 模块，下面的一行是用于在客户端访问网页时，对文本、JavaScript 和 CSS 文件进行压缩输出。

### 十、Nginx 与跨域请求

举个例子：在 a.com 页面中有请求 b.com 的接口`http://b.com/getHomeData`, 出现了跨域问题。当然这种跨域问题的处理方式很多，这里主要说下用 Nginx 如何解决。

在 a.com 启个 Nginx 服务，配置如下：

```bash
server {
	listen 80;
	server_name a.com;
  #请求跨域，这里约定代理请求url path是以/apis/开头
  location ^~/apis/ {
      # 这里重写了请求，将正则匹配中的第一个()中$1的path，拼接到真正的请求后面，并用break停止后续匹配
      rewrite ^/apis/(.*)$ /$1 break;
      proxy_pass https://www.b.com/;
  }
}
```

这时请求接口 URL 换成http://a.com/apis/getHomeData，就可以正常请求到数据了。其本质还是利用了服务端不受跨域限制的原理。

### 十一、Nginx 与合并请求

通过[nginx-http-concat](https://github.com/alibaba/nginx-http-concat)插件可以实现将多个资源请求合并为一个请求，达到性能优化目的。

### 十二、Nginx 与图片处理

通过[ngx_http_image_filter_module](http://nginx.org/en/docs/http/ngx_http_image_filter_module.html)插件实现日常对图片的处理，包括缩放、裁剪、旋转、图片质量等的控制。


### 十三、使用Let’s Encrypt配置ssl证书

#### 安装certbot

```bash
yum install -y python3 && pip3 install certbot
```

查看certbot使用方法：

```bash
certbot --help
```

certbot 默认使用http方式对域名所有权进行验证，该操作需要绑定vps的80端口。如果80端口已被占用，请先停止占用的进程，例如停止Nginx：

```bash
killall nginx
```

为指定域名生成证书：

```bash
certbot certonly --standalone -d 域名1 -d 域名2
```

查看域名证书的路径和国旗时间

```bash
certbot certificates
```

生成的证文件位置：

```bash
/etc/letsencrypt/live/kobin.top/
```

#### 配置Nginx
编辑/etc/nginx/conf.d/default.conf:

```bash
server {
    listen 80;
    server_name kobin.top;
    rewrite ^(.*) https://$server_name$1 permanent;
}

server {
    listen       443 ssl;
    server_name  kobin.top;
    charset utf-8;

    ssl_certificate /etc/letsencrypt/live/kobin.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kobin.top/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3; # TLSv1.3需要nginx 1.13.0以上版本
    # 如果nginx版本低，建议使用这种加密算法配置
    # ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_ecdh_curve secp384r1;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    keepalive_timeout 70;

    # 这里填写其他配置
}
```

查看配置有无错误：

```bash
nginx -t
```
如果没有错误，则启动Nginx：

```bash
systemctl restart nginx.service
```


#### 证书自动更新

Let’s Encrypt证书的有效期是三个月，超过期限则需要续签。证书续期可以手动完成，例如：

```bash
systemctl stop nginx
certbot renew
systemctl restart nginx
```

也可以配置crontab任务自动续签，在/etc/crontab文件末添加一行：

```bash
0 0 1 */2 0 root systemctl stop nginx; /usr/local/bin/certbot renew; systemctl restart nginx
```
