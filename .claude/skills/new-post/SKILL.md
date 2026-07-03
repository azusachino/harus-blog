---
name: new-post
description: Scaffold, categorize, and polish a new blog post for this MkDocs site. Use when the user wants to add/draft a new tech post, journal entry (weekly report / monthly refresh / yearly review), life post, or a tutorial series chapter.
---

# Add a new blog post

This site is **MkDocs + Material**. Content lives in `docs/`, split into type-based tabs.
**All three content tabs (Tech / Journal / Life) are Material blog-plugin instances**, and
`hooks/autonav.py` auto-generates the `Series` subtree — so **no `mkdocs.yml` nav edit is ever
needed**. Just drop a properly-front-mattered file in the right directory. Keep edits minimal
and match the surrounding posts.

## 1. Pick the destination

| Kind                      | Location                                          | Nav edit? |
| ------------------------- | ------------------------------------------------- | --------- |
| Tech blog post            | `docs/tech/posts/<slug>.md`                       | **No**    |
| Journal — weekly report   | `docs/journal/posts/<YYYY>/week-report-YYYY-WW.md` | **No**   |
| Journal — monthly refresh | `docs/journal/posts/<YYYY>/month-refresh-YYYY-MM.md` | **No** |
| Journal — yearly review   | `docs/journal/posts/<YYYY>/review-YYYY.md`        | **No**    |
| Life post                 | `docs/life/posts/<slug>.md`                        | **No**   |
| Tech series chapter       | `docs/tech/series/<name>/NN.标题.md`              | **No**    |

A yearly review is a journal post — it lands in the Journal "By year" archive alongside the
weekly/monthly entries. `slug` = the filename without `.md`, kebab-case; it must also be the
`slug:` frontmatter value (URLs are slug-based).

## 2. Write the frontmatter

**All content posts/pages** use the same universal frontmatter, keys in this exact order:

```yaml
---
title: "<see §4 for style>"
date: YYYY-MM-DD # a future date = draft, auto-excluded from `make build`
description: <one short line — a mood/hook, not a summary>
categories:
  - <category> # lowercase; see §3
tags: # tech only; omit otherwise
  - <Topic>
slug: <filename-without-.md>
comments: true
hide: # Life posts only — drops the empty left sidebar
  - navigation
---
```

`hooks/frontmatter.py` fails the strict build if these keys drift from the order above, so keep
them exact. Only **Life** posts (and `life/index.md`) add the trailing `hide: [navigation]`.
Nav landing pages (`index.md`, `about.md`, `cv.md`) are exempt from the frontmatter rules.

## 3. Categorize

Categories are **lowercase**, exactly one per post:

- **Tech** — **`practice`** (hands-on: building/configuring something) or **`research`** (concepts,
  theory, understanding how something works). Put the actual technologies in **`tags`** (e.g. `Java`,
  `Go`, `Rust`, `Kubernetes`, `gRPC`).
- **Journal** — **`weekly`** (week report), **`refresh`** (monthly), or **`review`** (yearly). No tags.
- **Life** — **`life`**. No tags.

When unsure between practice/research, ask the user rather than guessing.

## 4. Polish (always do this pass)

- **Title** — descriptive of the actual content, `Topic: subtitle` style, in the **same
  language as the post body** (Chinese body → Chinese title, English body → English title).
  Avoid vague stems like "练习 X" / "X Knowledge Sharing". Quote the value in YAML if it
  contains an ASCII colon `:`; a Chinese full-width colon `：` needs no quoting.
- **Description** — one short evocative line (the site shows it on the index card). Keep the
  author's voice; these are intentionally poetic, not summaries.
- **Cover image** — first `![](/assets/images/YYYY/...){ .post-cover }` line. For blog posts
  it **must sit before `<!-- more -->`** so it renders on the index card. Images live under
  `docs/assets/images/`.
- **Typos** — fix clear spelling/grammar/Markdown mistakes only. Do **not** rewrite voice,
  translate, restructure, or alter code blocks.

## 5. Nav is automatic

Every content kind lands in nav on its own: blog posts via the blog plugin's index/archive,
series chapters via `hooks/autonav.py` (filename order). Just save the file in the right
directory — `mkdocs.yml` stays untouched.

## 6. Verify

Run `make build` (strict) — it must pass with no warnings. A future-dated post is treated
as a draft and excluded from the build; that is expected. Then stop and let the user review
before committing (project convention: always ask before committing).
