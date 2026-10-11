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

The Wayback Machine had never archived a single one of them. Nine came back from my phone's photo library as HEIC files, and every one of them carried GPS coordinates, including the photo of the fuwamiku plushies, taken at home. They went back up as plain JPEGs with all metadata stripped. The tenth, a 百日紅 image from the Yorushika post, is gone, so the post now does without it.

The same dead domain hid two smaller things. Old posts still pointed readers to `note.azusachino.icu` for my reading notes, a site that no longer exists anywhere. I removed those "see my notes here" lines rather than repoint them; I did not like how they read anymore. The homelab hostnames in the Traefik post still said `.icu` while the cluster now lives on `.com`, so they moved too.

## The rule I took away

Posts stay plain Markdown. Covers move into frontmatter, attribute markers go, and only the pages that need components get them. The next migration should be a copy, not a rewrite.

Images live next to the posts. A CDN on a domain I stopped paying attention to is a slow delete.

## The fun part

It is themed after Hatsune Miku now, which it half was already: the teal was there in the MkDocs CSS. Reading progress is a strip of piano keys. Reading time is shown as a track length. Posts are numbered like tracks, and a missing page says "Track not found". The illustrations on the home page, the about page and the 404 page are AI-generated fan art, credited under the Piapro Character License in the footer.

There is also a "Currently" page, split into Play, Practice, Listen, Read & watch and Build: Maimai, Genshin, Dota 2 tournaments, piano, what is on repeat, and a strip of my public GitHub activity. GitHub's public events feed stops at 300 events. On a busy week that covers seven days, which says more about how I spent October than I would like.

## The detour through a music player

The footer was the plainest part of the site, so I went looking for energy and found it in a twenty-second YouTube Short, *mikumikuplaylist*, almost twenty-nine million views. It is one phone music player that never moves while everything around it does: every second a new full-screen color, a new cover, a new track. The elapsed time never changes from `0:39`.

My first answer was to build that player into the footer, with previous and next buttons, a progress bar, a heart for comments, a plus for the feed. Every control did something real. It was also too big, and its controls were confusing. Decoration that needs a manual has failed at being decoration.

What survived is small. The header has a pill that reads "Mozart · K. 333" over the current movement, because the Piano Sonata No. 13 in B-flat major is what I keep returning to lately. Clicking it moves to the next movement and repaints the whole site: I. Allegro in teal, II. Andante cantabile in snow blue, III. Allegretto grazioso in sakura pink, and the finale's cadenza in sunset orange. The footer is a band of the current color with two octaves of keyboard on it, B-flat, D and F lit.

The keyboard caught one more bug before anyone saw it. In dark mode the lit keys sat on near-white keys, and in the sakura palette the difference was 1.32 to 1, which is to say invisible. The site now has a script that reads the stylesheet and fails the build when any text falls under WCAG AA or a lit key under 3 to 1. It is the least romantic part of the redesign and the one I trust most.
