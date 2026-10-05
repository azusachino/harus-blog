---
title: Monthly Refresh 2026.09
date: 2026-10-01
description: vibecoding, harnesses, and the human boundary
categories:
  - refresh
slug: month-refresh-2026-09
comments: true
---

## keyword

- agent harnesses & the vibecoding trap
- shipping latte & tsuzuri 0.8
- prod realities & human boundaries

## journal

- The month opened with a physical halt: caught a severe fever and throat infection right on 09.01, burning through sick leaves and spending days curled up before energy returned.
- Work rolled straight from sick leave into production release trenches:
    - Shipped the `es-sink` release after catching a missing biz-lane bug during the release gate parity check, followed by the aircraft release (an 8:00 AM office start that went smoothly).
    - Even with agent assistance doing heavy lifting on analysis, production release verification underscored an enduring truth: AI can propose approaches and summarize diffs, but it cannot make decisions for you or substitute for grounded system context.
    - A harsh reminder arrived on 09.24: a production issue fired off right while I was standing in line at the Tokyo Immigration Bureau. Test environments never prepare you for 24/7 reality.
- The personal project front was an explosion of agent-assisted building across nearly a dozen repos:
    - **Latte (0.0.1 → 0.2.0)**: Built and shipped an entire native Android image client from scratch in Kotlin and Compose. What started as a simple Yande/Moebooru viewer rapidly grew into a full app with Pixiv OAuth, custom tabs authentication, following feeds, favorite tags, paged downloads, R8 hardening, and signed release APKs.
    - **The KB Stack (Tsuzuri, Luna, Asobi)**:
        - Renamed and flattened `neiro` into `tsuzuri`, publishing 0.8.0 to npm. Stripped out bloated abstractions in favor of a lean core, an explicit operation permission mask, and bulletproof link-rewriting when moving Markdown files.
        - Reworked `luna` around the `pi-coding-agent` embedding SDK. Went on a wild loop through external knowledge tools—testing Wiki.js, Trilium, and SilverBullet—before realizing local Git/Markdown with custom tools wins every time. Hooked Luna straight into Tsuzuri with guarded Apricot vault permissions and post-write formatting hooks.
        - Cut `asobi` 0.8.0 and 0.8.1: decoupled skills out of the graph, added a daemonized shared server, and implemented task leasing for multi-agent workflows.
        - Cleaned up the personal infra boundary: migrated domain DNS back from `.icu` to `azusachino.com` via Cloudflare, and automated Asobi server deployments on the k3s cluster.
    - **Iroha & Felicia**:
        - Rebuilt Iroha's ingestion around Health Auto Export (HAE) HTTP endpoints, completely retiring manual JSON exports and bot uploads. Reshaped Grapher into a consolidated daily activity cockpit with KPI cards and route privacy coordinate-rounding.
        - In Felicia, consolidated SQLite `user_version` migrations, cleaned up legacy ADRs, and established clean server-side journey authoring mask ownership.
    - **Trading & Learning Sandboxes**:
        - Expanded `dandelion` with a strategy agent fleet, supervisor lifecycle, DCA/Grid runners, and smart order routing (SOR) risk gates ahead of spot-grid deployments.
        - Refactored `calc` into a hands-on LLM learning repo, implementing manual causal attention and a GPT sliding-window dataset from scratch.
        - Contributed upstream to `animeko`: landed PR #3451 to display original Japanese/native titles across entries and episodes, and architected PR #3472 for an extensible tracker subsystem with AniList sync.
- Media, downtime, and life outside terminal windows:
    - Late-night streams of Dota 2 tournaments (PGL Wallachia Season 9 and BLAST SLAM, watching LGD, Aurora, and Xtreme Gaming).
    - Background soundtracks: Vaundy's Asia Arena Tour live (*Kaiju no Hanauta*), Yorushika's *Hirutobi*, and lo-fi Study with Miku streams (with the animated Sleeping Miku theme installed on Firefox).
    - Cleared Fontaine Archon Quest Chapter 4 in Genshin (the focus mode pre-conditions were an ordeal), kept tabs on *Neverness to Everness*, read raw manga on quiet evenings, and dropped by the arcade for an hour of Maimai until my arms gave out.
    - Dinner at a Ginza buffet that felt overpriced and underwhelming, salvaged by eating six servings of ice cream at the end; balanced out by stockpiling tubs of Meiji vanilla ice cream from Gyomu Super.
    - Finally laced up running shoes and logged a 6km run at the turn of the month, breaking a multi-week drought.

## conclusion

Looking at the git log, September looks hyper-productive: over 800 commits across ten personal repositories, two new apps shipped, releases delivered. But beneath the metrics lies a subtle exhaustion with "vibecoding". When agents can scaffold an entire Compose app or refactor a TypeScript SDK in an afternoon, the bottleneck shifts entirely to human verification, taste, and cognitive endurance. Without deliberate study, you end up reviewing hundreds of lines of code without absorbing their lessons. Users do not automatically grow alongside their agents unless they fight for genuine understanding.

## resolution

- **System boundaries (O3)**: Stop tool-hopping on note systems. Stick to the Tsuzuri + Apricot + Luna setup and focus on writing rather than plumbing.
- **Deep study over passive skimming (O4)**: Slow down the agent loops on `calc`. Write the attention mechanisms and tokenizers by hand before letting agents autocomplete them.
- **Body & Endurance (O1)**: Protect the running habit that returned with the 6km run—maintain at least 3 runs per week regardless of workload.

## sharing

- <https://blog.alexewerlof.com/p/coding-is-not-solved>
    - A sober, articulate critique of why churning out code is not the same as solving software problems.
- <https://claude.dev/blog/how-we-made-claude-ai-faster/>
    - Real architectural insight on latency reduction and interface responsiveness.
- <https://claude.dev/blog/spending-your-effort/>
    - Choosing where human attention actually matters when autonomous models handle execution.
- <https://mp.weixin.qq.com/s/XwdD9d6jFbRFwMWhr5a7JA>
    - Reflections on harness design: why the database industry has always built harnesses, and why fail-fast beats unbounded retries.
- <https://www.youtube.com/watch?v=jn7XU4OaIaE>
    - Visual breakdown of the Transformer architecture.
