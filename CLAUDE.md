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
