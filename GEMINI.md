# Haru's Blog - Project Context

## Project Overview

**Name:** Idealistic Daydreamer
**Type:** Static Site (Personal Blog)
**Engine:** [Hugo](https://gohugo.io/) (Extended)
**Theme:** [Hugo Theme Stack](https://github.com/CaiJimmy/hugo-theme-stack) (v3)
**Base URL:** `https://azusachino.icu`

This repository contains the source code and content for Haru's personal blog. It is managed as a Hugo module and utilizes `mise` for tool versioning and task management.

## Technical Stack

- **Hugo:** Static site generator (configured in `hugo.yaml`).
- **Go:** Used for Hugo Modules dependency management (`go.mod`).
- **Bun:** Used for running Prettier (`bunx prettier`).
- **Mise:** Tool version manager and task runner (`mise.toml`).

## Getting Started

### Prerequisites

Ensure `mise` is installed to automatically handle tool versions (`go`, `uv`, `bun`).

### Common Tasks (via `mise`)

The project uses `mise.toml` to define common development tasks:

- **Start Development Server:**

  ```bash
  mise run local
  # Runs: hugo server -D --bind "0.0.0.0" --port 1313 -d /tmp/mika
  ```

  - Builds drafts (`-D`).
  - Binds to `0.0.0.0` for network access.
  - Outputs to a temp directory (`/tmp/mika`).

- **Format Code:**

  ```bash
  mise run format
  # Runs: bunx prettier --write .
  ```

- **Deploy (Local):**

```bash
mise run deploy
# Warning: Specific to Haru's local environment.
# Builds to /tmp/mika and copies to /home/haru/Projects/project-github/harus-server/harus-blog/www-data
```

### Manual Commands

If not using `mise`:

- **Run Server:** `hugo server -D`
- **Build Production:** `hugo --minify`

## Configuration (`hugo.yaml`)

- **Comments:** Giscus enabled (`azusachino/idealistic-daydreamer`).
- **Analytics:** Google Analytics (`G-59FEKVM9G5`).
- **Permalink Structure:** `/p/:slug/` for posts.
- **Menus:** Defined for Main (Home) and Social (GitHub, Twitter, Note, running-page).

## Content Management

### Directory Structure

- `content/post/`: Blog posts organized by year (2021-2026).
- `content/page/`: Static pages (About, CV, Archives).
- `assets/template/`: Contains `week-report-template.typ` (Typst template).

### Frontmatter Conventions

Standard YAML frontmatter fields used in posts:

```yaml
---
title: "Post Title"
description: "Brief description"
date: YYYY-MM-DD
slug: post-slug-url
image: /images/YYYY/MM/filename.jpg # Featured image
categories: [category1]
tags: [tag1, tag2]
---
```

### Custom Shortcodes

Documented in `README.md`:

- **PPT:** `{{< ppt src="..." >}}`
- **Bilibili:** `{{< bilibili BV_ID >}}`
- **YouTube:** `{{< youtube VIDEO_ID >}}`
- **Douban:** `{{< douban src="DOUBAN_URL" >}}`

## Notes

- **Dockerfile:** Exists (`FROM scratch`) but purpose is unclear relative to the static site workflow; likely for a specific server binary or placeholder.
- **Ignored Files:** `.hugo_build.lock`, `resources/`, `public/` (implied standard ignores).
