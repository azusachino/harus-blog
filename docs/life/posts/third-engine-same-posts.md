---
title: Third Engine, Same Posts
date: 2026-10-11
description: moving the blog from MkDocs to Astro, and what the move dug up
categories:
  - life
slug: third-engine-same-posts
comments: true
hide:
  - navigation
---

This blog has outlived every engine I built it on. Hugo first, then MkDocs, now Astro. The posts are the only part that stayed, so they are the only part I should design for.

<!-- more -->

## Why move at all

Nothing was broken. That is usually when I leave things alone.

Then the dates arrived. Material for MkDocs went into maintenance mode in November 2025, and its critical fixes now end on 2027-05-05. MkDocs 1.x has no maintainer, and the announced 2.0 drops the plugin system and offers no migration path. My Makefile already carried `NO_MKDOCS_2_WARNING=true` so the build would stop nagging me. Silencing a warning is not the same as answering it.

The other push was more selfish. I wanted pages that are not articles: a list of the tools and devices I actually use, a page for what I am playing and practicing right now. A documentation theme can render those, but it fights you the whole way.

## The candidates

Zensical, the successor from the Material author, reads `mkdocs.yml` and already ported the blog plugin. It could not run the three Python hooks this site depends on: one enforces the frontmatter order, one builds the series navigation, one still renders old Hugo shortcodes. Its public extension API is not out yet.

Hugo would have been a return trip. I left it once already, and `scripts/migrate.py` is the receipt.

Next.js is an application framework. This is a static blog with 241 Markdown files.

So, Astro. Content collections with a typed schema replace the frontmatter hook. A collection query replaces the series hook. Components replace the shortcodes. Cloudflare bought the company in January 2026; it stays MIT-licensed, and that license is the part I am actually trusting.

## What the rewrite dug up

A migration is an audit you did not schedule.

Python-Markdown accepted an image path with spaces in it (`SMC and the Magellanic Bridge.png`). CommonMark does not, so the 2022 review lost its cover the moment it met a stricter parser.

Astro 7 replaced its Markdown pipeline with a new processor called Sätteri, so the small plugin I wrote for `{ .post-cover }` had to be rewritten for a different plugin API. Then the content cache kept serving the old output, and I spent a few minutes convinced my fix was wrong before deleting `node_modules/.astro`.

Comments are matched to pages by title. If the new site renders `Boring Kubernetes` where the old one rendered `Boring Kubernetes - Idealistic Daydreamer`, every existing thread quietly detaches. Nothing errors. You just find out later that the comments are gone.

The worst one was not about Astro at all. `cdn.azusachino.icu` no longer resolves. Ten images across three posts, including the photos from the Miku Symphony and the Yorushika live, had been broken on the live site for who knows how long. I only noticed because the new build rendered them as empty boxes. The concert photos are the part of those posts I would actually miss.

## The rule I took away

Posts stay plain Markdown. Covers move into frontmatter, attribute markers go, and only the pages that need components get them. The next migration should be a copy, not a rewrite.

Images live next to the posts. A CDN on a domain I stopped paying attention to is a slow delete.

## The fun part

It is themed after Hatsune Miku now, which it half was already: the teal was there in the MkDocs CSS. Reading progress is a strip of piano keys. Reading time is shown as a track length. Posts are numbered like tracks, and a missing page says "Track not found". The illustrations on the home page, the about page and the 404 page are AI-generated fan art, credited under the Piapro Character License in the footer.

There is also a "Currently" page: Maimai, Genshin, Dota 2 tournaments, piano, what is on repeat, and a strip of my public GitHub activity. GitHub's public events feed stops at 300 events. On a busy week that covers seven days, which says more about how I spent October than I would like.
