# Idealistic Daydreamer

> 假如我最终无法继续战斗下去，假如我放弃了，我堕落了，那么我就比那些从未战斗过的人更为恶劣。

Personal blog, built with [MkDocs](https://www.mkdocs.org/) + [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

## Layout

Content lives in `docs/`, split into type-based tabs (no year-wise layout):

- **Tech** — `docs/tech/` (blog) + `docs/tech/series/` (ordered tutorials)
- **Journal** — `docs/journal/` (weekly reports + monthly refresh)
- **Reviews** — `docs/reviews/` (yearly reviews, flat nav)
- **Life** — `docs/life/` (life / books / thoughts, flat nav)

Images live under `docs/assets/images/` and `docs/assets/book/`.

## Tasks

Tooling is managed by `mise` (runtimes) + `uv` (Python deps); `make` is the task runner:

```bash
make local     # serve with live reload at :1313
make build     # build the static site (strict)
make migrate   # regenerate docs/ from legacy Hugo content (one-shot, see scripts/migrate.py)
make format    # prettier
```

## Notes

- Comments: Giscus, configured in `overrides/partials/comments.html`.
- Legacy Hugo shortcodes (`youtube`/`bilibili`/`douban`/`ppt`) still render via `hooks/shortcodes.py`.
- Posts dated in the future are treated as drafts (`draft_if_future_date`).
