# Plan: Migrate harus-blog from Hugo (theme-stack) to MkDocs Material

## Context

The blog currently runs on **Hugo Extended** with the `hugo-theme-stack/v3` module, ~239 markdown files under `content/post/{2021..2026}/` plus `content/post/series/`, organized **year-wise**. Posts use Hugo page bundles, Hugo shortcodes (`{{< bilibili >}}`, `{{< youtube >}}`, `{{< ppt >}}`, `{{< douban >}}`), `/p/:slug/` permalinks, and YAML frontmatter (`title`, `description`, `date`, `slug`, `image`, `categories`).

The goal is to move to **MkDocs Material** with the **blog plugin**, replacing the year-wise layout with **type-based top tabs**. Per decisions taken:

- **4 grouped tabs**: `Tech` (technical notes + code series) · `Journal` (weekly reports + monthly refresh) · `Reviews` (yearly reviews) · `Life` (life + book + thought + concerning).
- **Custom MkDocs hook** to render the Hugo shortcodes at build time.
- **Fresh URLs** — no `/p/:slug/` redirect layer.
- **Replace Hugo now** — retire `hugo.yaml`, the theme module, `layouts/`, and rewire `mise` tasks to `mkdocs`.

## Target layout

```
docs/
  index.md                    # landing page (from content/page/about + sidebar copy)
  about.md  cv.md             # static pages (from content/page/)
  assets/images/YYYY/MM/...   # all images consolidated here
  tech/
    index.md                  # blog index for Tech
    posts/<slug>.md           # Learning/Exp/Java/DB/Middleware/Practice/ai posts (flat)
    series/                   # ordered, NOT reverse-chron — regular nav pages
      effective-cpp/NN.*.md
      more-effective-cpp/NN.*.md
      k8s/NN.*.md
      network/NN.*.md
  journal/
    index.md
    posts/<slug>.md           # week-report/* + month-refresh (refresh/*)
  reviews/
    index.md
    posts/<slug>.md           # review-YYYY.md
  life/
    index.md
    posts/<slug>.md           # life/book/concerning/thought/conclusion + 2025/2026 blog/* essays
hooks/shortcodes.py           # Hugo-shortcode → HTML converter (on_page_markdown)
overrides/partials/comments.html  # giscus comments
mkdocs.yml
pyproject.toml                # mkdocs-material + extensions (managed via uv)
scripts/migrate.py            # one-shot content migration script (committed for reproducibility)
```

## Implementation steps

### 1. Tooling bootstrap (replace Hugo)
- Add `pyproject.toml` (or `requirements.txt`) pinning: `mkdocs-material>=9.5`, `pymdown-extensions`, `mkdocs` (+ `pillow`/`cairosvg` only if social cards are wanted). Manage runtime via `mise` (python) + `uv` for deps, consistent with user's nix-first/mise-runtime convention.
- Rewrite `mise.toml` tasks: `local` → `uv run mkdocs serve -a 0.0.0.0:1313`; `build` → `uv run mkdocs build`; `deploy` → `mkdocs build` then copy `site/` to the existing `harus-server/.../www-data` target (same destination GEMINI.md documents, swapping `/tmp/mika` for `site/`).
- Decommission after parity: `hugo.yaml`, `go.mod`, `go.sum`, `layouts/`, `resources/`, `public/`, `.hugo_build.lock`. Keep `static/` content only until images are moved.

### 2. `mkdocs.yml`
- `theme: material` with features: `navigation.tabs`, `navigation.sections`, `navigation.top`, `navigation.indexes`, `content.code.copy`, `toc.follow`, `search.suggest`, palette toggle (light/dark to match current stack look).
- **Four blog plugin instances** (Material supports listing `blog` multiple times), one per tab, each with its own `blog_dir` and `post_url_format`:
  ```yaml
  plugins:
    - search
    - tags
    - blog: { blog_dir: tech,    post_dir: "{blog}/posts", categories_allowed: [...] }
    - blog: { blog_dir: journal, post_dir: "{blog}/posts" }
    - blog: { blog_dir: reviews, post_dir: "{blog}/posts" }
    - blog: { blog_dir: life,    post_dir: "{blog}/posts" }
  ```
- `hooks: [hooks/shortcodes.py]`.
- `nav:` defines the tabs; `Tech` nests a `Series` section with the four ordered series; `Home/About/CV` as plain pages.
- Markdown extensions to replicate Hugo features:
  - `pymdownx.arithmatex` (`generic: true`) + MathJax `extra_javascript` → replaces `article.math`.
  - `pymdownx.superfences` with a `mermaid` custom fence → replaces Hugo mermaid.
  - `toc` (`permalink: true`, `toc_depth: 2-4`) → replaces stack TOC.
  - `pymdownx.highlight` + `pymdownx.inlinehilite` + `tabbed` + `admonition` + `pymdownx.details`.
