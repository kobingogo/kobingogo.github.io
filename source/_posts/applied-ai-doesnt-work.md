---
title: 和 300 多位高管聊完，他说企业 AI 大多只是让烂流程跑得更快
date: 2026-09-09 10:00:00
tags:
  - AI
  - Agent
  - 企业AI
categories: AI
---

> 作者：jin kobin（@KobinFlow）
> 本文为对原文的摘译、点评与改写。原文：vas（@vasuman）《Applied AI Doesn't Work》，https://x.com/vasuman/status/2095999742031675738 。摘译部分尽量贴着原文，点评和观点是我自己的判断，文中补充的案例都附了来源链接。

英国商业贸易部（DBT）给员工发了 1,000 个 Microsoft 365 Copilot 授权，试了 3 个月。结果平均每人每天只用了 1.14 次 Copilot。做 PPT 快了 7 分钟，质量却只有对照组的一半；Excel 分析反而更慢、更差。官方报告自己写：没找到可靠证据说明节省的时间变成了生产力。可是 72% 的用户表示满意或非常满意。

大家都喜欢，产出没变。

这是 vas 那篇《Applied AI Doesn't Work》里我印象最深的一段。他说自己和全球最大一批公司的 300 多位 CEO、CIO、CFO 聊过，得出的结论很刺耳：

> "most companies apply AI onto their garbage processes, and the end result is just making garbage faster."（原文开头段）

大多数公司把 AI 套在原本就很烂的流程上，最后只是让烂东西产出得更快。这篇长文在 X 上传得很广，收藏的人明显比点赞的多，我猜很多人是想留着对照自己的情况。

要说明一下：vas 是 Varick Agents 的 CEO，这家公司就是帮大企业做 AI 转型的，文章最后放了预约电话链接。这是一篇有立场的文章，论点可以成立，读的时候也要记着。

## 他的核心论点

### 历史在重复：1990 年就有人说过一模一样的话

vas 搬出了 Michael Hammer 1990 年发在《哈佛商业评论》上的文章。Hammer 当年观察到，企业在计算机上砸了大钱，回报却很少：

> "companies tend to use technology to mechanize old ways of doing business."（原文 Part 1，引 Hammer 1990）

公司倾向于用技术把旧的做事方式机械化，流程原封不动，电脑只是让它跑快一点。Hammer 在同一篇文章里说该"stop paving the cow paths"，别再给牛踩出来的小路铺柏油了。vas 的吐槽是：把"information technology"换成"AI"，这段话明天就能上头条。

他还用了 Hammer 文中一个数字：一份保险申请在流程里走了 22 天，真正有人处理它的时间只有 17 分钟。就算最好的模型让每一步快一倍，也只省了 8 分半钟，负责人却能报告"节省 50% 时间"然后升职。

> "The work can be minutes while the process can still be weeks."（原文 Part 1）

他合作过的一家公司，新开一个客户案件实际工作 25 分钟，从录入到生效却要 2 天到 2 周。

### AI 是没法"涂"上去的

vas 很讨厌"applied AI"这个说法。他的比喻是：apply 是刷一层漆，漆盖不住底下的问题。当年没人说"applied cloud"，大家说的是数字化转型、云现代化，因为都明白技术只是转型的一部分。

他认为问题出在惯性：签 AI 合同的人管得了工具和供应商，管不了流程，没人有权走进财务部说"你们 14 步的流程应该只要 5 步"。

### 别急着先统一系统

很多人想先把系统理顺，一个 ERP、一个 CRM、一个数据平台，再上 AI。vas 用两个案例泼冷水：TSB 银行核心系统迁移花了 3.18 亿英镑，事故又吃掉约 2 亿英镑，2022 年 12 月被 FCA 和 PRA 罚了 4,865 万英镑，520 万客户的银行服务出问题；Zimmer Biomet 在 2025 年 9 月向德勤索赔 1.72 亿美元，起因是一次"迁移整合"搞砸，连发货、开票都成问题。

他主张先统一流程：收购了 9 家公司、同一个流程有 9 种跑法，你就得造 9 套 agent 并永远维护。至于系统，他认为 agent 能容忍不一致，在现有系统上加一层编排就行。

### 把每一步分进三个桶

这是全文我觉得最实用的部分。先按部门梳理流程，用流程挖掘（process mining）加访谈一线操作员，摸清例外情况、上下游、系统冲突时以谁为准、实际处理时间和总耗时的差距。然后把每一步分进三个桶：

确定性的步骤用普通代码，便宜、可审计、不会幻觉；有大量历史判断记录且风险够低的步骤交给 agent，每个输出都要度量；风险太高或历史数据不够的，保留人工，但由 agent 把证据都摆到人面前。他有一句我很喜欢：

