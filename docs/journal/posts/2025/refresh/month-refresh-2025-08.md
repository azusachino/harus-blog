---
title: Monthly Refresh 2025.08
date: 2025-08-31
description: yet days pass by
categories:
  - refresh
slug: month-refresh-2025-08
comments: true
---

![](/assets/images/2025/08-magical.jpeg){ .post-cover }

<!-- more -->

## keyword

- elden ring night reign
- DTS
- iris-node (aeron cluster application)

## things

- 月初继续在玩 elden ring, 虽然算不上轻车熟路, 但也算能跟得上大佬的节奏; 其实, 只要把握住最重要的几个时间点, 有一定的等级与装备, 最终 boss 不算是个问题, 甚至不需要特别巧妙的搭配, 每个人都好好玩, 别做“不合时宜”的事情就好了.
- 月初跟着一起去了一趟川越, xhs 上的各类宣传手册做得挺好的, 所谓的“小江户”. 真正到了, 只能说, 100% 的宣传诈骗… 一条夹杂着旧时代与新时代建筑的步行街, 以及周围的几座神社, 这就是川越旅行的全貌了. 不如说, 很多人是奔着 chikawa 过去的, 最终还是一句话: 人只能活在时代的洪流之中.
- 花了比较多时间去写 iris-node, 虽然之前已经积累了比较多的知识, 也看了很多生产代码, 但真正自己上手的时候也还是困难重重, 太多事情摸不着头脑, 比如 sbe 如何设计, aeron cluster client 究竟是怎样与集群交互的, 配置 aeron cluster 的时候, 需要如此多的 endpoint, 究竟应该怎么处理? ipc or udp? 怎么定义集群的状态机, 怎么实现集群状态的 snapshot serde 等等.
- 跟着小林桑学习了期货, 以及为什么期货会存在: 期货也是一只无形大手, 动态调整现货的价格, 以使其更接近“真实的价值”. 当然, 期货市场也是存在, 无视“物理规律”, 全凭资金量火拼的案例.
- 尝试订阅了一个月的 claude code, 效果确实非常好, 比如可以 case by case 写出比较完善的 unit test, 以及按部就班地修复代码中出现的问题, 编译错误/运行错误也是不在话下, 唯一的问题可能是 pro 版本的 token 比较少, 没办法维持长时间的记忆, 需要用户有意识地维护 claude.md
- 月末的魔法未来 2025, 也确实期待已久, 早早就到了现场, 展览馆场的内容跟往年差不多, 在官贩买好东西, 简单转了两圈就出来了. 今年的位置更靠近舞台了, 但好像也更靠近音响了, 左右不对称, 导致挺影响听力的… 演出当然非常棒, 自己也成长了不少, 能跟上应援了, 可以算是 mikufan 的新兄贵了 🐶

## conclusion

- 在回顾日志的过程中, 发现很多事情记录地太简陋, 事后就很难想起“看了一场比赛”, 究竟是什么比赛, 以及具体的感受如何等等…

## review

- aeron cluster application ✅
  - the iris-node
- 2~3 sharing (revise previous contents) ❌
- running up to 35KM
  - 月底尝试了夜跑, 效果好多了, 气温不高, 略有微风, 更主要的是, 不需要担心时间不够
- conversation-style, writing-style practice ❌

## resolution

- learn and share
- run 1 hour / 10 km
- residential materials preparation

## sharing

- cynics are merely idealists with unusually high standards.

---

- https://youtu.be/iGz2uWl-kGc
- https://youtu.be/--KnsLGfXWM
  - 有限的收益, 可能无限的亏损
- https://www.youtube.com/watch?v=Ylvr5hl6hYo
  - 多头/空头之间的资本较量 (1~40 倍杠杆)
- https://youtu.be/cBLbDn5RJlw
  - 人口
  - 经济
  - 利率
  - 政策
- https://www.youtube.com/watch?v=aOwmt39L2IQ
  - why alcohol is amazing to certain people
  - the bad side (alcohol accidents)
  - the trend of young people stop drinking and the isolation of individual
  - 视频立意: 都是时代的病?
- https://endler.dev/2025/how-to-review-code/
  - focus on the big picture
  - naming is critical
  - be willing to say no
  - reviews are iterative communication
  - focus on “why” not “how”
  - test the code when possible
  - maintain professional communication
  - skip the nitpicking
- https://www.seangoedecke.com/good-system-design/
  - good design looks underwhelming
  - minimize stateful components
  - split fast/slow work appropriately
  - focus on hot path
  - log aggressively during error conditions
  - use boring, well-tested components
- https://cheats.rs/
- https://stablecoin.com/guide/
