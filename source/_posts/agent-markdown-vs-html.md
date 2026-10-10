---
title: 我的 agent 交给我一堆 Markdown，我真的读了几份？
date: 2026-10-10 18:02:00
tags:
  - AI
  - Claude Code
  - Agent
categories: AI
---

> 作者：jin kobin（@KobinFlow）
> 本文的核心观点受 Thariq Shihipar（@trq212，Anthropic Claude Code 团队）《Using Claude Code: The Unreasonable Effectiveness of HTML》启发：https://x.com/trq212/status/2052809885763747935 （Claude Blog 版：https://claude.com/blog/using-claude-code-the-unreasonable-effectiveness-of-html ）。文中案例与观点为我自己的整理和判断。

## 一、先承认一件事

我现在一个人在养一群 agent：写代码的交给 Codex、Grok Build 和 Claude 系的 agent，调研、写方案、整理进度的交给助手 bot。它们交回来的东西，绝大多数是 Markdown。光我服务器上的 `/workspace`，就躺着好几份几百行的 report.md，一份调研报告动辄三四百行。

这么长的文件，真的会被从头读到尾吗？对我来说，这类报告我最先找的是两样东西：结论和风险，其次才是细节和出处。结论决定我要不要继续投入，风险决定我能不能放手让 agent 往下做。问题是 Markdown 只给了我一条从上往下的路，结论通常在开头还好找，风险往往埋在中后段。如果格式不帮我跳过去，我更可能看完 TL;DR 就直接去问 agent，而不是自己去读——这恰恰是我把判断权交出去的时刻。

Thariq 在文章里说了几乎一样的话："I find it difficult to read a markdown file of more than a hundred lines."（超过一百行的 Markdown 我就很难读下去。）他的解法很简单：别让 agent 写 Markdown 了，让它写 HTML。

这听起来像个排版偏好，其实问的是一个更根本的问题：**agent 产出的东西，到底是写给谁看的？**

## 二、核心论点：Markdown 是给"编辑者"设计的，而我们已经不编辑了

Markdown 流行的原因是：纯文本、好改、diff 干净、token 省。这些优点都建立在一个前提上——**人会亲手去改这份文件**。

但现在的真实情况是：方案是 agent 写的，修改是我口头让 agent 改的，最后读它的人也只是"看一眼然后拍板"。Thariq 也点出了这一点：他自己改这些文件时，也是让 Claude 去改，这就抵消了 Markdown 最大的好处。

当"可编辑性"不再是刚需，"可读性"和"可决策性"就变成了第一位。而在这件事上，HTML 能做的事情多得多：

- **信息密度**：表格、颜色、SVG 图、时间线、可折叠章节、标签页，一屏能放下的结构远多于纯文本。
- **好分享**：浏览器原生打开，丢一个链接就行，不用让对方装 Markdown 预览器。
- **能交互**：加滑块调参数，最后一个按钮"复制为 prompt"，再贴回 agent。人和 agent 之间多了一条回路。

Thariq 文末的那句我很认同：他用 HTML 的真正原因，是觉得自己和 Claude 之间"more in the loop"——在 agent 接手越来越多工作之后，人仍然参与决策，而不是只能把选择权全交出去。

## 三、半年过去，发生了什么（5 个可查证的案例）

这篇文章发布于 2026 年 5 月 9 日。我去翻了之后半年的进展，挑了 5 个有出处的。

**1. Anthropic 把它做成了产品功能。** 2026 年 6 月 18 日，Claude Code 上线 artifacts（beta）：agent 把会话里的产出发布成一个私有的 claude.ai 页面，每次发布都是同一链接下的新版本，可以回滚，可以在组织内分享。官方举的例子正是 PR 讲解、系统说明、看板和发布清单。也就是说，"让 agent 交网页"已经从个人习惯变成了官方支持的工作方式。
来源：https://claude.com/blog/artifacts-in-claude-code ，文档 https://code.claude.com/docs/en/artifacts

**2. 有人把成本真的测了一遍。** 荷兰开发者 Tim Schipper 5 月先写文章唱反调，说 HTML 要多花 3–5 倍 token、会毁掉 diff；9 月他回头做了实测（Claude Code 2.1.273 + Opus 5，每组跑 3 次）：同一份实施计划，Markdown 平均 6,205 个输出 token、$0.16、64 秒，HTML 平均 11,783 token、$0.30、104 秒；代码评审是 3,110 对 6,812。结论是**成本大约翻倍，不是 3–5 倍**，他自己也承认原来那个数字夸大了。更意外的是 diff：让模型就地修改时，HTML 计划的 diff 是 +6/−1 行，Markdown 是 +9/−1 行，两者都完全可审。
来源：https://tim-schipper.nl/en/blog/stop-letting-your-agents-write-markdown

