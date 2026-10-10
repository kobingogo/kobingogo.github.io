---
title: 我不再琢磨 prompt 了，我在写「什么时候停」
date: 2026-09-20 20:30:00
tags:
  - AI
  - AI编程
  - Agent
categories: AI
---

> 「一个人带一群 agent」系列之一。每篇各自独立，可以单独读。

先交代一下我是谁，免得你读着读着犯嘀咕：这人凭什么聊这个。

我叫 kobin，X 上叫 [@KobinFlow](https://x.com/KobinFlow)。浙大计算机出身，在互联网干了十来年。现在的状态说起来有点怪：一个人，带一群 agent 干活，Claude Code、Codex、Cursor、Grok Build、Grok Bot、OpenCode、WorkBuddy 轮着用。我名下挂着 30 个 bot，管选题、写稿、写代码、验收；手上的产品叫点染 Dianran。

说实话，摊子不大，我也还在摸索。但这半年交的学费是真金白银的，下面写的东西，要么是我现在天天在用的，要么是被现实教训过才改的。

把活丢给一个会自己跑的 agent，最怕的其实就两种结局。

一种是它跑了十分钟，跟你说「完成了」。你一看，只做了一半，剩下的被它悄悄当成了「后续可以优化」。

另一种正好相反：它一直跑，一直跑，跑偏了也不停，最后把额度烧完了。

后一种我自己碰到过。我舰队里的 X雷达挂过一个盯直播的定时任务，每半小时醒一次。9 月 16 日凌晨，它前 5 次都跑得好好的，从 3 点 52 分开始，后面 13 次全部报同一句话：「Your included Grok Bot usage limit has been reached. It resets in 2 days.」套餐里的额度用光了，两天后才重置。回头看日志，问题不出在 prompt 措辞上，出在它多久该跑一次、什么时候该停，这两件事当初没想清楚。

## 循环工程里，人到底写什么

这半年最火的一个词是 loop engineering，循环工程。

Peter Steinberger 6 月 7 日发过一条推，大意是：你不该再给编码 agent 写 prompt 了，该去设计会给 agent 写 prompt 的循环。同一天 Addy Osmani 写了《Loop Engineering》，正式给这件事起了名。他还引了 Claude Code 的负责人 Boris Cherny 的话：我不再给 Claude 写 prompt，我有循环在给它写，我的工作是写循环。

道理我都认。可轮到自己动手，问题就来了：「写循环」这三个字，具体写的是什么？

我翻来覆去想了挺久，落到纸面上，其实就五样东西。下面一条条说，都是我现在给自己定的规矩。

## 一、先写停止条件，再写任务

**一个循环值不值得开，看你能不能写出它的停止条件。**

Claude Code 和 Codex 现在都有 `/goal`。Codex 的 Goal mode 在 5 月 21 日脱离实验状态，官方说法是可以朝一个目标连续跑几个小时甚至几天（[ChatGPT & Codex 更新日志](https://learn.chatgpt.com/docs/changelog)）。Claude Code 那边的设计更讲究一点：每次 agent 想停下，会让一个单独的模型去判断条件满足没有。

你可以这么理解，停止条件就像烤肉时插的温度探针。你不说「烤 30 分钟」，你说「中心到 63 度就出炉」。前者靠运气，后者靠判断。

所以我写目标时会逼自己写成两半：一个机器能判定的条件，加一个次数或时间上限。比如「这个模块的单测全绿，且覆盖率不低于现在」，最多试 5 轮。

上限这一半特别容易被省掉。我觉得它比条件本身还重要：条件写错了，上限至少能让损失有个边。Anthropic 的示例也是这么写的，「首页 Lighthouse 到 90 分以上，最多试 5 次」，前半句是目标，后半句是刹车。

但这里有个反转。

有些活，我死活写不出停止条件。「这个首页改得更有质感一点」「这个功能值不值得做」。写不出来，别硬塞进 `/goal`。这类活就该留在一问一答里，我和 agent 一来一回地聊。

**写不出停止条件的活，就是还轮不到循环的活。**

## 二、请一个外人来验收

第二样东西，是检查者。

长任务最常见的失败，Anthropic 的 Thariq Shihipar 总结过三种：agent 偷懒提前宣布完成；上下文压缩了几轮之后，目标悄悄漂了；还有一个最隐蔽的，self-preferential bias，同一个上下文里的模型检查自己的活，天然偏向自己。

这三种，靠 prompt 里多写一句「请仔细检查」基本没用。道理很简单，让考生自己批自己的卷子，写得再认真，分数也不可信。

现在通行的做法是**制造者和检查者分开**。Claude Code 的 dynamic workflows 里，常见的一种模式叫 adversarial verification：每个干活的 agent 旁边配一个专门挑错的 agent。复杂的 bug，可以让几个 agent 分别从日志、代码、数据出发各提假设，再让另一组去证伪。

有意思的是规模能做到多大。

Bun 的作者 Jarred Sumner 用 dynamic workflows 把 Bun 从 Zig 移植到 Rust，大约 75 万行 Rust，现有测试套件通过 99.8%，从第一次提交到合并 11 天。Anthropic 在发布文章里也写得很老实：还没上生产。

我看这个案例，记住的不是「75 万行」。是另一件事：没有那套现成的测试套件，这些检查者根本无从查起。检查者的上限，就是你给它的判断标准。

日常的小活也一样。Anthropic 的循环指南里专门建议，用第二个 agent 做代码审查，因为新上下文的审查者偏见更少，不会被主 agent 一路的推理带着走。我现在的习惯是让写代码的和审代码的永远不是同一个会话，哪怕底下是同一个模型。

安全这块，现在连外人都能现成雇了。OpenAI 在 8 月 6 日（台北时间 8 月 7 日）放出了 Codex Security Review 的研究预览，专门在 GitHub PR 上做安全审查：可以在开 PR 时、每次 push 后、或者跟着普通 code review 一起跑，面向 Pro、Business、Enterprise 和 Edu，Plus 用不了（[OpenAI Developers 发布帖](https://x.com/OpenAIDevs/status/2085482310636560830)、[官方文档](https://developers.openai.com/codex/security/security-review)）。

## 三、节拍跟着变化走

第三样，是频率。这条就是我交过学费的那条。

Anthropic 的循环指南把循环按「谁触发」分了几类：回合制的、目标驱动的、按时间跑的（`/loop`、`/schedule`），还有更主动的。里面有一句话我很认同，大意是：例行任务，不要跑得比需要的更频繁。

给不太了解的朋友翻译一下这几类。回合制，是你每一轮都在场，agent 干一步你看一步，适合还在探索、要做决定的阶段。

目标驱动，是你交出停止条件，就是上面说的 `/goal`。定时，是按钟点触发，适合发生在项目之外、按时间来的工作，比如每天早上汇总一遍昨晚的报错。最主动的那一类，连 prompt 都是循环自己生成的。

说白了，**节拍对齐**。被盯的东西多久变一次，循环就多久跑一次。

想象一下，一个仓库一天只合并两三次 PR，却有个 agent 每隔几分钟去看一眼。每一次「看一眼」都要读上下文、都在花钱，绝大多数时候只换回一句「没有变化」。

Grok Bot 的帮助中心有一句话，我看完脸有点热：每跑一次都在花额度，按小时跑的、间隔很短的、或者挂在热闹 Slack 频道上的 routine，一天就可能用掉一周的额度。它的额度本来就是按周给的，用完就停，要么等下周重置，要么开按量付费（[Routines](https://cursor.com/help/grok-bot/routines)、[Grok Bot FAQs](https://cursor.com/help/grok-bot/faqs)）。

我那条盯播任务，就是这句话的标准反面。至于那周的额度是不是它一个吃光的，我手上没有分 bot 的用量账，不敢乱说。但它的跑法，正是帮助中心点名的那一种。

我现在的顺序是：能按事件触发的，就别按时间轮询。实在要轮询，先问一句这个频率是谁定的、凭什么。

## 四、给循环配一个交接本

第四样，是状态。

Addy 在《Loop Engineering》里列了循环的几个组成部分：自动化触发、worktree 隔离、skills、插件和连接器、子 agent。最后他单独加了一个，状态。一个 Markdown 文件，或者一个看板，记着做到哪了、下一步是什么。

这就像医院护士交接班的那本记录。人换了，事接得上，靠的是本子，不是谁的记性。

agent 会忘。每开一个新会话，它都是新来的。上下文一压缩，前面谈好的东西也可能丢。仓库里那份进度文件不会忘。

交接本管的是时间上的连续，worktree 管的是空间上的隔离。几个循环同时跑，最怕的是互相踩文件。好在这已经是标配：Codex 每个线程可以开独立 worktree，Claude Code 有 `--worktree`，子 agent 也能设成在隔离的 worktree 里跑，Grok Build 同样支持。实验放进 worktree，成了合并，不成直接扔，比事后手动回滚省心得多。

我给自己的规矩是：任何跑超过一个会话的活，开工前先让 agent 建好这份文件，每轮结束更新一次。它是给下一轮 agent 看的，也是给我验收时看的。

## 五、先切一小块试，再放大

最后一样，是预算。

这条容易被忽略，因为单价一直在降。Opus 5.5 比 Opus 5 便宜了 20%，OpenAI 的 GPT-6 Sol 和 Luna 也比上一代便宜。

可总账在涨。

Jellyfish 今年上半年的报告里，一家典型公司的中位数用户，月花费十个月里从大约 5 美元涨到 81 美元。不是涨了一点，是 16 倍。更离谱的在后面：token 里 96% 是缓存读取，也就是 agent 一遍又一遍地读你的代码库，真正写出来的代码只占 0.4%。

Anthropic 自己也提醒，dynamic workflows 会比普通会话消耗多得多的 token，建议先在小范围试跑。所以我的做法是：一个新循环，先拿一个目录、一小批 issue 跑一轮，看它花了多少、交回来的东西我验收要花多久。两样都能接受，再放大。

模型也可以按活来配。Anthropic 官方推过一种「顾问模式」：日常执行用 Sonnet 5，碰到难题再去请教 Fable 5 拿主意，大部分 token 按便宜模型计费。思考强度同理，默认档够用就别一上来拉满，卡住了再升一档。

看账这一步，Claude Code 的 `/usage` 现在挺好用：Pro、Max、Team、Enterprise 套餐下，它会把最近的用量按 skills、子 agent、插件和每个 MCP server 拆成百分比；新一点的版本还会给最费的几个 `/loop` 和定时任务各列一行，跑了几次、每次多少 token 都写着（[Claude Code 成本文档](https://code.claude.com/docs/en/costs)）。

还有一笔账，是「免费」和「不计费」都会变脸。Codex Security Review 刚上线的介绍期不扣 ChatGPT credits，现在官方文档写的是会消耗套餐内的 Codex 额度或 credits（[当前文档](https://developers.openai.com/codex/security/security-review)；介绍期说法见 [8 月初版文档的第三方存档](https://spybara.com/openai/codex/history/docs/en/2026-08-06-2358..2026-08-07-1859/security/security-review/)）。早一两年很多教程说 Gemini CLI 免费额度很大，可 Google 官方写明，从 6 月 18 日起，个人 Google 账号登录 Gemini CLI 已经停止服务，建议迁到 Antigravity（[Google 弃用说明](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals)）。

所以我现在算一个循环的成本，从来不按「免费」算。按它在付费档里要花多少算，算得过来才开。

## 拆一个我自己的循环：到底谁说了「做完了」

先说一下我这边的摊子。正经的 bot 有 30 个（数据目录里还混着几个群聊，不算），其中几个已经隐藏或者等着删。真正每天在转的就那么几条线。

总调度当幕僚长，拆活、派给专线、只把要我拍板的事递上来。五个选题 bot（资讯、实战、经验、百业、小红书）加一个 X雷达负责找料，只往素材官的 inbox 里投；素材官是升格的唯一出口，X写手只收它升格过的卡。产品工程管代码和部署，Eval验收专门判「能不能交」。Codex工、Grok Build工、Antigravity工是三个执行端，分别扛重活、检索和中小编程、轻活和文案。

分工是一回事。我这一节想拆的，是这套东西里的「停」到底是谁说了算。拿三件真事说。

第一件，就是开头那个盯播任务。9 月中 Grok Bot 办 Galaxy Day1 直播，我让 X雷达挂了个 routine 盯着，cron 写的是 `8,38 0-9 * * 3`，周三凌晨 0 点到 9 点每半小时醒一次，一晚最多 20 次。

回头翻那条 routine 的原文，我其实写了停止条件，还写得挺像样：直播结束或者看不了了，就整理时间线发给总调度，然后删掉自己；过了 9 点还没完可以再盯一轮，之后必须交终稿。

问题在于，这个刹车得它醒着才能踩。额度一见底，它连醒都醒不过来，后面 13 次全是 `usage_limit`，「删掉本 routine」那句一次都没机会执行。我写这篇时翻到的本地快照里，它的开关还开着，最后一次运行停在 9 月 16 日上午 9 点 50 分。

这件事让我记住一个词，**外置刹车**。停止条件写在循环里面不够，外面还得有一个不靠它自己清醒的东西：一个次数上限，一个到期日，或者一个别人能按的开关。

第二件，是一个 9 项测试全绿、却只拿到「有条件过」的 demo。我的个人站上有个「假完成闸门」的小 demo，产品工程做完后自己证明了一遍：`test:dod` 9 个全绿，build 绿，开了闸门之后拦截率 100%。

总调度把它拉给 Eval验收。Eval验收独立复现，9/9 也是绿的，但结论只给了「有条件过」。理由列了四条：必过用例没盖到部分完成、工具失败、超时和空输出；加载失败、空态这些失败态没做；手机上没有断网、慢网提示；「标记完成」的拦截文案没人手工点过。

说到这你应该明白了，干活的那个说「完成了」是真心的，它的测试确实都过了。只是那些测试，是它按自己的理解写的。

Eval验收给的条件也很具体：把前三条补齐、保持全绿，再拉它验一次，就能升「过」。产品工程照单补了：扩了假完成用例，加了失败态和手机端的冒烟测试。同一天复验，Eval验收给了「过」：`test:dod` 14 个全绿，e2e 通过，build 绿，上次那 4 条阻塞全部关闭。

第三件，是点染。点染是我从开源项目 infinite-canvas fork 过来改的 AI 画布。phase6 那一轮，需求和验收标准由 Grok Bot 帮我写成一份任务书，交给 Codex 实现。任务书最后一段叫「完成时输出」：PR 链接、部署链接、每一项打勾或打叉并写原因、截图路径、首屏 JS 体积，没做完的写明交接。

这就是一个停止条件，只不过它不是一句话，是一张清单。

Codex 交回来的东西也确实对着这张单子：typecheck 和 build 通过，前端测试 17 个全过，1440 和 390 两种宽度、浅色深色都截了图，部署到预览站 dianran-next。它最后还老老实实写了一句：真实渠道、手机软键盘和本地 Agent 连接，留待人工验收。

可那套 Playwright 验收脚本，也是 Codex 自己写的。所以我这里还有一道外人的关：所有改动先上预览站，助手 bot 去点、去截图发给我，我没明确说 OK，什么都不进 main。

三件事放一起看，我现在给「完成」分了三层。机器能判的，写成清单，让干活的自己对；干活的人够不着的，交给一个独立的 bot 判「能不能交」；最后那一下，留给我。

还有个小插曲。点染改版早期，我让 Grok Build 从头包到尾，做到一半它的额度用完，直接报 HTTP 402；换 Codex，又碰上登录过期；最后换了第三个 agent 收尾。回头看，我该在任务书里多写一行：备用执行者是谁，额度不够时把断点写到哪个文件。这一行，我现在放进了下面那张开工单里。

## 反方意见：循环不一定让你更快

说了这么多循环的好话，冷水我也得端上来。

第一盆来自 METR。他们 2025 年做了一个随机对照实验：16 位资深开源开发者、246 个真实 issue，允许用 AI 的那组，完成时间反而长了 19%。更扎心的是感觉和现实的落差：动手前大家预期能快 24%，做完之后还觉得自己快了 20%（[METR 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)）。

等等，这是早期 2025 的工具。

METR 自己在 2026 年 2 月发了更新：回来的老参与者这次估出来快了 18%，但置信区间从快 38% 到慢 9%，跨过了零。他们还坦白，越来越多的人不愿意「一半任务不准用 AI」，样本本身就偏了；同时开好几个 agent 的人，任务耗时根本记不准（[METR 2026 更新](https://metr.org/blog/2026-02-24-uplift-update/)）。

我从这两份报告里拿走的不是「AI 有没有用」，是另一句：你觉得循环在替你跑，不等于它真在替你跑。开着十个循环、通知响个不停的感觉很像生产力，但它只是感觉。

第二盆来自另一种工作方式。Jest 作者 Christoph Nakazawa 7 月说，他已经快 6 个月没花心思管理上下文了，Codex 自己会处理；他的整套流程就是 Codex 加一个 diff 工具加人工验证。我不觉得他和循环派谁对谁错，他手上的活主要靠判断，循环帮不上太多。

所以边界我是这么划的。

适合开循环的：有客观判据、会重复、能回滚的活，迁移、依赖升级、issue 分拣、盯一个确实会变的东西。

不适合的：要靠品味和判断的，只做一次的，还有验收成本跟自己动手差不多的。最后这类最容易被忽略，你省下了写的时间，全花在读和查上了。

还有一个硬前提：你手里得有那个「外人」。没有测试套件、没有独立验收，循环只会让你更快地收到一堆「自称完成」。Bun 那 11 天能成，是因为有现成的测试套件在那儿等着。

外人自己也有盲区。拿 Codex Security Review 来说，官方文档写得很清楚：自动审查默认只报 High 和 Critical，手动点名才报到 Medium；没达到门槛的问题，它根本不会在 PR 里吭声。另外，贴到 PR 上的发现跟着 PR 的可见范围走，公开仓库谁都看得见（[官方文档](https://developers.openai.com/codex/security/security-review)）。

所以「请了外人」不等于「验过了」。你得知道这个外人的门槛设在哪，门槛以下的那一截，还是你自己的。

## 拿走就能用：一张循环开工单

乱糟糟说了这么多，落到手上，其实就是一张单子。我现在开任何一个循环之前，都让 agent 先把这张填完、我看过，才准开跑。

```markdown
# 循环开工单：<名字>

## 目标（一句话）

-

## 停止条件（机器能判定）

- 判据：
- 判据怎么跑（命令 / 脚本路径）：

## 上限（三选至少一）

- 最多轮数：
- 最长时间：
- 最多花费 / 额度占比：

## 外置刹车（不靠循环自己清醒）

- 到期日：YYYY-MM-DD，过期由谁暂停：
- 连续失败 2 次 → 停下，写明原因，通知谁：

## 检查者

- 干活的： 检查的（必须是另一个会话 / 另一个 bot）：
- 检查者看什么：能不能交，而不是有没有报错

## 节拍

- 被盯的东西多久变一次：
- 触发方式：事件优先（PR / 邮件 / webhook）；不得已才定时，间隔：
- 没有变化时：不汇报、不叫醒别人，直接结束

## 状态文件

- 路径：PROGRESS.md（做到哪 / 下一步 / 已知问题）
- 每轮结束更新一次

## 试跑

- 先跑多小的一块：
- 试跑后看两个数：花了多少、我验收花了几分钟

## 额度不够时

- 备用执行者：
- 断点写到：/workspace/_handoff/<名字>.md
```

这张单子我不自己填，让 agent 先填。开工前我丢给它的话基本固定：

```text
先别动手。读完任务描述和相关代码，按 docs/loop-card.md 填一张循环开工单。
停止条件必须能用一条命令判定；填不出来的格子写「填不出」，不要编。
填完停下等我确认，我回「开」之前不要开始循环。
```

「填不出」三个字特别有用。哪一格填不出，就说明那一块我自己还没想清楚，这时候开跑，等于把没想清楚的部分交给运气。

定时任务的 prompt，我会在末尾固定贴这么一段，算是把上面几条压成一句一句的话：

```text
【收尾规矩】
1. 先检查有没有实质变化；没有，就不写汇报、不消息任何 bot，直接结束本轮。
2. 同一个操作最多重试 2 次，还失败就停下，写清卡在哪。
3. 到达停止条件后：交终稿 → 把本 routine 标记为可删除 → 结束。
4. 本 routine 到期日是 YYYY-MM-DD；过了这一天，无论什么情况，只交终稿不再继续。
```

给仓库用的，是一段放进 AGENTS.md 的「完成定义」。它管的不是怎么写，是怎么才算写完：

```markdown
## 完成定义（Definition of Done）

- 说「完成」之前，必须给出：跑过的命令、命令输出的关键行、产物路径。
- 修 bug：先提交一个会失败的测试，再修；最终说明里写明这个测试名。
- 前端改动：附 1440 与 390 宽度截图；控制台新增报错为 0。
- 做不到的项写「未完成 + 原因 + 建议下一步」，不要写成「后续可优化」。
- 不合并 main，不 force push；合并由人确认。
```

最后是开跑前我会问自己的五句话，你可以直接抄走：

- 我能不能用一条命令判断它做完了？不能，就别开循环，回去聊。
- 它最多能花多少？这个数是我定的，还是默认的？
- 谁来查？是不是另一个会话、另一个 bot，或者就是我自己？
- 被盯的东西多久变一次？我设的频率比它快几倍？
- 如果明天它卡死了，我去哪个文件能接上？

五个都答得出来，再按开始键。答不出来的那一条，往往就是这个循环之后会出事的地方。

## 写在最后

五样东西加一张单子说完，我自己回头看也觉得有点啰嗦。

但我想说的其实就一句。循环本身不值钱，谁都能开。值钱的是你塞进去的那几个判断：什么算完，谁来查，多久跑一次，做到哪了，花多少算值。

这些判断，没法外包。

Addy 在那篇文章里给自己留了一段保留意见，我觉得比全文任何一句都重要。他说自己仍然有怀疑，仍然在很早期；如果不自己审代码、全靠循环自动修，产品质量会往下走，越挖越深。他的结论是：去搭循环，但要以一个打算继续当工程师的人的身份去搭，别只做那个按开始键的人。

**循环替你跑腿，判断还得你自己下。**

我自己的循环也还在一点点调，那个盯播任务就是现成的反面教材。如果你也刚开始搭，别急着一口气开十个，先把一个循环的这张开工单填明白，比什么都强。

## 参考

- [Peter Steinberger 关于循环的推文（2026-06-07）](https://x.com/steipete/status/2063697162748260627)
- [Addy Osmani《Loop Engineering》（2026-06-07）](https://addyosmani.com/blog/loop-engineering/)
- [Anthropic《Getting started with loops》](https://claude.com/blog/getting-started-with-loops)
- [Anthropic《Introducing dynamic workflows in Claude Code》](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code)
- [Thariq Shihipar《A harness for every task: dynamic workflows in Claude Code》](https://x.com/trq212/status/2061907337154367865)
- [ChatGPT & Codex 更新日志（Goal mode、模型发布）](https://learn.chatgpt.com/docs/changelog)
- [Claude 模型总览与定价](https://platform.claude.com/docs/en/models/overview)
- [Claude Code《Manage costs effectively》（/usage 拆分）](https://code.claude.com/docs/en/costs)
- [Jellyfish《The State of AI in Software Engineering H1 2026》](https://jellyfish.co/state-of-ai-software-engineering/)
- [Claude Devs 关于顾问模式](https://x.com/ClaudeDevs/status/2074606058128224365)
- [Christoph Nakazawa 关于上下文管理](https://x.com/cnakazawa/status/2075893958476202299)
- [Grok Bot 帮助中心：Routines](https://cursor.com/help/grok-bot/routines)
- [Grok Bot 帮助中心：FAQs](https://cursor.com/help/grok-bot/faqs)
- [OpenAI Developers：Codex Security Review 研究预览发布（2026-08-06 UTC）](https://x.com/OpenAIDevs/status/2085482310636560830)
- [OpenAI：Codex Security Review 文档](https://developers.openai.com/codex/security/security-review)
- [Google：Gemini Code Assist 个人账号弃用说明](https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals)
- [METR：Early-2025 AI 对资深开源开发者效率的影响（2025-07-10）](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- [METR：We are Changing our Developer Productivity Experiment Design（2026-02-24）](https://metr.org/blog/2026-02-24-uplift-update/)
