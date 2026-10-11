# Changelog

Changes to the site itself, newest first. Posts are not listed here; they are their own record.
One dated entry per merged change, written in the [Keep a Changelog](https://keepachangelog.com/)
groups (Added, Changed, Fixed, Removed).

## 2026-10-11 — Astro

The blog moves from MkDocs + Material to Astro, with the same posts at the same URLs.

### Added

- Astro site at the repo root; posts stay in `docs/`. Series chapters, journal year archives, tech
  category pages, About, CV and an RSS feed at `/rss.xml`.
- Pages: Home, Currently (Play, Practice, Listen, Read & watch, Build), Use, Series, and a
  "Track not found" 404.
- Miku design system: four palette tracks named after Mozart's K. 333 movements (header pill),
  keyboard footer with the B♭ chord lit, 準備OK？ penlight call, piano-key reading bar, track
  numbers and lengths, AI-generated Miku illustrations credited under the Piapro Character
  License, an ID favicon that follows the palette.
- Per-article `lang` (detected, overridable in frontmatter); interface in English.
- Gates in `make check`: palette contrast, frontmatter contract, build, URL parity with the old
  MkDocs site.

### Changed

- Covers move from `{ .post-cover }` lines into `cover` / `cover_alt` frontmatter.
- Categories and tags must be lowercase.
- Dead `cdn.azusachino.icu` images brought into `docs/assets` (EXIF/GPS stripped); old `.icu`
  text references moved to `azusachino.com`.

### Removed

- MkDocs, Material, the Python hooks and scripts, and Google Analytics.
- Pointers to the defunct `note.azusachino.icu` reading notes.