> "you need to judge the difficulty of the action, not the difficulty of the thinking."（原文 Part 2）

要看的是这个动作的难度，跟思考有多难关系不大。输出是"是/否、转给哪个组、标记/不标记"的，适合交给 agent；输出是一份 5 页文档、人还得从头读一遍核对的，就该混合着做。

分完之后，25 步的流程可以变成 3 个 agent 加 2 个人工卡点。动手前先定 KPI 基线，否则 12 个月后说不清变化。优先做交接最多的流程，它不一定是量最大的。

### 案例：月底对账

他举的例子是一家每月要对 300 多个银行账户的公司，分在 3 个地区、3 种格式，全靠 Excel，有 12,000 多条未清项，每月光收集对账单就要 4 天。原流程 12 步：追对账单、整理格式、拉账、逐行匹配、标记差异、发邮件问当地财务、等回复、催回复、调账、汇总，每个地区各来一遍。

匹配从来不是瓶颈，时间耗在等对账单的 4 天和跨时区等回复上。新流程只有 3 步：对账单自动推送进来（他特意说这一步跟 AI 毫无关系）；规则能匹配的自动匹配，匹配不了的由 agent 把证据和建议动作整理好；最后人按队列处理例外。

### 为什么很少有人这么做

他给了三个原因：这件事只能从高层推，靠 IT 或一个"预算 100 万、零权力的创新部门"做不成；一线员工得愿意用，还得愿意讲出可能让自己被替代的知识；对多数人来说维持现状最安全，AI 成了没奖励，失败了要背锅。

他也承认流程再造很难。Hammer 和 Champy 1993 年估计，尝试再造的组织里 50% 到 70% 没达到预期，Hammer 后来说自己"insufficiently appreciative of the human dimension"（对人的因素重视不够）。vas 认为这次不同在于：agent 能接手过去靠人完成的交接，先被消掉的大多是追、等、升级这类协调工作。

他还批评了两类服务商：传统咨询公司能花 30 万美元画出漂亮的流程图，却不懂模型能信任到什么程度、怎么设计 eval；AI 厂商会造 agent，却没跟财务和运营一起拆过流程，还会把你绑死在自家模型上。

他列的成果包括：月结从 18–22 天缩到 7–9 天；交易平均闲置从 23 天降到 6 天，销售的行政时间从每周 38% 降到 14%；应付账款例外从每月 600–800 张降到 50 张以下；工资更正减少 90%；80% 的员工咨询直接由公司政策文档回答。他说这批部署累计创造的价值超过 1 亿美元，并且是和客户一起测出来的。

## 逐条点评

**"套在烂流程上只会让烂流程更快"：同意。** 这是全文最站得住的部分，Hammer 的 22 天和 17 分钟我去翻了原文，确实在，不过是 Hammer 在括号里引用"另一家保险公司的估计"，vas 写成"他研究过的一家保险公司"，稍微说重了一点，不影响论点。工作只占几分钟、排队占几周，这种结构在任何组织里都很常见。

**英国 Copilot 试点：部分同意。** 我把 DBT 那份 49 页的报告下载下来核对了，1.14 次、7 分钟、Excel 更慢、"extremely small"、72% 满意，这些都对得上。PPT 那组的质量分是 1 对 2，准确度是 1.5 对 5，说"一半质量"其实还算客气。但 vas 没提：同一张表里，用 Copilot 总结报告从 41 分半钟降到 12 分半钟，质量和准确度都更高。报告还写明观察任务样本很小，衡量生产力也"不是这次评估的主要目标"。它能支持"个人工具不会自动变成组织生产力"，证明"AI 没用"就不够了。

**先统一流程，别先统一系统：大体同意。** TSB 的罚款我在 FCA 官网查到了，4,865 万英镑没错；Zimmer Biomet 起诉德勤索赔 1.72 亿美元也有报道，不过德勤否认指控，2025 年 11 月申请驳回。我同意先统一流程定义。但"agent 能容忍系统不一致"这句话我有保留：能容忍，也就能把错误藏起来。两个系统对同一个供应商记录说法不同，agent 会自己选一个继续跑，选错了没人知道。他自己的梳理清单里有一条"两个系统冲突时以谁为准"，我觉得这条要写成规则，不能留给 agent 临场发挥。

**三个桶和 KPI 基线：强烈同意。** "看动作难度"这条判断标准很好用。输出能被便宜地验证，就放心给 agent；验证成本和自己做差不多，就别假装自动化了。先定基线也是同理，没有基线的 AI 项目，最后只能靠满意度调查交差，然后就是 72% 满意。

**"必须从高层推、一线要愿意"：同意，但谈得太轻。** 这是最难的部分，原文只用了三段。员工愿不愿意交出经验，取决于公司怎么安置被省下来的人，agent 帮不上忙。

