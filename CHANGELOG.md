# Changelog

Changes to the site itself, newest first. Posts are not listed here; they are their own record.
One dated entry per merged change, written in the [Keep a Changelog](https://keepachangelog.com/)
groups (Added, Changed, Fixed, Removed).

## 2026-11-04 — Two-tier series architecture and album landing pages

### Added

- Dedicated album pages under `/tech/series/<album>/` (`src/pages/tech/series/[album]/index.astro`) featuring complete vinyl-sleeve tracklists, chapter descriptions, track durations, and bidirectional album pager navigation.
- Curated series descriptions in `src/lib/posts.ts` (`SERIES_DESCRIPTIONS`) and `albumHref` helper.

### Changed

- Replaced `/tech/series/` 25rem overflowing card layout with a clean catalog grid: each series card displays album metadata, description, opening 3-track preview, and a link into the dedicated album page.
- Upgraded chapter reader (`src/pages/tech/series/[album]/[chapter].astro`) back link to point directly to its parent series album page.
- Added E2E smoke tests in `e2e/smoke.spec.ts` verifying series catalog navigation and album tracklists.

## 2026-11-03 — 39 Music footer call response

### Changed

- The footer call and response now plays the authentic, uncut concert call section of "39みゅーじっく！" (mikitoP) in one continuous single-click sequence: `準備OK？` → `Yes!` launches the full master track section (`39みゅーじっく！` → `大サービス！ (Oh Yeah!)` → `大熱唱！ (Hey!)` → `未体験Night！ (Oh Yeah!)` → `準備OK？ (Yes!)` → `もう一度名前呼んで！ (初音ミク!)`).
- Penlights continuously sway to the 130 BPM rhythm throughout the entire section, synchronized with `timeupdate` cue transitions, and retract when the section completes.

### Removed

- Removed the footer `<PianoStrip />` keyboard, clearing space for future 3D Miku additions.

## 2026-11-03 — CI preparation and redundant work

### Changed

- CI cancels superseded PR runs while preserving every main push, and skips PRs changing only
  explicitly listed root documentation. Blog posts and diagrams retain the complete gate.
- CI installs only Bun and rumdl with mise's built-in cache and checks out only Archify's skill
  directory. Installation, formatting and validation have separate timing steps.
- Diagram rendering runs once during the site build instead of repeating in standalone verification
  and type sync. The build still renders and validates every diagram; dev-mode generation is retained.
- The combined gate validates content, builds once (including Astro's type generation), then runs
  TypeScript against those generated types instead of running a second content/type sync first.
- The 50-run baseline and measured follow-up are recorded in `CI_PERFORMANCE.md`.

## 2026-11-03 — CV page and PDF

### Added

- The CV lives in `src/data/cv.yaml`, the one source for both outputs: `/cv/` is a component page
  in the blog's style (roles as a tracklist that expands, an "Updated" date, a PDF download), and
  `assets/cv/cv.typ` renders the formal PDF with a "Last updated" footer; `make cv` writes
  `public/cv.pdf`. Typst is pinned in `mise.toml`.

### Removed

- `docs/cv.md` and the `PageDoc` component, replaced by `src/data/cv.yaml` and `src/pages/cv.astro`.

### Fixed

- The header navigation and the footer link to `/cv/` again; the entry was lost in the move from MkDocs.

## 2026-11-03 — Headless browser checks

### Added

- Headless-Chromium checks via the playwright-verify skill: `make e2e` runs the specs in `e2e/`
  (home smoke; mermaid diagrams render inside their figure and survive a theme redraw) against a
  dev server on loopback 4332. `make e2e-probe ROUTE=/path` screenshots one route.

## 2026-10-27 — Travel Atlas and trip routes

### Added

- Header navigation, footer links, and `/life/` chip entry pointing to `/travel/`.
- Travel Atlas at `/travel/`: an interactive catalog of journeys with responsive SVG route maps, metadata cards, and chronological stats.
- Trip detail view at `/travel/<slug>/`: equirectangular map projection, structured daily logs & reflections, interactive stops timeline, and narrative mementos with coordinate linking.
- GeoJSON content collection (`src/content.config.ts`) and validation gate (`scripts/travel.ts`) in `bun run verify` enforcing schema constraints, coordinate precision (≤4 decimals), and referential integrity (Decision D15).

## 2026-10-20 — Journal piano roll, Life shelves, and playable footer keys

### Added

- Journal piano roll (`PianoRoll.astro`) on `/journal/` and `/journal/archive/<year>/`: a 53-week
  CSS grid across `review`, `refresh` and `weekly` lanes with live note readout.
- Life shelves (`LifeShelves.astro`) on `/life/`: Live & Stage concert cards, a collapsible
  Magical Mirai theme anthology (2014–2026, from `src/data/magical-mirai.yaml`), a Bookshelf with
  jacket covers, and Essays.
- Web Audio synthesis on the footer `<PianoStrip />`: clicking or pressing Enter/Space on any key
  plays its pitch, and answering `準備OK？` plays the B-flat major arpeggio (`B♭3 · D4 · F4`).
- Hover and focus highlight on the post list; the newest release card's waveform pulses on hover.

### Changed

- Site config and math helper moved to TypeScript (`astro.config.ts`, `src/lib/math.ts`), with
  `bun run typecheck` gated in `bun run verify`.

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
