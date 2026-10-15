# Project: Idealistic Daydreamer (blog)

Personal blog built with **Astro**, themed after Hatsune Miku. Posts are plain Markdown in `docs/`,
split into type-based sections — **no year-wise layout**. The site code is at the repo root
(`src/`, `scripts/`, `public/`). Served by Caddy on harus-k3s (`03-core/harus-blog`), built nightly.

## Stack & tooling

- `mise` pins bun and rumdl; **`make` is the task runner**; bun runs everything (no Python).
- `make local` (dev server :4321) · `make build` (`dist/`) · `make fmt` · `make check` (the gate).
- `make check` = prettier + rumdl, then `bun run verify`: palette contrast (`scripts/contrast.ts`),
  frontmatter contract (`scripts/frontmatter.ts`), `astro build`, URL parity with the old MkDocs
  site (`scripts/url-parity.ts` + `scripts/mkdocs-urls.txt`). CI and the cluster builder run the same.
- On this network installs need `BUN_CONFIG_REGISTRY=https://registry.npmmirror.com/`; strip mirror
  URLs from `bun.lock` afterwards. New packages wait 7 days (bun cooldown).
- The dev server runs as a background daemon: after changing `astro.config.ts`, a collection or a
  Markdown plugin, `bunx --bun astro dev stop`, delete `node_modules/.astro`, and start again —
  the content cache does not notice those changes.
- `CHANGELOG.md` records site changes (not posts): one dated entry per merged change.

## Content layout

- **Tech** — `docs/tech/posts/` + `docs/tech/series/<name>/NN.<title>.md` (ordered tutorials; the
  filename is the URL: `/tech/series/<name>/NN.<title>/`).
- **Journal** — `docs/journal/posts/<YYYY>/…`: weekly reports, monthly refreshes, yearly reviews.
- **Life** — `docs/life/posts/`: books, concerts, essays.
- **About** — `src/pages/about.astro`, a component page; its wordings are the owner's (ask before
  changing them). **CV** — `docs/cv.md`.
- **Data pages** — `src/data/*.yaml`: `currently.yaml` (Play/Practice/Read & watch), `playlist.yaml`
  (On repeat, file order), `use.yaml` (Dev/Devices/Subscriptions). Lists are the owner's; ask before
  adding entries.
- Images: `docs/assets/images/<YYYY>/<MM>/…`, `docs/assets/book/`. Served at `/assets/…`.

## Conventions

- Frontmatter contract, enforced by the build: `title`, `date`, `description`, `categories`,
  optional `tags`, `slug`, `comments: true`, optional `cover` + `cover_alt` — in that order.
  Series chapters need only `title` + `description` (optional `cover`). Categories and tags are
  **lowercase** (`research`/`practice`, `weekly`/`refresh`/`review`, `life`). Optional `lang`
  (`en`/`zh-CN`/`ja`) overrides the detected article language.
- `date`/`slug` drive ordering and URLs (`/<section>/<slug>/`); future-dated posts are drafts.
- Posts stay plain CommonMark: no MDX, no attribute markers, no shortcodes. The cover lives in
  frontmatter; embeds get components, not syntax inside posts.
- Diagrams: ` ```mermaid ` fences, drawn in the browser by `src/components/Mermaid.astro` (loaded
  only on pages that have one, colored by the palette). Math: `$…$` inline, `$$…$$` or a paragraph
  holding one formula for display, rendered at build time by KaTeX (`src/lib/math.ts`). A literal
  dollar in a paragraph that has another one is written `\$` (prices), or the two pair up as math.
- Images live in `docs/assets`, never on an external host (a dead CDN cost ten images once). Before
  committing a photo, resize to ≤2000px and strip EXIF/GPS (phone photos carry home coordinates).
- Giscus comments map threads by page title (`<title> - Idealistic Daydreamer`): never change a
  published post's title or the title format.
- URLs of published pages never change; `scripts/url-parity.ts` fails the build if one disappears.

## Adding UI (pages, components, palettes)

- Pages in `src/pages/`, components in `src/components/`, shared logic in `src/lib/`. Reuse
  `Base` (layout), `Article` (post-like pages), `Waveform`, `PostList` before writing new ones.
- Colors come only from the tokens in `src/styles/global.css` (`--primary`, `--glow`, `--accent`, …),
  never hex in components. A new palette is a `[data-palette]` block plus an entry in
  `src/lib/site.ts`; `scripts/contrast.ts` must pass (text 4.5:1, lit keys 3:1).
- Every animation has a `prefers-reduced-motion` path that still makes sense without motion (the
  global rule shortens animations to 0.01ms, so timed effects need their own fallback).
- Keyboard focus stays visible on every background; new controls get accessible names.
- Decoration does one thing. The footer music player was cut for having too many controls.
- Miku: colors and motifs are free to use; illustrations follow the Piapro Character License
  (non-commercial, credited, not official-looking, no promotion). Never quote song lyrics.
- External data is fetched at build time only (GitHub is the only source); a new source needs the
  owner's decision. No third-party analytics.

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