**对咨询公司和 AI 厂商的批评：部分同意。** 模型锁定的风险是真的，换模型要重跑 eval，这点我同意。但"做模型无关的平台，同时懂流程、懂工程、懂 AI"，正好就是他公司卖的东西。至于说大多数 FDE 是"平庸的工程师加平庸的顾问"，这是在说竞争对手，我没法判断，也不打算采信。

**成果数字：保留意见。** 月结从 18–22 天到 7–9 天、例外从 600–800 到 50 以下，这些数字很具体，听起来也合理。但全是自报，没有客户名，也没说一共做了几个项目、失败了几个。"300 多位高管"只是聊过，没有方法说明。我把它当从业者的经验总结来读，不当证据。

## 几个可以对照的外部数据

**MIT NANDA 的"95%"，以及它挨的批评。** 2025 年 7 月 Project NANDA 发的《The GenAI Divide: State of AI in Business 2025》说，企业在生成式 AI 上投了 300–400 亿美元，95% 的组织拿到的是零回报。这个数字被到处引用。我核对了报告 PDF，方法是 52 个组织的访谈、153 位高管的问卷和 300 多个公开项目的分析，作者自己说数字只是"directionally accurate"，衡量的是试点后 6 个月的回报。沃顿的 Kevin Werbach 等人公开质疑过：95% 在正文里找不到扎实的数据支撑，成功定义太窄，样本是自选的。NewMR 的 Ray Poynter 还指出，Fortune 报道写的样本量跟 PDF 对不上。同一份报告里也有对 AI 有利的数据：通用聊天工具的试点到落地比例约 83%。Fortune 还提到，最大的回报出现在后台自动化，这倒跟 vas 盯着财务流程的思路一致。

**Klarna：客服 AI 之后又招人。** Klarna 曾宣布它的 AI 客服做了相当于 700 名员工的工作。2025 年 5 月，CEO Sebastian Siemiatkowski 对 Bloomberg 说："As cost unfortunately seems to have been a too predominant evaluation factor when organizing this, what you end up having is lower quality."（组织这件事时成本占了太大权重，结果就是质量下降。）公司开始重新招人工客服，试点类似 Uber 的灵活排班。不过 Klarna 发言人对 Fortune 说，他们"very much still AI-first"。同一篇 Fortune 报道引了 IBM 对 2,000 位 CEO 的调查：只有四分之一的 AI 项目达到了承诺的投资回报，在全公司规模化的只有 16%。我觉得 Klarna 的问题出在度量上：KPI 只盯成本，没把质量设成基线，就会这样来回折腾。

**一个有明确数字的正面案例。** Brynjolfsson、Li、Raymond 研究了 5,179 名客服在分批接入生成式 AI 助手后的表现，每小时解决的问题平均提升 14%，新手和低技能员工提升 34%，资深员工几乎没变化，客户情绪和员工留存也变好了。论文 2025 年发在《经济学季刊》上。它说明 AI 直接加在现有岗位上，也能测出实打实的效果。但它测的是单个岗位的产出，跟 vas 引用的 Ethan Mollick 那句话并不冲突："AI use that boosts individual performance does not naturally translate to improving organizational performance."

三个放在一起看，说"企业 AI 不起作用"太绝对，说"大部分企业 AI 还没在财报上留下痕迹"比较准确，原因多半出在流程和度量上，跟模型关系不大。

## 放到一人公司身上

我现在一个人带一队 agent 做产品，「点染 Dianran」和几个负责调研、写作、验收的 bot。按理说大企业病跟我没关系，没有子公司，没有部门要协调。但他说的几个问题，在小团队里都有缩小版。

先说那 17 分钟。agent 干活很快，一个调研、一段代码，几分钟就交回来。然后它就在那等，等我有空看，等我验收，等我回一句"可以"或者"重做"。在我这里，我自己就是那个排队环节。点染改版就是这样：我把它拆成 #4、#5、#6 三个 PR 加一条流水线分支，agent 几天内就写完了，全部部署到预览站，PR 也都开好了。然后这几个 PR 就一直挂在那里没合，正式站还停在第二阶段，因为验收和 7 个设计决定都在等我。卡住的是我的审阅和拍板，不是 agent。如果只是换更强的模型让 agent 再快一倍，跟给那 17 分钟提速没两样。

再说三个桶。我一直觉得检查通过和可以交付是两回事。lint 过了、测试过了、格式对了，属于确定性的那一桶，用脚本跑就行，很便宜。可它们只能说明东西"没坏"，不能说明"能用"。整理提示词库的时候，agent 先报告有 93 条缺封面图，我让它重数一遍，实际是 283 条，只好回头更正。另一次是每周跑的自动任务，有一周因为助手的用量额度用完了直接失败，最后是我手动把它续上的。两次都是步骤显示做完了，结果却不对、也不完整。所以我会让一个 bot 干活，另一个 bot 独立验收，看的是"这东西能不能交出去"，不碰"代码有没有报错"。在我看来，多 agent 最该买的就是这份独立验收：干活的那个总会觉得自己做完了。