- `extra`: `social:` links (GitHub, Twitter, Note, running-page from current `menu.social`), `analytics: { provider: google, property: G-59FEKVM9G5 }`.
- `extra.comments`/`overrides` for giscus (`azusachino/idealistic-daydreamer`), gated to post pages.

### 3. Shortcode hook — `hooks/shortcodes.py`
Implement `on_page_markdown(markdown, page, config, files)` doing regex substitution:
- `{{< youtube ID >}}` → responsive `<iframe>` to `youtube-nocookie.com/embed/ID`.
- `{{< bilibili BVID >}}` → `<iframe>` to `player.bilibili.com/player.html?bvid=...`.
- `{{< douban src="URL" >}}` → styled link/card to the Douban URL.
- `{{< ppt src="URL" >}}` → `<iframe>`/link to the slide URL.
- Wrap iframes in a `.video-wrapper` div; add a small `docs/assets/extra.css` for 16:9 responsiveness.
This is the single reusable mechanism, so no per-file embed edits are needed.

### 4. Content migration — `scripts/migrate.py`
A committed one-shot Python script (idempotent, re-runnable into a clean `docs/`):
1. **Classify** each `content/post/**/*.md` into a tab bucket by directory + `categories`:
   - `series/*` → `tech/series/<series>/` (keep `NN.*` filename order; these become ordered nav pages, not blog posts).
   - `report/*` (week-report) and `refresh/*` / `month-refresh` → `journal/posts/`.
   - `review-YYYY.md` / `categories review` → `reviews/posts/`.
   - `life`, `book`, `concerning`, `thought`, `conclusion`, and the `2025/2026/{blog,life,concerning,data}` essays → `life/posts/`.
   - everything else (Learning/Exp/Java/DB/Middleware/Practice/ai) → `tech/posts/`.
2. **Rewrite frontmatter** Hugo → Material blog: keep `title`, `description`, `date`, `categories`; map `categories` values to a normalized set (fix typos seen: `Concluion`→`Conclusion`); convert Hugo `tags` if present; **drop** `slug`, `image`, `created`/`modified`. Filename becomes the slug (fresh URLs).
3. **Images**: copy `static/images/YYYY/MM/*` → `docs/assets/images/YYYY/MM/`; copy page-bundle `images/` dirs into the same tree; rewrite in-body `](images/...)`, `](/images/...)` and any `image:` references to `/assets/images/...`. Drop the now-unused `image:` featured-image field (or, optionally, emit it as a leading inline image — default: drop).
4. **Strip** remaining Hugo-isms the hook doesn't cover (e.g. `{{< ref >}}` internal links → relative md links; `_index.md` category bundles are not copied — categories come from frontmatter).
5. Write per-tab `index.md` files with a short intro for each blog instance.

### 5. Static pages & home
- `content/page/about.md` → `docs/about.md`; `content/page/cv.md` → `docs/cv.md`. Drop Hugo-only `archives.md`/`search.md` (search is built into Material).
- Build `docs/index.md` landing from the stack sidebar subtitle/avatar copy in `hugo.yaml`.

## Verification

1. `uv sync` (or `pip install -e .`), then `uv run mkdocs serve` — site builds with **no warnings** (`mkdocs build --strict`).
2. Visit each tab: confirm 4 tabs render, posts list reverse-chron per instance, Series renders in file order.
3. Spot-check ~5 migrated posts across tabs for: correct frontmatter/date, working images, rendered shortcodes (load a YouTube + Bilibili post), math (a `math: true` post), mermaid, and code highlighting.
4. Confirm giscus loads on a post page and GA tag is present in `site/`.
5. Run the `mise deploy` task into a scratch dir and confirm `site/` lands at the expected `www-data` path.
6. Compare post count: migrated `docs/**/posts/*.md` + `series` ≈ 239 source files (allow for skipped `_index.md` bundles); investigate any large delta.

## Open risks / notes
- **Multiple blog instances** is a Material ≥9.2 feature — pin a recent version.
- Series ordering relies on `NN.` filename prefixes; nav for series will be listed explicitly (or via an `awesome-nav`/literate-nav approach) to guarantee order.
- A handful of files have malformed categories (`Concluion`, mixed case) — the script normalizes these; review the mapping table once.
- Featured `image:` thumbnails from stack have no first-class Material blog equivalent; default is to drop them (can revisit with a custom blog post template later).
