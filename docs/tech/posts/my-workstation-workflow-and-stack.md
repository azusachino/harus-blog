---
title: How my agent-assisted workstation took shape
date: 2026-10-08
description: How I prepare context before a task, choose tools and agent skills, borrow from Spec Kit, and keep the results reviewable.
categories:
  - practice
slug: my-workstation-workflow-and-stack
comments: true
---

In my [September refresh](../../journal/posts/2026/refresh/month-refresh-2026-09.md), I described an uncomfortable gap: agent-assisted projects were moving quickly, while human verification and understanding struggled to keep up. More code was arriving. That did not mean I understood more of it.

The workstation grew out of that gap. I needed to return to a project and know what was happening without reconstructing its entire history. That pushed context management to the beginning of the task: settle the outcome, find the relevant evidence, choose the tools and skills, and decide what would prove the result. Along the way, I built some useful tools, adopted others, and removed machinery that made the work harder.

## TL;DR

Before a task, I define the outcome and assemble a small, current context: owning instructions, relevant decisions, source and verification criteria. Search tools and structured CLI output help me and the agent inspect the same evidence. Selected skills guide particular phases; Spec Kit contributed clarification and consistency checks rather than a second workflow. Independent repos own their toolchains, Markdown holds durable knowledge, Asobi carries live tasks, and GitHub holds reviewed changes. Nix/Home Manager and mise supply the environment; Pi, Claude Code or Codex handles the session, with Herdr available for assigned peers. The costs remain context upkeep and human review. Next, I want easier resumption and stronger end-to-end evidence.

<!-- more -->

## The pain: every project had a second job

The first job was building the application. The second was remembering how to work on it.

A change might start in an application, require a deployment change elsewhere, and touch shared configuration on another machine. The relevant decision could be in a Markdown file, a PR, a task graph or yesterday's agent conversation. A long conversation supplied context, but it also accumulated old assumptions. Opening another session meant figuring out which parts were still true.

Agents made this more visible. A plausible implementation could arrive before I had settled the acceptance criteria. A passing check could be presented as evidence for a behavior it had never exercised. I could spend the time saved on typing in a much longer review loop.

My response was initially to try more infrastructure. Wiki.js looked like a centralized authoring surface. The repository collection used submodules. Shared tool configuration seemed like something to put in the reusable Nix base. These choices all looked orderly. Each also introduced a place where ownership or synchronization could become ambiguous.

I wanted shared context across projects. I did not want every project to become dependent on a new central system just to read its instructions or run its tests.

## Before any task: build the context

I want the preparation to happen even when the change is small. A typo fix does not need a feature specification, but it still needs the right checkout and a way to check the edit. For a larger change, “make this better” needs to become an observable result before an agent starts implementing its own interpretation.

I start by identifying the owner, the paths in scope and the decisions that need my approval. Then I read the owning instructions, check Git, and find the relevant decisions and current work state. A handoff that names yesterday's commit cannot silently outrank today's checkout. An old architectural summary cannot settle a question that the current source contradicts.

Context has layers. Repository rules persist between tasks. A specification or architectural decision explains this task. Source files show the behavior being changed; test failures and logs update the picture during iteration. Conversation history helps me remember the discussion, but its length does not make it authoritative. I try to load what can change the next decision, with links back to the fuller evidence.

The tool and skill choices follow that scope. A retrieval question needs search and source reading. A bug needs reproduction and diagnosis. A UI change needs a rendered artifact, not just a diff. I also establish the acceptance check and reviewer at the beginning, so a convenient green command does not quietly become the definition of success.

### The terminal helps me choose what to read

My shell configuration makes that inspection fairly direct. `zoxide` gets me back to a project; `fd` finds candidate files. Fish helpers combine `fzf` selection with `bat` previews and open the result in Neovim. The `rgi` helper starts with ripgrep matches and jumps to the selected line. Atuin provides searchable command history. For changes, Git's diff and log, Lazygit and Delta help me inspect the actual work; `gh` brings the issue or PR into the same terminal.

An agent can use the same sources without copying my interactive gestures. It searches with `rg`, reads bounded file ranges, inspects `git diff`, and asks `gh` for JSON rather than waiting in a fuzzy picker. `jq` helps select fields; tools such as `dasel` and `xh` are available when the question involves structured configuration or HTTP. The harness's file-reading tool may be a better fit than invoking a shell viewer. A preferred tool list does not override the repository's commands or the session's permissions.