vas 说动手前要定 KPI 基线，这跟我做 eval-driven 是一个意思。一个 bot 上线前，先写清楚怎样算合格，拿几个样例跑出基线，以后改 prompt、换模型都拿同一套 eval 比。我现在实际在用的有两条。一是 agent 的每个改动都必须先部署到单独的预览站 dianran-next，由助手 bot 在那里检查、截图发给我，没有我明确说 OK，什么都不会合进 main、不会上正式站；每周维护提示词库的那个任务也只开 PR、只部署预览，从不自己合并。二是调研报告里的每个数字都要能追到来源，核实不了的一律标【待核实】。他提醒换模型要重跑 eval，这个我很有感触，没有 eval 的话换模型基本靠感觉。

还有谁对结果负责。vas 说大企业里签 AI 合同的人不对流程负责，所以没人去改流程。在我这里结果只能我来负责，agent 不负责。所以卡点要设计好：哪些步骤 agent 自己定，哪些必须停下来等我，等我的时候证据要摆好，让我 30 秒能判断。这正好是他说的第三个桶。也是因为这样，我坚持人机双写、不陪聊：我写需求和验收标准，agent 写产出和证据，双方都留下可以复查的东西，不在对话框里来回磨。DBT 那个"每人每天 1.14 次"和 72% 满意，让我想到很多人用 AI 停在陪聊上，用得开心，流程没变。

最后一点是流程本身。小团队最容易犯的错，大概是把自己原来手工的做法原样交给 agent。我自己就犯过。点染改版一开始，我让一个编码 agent（Grok Build）从头包到尾，做到一半它的额度用完了，直接报 HTTP 402。我只好换 Codex，结果它的登录也过期了，最后又换了一个 agent 来接手，把做了一半的活收尾。回头看，我是把“一个 agent 包办”当成雇一个外包来用了，应该先把活拆成一个个能单独验收的小 PR，再把备用执行者和额度检查写进流程里。vas 说对账单自动推送"跟 AI 毫无关系"，我很认同。很多时候该先删掉的是步骤，加 agent 是后面的事。

## 结尾

我同意 vas 的主干：AI 加在没改过的流程上，省下几分钟，流程照样是几周。我不太接受的是斩钉截铁的语气和没有分母的成功数字，这跟被到处转的 95% 是同一类问题，都得先看清楚测的是什么。

对我这种一人公司来说，好消息是改流程不用说服任何部门，坏消息是也没人替你验收。企业失败的原因换到小团队，大多变成了一个问题：你有没有在 agent 动手之前，想清楚这件事做完是什么样、由谁来判定做完了。

所以想问问也在带 agent 干活的朋友：你们那里，agent 干活的时间和等人验收的时间，哪个更长？

## 参考链接

- 原文：vas（@vasuman），《Applied AI Doesn't Work》，https://x.com/vasuman/status/2095999742031675738
- Michael Hammer，《Reengineering Work: Don't Automate, Obliterate》，HBR 1990，https://store.hbr.org/product/reengineering-work-don-t-automate-obliterate/90406
- 英国 DBT，《Microsoft 365 Copilot pilot: DBT evaluation report》，https://www.gov.uk/government/publications/microsoft-365-copilot-pilot-dbt-evaluation-report （PDF：https://assets.publishing.service.gov.uk/media/68adbe409e1cebdd2c96a19d/dbt-microsoft-365-copilot-evaluation.pdf ）
- FCA，《TSB fined £48.65m for operational resilience failings》，https://www.fca.org.uk/news/press-releases/tsb-fined-48m-operational-resilience-failings
- MassDevice，《Zimmer Biomet sues Deloitte for $172 million》，https://www.massdevice.com/zimmer-biomet-sues-deloitte-for-172-million/ ；德勤回应：https://www.massdevice.com/zimmer-biomet-deloitte-response-erp-lawsuit-looking-glass/
- Fortune，《MIT report: 95% of generative AI pilots at companies are failing》，https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo/
- Ray Poynter（NewMR），《Myth Number 2: MIT Showed That 95% of AI Pilots Fail》，https://newmr.org/blog/myth-number-2-mit-showed-that-95-of-ai-pilots-fail/
- Fortune，《Klarna plans to hire humans again, as new landmark survey reveals most AI projects fail to deliver》，https://fortune.com/2025/05/09/klarna-ai-humans-return-on-investment/
- Brynjolfsson, Li, Raymond，《Generative AI at Work》，NBER Working Paper 31161 / QJE 2025，https://www.nber.org/papers/w31161
