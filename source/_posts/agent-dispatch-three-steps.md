---
title: 一个人带 30 个 bot：派活给 agent 只有三步，附任务卡模板和一个能直接装的 skill
date: 2026-10-09 20:30:00
tags:
  - AI
  - AI编程
  - Agent
categories: AI
---

![派活只有三步](/images/agent-dispatch/cover.jpg)


<!--
备选标题（不进正文）：
1. 一个人带 30 个 bot：派活给 agent 只有三步，附任务卡模板和一个能直接装的 skill（推荐）
2. 派活给 agent 的第一句，不是「帮我做」，是「你先复述一遍」（附中英提示词 + skill）
3. 一句被收藏 1.1 万次的提示词：一个人派活给 agent 的 3 步法（附任务卡模板）
4. 不读代码的人怎么派活：复述、拷问、验收单，3 步 + 1 张任务卡 + 1 个 skill
5. 一个人带一群 agent · 第 0 篇：派活就三步，复述、拷问、验收单（附模板和 skill 全文）
-->

> 「一个人带一群 agent」系列 · 第 0 篇。五篇各自独立，可以单独读；这篇讲的是最前面那一步：派活。

这篇能拿走的东西，先摆在前面：

- 一句让 agent 先复述目标的提示词，中英两版
- 一张「这个活要不要先拷问」的决策表
- 一张三栏任务卡：完成的定义、证据清单、不做什么
- 一个把这三步串起来的 skill，SKILL.md 全文，Claude Code 和 Codex 都能装

本来我想拿一个翻车现场开头。就是那种你说「帮我做个 XX」，agent 吭哧半小时，交回来一个能跑、但根本不是你要的东西。

说实话，点染的记录里，我找不到一次这么干净的翻车。

不是因为我的 agent 多聪明。是因为点染最近两轮大改，动手之前都先有一份只写方案、不碰代码的文件。前一份的开头就写着：仅为方案，本次没有改代码、没有部署、没有合并。

而那份方案里最值钱的一句，恰恰证明了我当初的需求是歪的。

那一轮我对生图页提了几条意见，其中一条大意是：「质量」这个选项看不懂。要是那天我直接说一句「把质量改清楚点」，它多半会去改文案、加个问号提示，然后跟我说做完了。

方案里写的是另一回事：「质量」不是画质开关，是一个藏起来的「分辨率加费用」开关。分辨率选自动的时候，选「高」会把像素悄悄抬到 4K 档，1:1 的图直接变成 2880×2880，费用和耗时都可能跟着翻几倍。

对，我以为是文案问题，其实是参数问题。

这件事让我想明白一个顺序：**派活的第一步，是让它先把你要的东西说一遍。**

