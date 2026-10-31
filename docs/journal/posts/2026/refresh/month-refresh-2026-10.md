---
title: Monthly Refresh 2026.10
date: 2026-10-31
description: a trip home, another rewrite, and the same unfinished learning
categories:
  - refresh
slug: month-refresh-2026-10
comments: true
cover: "/assets/images/2026/10/shanghai-mercedes-benz-arena.jpg"
cover_alt: "Shanghai's Mercedes-Benz Arena beneath a blue sky, with steps and a globe sculpture in the foreground"
---

October had a trip home in the middle of it. Before leaving, I was debugging infrastructure and rebuilding the blog. After returning, I was fixing CVEs and working through another agent-built MVP. In between were my sister's engagement ceremony, old friends, and my first DQ ice cream after coming across the Snow Miku collaboration.

<!-- more -->

## keyword

- going home & catching up in person
- agent-built systems & unfinished verification
- rebuilding the shelves & postponing the study

## journal

### Work & Systems

The first working week went into bot infrastructure: understanding the existing setup and preparing CDK/CDK8s code. By October 7, the applications were compiling, running, and deployed to the test environment.

After the trip, the queue was mostly CVE fixes and infrastructure changes. An account-operator MVP came together with Claude in one night and one morning. Being able to inspect the code and the Kubernetes environment made the discussion much more concrete. I still had to decide what the system should do and whether the proposed behavior made sense. The next day brought more test cases and memory-leak problems to investigate.

I also spent too much time refining the work knowledge base on October 30, even though I knew it was not the critical task.

### Engineering & Craft

The blog moved from MkDocs to Astro on October 11, with the [migration merged in PR #5](https://github.com/azusachino/harus-blog/pull/5). The redesign gave me room for the Miku palettes, piano keys, and pages that do not fit a documentation theme particularly well.

The useful part was the cleanup it forced. Old image links were dead. Recovered phone photos carried location metadata. Comment threads depended on preserving the page title format, and the new renderer exposed Markdown and math assumptions the old one had tolerated. I wrote up the details in [Third Engine, Same Posts](/life/third-engine-same-posts/).

Later in the month, the [travel atlas](/travel/) gained Felicia route exports and interactive maps. That work is in [PR #10](https://github.com/azusachino/harus-blog/pull/10) and the follow-up changes. A trip can now sit beside the writing as a route instead of disappearing into a folder of exports.

Apricot also gained folder indexes, search, and site fixes. I kept finding work to do on the knowledge base while the study plans underneath it barely moved.

Cappuccino remained an active experiment. I switched to Claude Code after spending too long getting an acceptable UI out of the previous setup. By the end of the month, I had finished another pass on the iroh integration and Android app, though I am not counting those rewrites as a release. Latte got another UI pass too. There was plenty of building; the LLM-from-scratch work and CME 295 kept reappearing in the weekly intentions without a concrete study result underneath them.

The month ended with two less satisfying checks: an unsuccessful attempt to restore the OnePlus Pad to ColorOS or OxygenOS, and another look at an older Animeko PR that exposed issues I had missed the first time. My first review needed more care.

### Life, Downtime & Culture

I finally picked up the renewed residence card and dealt with the overdue card and bank-account updates. I also submitted additional paperwork for the separate permanent-residency application, which remains pending.

I went home on October 16. There was some help with the family business, shopping for the next day's clothes, and my sister's engagement ceremony on the 18th.

The following week was mostly people and places: a walk around Longhu Park in Huainan, the fried whole chicken I had missed, new glasses in Hefei, and a visit near Dashushan without actually climbing it. The Gaoxin Intime shopping center had changed a lot. There were meals with family, a walk around Luogang catching up with a friend, then Shanghai in the rain.

On October 25, I spent a long day around the Huangpu River. Shanghai gave me more to look at than I had expected. I also ran into the Snow Miku collaboration at DQ and tried it for the first time. That is a perfectly adequate reason to buy an ice cream.

![A small Snow Miku plush with blue earmuffs and a red spoon, held in front of a larger Miku plush](/assets/images/2026/10/snow-miku-plush.jpg)

There were game quests and seasonal events around the trip, including an unusually lucky Arknights banner. Running stayed sporadic: [Iroha](https://iroha.azusachino.com/) logged five runs totaling about 20km, well short of the three-runs-a-week habit I wanted. The trip brought some walking and cycling too.

## conclusion

September ended with a warning that users do not automatically grow alongside their agents. October did not resolve it. I can point to a migrated blog, a travel atlas, and several application rewrites. I cannot point to comparable progress in the study I kept scheduling.

The ceremony and catching up with old friends filled much of the trip. Back at the desk, I still want to spend more time understanding the systems I am building, even if that means letting the next rewrite wait.

## resolution

For November, against the H2 OKRs:

- O1 (running): return to three runs a week and check the accumulated distance against the 500km August–December target each Sunday.
- O3 (working systems): check progress on the original targets: 30 unattended days for the Flink app, Aeron Rust/Zig parity against the same test suite, and a written self-assessment across at least three domains. The new projects have taken most of the attention; I have not established where those targets stand.
- O4 (reading): finish one of the three planned synthesis notes, connecting at least three existing book notes, and apply one lesson from an already-read book to a concrete decision. LLM study needs its own time too, but it does not close these reading goals.
- O6 (life admin and travel): update the renewal checklist after collecting the residence card, and record the trip home. Keep the permanent-residency application separate and pending.

## sharing

- [Third Engine, Same Posts](/life/third-engine-same-posts/)
  - The migration record, especially the lost images and metadata cleanup. Those are the details I want available before the next engine change.
- [How my agent-assisted workstation took shape](/tech/my-workstation-workflow-and-stack/)
  - The workflow I described early in October. Worth comparing with where I actually spent attention by the end of the month.
- [Travel atlas](/travel/)
  - Felicia's routes now have somewhere to go on the blog. I want to use it to keep the trips, rather than immediately inventing another mapping feature.
- [Cappuccino](https://github.com/azusachino/cappuccino)
  - The app I kept returning to between other tasks. I want the next update to describe a working end-to-end session.
- [Iroha public activity archive](https://iroha.azusachino.com/)
  - The activity log filled in runs I had left out of the journal. Useful for checking the running goal without relying on memory.
