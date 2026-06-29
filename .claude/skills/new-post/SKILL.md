---
name: new-post
description: Scaffold, categorize, and polish a new blog post for this MkDocs site, and refresh the nav/index when needed. Use when the user wants to add/draft a new tech post, journal entry (weekly report / monthly refresh), review, life page, or a tutorial series chapter.
---

# Add a new blog post

This site is **MkDocs + Material**. Content lives in `docs/`, split into type-based tabs.
Two tabs use the Material **blog plugin** (auto-indexed — no nav edit); the rest are
hand-listed in `mkdocs.yml` `nav`. Follow the steps below; keep edits minimal and match
the surrounding posts.

## 1. Pick the destination

| Kind                      | Location                                      | Indexed by  | Nav edit? |
| ------------------------- | --------------------------------------------- | ----------- | --------- |
| Tech blog post            | `docs/tech/posts/<slug>.md`                   | blog plugin | **No**    |
| Journal — weekly report   | `docs/journal/posts/week-report-YYYY-WW.md`   | blog plugin | **No**    |
| Journal — monthly refresh | `docs/journal/posts/month-refresh-YYYY-MM.md` | blog plugin | **No**    |
| Tech series chapter       | `docs/tech/series/<name>/NN.标题.md`          | nav         | **Yes**   |
| Review                    | `docs/reviews/<slug>.md`                      | nav         | **Yes**   |
| Life page                 | `docs/life/<slug>.md`                         | nav         | **Yes**   |

`slug` = the filename without `.md`, kebab-case. It must also be the `slug:` frontmatter
value (URLs are slug-based, so the two must agree).

## 2. Write the frontmatter

**All content posts/pages** use the same universal frontmatter, keys in this exact order:

```yaml
---
title: "<see §4 for style>"
date: YYYY-MM-DD # a future date = draft, auto-excluded from `make build`
description: <one short line — a mood/hook, not a summary>
categories:
  - <Category> # see §3
tags: # tech only; omit otherwise
  - <Topic>
slug: <filename-without-.md>
comments: true
---
```

This applies to **reviews & life pages too**. They are flat nav pages, so their
`date`/`categories`/`slug` aren't consumed by the blog plugin — but we keep them for a
consistent format (`date` = the page's real date; `categories` = `Review` or `Life`).
Only nav landing pages (`index.md`, `about.md`, `cv.md`) are exempt.

## 3. Categorize

- **Tech** — `categories` is exactly one of **`Practice`** (hands-on: building/configuring
  something) or **`Research`** (concepts, theory, understanding how something works). Put the
  actual technologies in **`tags`** (e.g. `Java`, `Go`, `Rust`, `Kubernetes`, `gRPC`).
- **Journal** — `categories` is **`Weekly`** (week report) or **`Refresh`** (monthly). No tags.
- **Reviews / Life** — `categories` is **`Review`** or **`Life`** respectively. No tags.

When unsure between Practice/Research, ask the user rather than guessing.

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

## 5. Refresh the nav (series / reviews / life only)

Tech-post and journal additions need **no** `mkdocs.yml` change. For the nav-listed kinds,
add one line under the matching tab in `mkdocs.yml` `nav:`:

- **Reviews / Life** — newest-first; insert near the top, just under the tab's `index.md`:
  `- <Display Title>: reviews/<slug>.md`
- **Series chapter** — append in order under `Tech > Series > <series-name>`:
  `- tech/series/<name>/NN.标题.md`

Do not run `make migrate` to do this — that script is the one-shot Hugo importer and will
wipe hand-authored changes. Edit `nav` directly.

## 6. Verify

Run `make build` (strict) — it must pass with no warnings. A future-dated post is treated
as a draft and excluded from the build; that is expected. Then stop and let the user review
before committing (project convention: always ask before committing).
