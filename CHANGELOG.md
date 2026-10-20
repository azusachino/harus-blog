# Changelog

Changes to the site itself, newest first. Posts are not listed here; they are their own record.
One dated entry per merged change, written in the [Keep a Changelog](https://keepachangelog.com/)
groups (Added, Changed, Fixed, Removed).

## 2026-10-20 — Side rail and music pages

### Added

- A Magical Mirai rail on wide screens (1600px and up): the theme song of each year, with the
  original title, producer, a thumbnail and a link to the video. The list lives in
  `src/data/magical-mirai.yaml`; thumbnails are in `docs/assets/magical-mirai/`.
- Setlist (`/setlist/`): every post on one timeline, one lane per section, bar height is track length.
- Constellation (`/constellation/`): posts as stars, linked when their titles share a topic word.
- Keys (`/keys/`): a playable two-octave keyboard, tones synthesised in the page.
- Hover and focus highlight on the post list; the newest release card's waveform moves on hover.

### Changed

- Page changes use the Astro view-transition router, and the rail persists across pages.
- The home page has no rail; its content is unchanged.

## 2026-10-12 — Footer and Currently

### Changed

- The light-theme footer is a pale wash of the palette with a glow edge instead of a full glow fill,
  so the penlights stop vibrating against it. Snow, sakura and sunset are retuned to shared
  lightness per role (contrast checks now cover the footer and penlights).
- The penlights use the palette accent like the lit piano keys, and the chord presses B-flat, D, F
  in turn when you answer the call.
- Currently is refreshed: Genshin Impact, Wuthering Waves, Arknights: Endfield; LLM and agent
  practice; 亲密关系 and 薬屋の独り言 Season 2.
- Use is a compact section of Currently (one row per kind).

### Removed

- The Use tab and page in the header.

## 2026-10-11 — Diagrams and math

### Fixed

- Mermaid diagrams render again (18 diagrams in 6 posts), drawn in the browser with colors from the
  current palette and mode; the library loads only on pages that have a diagram.
- Math renders again (5 posts), typeset at build time with KaTeX; a paragraph holding one formula
  displays as a centered block, as on the MkDocs site.
- Prices in the k3s migration post are escaped (`\$`) so they no longer pair up as a formula.

### Added

- Back-to-top button (bottom right) once the header scrolls out of view; smooth in-page scrolling
  unless reduced motion is set.

### Changed

- About is a component page (`src/pages/about.astro`): a before/now role comparison, project
  cards, "Outside of code" with exact names from the journals, and the life-long rules as a
  full-width section.
- Agent files are harness-neutral: instructions in `AGENTS.md` (`CLAUDE.md` links to it) and
  skills in `.agents/skills/` (`.claude/skills` links to it).

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
