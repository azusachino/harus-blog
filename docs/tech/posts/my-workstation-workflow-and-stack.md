---
title: My workstation workflow and stack
date: 2026-10-08
description: Independent repos, a shared Nix environment, local Markdown, and choosing how much agent coordination a task needs.
categories:
  - practice
slug: my-workstation-workflow-and-stack
comments: true
---

Switching projects means remembering more than the code. Which checkout owns the change? Which toolchain does it expect? Where did the last decision go? What did the previous session actually verify?

My setup grew around those questions: a workstation repository containing independent projects, a shared machine environment, local Markdown knowledge, and coding agents that work through the same project commands I do. The awkward parts have been ownership and review. Adding another tool has sometimes made both worse.

<!-- more -->

This is the setup in October 2026. Some of the boundaries changed as recently as October 8; I expect them to change again when they stop helping.

## One directory, independent repositories

`harus-workstation` is the starting directory for work across my projects. It contains a catalog rather than a single application:

```text
harus-workstation/
  platform.toml        # projects and useful groupings
  vendor/<project>/    # independent Git repositories
  refs/<category>/     # read-only repositories for study
  docs/                # operational knowledge: harus-kb
  .agents/skills/      # reusable agent instructions
  .tmp/<task>/         # disposable investigation outputs
```

The catalog describes which repositories belong here. Each project still owns its build, tests, architecture and release process. A Go application and a Markdown blog can share a working directory without sharing a dependency graph or a release cycle.

For a task in Felicia, my travel-journal project, the entry point is:

```sh
make context NAMES="felicia" ASOBI=1
git -C vendor/felicia status --short
git -C vendor/felicia branch --show-current
git -C vendor/felicia rev-parse HEAD
```

The context command reports the checkout state and the instruction files to read. `ASOBI=1` adds live task state. Those files still need reading; discovering a filename does not load its instructions. For work spanning an application and its deployment repository, I select both, or use a catalog group.

The vendor repositories used to be submodules. On September 29 I changed them to ordinary clones. We were deliberately ignoring the moving submodule pointers because the catalog tracked branches, so the pointers supplied bookkeeping without a useful reproducibility guarantee. The root now ignores `vendor/`. A workstation commit records workstation changes; project changes are committed in the project's own Git repository.

That choice has a cost: the root commit alone cannot reproduce every project checkout. A handoff needs the actual project branch and commit. I prefer that explicit record to a parent pointer nobody was maintaining.

## The machine environment and the project toolchain