**3. 老派 Markdown 用户开始动摇。** Simon Willison 写道，他从 GPT-4 时代起就默认要 Markdown，因为当时 8,192 token 的上限让省 token 很划算；Thariq 这篇让他重新考虑，至少在"输出"这一侧。他当场用 GPT-5.5 生成了一份 HTML 版的漏洞代码讲解来试。
来源：https://simonwillison.net/2026/may/8/unreasonable-effectiveness-of-html/

**4. 最有价值的反对意见：内容和呈现要分开。** Dominik Lukes（@techczech）认为方向对、方法错：内容应该用 Markdown + YAML/JSON 存，再用脚本生成富 HTML 来读。另一篇 Medium 评论文提出了类似的"模板 + 数据"模式：HTML 模板固定，变化的内容放 JSON，版本控制只 diff JSON。
来源：https://x.com/techczech/status/2053008412380733682 ，https://generativeai.pub/anthropics-engineer-said-kill-markdown-here-s-what-he-actually-meant-36bee00c0ca2

**5. Codex 那边，需求跑在了功能前面。** 2026 年 6 月 23 日，有人在 openai/codex 仓库提 issue，说 Codex Desktop 生成了 HTML 的流程图、调试面板、结果对比页，却没法在应用里内联预览，只能自己去外面打开。Codex 官方的数据分析用例里，则把"用 `$vercel-deploy` 部署一个静态报告站"列为交付形式之一。不管哪家 agent，用户都在往"交付一个能打开的页面"这个方向走。
来源：https://github.com/openai/codex/issues/29642 ，https://developers.openai.com/codex/use-cases/datasets-and-reports

还有一个小信号：开发者 Vaibhav（@naklihero）说他让 Claude Code 用 HTML 写 spec 后读起来轻松多了，但"浏览器里看、切回终端用文字描述改哪里"这个回路很痛，于是自己做了个工具 Marginalia 来解决。HTML 解决了"读"，"改"的环节还在补。
来源：https://x.com/naklihero/status/2081045557607596158

## 四、反方意见和它的边界

把正反两边放在一起看，我觉得争论其实已经收敛了：

- **Token 成本是真的，但量级被夸大了。** 按 Tim 的实测，一份文档多花大约一倍、十几美分、几十秒。只读一次的文档，这笔钱不值得纠结；放进循环里每轮重新生成，就会成倍累积。
- **Diff 的问题主要出在"重新生成"，不在"HTML"本身。** 就地修改的话，两种格式的 diff 差不多；整份重写的话，Markdown 一样面目全非。
- **给 agent 读的东西，Markdown 依然更好。** Tim 引用了 Mintlify 和 Cloudflare 的数据：agent 读 HTML 文档更容易迷路，同一页面 HTML 版的 token 是 Markdown 版的约 5 倍。spec、CLAUDE.md、下一轮会话要接着用的计划，都应该留在 Markdown。
- **利益相关要心里有数。** 有评论直说，HTML 用的 token 更多，对卖 token 的公司有利。我不认为这推翻了论点，但它提醒我：格式要按自己的场景选，不要按厂商的推荐选。

## 五、放到一人公司的场景里：我的判断

我的情况和 Claude Code 团队不一样：我没有同事要说服，但我有一群 agent 要管理，读它们产出的人只有我一个。所以我关心的不是"同事会不会读"，而是"**我自己能不能在五分钟里做出判断**"。

我手头正好有一个现成的对照。最近我把一个开源画布应用改造成了「点染 Dianran」，助手给我做了一份全站视觉审计方案，PLAN.md 有 545 行。但整份方案里最直观的部分，是助手用 HTML 做的那套高保真样稿——`mockups/src/` 下面 9 个 HTML 文件，渲染成截图放进方案里。文字负责解释"为什么"，HTML 负责让我"看到"。而另一份 phase5 的 PROGRESS.md 只有 30 行，是给下一个接手的 agent 看的状态清单，用 Markdown 就是最合适的。

两者的差别是结构上的，不需要计时也看得出来：样稿是"看一眼就知道方向长什么样"——宣纸底色、左侧印章导航、参数面板怎么排，全在一张图里；而 PLAN.md 要读完 545 行文字，才能在脑子里拼出同一幅画面。对"选哪个视觉方向"这种决定，我宁可先看图，再回头读文字里的理由。

基于这些，我给自己定的规则是一句话：

> **读者是要做决定的人 → HTML；读者是 agent，或者要进 git、进循环 → Markdown；需要多人评论、长期沉淀 → Notion。**

再细一点：

1. **调研报告、方案对比、设计方向、PR 讲解**：要 HTML。这些是我要拍板的东西。
2. **spec、进度日志、交接文档、AGENTS.md / CLAUDE.md**：留 Markdown。这些是 agent 之间的接力棒。
3. **最佳组合是"Markdown 存内容，HTML 当阅读层"**：agent 先写 Markdown 作为唯一事实来源，再生成一份 HTML 给我看。这正好也解决了版本控制的问题。

## 六、我用助手做了一个小实验

