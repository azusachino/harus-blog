# CI performance investigation

## Scope and measurement

Repository: azusachino/harus-blog. Baseline source: `710f04f12fecafc3e55f86fd2f19dbf621b6e2ef`.
Retrieved the latest 50 workflow runs using `gh run list --repo azusachino/harus-blog --limit 50`, then each run's jobs and step timestamps using `gh api repos/azusachino/harus-blog/actions/runs/<id>/jobs?per_page=100`.
The sample spans 2026-10-15T06:02:19Z through 2026-11-03T07:33:39Z: 50 jobs, 46 successful and 4 failed. Failed runs are listed but excluded from performance summaries.

Queue is workflow creation to job start, including scheduling and dispatch latency. Preparation is job start to the original combined check step. Checks is that step's elapsed time, which also included dependency installation; GitHub's historical step timestamps cannot separate its inner commands. Job total includes preparation, checks and cleanup, and excludes queue. Timing resolution is one second. No historical sub-step test duration is inferred.

## Baseline

All 46 successful jobs:

| Phase | Median seconds | p90 seconds |
| --- | --- | --- |
| queue | 3 | 3 |
| prep | 11 | 17 |
| checks | 13 | 16 |
| total | 27 | 35 |

The 8 successful jobs with the current two-checkout workflow are the closer comparison; the full sample includes earlier implementations:

| Phase | Median seconds | p90 seconds |
| --- | --- | --- |
| queue | 3 | 3 |
| prep | 10.5 | 16 |
| checks | 15.5 | 20 |
| total | 30 | 35 |

