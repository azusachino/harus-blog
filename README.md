# Idealistic Daydreamer

> 假如我最终无法继续战斗下去，假如我放弃了，我堕落了，那么我就比那些从未战斗过的人更为恶劣。

Personal blog, built with [Astro](https://astro.build/) and themed after Hatsune Miku.

## Layout

- `docs/` — the posts, plain Markdown: `tech/posts/`, `tech/series/<name>/`, `journal/posts/<year>/`,
  `life/posts/`, plus `about.md`, `cv.md` and images under `docs/assets/`.
- `src/` — the site: pages, components, styles, and the data pages in `src/data/` (Currently, On
  repeat, Use).
- `scripts/` — the gates run by `make check`: palette contrast, frontmatter contract, URL parity.
- `public/` — favicon and touch icon; `public/assets` links to `docs/assets`.

## Tasks

Tooling is pinned by `mise` (bun, rumdl); `make` is the task runner:

```bash
make local   # dev server with live reload at :4321
make build   # static site into dist/
make fmt     # prettier + rumdl
make check   # the gate: formatting, then contrast, frontmatter, build and URL parity
```

## Writing and changing

Rules for posts, images, components and palettes are in [CLAUDE.md](CLAUDE.md); the step-by-step
for a new post is [.claude/skills/new-post/SKILL.md](.claude/skills/new-post/SKILL.md). Site
changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Deployment

Built nightly on the harus-k3s cluster (`03-core/harus-blog`) into atomic releases and served by
Caddy.