我让助手把一份 434 行的调研报告（rea-research/report.md，约 37KB）用脚本渲染成一个单文件 HTML：左侧是常驻目录，滚动时自动高亮当前章节；TL;DR 用红色左边框单独突出；表格和代码块统一样式；原来只能看源码的 mermaid 数据流图，现在直接渲染成图；手机上会自动变成单栏，系统切到深色时页面也跟着变。整个过程没有让模型重写任何内容，只是换了一层皮。

诚实地说：内容一个字没变，变的是"找到东西的成本"。缺点也很明显：因为把 mermaid 库整个内联进去以保证离线可用，文件从 37KB 变成了约 3.6MB；而且这只是一个通用模板，还不是 Thariq 说的那种"为这份内容专门设计"的页面。

我让助手用无头浏览器把两个版本都量了一下。原文 434 行、37,067 字节，有 11 个二级标题、25 个三级标题、13 张表格、3 个代码块（其中 1 个是 19 行的 mermaid 源码）。

- **找"有风险的行为"这一节（4.4）**：把 Markdown 源码直接摊开看（按 14px 等宽字体、自动换行估算），在 1440px 宽的屏幕上它在第 5,932px，大约要往下翻 7 屏多；在 390px 宽的手机上是第 9,775px，大约 13 屏。HTML 版左侧目录里的"4.4"链接在桌面和手机上都出现在第一屏，点一下就到。
- **反直觉的一点**：HTML 版整页其实更长。桌面端 15,794px 对 9,907px，手机端 26,117px 对 16,606px，因为留白、卡片和表格样式都占地方。如果不用目录、硬往下滚，HTML 反而更远。它省的是"定位"，不是"篇幅"。
- **TL;DR**：两个版本的结论都在最前面，Markdown 开头只有约 240 个字符的说明，HTML 在桌面端第一屏就能看到结论卡片。但在手机上，目录放在了页面顶部，结论卡片被推到了约第 1,472px，差不多第二屏，这是我这个模板的一个缺点。
- **mermaid 图**：Markdown 里是 19 行 `graph TD` 源码，得在脑子里自己连线；HTML 里直接渲染成了一张 SVG 流程图。

我的结论是：对于"我要找结论和风险"这种读法，HTML 加目录确实更顺手；但如果模板没设计好，它也会把重要的东西往后推。

## 七、实操手册

**什么时候开口要 HTML：** 超过 100 行、需要你做选择、有空间关系（架构、流程、diff）、要发给别人看。

**几个可以直接用的中文 prompt：**

```
把这份调研整理成一个单文件 HTML（不依赖外部 CDN）：顶部一个结论卡片，左侧目录，表格可排序，风险按严重程度用颜色区分。同时保留原 Markdown 作为源文件，不要改动它。
```

```
我还没决定画布页的方向。生成一个 HTML 文件，把 4 种布局方案并排渲染出来，每种下面写清楚取舍，方便我直接指着选。
```

```
帮我审这个 PR：做一个 HTML 页面，渲染真实 diff，在旁边加批注，按严重程度标色，重点讲我不熟的部分。
```

```
这 20 个待办我要重新排优先级。做一个 HTML 看板，卡片可以在"现在 / 下周 / 以后 / 砍掉"之间拖动，最后给一个"复制为 Markdown"的按钮。
```

**版本控制：** Markdown 或 JSON 作为唯一事实来源进 git，HTML 当构建产物，可以不提交，或者放进单独目录；要改就让 agent 就地修改，不要整份重写。

**Token 成本：** 只在"最后交付给人"那一步生成 HTML，中间迭代全用 Markdown；把通用 CSS 做成固定模板让 agent 复用，省掉每次重新写样式的那部分输出。

我让助手在服务器上用 Codex CLI 做了一个很小的对照：同一个 prompt（读 rea 报告，写约 300 字的中文摘要：一句话结论、3 条关键事实、2 条最大风险），唯一的区别是最后要 Markdown 还是"单文件 HTML（内联 CSS）"。只跑成功了一轮：Markdown 版输出 353 个 token、980 个字符、约 17 秒；HTML 版输出 773 个 token（另有 55 个推理 token）、1,981 个字符、约 22 秒。两次读取报告的输入都是约 4.85 万 token。输出 token 大约是 2.2 倍，和 Tim 测出的 1.9–2.2 倍落在同一个范围。不过样本只有一次，第二轮重跑时 Codex 卡住超时了，所以这只能当一个参考点，不算结论。

## 八、结尾

Markdown 不会消失，它会退回到它最擅长的位置：agent 之间的通信格式。而人和 agent 之间的那一层，正在变成网页。

对一个人带一群 agent 的人来说，真正稀缺的不是 token，而是自己的注意力。如果多花一倍的 token，能换来我真的读完、真的做出判断，这笔账我愿意算。

---

参考与致谢：Thariq Shihipar 原文及示例合集 https://thariqs.github.io/html-effectiveness （20 个 agent 生成的单文件 HTML 示例）。