先交代一下我是谁。我叫 kobin，X 上叫 [@KobinFlow](https://x.com/KobinFlow)，浙大计算机出身，在互联网干了十年左右。现在一个人做产品，主力是「点染 Dianran」，一个节点式的 AI 创作画布；另一个是「Mood3D」，一个 Web3D 展品库。侧栏里挂着 30 个 bot，日常在 Claude Code、Codex、Cursor、Grok Build、Grok Bot、OpenCode、WorkBuddy 之间来回切。

我也还在摸索，下面这三步，是我现在派活时真的在用的。

## 第一步：先让它复述，再让它动手

9 月 29 日，poteto（Lauren Tan）在 X 上发了一条很短的帖子，说这是她最近最常用的提示词之一：

> restate in your own words what you think my goals are and what the problem i'm trying to solve is

翻译一下：用你自己的话，复述一遍你认为我的目标是什么、我想解决的问题是什么。

就这一句。截至 10 月初，这条帖子 1.3 万赞、1.1 万次收藏、71 万次浏览（[原帖](https://x.com/poteto/status/2104744961904394699)）。

![poteto 的原帖：「restate in your own words…」](/images/agent-dispatch/shot-poteto.png)

收藏数快追上点赞数了。你品，你细品。

我一开始也觉得，这不就是「请确认需求」吗，有什么好收藏的。后来想了想，区别在「用你自己的话」这几个字。

你让它确认，它会说「好的，明白」。你让它复述，它就得把脑子里那个版本掏出来摆在桌上。哪里理解歪了，一眼就看得见。

还有一个小地方，我读了好几遍才注意到：她让 agent 复述的是两样东西，目标和问题。目标是「我想要什么」，问题是「我为什么想要」。

很多时候目标说对了，问题说歪了。你要一个导出按钮，它复述成「用户需要导出数据」，听着没毛病；可你真正的问题是「客户每周找我要一次报表，我烦了」，那最好的解法可能是定时发邮件，根本不是按钮。

打个比方，这就像装修开工前，师傅拿着图纸跟你对一遍：这面墙拆，那面墙留，插座挪到这儿。你说的是「客厅弄敞亮点」，他听成的可能是「把承重墙打掉」。不对一遍，你是在交钥匙那天才发现的。

![派活前先对图纸：机器把任务复述成一张列着编号假设的卡片，人用红铅笔划掉猜错的那条](/images/agent-dispatch/fig-1.jpg)

我现在给自己定的规矩是：复述要包含四样东西。目标是什么，这次不做什么，它在猜的地方有哪些，它觉得这个活有多大。

第三样最要紧。「猜的地方」一条条编号列出来，我只需要划掉错的那几条，比我从头写需求省事得多。

我拿「质量看不懂」那条意见做个示意。下面不是当时的原话，是我按这四样东西重新摆了一遍：

- 只有一句「把质量改清楚点」：它最顺手的做法，是改文案、加提示，改动小，交得快。
- 先复述：目标是让用户选质量时知道自己在选什么；问题是选完之后结果和费用对不上预期。光是把「问题」这一栏写出来，它就得回头去查「选了高之后到底发生了什么」。
- 猜的地方：「我假设质量只影响画质」。这一条只要被我划掉，或者被它自己查代码推翻，后面的活就整个换了方向。

你会发现，复述不是一句客套话。它逼着 agent 把「我以为」写成能被推翻的句子。

点染那一轮里，还有个细节我挺喜欢。新的交互方案里专门写了一句：旧审计方案针对的是较早的版本，里面「没有返回入口」「质量偷偷联动 4K」这些问题，不能直接当作当前现状。

你看，它复述的不只是我的目标，还有「现在到底是什么样」。我的意见是基于旧版本提的，代码早就往前走了一截。

**复述闸**，我给这一步起的名字。闸不开，活不派。

## 第二步：按改动大小，决定要不要拷问

复述完，下一个问题是：要不要再往深里问？

这个我参考的是 Matt Pocock 10 月 8 日那条帖子。他手里有两个 skill：`/grill-with-docs` 让 agent 反过来拷问你，把计划问透再动手；`/wayfinder` 是活太大、一个会话装不下的时候，把它画成一张地图，拆成一张张决策工单（[原帖](https://x.com/mattpocockuk/status/2108216899439894574)、[skill 说明](https://github.com/mattpocock/skills/blob/main/docs/engineering/grill-with-docs.md)）。

![Matt Pocock 的原帖：小改动别拷问，中等以上先 /grill-with-docs，失控了再 /wayfinder](/images/agent-dispatch/shot-matt.png)

他的建议就三句。diff 很小，别拷问，直接写。预计中等以上，先拷问。拷问着拷问着规划失控了，再说一句「把它画成地图」。

我判断大小，也不靠感觉，就问自己三个问题：会动几个文件？里面有没有一个我得拍板的产品决定？改坏了，回滚要多久？

三个都是「少、没有、几秒钟」，那就是小活。只要有一个答案让我犹豫，就按中等处理。

![按尺寸分拣：小活直接做，中等的先一问一答，大的才摊成地图拆成工单](/images/agent-dispatch/fig-2.jpg)

最后还有一条我特别认同：永远不要一上来就画地图。你可能刚开始拷问，就发现解法比你想的简单得多，那张地图和那堆工单就全白做了。

截至 10 月初，这条帖子 1925 赞、1713 次收藏。中文区我只看到一条转述。

我拿点染自己的三件事对了一下，刚好一档一个。

小改动。点染的提交记录里有一条就叫「使用点染图标」。换个图标，改一行文案，这种活复述都嫌多，任务卡写三五行就够了。

中等改动。点染 phase6 那一轮要把首页和工作台的输入框统一起来，动的文件不少，还藏着产品决定。开工前先有了一份交互方案，然后任务书里单独有一节，叫「老板拍板（绑定）」。

等等，严格讲，这不算 Matt 那种一问一答的拷问。它更像是一份方案把要我拍板的问题全摆出来，我一条条回。

那一节一共四条。两条是我定死的：首要服务快速出图；视频 4K 只有模型能力表声明支持时才显示。另外两条，费用怎么显示、送入画布默认带什么，我写的是「由你决定」，但要求它把决定和理由写进进度文件。

后来它真的写了。费用那条的结论是：当前渠道配置里没有可匹配的单价，所以只显示「费用由所选渠道计费」，不展示金额，固定倍率和伪精确的耗时一并删掉。

失控的改动。前面说的那份审计方案，就是一张地图。它把问题拆成 P0、P1、P2 三档，一共 19 张工单，按一个前端粗估，加起来二三十个人日。phase5 那一轮照着单子，做掉了 P0 和 P1 的 13 张。

这张地图后来还救过一次场。那一轮先是 Grok Build 做到一半额度用完，报了 402；换 Codex，又碰上登录失效。最后是第三个 agent 接手，照着同一张单子，从断掉的那张工单接着往下做。

![任务卡存在柜子里，不在机器里：一台停摆、一台被锁，第三台取出同一张工单接着做](/images/agent-dispatch/fig-4.jpg)

要是当时只有一段聊天记录，换人就等于从头再讲一遍。

有意思的是下一轮。phase6 的方案里写着：本轮无需重新安排换肤、导航改版或重建能力表。地图画过一次，下一轮反而主动把范围收窄了。这就是 Matt 说的那个陷阱的反面。

**按尺寸派活**，说白了就一句：拷问是有成本的，花在值得的地方。

## 第三步：验收单，人自己写

前两步解决的是「做对的东西」。第三步解决的是「怎么算做完」。

这一步我是被 Kun Chen 那条帖子说服的。他 10 月 8 日在 X 上发了一个实验：在 deepswe 评测集上，禁止 Sonnet 5.5 high 自己写任何测试，成功率反而略高一点（他自己注明统计上不显著），花的时间和 token 更少（这一项显著）（[原帖](https://x.com/kunchenguid/status/2108030810691629403)）。

![Kun Chen 的原帖：禁止 agent 自己写测试，成功率 65.3% 对 66.2%，差异不显著](/images/agent-dispatch/shot-kunchen.png)

更狠的在后面。允许写测试的那组，写出来的测试 65% 是单元测试、35% 是集成测试，两类都没带来任何提升。他又随机挑了 44 个任务，连已有的测试都不让跑，成功率还是没变。

截至 10 月初，这条帖子 2790 赞、2835 次收藏、460 条回复，是三条里吵得最凶的。

他给的解释我觉得才是重点：实现和测试，都只是 agent 对你意图的一次解读。测试不会比实现本身更准。

我自己就撞上过这个。个人站上那个「假完成闸门」的小 demo，产品工程做完后自己跑测试，9 个全绿。交给 Eval验收，只给了「有条件过」：部分完成、工具失败、超时、空输出，这几种假完成，它自己写的测试一个都没覆盖到。

它没偷懒。它只是没想到。它想不到的东西，它写的测试也想不到。

点染 phase6 的验收脚本，同样是 Codex 自己写的。但任务书最后那一段「完成时输出」，要它交什么、每项打勾还是打叉、截图放哪，是我这边定的。

这里得说清楚：那份任务书的字是 Grok Bot 帮我敲的。可里面每一条标着「绑定」的，都是我拍的板。

所以我现在派活，任务卡分三栏。完成的定义，我写，或者至少我逐条确认过。证据清单，它交。不做什么，我们俩一起写。

完成的定义怎么写，我自己也是踩出来的。我的习惯是，每一条都写成一个别人能当场看见的行为，而不是一个形容词。

「拦截假完成要可靠」，这句没法验。改成「agent 只做了一半就报完成，闸门要拦住，并在页面上写明缺了哪一项」，就能验了。Eval验收后来让补的那几种情况，换成我来写，大概就是这个样子：一条情况一行，写清楚输入是什么、期望看到什么。

Kun Chen 在帖子最后也提了一句类似的猜想：如果我们觉得用测试用例比用需求更能说清意图，那就由我们自己来描述这些用例。我现在就是这么干的，只不过我描述，它实现，它不准改我写的那几行。

这一栏跟 [#436 那篇](https://kobingogo.github.io/trust-agent-code-without-reading/)讲的证据链是接着的。证据链管的是「你拿什么证明」，验收单管的是「证明什么」。后者要是交给 agent 自己定，前者再完整也只是在证明它自己的理解。

这也是 #436 里说的「验收权分离」落到派活这一步的样子：干活的不定标准，定标准的不干活。

试菜的人，得是点菜的那个人。

![试菜的人得是点菜的人：机器自带打满勾的卡片没人看，人只按自己手写的单子试菜打勾](/images/agent-dispatch/fig-3.jpg)

**验收单不外包。**

## 顺手：把停止条件也写进卡里

任务卡上我还会多留一栏，叫「出现这些情况就停下来问我」。

最常写的就三条：同一步失败两次；要动「硬性约束」里列的东西；发现复述时的某条假设是错的。

第三条是这篇独有的。复述时它说「我假设视频也要支持 4K」，我没划掉；干到一半它发现模型根本不支持，这时候它该停下来问我，而不是自己挑一个方案接着写。

停止条件为什么值得单独写一栏，我在 [#437 那篇](https://kobingogo.github.io/agent-stop-conditions/)拆得比较细，这里就不展开了。

## 反方意见：这三步也可能是白折腾

说了半天好话，冷水我自己先泼。

第一盆来自 Kun Chen 自己。成功率那个提升，他明说了统计上不显著；只测了 Sonnet 5.5 high 一个模型、一个评测集；e2e 测试他压根没测到，agent 全程只写了 17 个 e2e，单元和集成测试写了 3000 多个。至于「人来描述测试用例会不会更好」，他原话是：我怀疑能，但还没证明。

也就是说，「验收单人来写」这一条，我是押在一个还没被证明的方向上。

第二盆来自一篇卡内基梅隆的论文 [Ambig-SWE](https://arxiv.org/abs/2502.13069)。他们把 SWE-Bench Verified 的 issue 故意删成模糊版，让 agent 可以去问一个模拟用户。结论一半是好消息：允许交互时，模糊任务上的表现比不交互最多高 74%。

![Ambig-SWE 论文页（arXiv 2502.13069）](/images/agent-dispatch/shot-ambig-swe.png)

另一半就没那么好听了。交互提高了成功率，但没省步数，Claude Sonnet 4 平均从 65 步涨到 75 步。不明确要求的话，模型几乎从不主动提问；就算要求了，大多数模型也分不清哪个任务说清楚了、哪个没说清楚。论文还承认，模拟用户可能比真人更配合。

还有一个细节挺扎心。Qwen 3 Coder 平均每次问 6 个问题，Claude Sonnet 4 只问 4 个，两者最后解决的比例差不多。问得多，不等于问得好，多出来的那几个，全是用户的负担。

简单说：拷问能救回不少，但不是免费的，问得好不好还得看模型，看你答得上来答不上来。

我自己再补一盆，没有数据，纯是体感：复述也会变成走过场。模型很会说你爱听的话，复述得越漂亮，我越容易点头放行。所以我现在只盯「猜的地方」那一栏，前面的漂亮话一律跳过。

第三盆是 Matt 自己提醒过的：小改动拷问，纯属浪费。一个改文案的活，你让它复述、拷问、写验收单，三步走完，自己动手早就改好了。

所以我的边界是这么划的。

适合走完三步的：动了好几个文件，里面藏着产品决定，返工成本高，你又不打算逐行看 diff。

可以只走第一步的：小而确定的活。复述一句，对上了就开干。

三步都不适合的：你自己还没想清楚要什么的探索期。这时候别急着写验收单，先让它快速出两个原型，看着原型再说话。

还有一个硬前提：你得真的会看那张验收单。写完不看，跟没写一样。

## 拿走就能用：任务卡、提示词、决策表和 skill

乱糟糟说了这么多，落到手上就是下面几样。改改路径就能用。

用法很简单：小活只用复述那段提示词；中等的活，复述完接着贴拷问那段，问完了再填任务卡；大活先拷问，问不完了再让它按 skill 里的规矩画地图。决策表拿不准的时候对一眼就行。

先是任务卡。我放在仓库的 `docs/tasks/<名字>/TASK.md`，不放在聊天里：

```markdown
# <任务名>

## 目标（复述确认后的版本）
- 

## 完成的定义（人写；agent 只能提草稿，标「草稿」）
- [ ] 
- [ ] 

## 证据清单（agent 交）
- 跑过的命令 + 关键输出
- 截图 / 产物路径 / 预览链接
- 没能验证的项，以及原因

## 不做什么
- 

## 硬性约束
- 不合并 main，不 force push
- 

## 出现这些情况就停下来问我
- 同一步失败两次
- 要动「硬性约束」里的东西
- 复述时的某条假设被证明是错的

## 决策记录
- 日期 / 决定 / 谁拍的板 / 理由
```

复述提示词，中英两版。英文那句是 poteto 原句，后面三条是我自己加的：

```text
Before you write any code, restate in your own words what you think my goals are
and what the problem I'm trying to solve is. Then list:
1. what you will NOT do in this task,
2. every assumption you are making, numbered,
3. how big you think this change is (tiny / medium / large) and why.
Stop and wait for my confirmation.
```

```text
先别写代码。用你自己的话复述一遍：你认为我的目标是什么、我想解决的问题是什么。
然后列出：
1. 这次你不打算做的事；
2. 你在猜的地方，逐条编号；
3. 你觉得这个改动有多大（小 / 中 / 大），一句话说理由。
写完停下，等我确认。
```

拷问提示词。几条规矩里，「先翻代码，只问翻不到的」来自 Ambig-SWE 的发现：问题越具体、越是用户答得上来的，越管用。

```text
Grill me on this plan before you build it. Rules:
- Explore the codebase first; only ask what you cannot find out yourself.
- One question at a time. For each, give your recommended answer and why.
- Ask about behavior, constraints and trade-offs, not implementation details.
- Never answer your own questions for me.
- Stop after every assumption is confirmed or struck, or after 10 questions,
  then summarize the decisions.
```

```text
动手之前，先拷问我。规则：
- 先翻代码，只问你自己查不到的。
- 一次只问一个问题，每个问题附上你推荐的答案和理由。
- 问行为、约束和取舍，不问实现细节。
- 不准替我回答你自己的问题。
- 所有假设都确认或划掉了，或者问满 10 个，就停下，把结论汇总给我。
```

「要不要拷问」决策表：

| 改动大小 | 信号 | 流程 | 我的例子 |
|---|---|---|---|
| 小 | 一个文件、几行；好回滚；里面没有产品决定 | 复述一句，任务卡三五行，直接写 | 点染「使用点染图标」 |
| 中 | 好几个文件；至少一个产品或交互决定；碰到存储或数据 | 复述 → 拷问 → 完整任务卡 | phase6 统一输入框，任务书里单列「老板拍板」 |
| 大 | 一个会话装不下；越问问题越多 | 先拷问；规划失控了才画地图拆工单，别一上来就画 | 审计方案拆成 P0/P1/P2 共 19 张工单 |

最后是那个 skill。存成 `.claude/skills/dispatch-task/SKILL.md` 给 Claude Code 用；Codex 读的是仓库里的 `.agents/skills/dispatch-task/SKILL.md`，或者个人目录下的 `~/.agents/skills/`（[Codex 官方说明](https://developers.openai.com/codex/skills)）。正文我写成英文，两边的模型读起来都稳一点：

````markdown
---
name: dispatch-task
description: >-
  Use when the user hands you a new coding task, feature, fix or refactor and wants it
  done right the first time ("帮我做", "派个活", "implement", "build", "fix"). Before writing
  code: restate the goal, size the change, grill only when the change is medium or large,
  and get a task card whose acceptance section is written or confirmed by the human.
---

# dispatch-task：复述 → 定尺寸 → 验收单

You are receiving a task from a human who will NOT read every line of your diff.
Your job in this skill is to make sure you build the right thing, and that "done"
is defined by the human, not by you.

## Step 1 — Restate (always)

Before touching any file, reply with:

1. **Goal**: in your own words, what the user wants and the problem they are trying to solve.
2. **Not doing**: what you will deliberately leave out.
3. **Assumptions**: every guess you are making, numbered, so the user can strike them.
4. **Size guess**: tiny / medium / large (see Step 2), with one line of reasoning.

Then STOP and wait. Do not start until the user confirms or corrects the restatement.
If the user corrects you, restate again in one short paragraph.

## Step 2 — Size the change, pick the flow

| Size | Signal | Flow |
|---|---|---|
| tiny | one file or a few lines; easy to revert; no product decision inside | Skip grilling. Write the task card (Step 3) in 3–5 lines and do it. |
| medium | several files, or at least one product/UX decision, or touches data/storage | Grill first (below), then write the full task card. |
| large | more than one session can hold; many open decisions; you keep finding new questions | Grill first. Only if planning gets out of hand, turn it into a map (below). Never start with a map. |

### Grilling rules (medium and large)

- Explore the codebase first. Ask only what you cannot find out yourself.
- Ask ONE question at a time. For each question give your recommended answer and why.
- Ask about behavior, constraints and trade-offs the user can actually answer, not implementation details.
- Never answer your own questions on the user's behalf.
- Stop grilling when every assumption from Step 1 is confirmed or struck, or after 10 questions; then summarize the decisions.

### Map (only when grilling gets out of hand)

Write `docs/tasks/<slug>/MAP.md`: the destination in one sentence, then tickets grouped by
priority (P0 = fixes misleading or blocking behavior; P1 = main flow; P2 = polish). Each ticket
has: id, one-line goal, files likely touched, open decision (if any), and whether it needs the
human (HITL) or not (AFK). Work tickets one at a time. Re-check the map after every ticket;
delete tickets that turned out unnecessary.

## Step 3 — Task card (written into the repo, not just the chat)

Create or update `docs/tasks/<slug>/TASK.md` with this structure:

```markdown
# <title>

## Goal (confirmed restatement)

## Definition of done            <!-- HUMAN-OWNED -->
- [ ] ...

## Evidence I must hand back
- commands run + key output lines
- screenshots / file paths / URLs
- what I could NOT verify, and why

## Not doing
- ...

## Hard constraints
- ...

## Stop and ask me if
- ...
- the same step fails twice
- I need to change anything listed under Hard constraints

## Decisions log
- <date> <decision> — <who decided> — <why>
```

Rules for the **Definition of done** section:

- It belongs to the human. You may propose items, but mark each one `(draft)`.
- Do not begin implementation until the human has removed `(draft)` or rewritten the list.
- Never edit this section after work starts. If you think it is wrong, stop and say so.
- Tests you write yourself are evidence, not the definition of done. When the human describes
  a test case in their own words, implement exactly that case and name it in your report.

## Step 4 — Report

When you stop, reply in this order:

1. Each Definition-of-done item: ✅ / ❌ / ⚠️ with the evidence path.
2. Anything under "Stop and ask me if" that happened.
3. What is unverified and needs the human (real accounts, real devices, money, taste).
4. Update the Decisions log in TASK.md before you finish.

Do not say "done" if any item is ❌ or ⚠️. Say "partially done" and list what is left.
````

装好以后，派活时说一句「用 dispatch-task 派这个活」，或者直接描述任务，它会先停在复述那一步等你。

这个 skill 里有几处是我刻意的。完成的定义那一栏标成人的地盘，agent 只能提草稿，开工以后不准改；拷问最多 10 个问题，问满就收；地图只在拷问失控时才画，每做完一张工单回头看一眼，用不着的就删。

还有一处我刻意没写：它该用什么框架、怎么拆函数。那些是它的活，我不管。这个 skill 只管两件事，做对的东西，以及谁说了算「做完了」。

## 常见问题

问：任务很小，也要写任务卡吗？

要写，但三五行就够：目标一句，完成的定义一两条，不做什么一条。真正花时间的是拷问那一步，小活直接跳过。

问：Claude 号被封了，活会不会断？

这两周中文区聊得最多的就是 Claude 封号，我看到不少人的痛点不在号本身，在于需求和进度全在那个号的聊天记录里。我自己的做法是，任务卡、决策记录、进度文件全都写进仓库，不留在某个 agent 的聊天记录里。号没了，换 Codex 或者别的 agent 打开同一个仓库，读一遍 `TASK.md` 就能接着干。点染那一轮 Grok Build 额度用完、Codex 又登录失效，最后换人接手也没丢活，靠的就是这些文件。

问：它复述得头头是道，交回来还是不对，怎么办？

我也碰到过。多半是复述里的「假设」那一栏写得太虚。让它把每条假设写成能被一句话推翻的样子，比如「我假设视频也要支持 4K」，而不是「我会兼顾各种情况」。

问：验收单我不会写，或者没时间写？

那就让它先写草稿，你只做一件事：逐条看，删掉、改掉、补上。看不懂的那条，就是你还没想清楚的地方，先别派。

草稿里的每一条，它都得标上「草稿」两个字。我划过、改过，才把这两个字删掉。skill 里也是这么写的：这两个字没删之前，它不准动手。

## 系列导航

这是第 0 篇，讲派活。后面四篇，各管活交出去之后的一段：

- [我不再逐行看 agent 写的代码了，所以得先想清楚：凭什么信它](https://kobingogo.github.io/trust-agent-code-without-reading/)：不读每一行，靠什么相信它，讲证据链。
- [我不再琢磨 prompt 了，我在写「什么时候停」](https://kobingogo.github.io/agent-stop-conditions/)：循环什么时候该停，停止条件和外置刹车怎么写。
- [规矩放在哪一层](https://kobingogo.github.io/where-agent-rules-live/)：同一条规矩，放在对话、AGENTS.md、lint、测试还是记忆里。
- [一个 agent、一个 diff 工具、自己验收](https://kobingogo.github.io/minimal-agent-workflow/)：拿 Jest 作者的极简路线，对一下我这支 30 个 bot 的舰队。

回头看，这三步一点都不高级。复述、问清楚、写好验收单，跟带一个新同事差不多。

我自己也还没做到每次都走完。但每次偷懒跳过的那一步，后来大概率都得还。

说到底，agent 越能干，派活这一步越不能省。它干得快，跑偏了也跑得快；你省下的那几分钟，最后都会变成验收时的半小时。

如果你也刚开始带 agent，先从那一句复述开始就好，别的慢慢加。我们一起慢慢摸。

## 参考

- [poteto：restate in your own words…（2026-09-29）](https://x.com/poteto/status/2104744961904394699)
- [Matt Pocock：Should you /grill-with-docs, /wayfinder, or just one shot the code?（2026-10-08）](https://x.com/mattpocockuk/status/2108216899439894574)
- [mattpocock/skills：grill-with-docs 说明](https://github.com/mattpocock/skills/blob/main/docs/engineering/grill-with-docs.md)
- [mattpocock/skills：wayfinder SKILL.md](https://github.com/mattpocock/skills/blob/HEAD/skills/engineering/wayfinder/SKILL.md)
- [Kun Chen：AI-written unit tests and integration tests are empirically proven to be unhelpful（2026-10-08）](https://x.com/kunchenguid/status/2108030810691629403)
- [Vijayvargiya 等《Ambig-SWE: Interactive Agents to Overcome Underspecificity in Software Engineering》](https://arxiv.org/abs/2502.13069)
- [OpenAI：Codex Agent Skills](https://developers.openai.com/codex/skills)
