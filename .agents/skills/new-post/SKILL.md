---
name: new-post
description: Scaffold, categorize, and polish a new blog post for this Astro site. Use when the user wants to add/draft a new tech post, journal entry (weekly report / monthly refresh / yearly review), life post, or a tutorial series chapter.
---

# Add a new blog post

This site is **Astro**. Posts are plain Markdown in `docs/`, split into type-based sections; the
site reads them as content collections, so **no config or nav edit is ever needed**. Just drop a
properly-front-mattered file in the right directory. Keep edits minimal and match the surrounding
posts.

## 1. Pick the destination

| Kind                      | Location                                             | URL                               |
| ------------------------- | ---------------------------------------------------- | --------------------------------- |
| Tech blog post            | `docs/tech/posts/<slug>.md`                          | `/tech/<slug>/`                   |
| Journal — weekly report   | `docs/journal/posts/<YYYY>/week-report-YYYY-WW.md`   | `/journal/<slug>/`                |
| Journal — monthly refresh | `docs/journal/posts/<YYYY>/month-refresh-YYYY-MM.md` | `/journal/<slug>/`                |
| Journal — yearly review   | `docs/journal/posts/<YYYY>/review-YYYY.md`           | `/journal/<slug>/`                |
| Life post                 | `docs/life/posts/<slug>.md`                          | `/life/<slug>/`                   |
| Tech series chapter       | `docs/tech/series/<name>/NN.标题.md`                 | `/tech/series/<name>/NN.标题/`    |

A yearly review is a journal post and appears in its year's archive. `slug` = the filename
without `.md`, kebab-case; it must also be the `slug:` frontmatter value. A series chapter's URL
is its filename, so the `NN.` prefix sets its order — never rename a published chapter.

## 2. Write the frontmatter

**All posts** use the same frontmatter, keys in this exact order (the build enforces it):

```yaml
---
title: "<see §4 for style>"
date: YYYY-MM-DD # a future date = draft, excluded from the build
description: <one short line — a mood/hook, not a summary>
categories:
  - <category> # lowercase; see §3
tags: # tech only; omit otherwise; lowercase
  - <topic>
slug: <filename-without-.md>
comments: true
cover: "/assets/images/YYYY/MM/<file>" # optional
cover_alt: "<what the cover shows>" # optional, with cover
---
```

Series chapters need only `title` and `description` (plus an optional `cover`/`cover_alt`).
Optional `lang: en | zh-CN | ja` overrides the detected article language; add it only when the
detection is wrong. `scripts/frontmatter.ts` and the collection schema fail `make check` on a
missing key, wrong order, `comments` not `true`, or any uppercase category or tag.

## 3. Categorize

Categories are **lowercase**, exactly one per post:

- **Tech** — **`practice`** (hands-on: building/configuring something) or **`research`** (concepts,
  theory, understanding how something works). Put the actual technologies in **`tags`**, lowercase
  (e.g. `java`, `go`, `rust`, `kubernetes`, `grpc`).
- **Journal** — **`weekly`** (week report), **`refresh`** (monthly), or **`review`** (yearly). No tags.
- **Life** — **`life`**. No tags.

When unsure between practice/research, ask the user rather than guessing.

## 4. Polish (always do this pass)

- **Title** — descriptive of the actual content, `Topic: subtitle` style, in the **same
  language as the post body** (Chinese body → Chinese title, English body → English title).
  Avoid vague stems like "练习 X" / "X Knowledge Sharing". Quote the value in YAML if it
  contains an ASCII colon `:`; a Chinese full-width colon `：` needs no quoting. Once a post is
  published its title is fixed: Giscus finds the comment thread by title.
- **Description** — one short evocative line (the site shows it in lists and the RSS feed). Keep
  the author's voice; these are intentionally poetic, not summaries.
- **Cover and images** — in frontmatter (`cover`, `cover_alt`), never as a body line. Images live
  under `docs/assets/images/YYYY/MM/` and are referenced as `/assets/images/...`; never link an
  external image host. Before adding a photo, resize it to at most 2000px and strip EXIF/GPS
  (phone photos carry location): convert HEIC with `sips -s format jpeg`, then
  `sharp(src).rotate().resize(2000, 2000, { fit: 'inside' }).jpeg({ quality: 82, mozjpeg: true })`.
- **Markdown** — plain CommonMark: no `{ .class }` attribute markers, no shortcodes, no MDX. Put a
  `<!-- more -->` after the opening paragraph when the post has a hook.
- **Diagrams and math** — diagrams are ` ```mermaid ` fences. Math is `$…$` inline and `$$…$$` (or
  a paragraph holding only one formula) for display. Write a price or other literal dollar as `\$`
  when its paragraph contains another `$`, otherwise the two become a formula.
- **Typos** — fix clear spelling/grammar/Markdown mistakes only. Do **not** rewrite voice,
  translate, restructure, or alter code blocks.

## 5. Lists are automatic

Posts appear in their section list, the RSS feed and (journal) the year archive on their own;
series chapters appear on `/tech/series/` in filename order. Nothing to register.

## 6. Verify

Run `make check` — formatting, contrast, frontmatter, build and URL parity must all pass. To look
at the post, `make local` and open it on :4321. A future-dated post is a draft and is absent from
the build; that is expected. Then stop and let the user review before committing (project
convention: always ask before committing).