My Home Manager configuration defines six device profiles across macOS, Linux and WSL. The reusable foundation is public [harus-config](https://github.com/azusachino/harus-config); a private consumer holds device choices and personal configuration.

The division today looks like this:

| Layer | Tools | Responsibility |
| --- | --- | --- |
| Configured machine environment | Nix and Home Manager | Shell, Git, dotfiles, applications and their supporting tools; default runtimes where selected |
| Global standalone utilities | mise, configured by the consumer | A selected set of CLI binaries and their update policy |
| Project runtime and tools | Project `.mise.toml` and its lock policy | The versions that this repository expects |
| Rust toolchains | rustup | Rust compiler/toolchain selection |
| Project dependencies | uv, Bun or the project's chosen manager | Dependency resolution under that project's declarations and locks |
| Daily commands | Make | A discoverable entry point to the owning project's operations |

The split is less tidy than “Nix for everything,” but it answers who changes a version and what might break with it. A standalone utility has different constraints from a binary used by a configured shell preview or editor.

The [harus-config changelog](https://github.com/azusachino/harus-config/blob/f95550740b74203c9ab5f9b898c33d6d8a84fb9c/CHANGELOG.md) makes that distinction painfully concrete. The October 8 changes first moved a broad collection of Rust CLIs into mise, then restored tools whose application integrations needed Nix ownership. Eza and Tokei stayed in Nix; Yazi kept its supporting helpers. The initial exact-pin/global-lock policy was also revised. Describing that first attempt as the final setup would already be wrong.

[Version 0.5.0](https://github.com/azusachino/harus-config/releases/tag/v0.5.0), released later that day, clarified another boundary: the shared base installs mise and its shell integration, while each consumer owns its global tool manifest and trust roots. A reusable base should not decide which project directories someone else trusts.

I reach for `rg` and `fd` to find things, `jq` for JSON, and tools such as `xh`, `ast-grep` and `hyperfine` when the task calls for them. Their presence in a configuration is not proof that every machine has activated the same generation. Project commands remain the authority for project requirements.

## Where knowledge goes

Several stores coexist because they hold different kinds of information:

| Information | Home |
| --- | --- |
| Active task, claim and handoff | Asobi |
| Acceptance criteria, delivered change and review | Owning GitHub issue or PR |
| Workstation and cross-repo operational knowledge | `docs/`, rendered with Rspress |
| Project contracts and design decisions | The project's own repository |
| Personal notes and journals | Apricot, an Obsidian-compatible Markdown vault |
| Public writing | This blog, built with MkDocs and Material |

The operational KB and the blog use different renderers because they have different jobs. Both keep Markdown as the authoring source. The public post is a deliberate selection from private working knowledge, not an automatic export of it.

I tried putting operational authoring through Wiki.js. On September 24 I returned to the local Markdown workflow. Reading and editing through a service added round trips and put a second authoring boundary beside files that already had search, diffs and build checks. That was a judgment about my workflow, not a benchmark proving hosted wikis are bad.

[Tsuzuri](https://github.com/azusachino/tsuzuri) is the file-access layer for personal Markdown: a TypeScript SDK and CLI that understands Obsidian links, tags and frontmatter without requiring the Obsidian application or a persistent index. Moves can rewrite affected links; deletion moves a note into `.trash`; callers can apply permission masks and preview writes. It does not own Git or run a server.

Luna, my Telegram secretary, uses Bun, grammY and Pi's embedding SDK. Its Tsuzuri integration gives me another interface to the vault. The files remain authoritative, and vault edits stay local for review. Confirming a particular destructive change is separate from granting the bot general access.

## Asobi carries work in progress

[Asobi](https://github.com/azusachino/asobi) is a Rust CLI with local SQLite storage and an optional shared graph server. I use the shared graph for live workstation work.

Its reading model suits agents: search and graph reads return small summaries, while `show` loads the observation bodies for selected entities. Current facts, such as the branch, commit or next action, are key/value truths. Observations hold the trail of what happened.

A task claim records ownership. It does not launch an agent. Likewise, a graph entry saying “verified” cannot replace the command result or review it refers to. Before resuming, I compare the recorded revision with the owning Git checkout.

The [0.8.1 change](https://github.com/azusachino/asobi/pull/41), released September 29, fixed a dangerous convenience: a remote-configured client now fails if the server is unavailable instead of silently writing to a local fallback graph. Otherwise two sessions could believe they were updating shared state while one was working on a disconnected copy.

Asobi also expires idle or finished tasks. Anything worth keeping must move into a PR, issue or Markdown document. Agent transcripts and private memory can help recover context, but they are poor sole owners of a decision other sessions need.

## One agent, subagents, or Herdr peers?

These are different ways to organize work, and a task does not need all of them.

### One agent owns the task

A single agent can investigate, edit and run the owning checks, then hand the result to me. This article uses that arrangement: one assigned agent researches and writes; I review the draft.

It keeps ownership easy to follow. There is no dispatch brief to maintain, no second writer to serialize, and no peer session to clean up. For a bounded task, introducing more agents can create more coordination work than it saves.

### A subagent handles a bounded question

Harness-provided subagents are useful for a separable investigation or review: inspect a module, trace a dependency, or compare a proposal with its source. The lead gives a bounded assignment and consumes the result.

The benefit depends on whether the work is genuinely separable. A subagent given “help with everything” duplicates the lead's exploration and returns another pile of context. A precise question and a source-backed answer are easier to reconcile.

Subagent behavior varies by harness. I need to know whether it has its own context, which tools it can use, and whether it shares a checkout. A separate conversation does not imply isolated files, independent evidence, or permission to make changes.

### A Herdr peer is a separate live session

[Herdr](https://herdr.dev) manages terminal workspaces and recognizes agent sessions in panes, including Pi, Claude Code and Codex. Its CLI can address a named agent, submit a prompt, read its output and wait for a reported state. That makes a peer visible and directly addressable outside the lead's internal conversation.

A peer may be useful for work that needs a distinct session, an explicitly assigned repository, or a reviewer with fresh context. The assignment still needs an outcome, owned paths, required checks and forbidden actions. Two panes pointing at the same vendor checkout do not create two safe writers.

Herdr manages sessions; Asobi records live work. Neither decides how many agents a task needs. An idle pane is also not proof that its assignment succeeded: the lead must read the returned evidence and account for any unfinished work.

I want the reviewer chosen explicitly. Sometimes that reviewer is me. Extra agents make sense when their distinct role earns the coordination cost, not because “multi-agent” sounds like a more complete workflow.

## How a task moves through the setup

For an ordinary change, the sequence is fairly small:

1. Name the outcome and owning repositories. Search existing decisions before inventing a new plan.
2. Read project context and inspect Git. If resuming, reconcile the task's branch and commit with the checkout.
3. Make a bounded change. Use relevant format, type and behavior checks while iterating.
4. At a stable checkpoint, run the owning project's required acceptance checks and state what they cover.
5. Put the diff and evidence in a reviewable PR. Keep the reviewer and publication decision explicit.

Make supplies a common entry point, not a universal implementation. This blog's `make check` runs formatting checks and a strict MkDocs build. Tsuzuri validates its package on Node without Bun and has a separate runtime-parity check. Felicia combines Go, SQLite, Svelte and native desktop composition, so its verification has different requirements.

The recent [Tsuzuri CI change](https://github.com/azusachino/tsuzuri/pull/124) gives documentation-only PRs a lightweight Markdown/spelling lane, while pushes to `main` run the full Node matrix and smoke checks. [Felicia adopted path-aware CI too](https://github.com/azusachino/felicia/pull/169). Those are concrete attempts to avoid doing unrelated work during iteration without pretending a narrow check covers the whole system.

A passing report can still prove less than its label suggests. The [Tsuzuri 0.8.0 release notes](https://github.com/azusachino/tsuzuri/releases/tag/v0.8.0) record twenty rejection assertions that previously lacked `await`; a passing test run had not actually checked them. For browser work, Lightpanda can cover DOM interactions where a project adopts it, but screenshots need a rendering browser such as Chromium. Felicia's headless desktop-composition tests do not drive the native Wails window.

I need the evidence to say which revision, environment and behavior were tested. “All green” is too vague when the claim is about something the tests never exercised.

## Running services is a separate step

The homelab uses a single-node k3s cluster, with Tailscale for private access and Traefik for HTTP routing. Public exposure is selected explicitly. My earlier posts on [k3s](k3s-migration.md) and [Traefik ingress](k3s-traefik-ingress.md) describe that part of the setup.

For my own services, a local build can be imported into the node's containerd without publishing an image to a registry. The deployment repository owns image pins and rollout commands. Updating a pin is not proof that the image exists on the node, and a local source check is not proof that the deployed service works.

A merge, a release and a deployment are separate outcomes. Keeping them separate lets a writing task end at a draft PR, or an application change end at review, without an agent treating a successful check as permission to change a running system.

## What I would keep in a smaller setup

Someone starting with two projects probably does not need my catalog, task graph and homelab. I would start with project-owned commands, Markdown decisions, and a clear place to review changes. Add shared machinery when a repeated problem makes its job obvious.

The parts I would preserve are the ownership boundaries: configured applications keep their dependencies together; a project chooses its toolchain; a note interface leaves files in charge; an agent's output has a named reviewer. Recent changes removed unused submodule pointers and moved a global tool manifest to the repo that actually owns it. I would rather keep doing that kind of subtraction than turn every task into an orchestration exercise.