For example, revisiting Felicia's path-aware CI means reading its workflow conditions and the owning PR. It does not require loading every application file. Before changing those conditions, I want to know which check should run for each kind of change and how I will detect a skipped required check. The eventual project command supplies executable evidence; the search tools merely help locate what to inspect.

## The decision: give the shared layer a smaller job

### Keep the knowledge close to the work

On September 24, I returned operational authoring to local Markdown after the Wiki.js experiment. The files already had search, Git diffs and build checks. Putting routine edits through a service added round trips and split the authoring path.

Today `docs/` in the workstation is harus-kb, rendered with Rspress. Project-specific contracts stay in the project. Apricot holds personal Markdown notes and journals; this blog uses MkDocs and Material. These are separate publication and ownership boundaries, even though all three use Markdown.

[Tsuzuri](https://github.com/azusachino/tsuzuri) provides a CLI and TypeScript SDK over the personal vault. It understands Obsidian links, tags and frontmatter without requiring the Obsidian application or a persistent index. Luna, my Telegram secretary built on Bun, grammY and Pi's embedding SDK, uses that interface to read and edit the vault. It leaves changes local for review.

This buys a direct authoring path and inspectable changes. It does not make synchronization disappear. An unpushed commit stays on its machine, and naming, filing and reviewing notes remain work someone has to do.

### Share a starting directory, not a release cycle

On September 29, I replaced the vendor submodules with ordinary independent clones. We had deliberately ignored their moving pointers because the catalog tracked branches. Maintaining a second set of pointers had no useful job.

The private `harus-workstation` repository now provides a catalog and a common entry point:

```text
harus-workstation/
  platform.toml        # catalog and project groups
  vendor/<project>/    # independent Git repositories
  refs/<category>/     # read-only source material for study
  docs/                # workstation and cross-project knowledge
  .agents/skills/      # reusable agent instructions
  .tmp/<task>/         # disposable investigation outputs
```

For a Felicia task, the context query is `make context NAMES="felicia" ASOBI=1`. It reports the checkout, instruction files and live task state. That gives the preparation above a repeatable entry point; it discovers context rather than dumping every project's documentation into the session.

Felicia still owns its Go, SQLite, Svelte and desktop workflow. The blog still owns its Python/MkDocs build. The workstation does not invent another build system above them.

The cost is deliberate: a root commit cannot reproduce every vendor checkout. Handoffs must record the actual project revisions. That is more useful to me than a parent pointer that nobody was keeping meaningful.

### Let configured applications keep their dependencies

The machine environment also needed a narrower boundary. My Home Manager configuration defines six profiles across macOS, Linux and WSL. The public [harus-config](https://github.com/azusachino/harus-config) base supplies reusable modules; a private consumer chooses devices and personal configuration.

The October 8 [changelog](https://github.com/azusachino/harus-config/blob/f95550740b74203c9ab5f9b898c33d6d8a84fb9c/CHANGELOG.md) records the revisions within that split. A broad Rust-CLI move to mise was followed by restoring application dependencies and shell integrations to Nix. Eza and Tokei were retained, and Yazi kept its supporting helpers. The initial exact-pin/global-lock approach was revised too.

[Version 0.5.0](https://github.com/azusachino/harus-config/releases/tag/v0.5.0) then moved global mise choices into the consumer. The shared base installs mise and shell integration; the consumer decides its global tools and trust roots. Projects choose their runtime versions and lock policy. Rust toolchains remain rustup-owned, and uv or the project's JavaScript package manager handles project dependencies.

I gave up the appeal of one installer owning everything. In return, a configured application can keep the dependencies its integrations need, while a standalone utility can have a different update policy.

### Adopt useful skills without importing another workstation

A tool executes an operation. A skill gives the agent instructions for approaching a kind of work, usually through a `SKILL.md` file and supporting material. Neither alone defines the whole task. The local playbook supplies the sequence, and the project keeps its own build commands and acceptance rules.

[Matt Pocock's skills](https://github.com/mattpocock/skills/tree/153fc1b93de6584562765cdce299324e1ff9e661) supplied concrete approaches I wanted to reuse. On September 10, I expanded the selection with `codebase-design`, `domain-modeling`, `research`, `resolving-merge-conflicts` and `tdd`. The current selection also includes diagnosis, review and design-challenging skills. `research` asks for primary-source findings; `tdd` works through behavior at agreed public interfaces, one failing test and minimal implementation at a time. `codebase-design` gives us vocabulary for deciding where a module boundary should go.

I did not install Matt's entire setup. Its ticket/spec setup and triage conventions would introduce another set of agent documents and task conventions. Those jobs already had owners here. Local routing also resolves narrower collisions: a domain-modeling skill cannot replace a project's ADR schema, research must land in the right documentation home, and a merge helper cannot stage independent vendor checkouts into root Git.

The selected sources are declared in the catalog and installed with `make skills`. The agent follows local routing and reads the skill needed for its current phase. Other adopted sources contribute context engineering and spec-driven development, while my own [toolbelt skill](https://github.com/azusachino/harus-skills/blob/8ed59dd2f734f3ea400630b25025fc986382728a/skills/toolbelt/SKILL.md) records preferred CLI choices. Loading all of them before every task would bury the relevant instruction in competing advice.

There was a maintenance cost I initially missed. By September 29, Matt's upstream repository was seventeen commits ahead of the reviewed installation, and an unpinned refresh could bring in new instructions without review. I added full-commit pins for third-party sources. A skill update can change agent behavior, so I want to know which version I am asking it to follow.

### Borrow Spec Kit's checks, keep one workflow

On September 14, I put [GitHub Spec Kit](https://github.com/github/spec-kit) on the read-only reference shelf. Its specification-to-implementation sequence overlapped with my existing playbook, and its generated task file would add a second task ledger. I studied the command templates and folded two checks into the sequence I already had.

The first came from its [clarification template](https://github.com/github/spec-kit/blob/adbd62af15f363cbaf1e69e117eb8444d525a0a0/templates/commands/clarify.md): scan for missing requirements, including data lifecycle, error states, dependency failures and completion evidence. Ask at most five questions that would change the design, record the answers, and make remaining assumptions visible. A testable specification can still omit the failure mode that matters.

The second checks the breakdown before implementation: does any acceptance criterion lack a task, does any task lack a requested outcome, and do the two contradict each other? That catches a plan answering a different question while it is still cheap to revise.

This was selective adoption of ideas, not installation of the `specify` CLI or a `/speckit` command pipeline into the workstation. The useful result was a stronger existing playbook, without another authority for specifications or task state. It also means I own the adaptation and must revisit it when the upstream approach or my projects change.

The resulting stack looks like this. Arrows describe support and access, not an automatic orchestration service:

<figure markdown="1" aria-label="Workstation stack and ownership">

```mermaid
flowchart TD
  accTitle: Workstation stack and ownership
  accDescr: Machine tools and coding sessions support independent repositories. Tasks live in Asobi, reasoning in Markdown, and reviewed changes in GitHub. Deployment is a separate explicit action.
  N["Nix / HM + mise<br/>environment"] --> W["Workstation<br/>context + skills"]
  W --> P["Project repos<br/>own Git and commands"]
  H["Herdr sessions<br/>Pi / Claude Code<br/>/ Codex"] --> P
  P --> R["GitHub PR<br/>review"]
  P -. "reasoning" .-> K["Markdown<br/>durable docs"]
  P -. "live work" .-> A["Asobi<br/>tasks"]
  R -->|"explicit deploy"| D["k3s<br/>Traefik / Tailscale"]
```

<figcaption>The shared workstation supports independently owned projects.</figcaption>
</figure>

## The trade-off: someone still has to coordinate

Local files and independent repos reduce central machinery. They also make it harder to hide unfinished coordination behind a dashboard.

[Asobi](https://github.com/azusachino/asobi) carries my live task state. It is a Rust CLI backed by SQLite, with an optional shared graph server. Small search/graph reads locate relevant entities; `show` loads their observation bodies. Current facts such as branch, commit and next action are separate from the historical trail.

That makes a handoff portable across sessions, provided it records the right facts. A task claim is ownership, not a process launch. A saved revision can go stale. Finished tasks expire, so durable decisions still need to move into an issue, PR or Markdown document.

The [Asobi 0.8.1 change](https://github.com/azusachino/asobi/pull/41), released September 29, captures the trade-off well. Remote-configured commands now fail during an outage rather than silently writing to a local fallback graph. Work can be blocked, but it no longer appears shared while updates are actually going into a disconnected copy.

### More agents can create more work

A second agent can bring a separate context and a useful role. It also brings an assignment, a result to reconcile, and possibly another writer in the same checkout. Adding agents before defining that role just multiplies exploration.

I distinguish three arrangements:

- **One agent owns the task.** It investigates, edits and runs checks, then gives me a reviewable result. This is enough for a bounded task such as researching and writing this article.
- **A harness subagent answers a separable question.** For example, it can inspect a dependency while the lead handles the change. Its context, tools and filesystem isolation depend on the harness. A separate conversation alone does not guarantee independence.
- **A Herdr peer has a separate live session.** [Herdr](https://herdr.dev) can address a named agent, submit work, read its output and wait for a reported state. It helps when a role needs its own visible session or explicitly assigned repository. Separate panes still do not make concurrent writes to one checkout safe.

Even this article exposed a mismatch in the written workflow. The agent began setting up a separate researcher because the instructions said to delegate broad exploration. I had assigned the blog task to one agent and intended to review it myself. I asked it to finish that task and leave workflow refinement until afterward.

I want agent count to follow the assignment. A policy that makes every task a team exercise creates coordination overhead before it has demonstrated a benefit.

## The result: a loop I can inspect

There are concrete results behind this setup. Tsuzuri [0.8.0](https://github.com/azusachino/tsuzuri/releases/tag/v0.8.0) shipped file operations, permission masks and optional vault extensions. Asobi 0.8.1 shipped the explicit remote boundary. The shared Nix base now has a clearer consumer seam.

Running services add another boundary. The homelab uses a single-node k3s cluster, Tailscale for private access and Traefik for HTTP routing. Own-source images can be built locally and imported into the node's containerd. That avoids a registry-distribution problem on one node, while keeping the limitation obvious: a single node does not provide distributed availability. A reviewed source change still needs a separately authorized rollout and runtime check.

The same division is appearing in applications. Felicia's [agent intake change](https://github.com/azusachino/felicia/pull/167) feeds a local workspace through its CLI. The human reviews candidates and authors essays in the desktop studio; explicit publication produces a static reader. A fast importer should not decide which memories deserve an essay.

For an ordinary development task, I can now follow a change from request to review without making the agent transcript the only record:

<figure markdown="1" aria-label="A task from request to reviewed result">

```mermaid
flowchart TD
  accTitle: A task from request to reviewed result
  accDescr: Define the outcome, assemble current project context, choose tools and phase skills, and establish checks and a reviewer before acting. Choose an appropriate agent arrangement, edit and check, then review the result. Preserve evidence and separately authorize publication.
  Q["Intended result"] --> X["Scope + context<br/>check Git"]
  X --> T["Tools + skills<br/>checks + reviewer"]
  T --> D{"Agent setup?"}
  D --> O["One agent"]
  D --> S["Lead + subagent"]
  D --> H["Assigned peer<br/>in Herdr"]
  O --> E["Bounded edit<br/>focused feedback"]
  S --> E
  H --> E
  E --> G["Stable checkpoint<br/>project checks"]
  G --> R["Review against<br/>intended result"]
  R -->|"revise"| E
  R -->|"accepted"| K["Keep evidence<br/>PR / issue / docs"]
  K --> P{"Publish requested?"}
  P -->|"no"| F["Finish / handoff"]
  P -->|"yes"| B["Authorized release<br/>or deployment<br/>+ verification"]
```

<figcaption>Context, tools and acceptance are prepared before the edit; publication is a separate decision.</figcaption>
</figure>

That loop is a working shape, not a guarantee that every task follows it correctly. It also costs time: someone must define the result, inspect what the tests prove, and review the actual artifact.

Recent CI changes reduce some unrelated repetition. [Tsuzuri](https://github.com/azusachino/tsuzuri/pull/124) gives documentation-only PRs a Markdown/spelling lane while pushes to `main` run the full Node matrix and smoke checks. [Felicia](https://github.com/azusachino/felicia/pull/169) also adopted path-aware CI. These changes alter check selection; they do not establish a measured productivity gain.

The verification work has supplied less flattering results too. Tsuzuri's 0.8.0 release notes record twenty rejection assertions that previously lacked `await`. A passing test run had not actually checked them. In Felicia, headless desktop-composition tests cover useful behavior without driving the native Wails window. Native acceptance remains a separate question.

My first draft of this article also passed the build and GitHub CI. I rejected it because it read like an internal manual and had no TL;DR. Those checks did their job: the Markdown and site built. They could not decide whether the article had a reason to exist.

I can point to better-separated responsibilities and shipped capabilities. I cannot honestly claim a measured reduction in my review burden yet.

## What I want to develop next

### Refine the workflow around the actual task

The next workflow revision should make the assignment and reviewer explicit without demanding multiple agents by default. I want fewer repeated instructions and fewer handoffs whose only purpose is satisfying a process.

A useful test would be whether another session can resume a real task from its recorded checkout, next action and evidence without reconstructing the old conversation. I also want to notice when context fails: an outdated instruction, a missing decision, or a skill that sends the agent toward the wrong workflow. Those failures tell me what to improve more directly than counting loaded documents or spawned agents. That refinement is separate work; writing this post does not change the contract underneath it.

### Finish useful journeys, not just more components

Felicia has CLI intake, a local authoring workspace and static publication. I want the collection-to-publication journey to feel coherent, including the native interactions that headless checks cannot prove. A merged component or another green fixture should not become shorthand for that whole experience.

For the workstation, the equivalent is a reviewable end-to-end result: the exact artifact, its provenance, the behavior checked, and the limits of the evidence. Faster focused feedback helps only if the final acceptance remains meaningful.

### Make the phone a companion to existing agents

[Cappuccino](https://github.com/azusachino/cappuccino) is the next interface experiment: native Apple and Android clients for agent sessions that already exist in Herdr. The intended payoff is being able to inspect a conversation and understand where attention is needed away from the desk, without a phone client launching or replacing the agent.

The [current source](https://github.com/azusachino/cappuccino/blob/36f3afecb26e65fe2c3be12c42b4b64f52aef3e5/README.md) contains native clients and read-only bridge routes, but explicitly leaves prompt delivery and approvals unimplemented. Canonical live Pi transcript/stream behavior remains unverified. I want reconnection and session identity to be reliable before describing this as remote control that works.

That work adds another interface and another failure surface. It earns its place only if checking on an existing task becomes easier without changing that task's lifetime or authority.

### Improve recall only when retrieval actually fails

Tsuzuri currently works directly on files, with an in-memory scan. Its [later roadmap](https://github.com/azusachino/tsuzuri/blob/ae27321d47360549788bb5d8cec5bcfd21daf91e/docs/roadmap.md) leaves a derived cache and local multilingual embeddings conditional on real use cases and measurements.

That is a direction worth keeping. A slow cold load can justify a disposable cache; repeated Chinese recall failures can justify semantic retrieval. Neither should turn a derived store into the authority for the notes. I want better access to what I already know before building another knowledge system.

The workstation is still being developed through these frictions. Its useful output should be work I understand and can review, with enough context left for the next session. If the machinery starts consuming more attention than it returns, another round of subtraction is warranted.

## References

- [Monthly refresh, September 2026](../../journal/posts/2026/refresh/month-refresh-2026-09.md): the original reflection on agent velocity, verification and understanding.
- [harus-config changelog](https://github.com/azusachino/harus-config/blob/f95550740b74203c9ab5f9b898c33d6d8a84fb9c/CHANGELOG.md): the tool-ownership reversals, including the global mise boundary in 0.5.0.
- [Asobi 0.8.1 PR](https://github.com/azusachino/asobi/pull/41): fail-closed remote behavior, target reporting and the limits of its verification.
- [Tsuzuri 0.8.0 release](https://github.com/azusachino/tsuzuri/releases/tag/v0.8.0): file operations, host permission masks, portable runtime checks and the corrected assertions.
- [Felicia's agent-and-desktop workflow](https://github.com/azusachino/felicia/blob/693862a776281341672bbf8c6c42ba2c03409ba8/docs/research/agent-and-desktop-workflow.md): the proposed design narrative separating headless intake from human visual authoring; the implemented intake change is linked above.
- [Herdr](https://herdr.dev): the terminal/session layer behind the peer arrangement.
- [Home Manager](https://nix-community.github.io/home-manager/) and [mise](https://mise.jdx.dev/): the underlying environment and toolchain systems.
- [harus-config shell helpers](https://github.com/azusachino/harus-config/blob/f95550740b74203c9ab5f9b898c33d6d8a84fb9c/users/haru/fish.nix): the file, search and Git inspection helpers behind the terminal workflow.
- [Matt Pocock's skills](https://github.com/mattpocock/skills/tree/153fc1b93de6584562765cdce299324e1ff9e661): the reviewed source version for the selectively installed engineering skills.
- [Spec Kit command templates](https://github.com/github/spec-kit/tree/adbd62af15f363cbaf1e69e117eb8444d525a0a0/templates/commands): reference material for clarification and spec-to-task consistency, adapted into the existing workflow.
- [Addy Osmani's agent skills](https://github.com/addyosmani/agent-skills/tree/2686b620fc1fed2e8f60c704839c766b8594c6b6): the source of the selected context-engineering and spec-driven-development guidance.
- [Cappuccino README](https://github.com/azusachino/cappuccino/blob/36f3afecb26e65fe2c3be12c42b4b64f52aef3e5/README.md): current companion implementation and its unverified or unfinished boundaries.
