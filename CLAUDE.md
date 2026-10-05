# Project: Idealistic Daydreamer (blog)

Personal blog built with **MkDocs + Material for MkDocs**. Content is in `docs/`, split into
type-based tabs — **no year-wise layout**.

## Stack & tooling

- `mise` manages runtimes; `uv` manages Python deps; **`make` is the task runner**.
- `make local` (serve :1313) · `make build` (strict) · `make migrate` · `make format`.
- Material blog plugin, one instance per tab. Giscus comments via `overrides/partials/comments.html`.

## Content layout

- **Tech** — `docs/tech/posts/` (blog) + `docs/tech/series/<name>/NN.*.md` (ordered tutorials, in nav).
- **Journal** — `docs/journal/posts/` (blog): weekly reports + monthly refresh + yearly reviews
  (`review-YYYY`), all under the same By-year archive.
- **Life** — `docs/life/posts/` (blog): books, concerts, essays.
- Images: `docs/assets/images/`, `docs/assets/book/`.

## Conventions

- Universal frontmatter — **every** content post uses the same keys in this order: `title`, `date`,
  `description`, `categories`, `slug`, `comments: true` (optional `tags` go after `categories`).
  Every tab (Tech/Journal/Life) is a blog-plugin instance, so `date`/`slug` drive post ordering and
  URLs. Categories are **lowercase** (`research`/`practice`, `weekly`/`refresh`/`review`, `life`).
  Nav landing pages (`index.md`, `about.md`, `cv.md`) are exempt.
- `hooks/frontmatter.py` fails the strict build if a post drifts from that order; `hooks/autonav.py`
  auto-generates the `Series` nav subtree — so **no `mkdocs.yml` nav edit is ever needed** for new content.
- Life is a blog with no series/archive, so its posts + `life/index.md` carry `hide: [navigation]`
  (last frontmatter key) to drop the otherwise-empty left sidebar.
- `scripts/normalize_frontmatter.py` reorders keys in place without touching values; rerun if drift creeps in.
- Cover image = first `![](...){ .post-cover }` line; blog posts put it before `<!-- more -->` so it
  shows on the index card.
- Future-dated posts are drafts (`draft_if_future_date: true`) — excluded from `make build`.
- Legacy Hugo shortcodes still render via `hooks/shortcodes.py`.
- `scripts/migrate.py` was the one-shot Hugo→MkDocs migration (kept for reference only).

## Tone & Voice Manifesto (The Idealistic Daydreamer)

Haru's writing is **candid, intellectually honest, grounded, and arena-focused**. It repudiates corporate fluff, empty AI optimism, and cheap cynicism.

- **In the Arena**: As Theodore Roosevelt and Lu Xun remind us, criticism from the sidelines costs nothing. Reject Ah Q's "spiritual victories" and cynical pre-emptive surrenders. Celebrate building, shipping, and active wrestling with hard constraints.
- **Ruthless Specificity**: Reject generic abstractions. Name real tools, repos, files, books, places, dishes, and physical sensations (e.g. *Gyomu Super Meiji vanilla ice cream*, *6km night run*, *Maimai arm fatigue*, *PGL Wallachia Dota 2*, *Tokyo Immigration Bureau queue*).
- **Intellectual Honesty**: Admit failures plainly. If a weekend was lost to gaming or sickness, say so without romanticizing it. If 800 commits felt like empty "vibecoding" without real learning, call it out. If a restaurant meal was mediocre, don't sugarcoat it.
- **Anti-AI Writing Rules**:
  - No synthetic triads ("In today's fast-paced, dynamic, and ever-changing landscape...").
  - No hollow cheerleading ("A testament to our passion", "Excited to embark on this journey").
  - No pseudo-summary bold labels on every sentence (**Key Takeaway:**, **In Conclusion:**).
  - No forced "not-X-but-Y" clichés ("It's not just about code, it's about connection").
  - Let rhythm vary: pair short, sharp declarations with rhythmic, reflective sentences.

## Content Archetypes & Patterns

### 1. Monthly Refresh (`journal/posts/YYYY/refresh/`)

- **`keyword`**: Exactly 3 thematic anchors summarizing tensions or focal shifts (not single generic words).
- **`journal`**: Structured across:
  - *Work & Systems*: Production releases, operational incidents, on-call reality.
  - *Engineering & Craft*: Concrete apps built, SDKs refactored, tools adopted or abandoned.
  - *Life, Downtime & Culture*: Esports, music, books, food, physical health.
- **`conclusion`**: The core paradox or tension of the month (e.g., human cognitive endurance vs. agent velocity).
- **`resolution`**: Explicitly measured against the active OKR (O1 Body, O3 Work, O4 Learning), never floating wishes.
- **`sharing`**: 4–5 curated links with 1–2 sentence personal commentary explaining why it mattered to *your* work.

### 2. Philosophical & Life Essays (`life/posts/`)

- **The Hook**: A provocative, unequivocal thesis statement right before `<!-- more -->`.
- **The Deconstruction**: Expose hidden preconditions (e.g., how Stoicism quietly assumes privilege, security, and slack).
- **The Concrete Literary / Real-World Foil**: Ground abstract philosophy in vivid counter-examples (Kong Yiji, Ah Q, economic precarity).
- **The Contrast**: Sharp distinction between methods and conclusions (e.g., skepticism as a method vs. cynicism as a dead-end conclusion).
- **The Way Out**: An affirmative call to enter the arena and create.

### 3. Technical Deep-Dives (`tech/posts/` and `tech/series/`)

- **Context & Motivation**: What broke, hit a wall, or was missing before?
- **Architecture & Seams**: ASCII/Mermaid diagrams, interface boundaries, and explicit tradeoffs.
- **Failure Modes & Pitfalls**: Real bugs encountered, race conditions, or tooling friction.
- **Operational Reality**: How it actually behaves in production (latency, memory, deployment gates).
