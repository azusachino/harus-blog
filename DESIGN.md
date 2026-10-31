---
name: idealistic-daydreamer
description: Haru's personal blog and digital garden, built with Astro and themed after Hatsune Miku.
colors:
  bg: "#f4f7f9"
  surface: "#ffffff"
  ink: "#2b2f32"
  muted: "#5d6871"
  line: "#d5dde3"
  primary: "#107076"
  glow: "#39c5bb"
  soft: "#86cecb"
  accent: "#d01f78"
  dark-bg: "#1b1e21"
  dark-surface: "#262a2e"
  dark-ink: "#e6ecef"
  dark-muted: "#a9b4bd"
  dark-line: "#3a4045"
  dark-primary: "#4fd1c7"
  dark-glow: "#39c5bb"
  dark-accent: "#ff4fa3"
typography:
  body:
    fontFamily: '"Noto Sans SC", "Noto Sans JP", "PingFang SC", "Hiragino Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "16px"
    lineHeight: 1.75
  mono:
    fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace'
  measure: "70ch"
rounded:
  sm: "4px"
  md: "8px"
  card: "10px"
components:
  blockquote:
    textColor: "{colors.muted}"
    padding: "0.2em 1.2em"
  code-inline:
    backgroundColor: "color-mix(in oklab, {colors.glow} 14%, transparent)"
    rounded: "{rounded.sm}"
    padding: "0.1em 0.35em"
---

# Design System

## Overview

*Idealistic Daydreamer* is Haru's personal public blog. The design mode is an **Experience / Persuade / Read** hybrid: a distinct aesthetic identity inspired by Hatsune Miku ("Studio" in light mode, "Stage" in dark mode), paired with an uncompromising, arena-focused editorial voice. The design repudiates AI-generated visual boilerplate: no purple-cyan gradients, no side-tab card stripes, no diffuse chromatic haze, and no marketing buzzwords.

## Colors

- **Thematic Core**:
  - Miku Cyan (`#39c5bb` glow, `#107076` primary ink) represents vocal synthesis and clarity.
  - Magenta Accent (`#d01f78` light / `#ff4fa3` dark) provides crisp, sharp contrast for active states.
  - Neutral Backgrounds: Off-white studio ground (`#f4f7f9` / `#ffffff`) and stage ground (`#1b1e21` / `#262a2e`).
- **Palettes**:
  - `miku` (default teal & magenta).
  - `sakura` (cherry blossom pink & leaf green).
  - `snow` (ice blue & bright snow cyan).
  - `sunset` (warm amber & deep evening blue).
- **Validation**: Every palette is verified against WCAG AA standards (≥4.5:1 text contrast, ≥3:1 interactive controls) via `scripts/contrast.ts`. Never use hardcoded hex values in components; reference token variables only.

## Typography

- **Measure**: Strict reading measure (`max-width: 70ch`) ensures lines never exceed ~75 characters for comfortable long-form reading across essays and technical posts.
- **Rhythm & Line Height**:
  - Body text uses 1.75 leading to provide comfortable vertical rhythm.
  - Headings are separated by generous spacing (≥2.4em before `h2`, ≥1.8em before `h3`).
  - Text wrapping: headings use `text-wrap: balance`; paragraphs use `text-wrap: pretty`.
- **Anti-AI Writing Standards**:
  - No synthetic triads ("In today's fast-paced, dynamic...").
  - No pseudo-summary bold prefixes (`**Key Takeaway:**`).
  - No forced "not-X-but-Y" contrasts.

## Layout

- **Structure**: Single-column reading container (`max-width: 840px`), centered, with generous horizontal padding on viewports `<640px`.
- **Section Types**:
  - Tech articles and tutorials (`/tech/`).
  - Personal journals and monthly refreshes (`/journal/`).
  - Cultural essays, book reviews, and life notes (`/life/`).
  - Dedicated interactive pages (`/about`, `/currently`, `/cv`).

## Elevation & Depth

- **Tonal Separation**: Contrast is achieved through crisp 1px borders (`var(--line)`), clean surface shifts, and selective glow accents.
- **Controlled Lighting**: Glowing accents are restricted to active penlight waves, playback indicators, and focus rings. Diffuse zero-offset background shadows are prohibited.

## Shapes

- **Radius Scale**:
  - Small badges and code spans: 4px.
  - Interactive buttons and input pills: 8px.
  - Cards, code frames, and block containers: 10px (`--radius`).
- **Affordances**: Focus outlines must remain visible on every theme and background with `outline: 2px solid var(--primary); outline-offset: 2px`.

## Components

- **Penlight Waveform (`Call.astro`)**: An interactive concert penlight callout rendered with pure CSS transforms and timing functions.
- **Blockquote**: Clean indentation with a disciplined 2px rule line (`border-left: 2px solid var(--glow)`), never a thick 4px AI card stripe.
- **Code Frames**: Styled `<pre>` blocks with 1px border and syntax highlighting. KaTeX math formulas are statically rendered at build time.

## Do's and Don'ts

### Do

- Reference CSS variables from `src/styles/global.css` for all component colors.
- Ensure all animations include a `prefers-reduced-motion` alternative.
- Keep all post URLs stable and compliant with `scripts/url-parity.ts`.

### Don't

- Don't use heavy 4px+ side-tab borders on rounded cards.
- Don't embed images from external CDNs; store photos in `docs/assets/images/` and strip EXIF before publishing.
- Don't introduce third-party analytics or external tracking scripts.