Latest baseline: [run 41597121991](https://github.com/azusachino/harus-blog/actions/runs/41597121991), 2 seconds queued, 9 seconds preparation, 11 seconds checks, 23 seconds job total. Its log reports dependency installation at 865ms and Astro build at 3.66s. Those are log-reported sub-command timings, unlike the job API phase measurements.

## Decisions

- Keep one Ubuntu job: splitting this short gate adds runner queue, checkout and setup overhead. There are no inter-job dependencies or long test shards to remove or split.
- Cancel superseded PR runs, using the PR number as the concurrency identity. Every main push has a unique run ID so neither running nor pending main runs replace one another.
- Skip only explicit root documentation files on PRs. Posts, diagrams and other files under `docs/` are product inputs and retain complete validation. Main pushes always run. Both the branch protection endpoint and active branch rules were checked: protection returned 404 (not protected), rules returned an empty array. If `check` becomes required, replace workflow-level path skipping with an always-running status job before enabling that requirement; skipped workflows otherwise leave required checks pending.
- Retain mise's built-in binary cache and install only Bun and rumdl in CI. Typst is needed by `make cv`, not this gate. No source compilation via cargo/go install is introduced.
- Sparse checkout the complete Archify skill directory, which contains the renderer API and its renderers. Avoid downloading unrelated reference, website and example files.
- Do not add a Bun package cache speculatively: the measured 865ms install can be cheaper than a cache restore/save. Existing repository caches occupy 641,099,855 bytes across six entries, well below 10GB. No browser, Rust or full build-output cache is added.
- Separate dependency installation, formatting and validation in the workflow for future timing attribution; preserve all existing commands and fail on any failed step.

## Local repeated build and validation

On macOS arm64 at the baseline revision, two consecutive `make build` calls passed in 2.863s and 1.671s (41.7% faster on the second run). Each includes the frozen-lockfile installation check. The second build reused optimized images but still regenerated the site and bundles; Astro's static build is not an incremental no-op. This is not a cold-install benchmark and does not predict GitHub-hosted runner times.

The first pass removed the separate `bun scripts/archify.ts` from `verify`; the Astro integration still rendered during both `astro sync` and `astro build`. The second pass skips rendering for the explicit `sync` command, leaving one complete validation/render pass in `astro build` and retaining dev-mode generation. The [Astro integration API](https://docs.astro.build/en/reference/integrations-reference/#astroconfigsetup) documents these command values, also confirmed against the installed Astro types. No output cache or timestamp-based shortcut is introduced, so content, time-sensitive publication and build-time data are still evaluated.

`make check` passed after the first optimization, including formatting, type checking, palette contrast, frontmatter, travel validation and the full site build. All 7 diagram sources have generated HTML. Precompiled actionlint 1.7.12 (archive SHA-256 checked against its published checksum) and `git diff --check` passed.

## Pushed experiments and second pass

First-pass revision: `bd767d8bd4aef53a04b43990e33aef36027e0175`, [PR #22](https://github.com/azusachino/harus-blog/pull/22).

| Run / attempt | Queue | Preparation including install | Formatting + validation | Job total | Result |
| --- | --- | --- | --- | --- | --- |
| [41601188595 / 1](https://github.com/azusachino/harus-blog/actions/runs/41601188595/attempts/1), cold tool cache | 3s | 19s | 14s | 37s | Passed |
| [41601188595 / 2](https://github.com/azusachino/harus-blog/actions/runs/41601188595/attempts/2), warm tool cache | 4s | 10s | 10s | 22s | Passed |

For reruns, queue is attempt `run_started_at` to job start, not the original workflow creation time. New preparation includes dependency installation; the baseline combined check step included it, so phase comparisons have that approximately one-second boundary difference. Job totals remain directly comparable.

The cold tool setup took 8s versus 2s warm. The reduced tool cache is 99,499,327 bytes versus the preceding full-tool cache's 123,011,610 bytes (19.1% smaller). Installs remained below one second (878ms cold, 909ms warm). Formatting took 4s cold and 1s on the warm-tool rerun even though no package cache was added; this variation does not establish a package-cache bottleneck.

The warm first-pass job was 18.5% faster than the full-sample median (27s), 26.7% faster than the comparable two-checkout median (30s), and 4.3% faster than the latest baseline (23s). One warm run is not a statistically robust estimate; the cold run was slower. No guaranteed speedup is claimed.

Second pass: avoid the remaining redundant Archify render during type sync. The full build remains authoritative for diagram validation. A controlled invalid-diagram probe passed: explicit type sync completed without rendering; `astro build` failed with the invalid diagram's path, as expected. The temporary fixture was removed. This expected-red diagnostic is separate from the normal acceptance gate. The second-pass `make check` passed, all 7 valid diagrams generated HTML, and actionlint plus diff checks passed. Revision `065c720a6e7f03676801f8f3308356a0a7b0a45f` passed [run 41601981610, attempt 1](https://github.com/azusachino/harus-blog/actions/runs/41601981610/attempts/1) in 29s (4s queue, 12s preparation, 13s checks). Astro build itself took 5.42s versus 3.84s on the preceding warm run. [Attempt 2](https://github.com/azusachino/harus-blog/actions/runs/41601981610/attempts/2) passed in 26s (3s queue, 10s preparation, 14s checks). The 29s/26s pair does not establish a consistent total-job speedup; removing the duplicate content sync is the next targeted refinement.

The detailed log exposed a larger duplicate: explicit `astro sync` took 4.32s before `astro build` synchronized content and generated types again. The installed Astro build implementation calls `syncInternal` itself (`node_modules/astro/dist/core/build/index.js`). A further refinement runs the cheap validators first, builds once, then runs the same `tsc -p tsconfig.json` against build-generated types. Standalone `bun run typecheck` retains its explicit sync. A controlled type-error probe passed: the build completed, then `verify` failed on the intentional TypeScript error (`TS2322`), as required. The temporary source was removed. The normal `make check` acceptance gate then passed. Pushed measurements for this refinement are pending.

## Every baseline job

Each link identifies the source run; all jobs are named `check`. Times are seconds; checks still includes installation as explained above.

| Run | Event | Result | Queue | Preparation | Checks | Job total |
| --- | --- | --- | --- | --- | --- | --- |
| [41597121991](https://github.com/azusachino/harus-blog/actions/runs/41597121991) | push | success | 2 | 9 | 11 | 23 |
| [41596839343](https://github.com/azusachino/harus-blog/actions/runs/41596839343) | pull_request | success | 3 | 8 | 19 | 30 |
| [41590550768](https://github.com/azusachino/harus-blog/actions/runs/41590550768) | push | success | 3 | 16 | 16 | 35 |
| [41590381119](https://github.com/azusachino/harus-blog/actions/runs/41590381119) | pull_request | success | 3 | 11 | 20 | 34 |
| [41589952163](https://github.com/azusachino/harus-blog/actions/runs/41589952163) | pull_request | success | 3 | 16 | 14 | 33 |
| [41578204827](https://github.com/azusachino/harus-blog/actions/runs/41578204827) | push | success | 2 | 11 | 15 | 30 |
| [41575354387](https://github.com/azusachino/harus-blog/actions/runs/41575354387) | pull_request | success | 3 | 10 | 16 | 29 |
| [41575327375](https://github.com/azusachino/harus-blog/actions/runs/41575327375) | pull_request | success | 2 | 9 | 12 | 23 |
| [41575040933](https://github.com/azusachino/harus-blog/actions/runs/41575040933) | pull_request | failure | 2 | 11 | 2 | 26 |
| [41574794377](https://github.com/azusachino/harus-blog/actions/runs/41574794377) | pull_request | failure | 3 | 7 | 1 | 10 |
| [41568730900](https://github.com/azusachino/harus-blog/actions/runs/41568730900) | pull_request | failure | 2 | 5 | 1 | 8 |
| [41567558964](https://github.com/azusachino/harus-blog/actions/runs/41567558964) | push | success | 3 | 14 | 14 | 42 |
| [41562078708](https://github.com/azusachino/harus-blog/actions/runs/41562078708) | pull_request | success | 3 | 17 | 13 | 34 |
| [41561477528](https://github.com/azusachino/harus-blog/actions/runs/41561477528) | pull_request | success | 2 | 8 | 13 | 23 |
| [41560807879](https://github.com/azusachino/harus-blog/actions/runs/41560807879) | pull_request | success | 3 | 26 | 13 | 42 |
| [41560725982](https://github.com/azusachino/harus-blog/actions/runs/41560725982) | pull_request | success | 3 | 17 | 10 | 30 |
| [41471166700](https://github.com/azusachino/harus-blog/actions/runs/41471166700) | push | success | 3 | 9 | 9 | 22 |
| [41470260957](https://github.com/azusachino/harus-blog/actions/runs/41470260957) | pull_request | success | 9 | 9 | 9 | 22 |
| [41469669518](https://github.com/azusachino/harus-blog/actions/runs/41469669518) | pull_request | success | 3 | 12 | 10 | 25 |
| [41469602944](https://github.com/azusachino/harus-blog/actions/runs/41469602944) | pull_request | success | 3 | 10 | 11 | 24 |
| [41468966041](https://github.com/azusachino/harus-blog/actions/runs/41468966041) | pull_request | success | 2 | 9 | 13 | 24 |
| [41468745845](https://github.com/azusachino/harus-blog/actions/runs/41468745845) | pull_request | success | 3 | 12 | 14 | 29 |
| [41468650705](https://github.com/azusachino/harus-blog/actions/runs/41468650705) | pull_request | success | 4 | 12 | 14 | 29 |
| [41467990090](https://github.com/azusachino/harus-blog/actions/runs/41467990090) | pull_request | success | 2 | 12 | 13 | 28 |
| [41467081516](https://github.com/azusachino/harus-blog/actions/runs/41467081516) | pull_request | success | 9 | 9 | 9 | 20 |
| [41466395091](https://github.com/azusachino/harus-blog/actions/runs/41466395091) | pull_request | success | 2 | 11 | 12 | 27 |
| [41466059119](https://github.com/azusachino/harus-blog/actions/runs/41466059119) | pull_request | success | 3 | 13 | 12 | 28 |
| [41465673228](https://github.com/azusachino/harus-blog/actions/runs/41465673228) | pull_request | success | 3 | 9 | 16 | 30 |
| [41465393952](https://github.com/azusachino/harus-blog/actions/runs/41465393952) | pull_request | success | 2 | 18 | 14 | 35 |
| [41461583202](https://github.com/azusachino/harus-blog/actions/runs/41461583202) | pull_request | success | 2 | 9 | 13 | 25 |
| [41215236362](https://github.com/azusachino/harus-blog/actions/runs/41215236362) | push | success | 2 | 8 | 13 | 23 |
| [41215010730](https://github.com/azusachino/harus-blog/actions/runs/41215010730) | pull_request | success | 2 | 13 | 13 | 29 |
| [41214435594](https://github.com/azusachino/harus-blog/actions/runs/41214435594) | pull_request | success | 2 | 8 | 9 | 19 |
| [41212734512](https://github.com/azusachino/harus-blog/actions/runs/41212734512) | push | success | 3 | 12 | 14 | 29 |
| [41212518747](https://github.com/azusachino/harus-blog/actions/runs/41212518747) | pull_request | success | 2 | 11 | 13 | 27 |
| [41212105604](https://github.com/azusachino/harus-blog/actions/runs/41212105604) | pull_request | success | 2 | 8 | 13 | 23 |
| [40517710077](https://github.com/azusachino/harus-blog/actions/runs/40517710077) | push | success | 2 | 14 | 28 | 47 |
| [40517253310](https://github.com/azusachino/harus-blog/actions/runs/40517253310) | pull_request | success | 2 | 8 | 13 | 23 |
| [40512241161](https://github.com/azusachino/harus-blog/actions/runs/40512241161) | push | success | 2 | 9 | 11 | 22 |
| [40512083013](https://github.com/azusachino/harus-blog/actions/runs/40512083013) | pull_request | success | 3 | 13 | 16 | 32 |
| [40489558737](https://github.com/azusachino/harus-blog/actions/runs/40489558737) | push | success | 2 | 8 | 13 | 22 |
| [40489443646](https://github.com/azusachino/harus-blog/actions/runs/40489443646) | pull_request | success | 3 | 9 | 13 | 24 |
| [40485133458](https://github.com/azusachino/harus-blog/actions/runs/40485133458) | push | success | 2 | 8 | 13 | 23 |
| [40482891299](https://github.com/azusachino/harus-blog/actions/runs/40482891299) | pull_request | success | 2 | 8 | 8 | 18 |
| [40482626196](https://github.com/azusachino/harus-blog/actions/runs/40482626196) | pull_request | failure | 2 | 12 | 6 | 20 |
| [39409114147](https://github.com/azusachino/harus-blog/actions/runs/39409114147) | push | success | 2 | 11 | 13 | 26 |
| [39408621475](https://github.com/azusachino/harus-blog/actions/runs/39408621475) | pull_request | success | 3 | 20 | 13 | 37 |
| [39397230309](https://github.com/azusachino/harus-blog/actions/runs/39397230309) | pull_request | success | 5 | 12 | 14 | 27 |
| [38691271748](https://github.com/azusachino/harus-blog/actions/runs/38691271748) | push | success | 2 | 10 | 8 | 20 |
| [38690074973](https://github.com/azusachino/harus-blog/actions/runs/38690074973) | pull_request | success | 3 | 19 | 13 | 35 |
