---
title: Monthly Refresh 2026.09
date: 2026-10-01
description: learning in the agent era
categories:
  - refresh
slug: month-refresh-2026-09
comments: true
---

## keyword

- agent era workflows & harnesses
- prod releases & operational reality
- knowledge tools migration (tsuzuri, luna, asobi)

## journal

- The month opened with recovery and sickness (throat and fever), forcing sick leave and rest, but work quickly rolled into production release verification.
  - Delivered the `es-sink` and aircraft production releases. Both went smoothly overall, though verification and edge cases highlighted that AI can help reason about decisions, but cannot substitute for deep system understanding.
  - A morning prod issue hit while I was at the Tokyo immigration center, serving as another reminder of the operational gap between test environments and 24/7 production.
- Spent significant time learning and iterating on coding agent loops and harnesses:
  - Read through the `pi` agent book and studied agent loop mechanics, three-layer interface-first design, event sources, and session steering hooks.
  - Explored `dsh` (deepseek-harness) concepts: the plugin runtime, contract-first workflows, and reducing unnecessary orchestration.
  - Built out and reworked `luna` (integrating `pi`), `tsuzuri`, and refactored `asobi` into a client/server architecture for multi-device and agent collaboration.
  - Migrated domains back to `azusachino.com` via Cloudflare.
- Knowledge base infrastructure experiments continued:
  - Tested wiki tools like Wiki.js and Trilium before doubling down on local Git/Markdown workflows. With agent assistance, migrating back and forth between tools is easier than ever, though shaping the information architecture still requires manual clarity.
  - Began incorporating GitLab issues as central anchors for collaboration.
- On side projects and learning:
  - Worked on the `animeko` tracking subsystem PR. The Android piece was straightforward, while Desktop and iOS required substantially more care and cross-platform revision.
  - Started into LLM fundamentals (Stanford CME 295 materials, transformer mechanics, building from scratch in `calc`), though progress was slower than planned.
  - Life pace: a quiet stretch with gaming, Maimai at the arcade, and finally breaking the running drought with a 6km run in early October.

## conclusion

September revolved around adapting to the rhythms of the agent era. While agent tooling makes prototyping, refactoring, and migrating between platforms faster, the cognitive load of shaping architectures, verifying edge cases, and steering decisions remains entirely on the human. Work and personal tooling made steady progress, but self-directed learning (LLM fundamentals, reading synthesis) still struggled against side quests.

## resolution

- **Work & Systems**: Keep execution grounded—use agents for implementation while reserving time for explicit design review and verification gates.
- **Learning**: Resume structured time for LLM foundations (`calc`) and synthesis notes rather than drifting across articles and feeds.
- **Physical**: Maintain the running habit restarted with the 6km run (aiming for consistent weekly mileage).

## sharing

- https://claude.dev/blog/how-we-made-claude-ai-faster/
  - System-level optimizations and real latency reductions in agent interfaces.
- https://claude.dev/blog/spending-your-effort/
  - Where human leverage actually matters when working alongside autonomous models.
- https://mp.weixin.qq.com/s/XwdD9d6jFbRFwMWhr5a7JA
  - Notes on agent orchestration, fail-fast mechanics, and harness design.
- https://www.youtube.com/watch?v=jn7XU4OaIaE
  - Visual walk-through of the Transformer architecture.
