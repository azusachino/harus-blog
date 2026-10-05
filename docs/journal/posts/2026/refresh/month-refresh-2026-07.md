---
title: Monthly Refresh 2026.07
date: 2026-08-03
description: the same gap, a week apart
categories:
  - refresh
slug: month-refresh-2026-07
comments: true
---

## keyword

- flink adoption (the missing app)
- the clustering-library port, no breakthrough
- KB restructure (json over html)

## journal

- The month opened already on fire: a prod incident from late June followed me into July — a clustering node had lost its state, and even working through it with claude-code, it took a few rounds before we landed on a recovery approach.
- Flink got greenlit as the answer to our OLAP mess, and by 07.17 I had the first real deployment running. A real milestone — except the one piece that would make it usable, a deployable app, was still missing a week later, on 07.24.
- In parallel I kept working on a side project: porting a clustering library from zig to rust. Agents carried some of the pattern over, but "no breakthrough" is a phrase that showed up in my log two weeks running.
- Opened a new project, `flos`, as a learning sandbox, and then just... left it there. Drafted, unjudged.
- Miku Symphony 2026 at Suntory Hall on 07.05 — a great, very orthodox performance, though I still couldn't quite connect the parts of the music together.
- 07.09 turned into a messy debate about a paperwork gap that might affect my PR application. It surfaced once and never came back up.
- The stay-home days mostly amounted to food and games — hot pot that wrecked my stomach for a few days after, a "cheap beef vs. shrimp" lesson learned the hard way, and clearing out the last of the seasonal events in ZZZ and Genshin before their version updates.
- Sang for about six hours straight at Akabane on the 07.20 holiday, then had a perfectly reasonable dinner at Saizeriya.
- Drafted the H2 2026 OKR, anchored in 黄勇的 OKR 实战笔记 — read once, understood a lot less than I'd hoped.
- Also finished two books this month: a reread of 哈佛幸福课, and 10x程序员工作法. ~30 books logged so far this year already beats all of 2025 — turns out volume was never the gap, connecting what I've read is.
- Ran exactly once, 3km, in the first week — then nothing. Four Sundays in a row of the same "not much" answer.
- Restructured the whole knowledge base to run on JSON instead of scraping HTML — a real infra upgrade, not busywork.

## conclusion

I'm good at opening things this month and bad at closing them — flink, the clustering-library port, `flos`, the O3-KR3 self-assessment (already flagged overdue back in May) all stayed exactly as open as they started, some of them named the same way a week apart. Real life had the same shape: four weeks of not running, and a reading pile that's already bigger than all of 2025 but still isn't turning into anything. The two books and the KB restructure are the clean wins; everything else is a carry-over into August.

## resolution

This month I finally drafted the H2 2026 OKR (Aug–Dec), so starting now, resolutions get measured against it instead of floating free:

- **Body (O1)** — running goes from "basically zero" to an actual habit: 3 runs/week toward 500km by year end. Four weeks of "not much" was the real finding this month, not a rounding error.
- **Learning (O4)** — stop logging more books and write synthesis notes connecting the ones already read, starting with the wealth-psychology cluster.
- **Work/infra (O3)** — ship the missing runnable app on the flink deployment, take the clustering-library port to an actual checkpoint against the original (or shelve it honestly), give `flos` a real go/no-go, and finally do the O3-KR3 self-assessment that's been named since May.

## sharing

- https://www.gingerbill.org/article/2026/07/10/good-tools-are-invisible/
  - landed the same week my `astro + starlight` experiment failed for being too rigid to hook into
- https://antirez.com/news/169
  - you can't just say "implement XYZ" — the honest read on why my clustering-library port kept stalling
- https://bun.com/blog/bun-in-rust
  - pre-work, trial-run, verification, dispatch — a name for the loop I'm already running on agent-built infra work
- https://akitaonrails.com/en/2026/04/20/clean-code-for-ai-agents/
  - KISS yet with context, a good note to close the month on
