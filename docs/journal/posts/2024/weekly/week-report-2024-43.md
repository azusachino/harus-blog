---
title: Weekly Report 2024.43
date: 2024-10-27
description: payback or paycheck?
categories:
  - weekly
slug: week-report-2024-43
comments: true
---

![](/assets/images/2024/psn-tlou2.png){ .post-cover }

<!-- more -->

People made wrong choices, or they were made so.

## Entertainment

### TLOU part2

用周末两天通关了 part2, 相较于一代, 更加重视叙事了, 但好像也没说一个特别“有意思”的故事. Abby 与 Ellie 的对立固然不错, 但 Scar 帮的小男孩那段剧情是想表达什么呢, 为了结局的时候, 侧面展示 Ellie 的恻隐之心给 Abby 一个可以“圆回来”的 ending?

最后那部分的小木屋感觉也挺突兀的, 大家一起住不好吗? 也是为了烘托 Ellie 最终孤身一人的凄凉之境吧. 下周争取能够白金 🎮

## Learning

SG exam related stuffs

## life

- 为了 12 月份的札幌之旅, 开始省钱.
  - 机票明明很便宜, 但是旅费还是吓人 (机场到札幌站的费用基本上够住一晚青旅了 👀)
- SG 考试算是低空飘过了, 经验教训就是不能完全靠过去问道场来准备, 还是有不少知识点从来没在模拟测试中遇到过
- 久违地在周末两天窝在家里, 玩游戏, 目前看来在家打游戏确实是节省开销的好办法.

## Collectibles

### learn

- https://www.uber.com/en-IN/blog/postgres-to-mysql-migration
  - architecture design between Postgresql & MySQL (with certain versions)
- https://www.uber.com/en-IN/blog/differential-backups-on-myrocks
  - by utilizing MyRocks as the backend of MySQL (SST), uber introduced differential backup
    - manifest
    - SST files (blob)
    - ![.](https://lh7-rt.googleusercontent.com/docsz/AD_4nXfCb9fhrKQmz_E-om9aLszMnP8rwiDhPJ3IbLdv7snvE5I3BpmXVJpMhVz9ZvPyvKsxc-PgGbw8bTlYbtX75kJvX-6KuRW9K8AHfM8lXpgAMpizpvXZg-Uq1T859HvLe5JPRn4RNTmH27ZjvYT3ryXluU9R?key=5NK_RoiIfdfw2rcH98YHAg)
- https://netflixtechblog.com/netflix-edge-load-balancing-695308b5548c
  - load balancing approach
    - choice of 2
    - primarily based on the load balancers' view of a server's utilization
    - secondarily based on the servers' view of its utilization
    - probation and server-age based mechanisms for avoiding overloading newly launched servers
    - decay of collected server stats to zero over time (avoid latency problem)
  - server reported utilization
    - actively poll for each server's current utilization using health-check endpoints
    - passively track responses from the servers annotated with their current utilization data
- https://www.uber.com/en-JP/blog/avoiding-cpu-throttling-in-a-containerized-environment/
  - allocating resouces by CPU or cpuset
