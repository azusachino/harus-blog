import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The universal post frontmatter (see ../CLAUDE.md). Posts stay plain
// Markdown under ../docs so the content outlives this framework.
const post = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).optional(),
  slug: z.string(),
  lang: z.string().optional(),
  comments: z.boolean().default(false),
});

const posts = (dir: string) =>
  defineCollection({
    loader: glob({ base: `../docs/${dir}/posts`, pattern: '**/*.md' }),
    schema: post,
  });

const use = defineCollection({
  loader: file('src/data/use.yaml'),
  schema: z.object({
    group: z.enum(['dev', 'devices', 'desk-audio', 'subscriptions']),
    kind: z.string(),
    name: z.string(),
    url: z.url().optional(),
    note: z.string().optional(),
  }),
});

const currently = defineCollection({
  loader: file('src/data/currently.yaml'),
  schema: z.object({
    section: z.enum(['play', 'practice', 'read-watch']),
    kind: z.string(),
    value: z.string(),
    detail: z.string().optional(),
    url: z.url().optional(),
    updated: z.coerce.date(),
  }),
});

const playlist = defineCollection({
  loader: file('src/data/playlist.yaml'),
  schema: z.object({
    title: z.string(),
    artist: z.string(),
    url: z.url().optional(),
    note: z.string().optional(),
    added: z.coerce.date(),
  }),
});

// Standalone pages (About, CV) rendered as they are.
const pages = defineCollection({
  loader: glob({ base: '../docs', pattern: ['about.md', 'cv.md'] }),
  schema: z.object({ title: z.string(), description: z.string().optional() }),
});

export const collections = {
  pages,
  tech: posts('tech'),
  journal: posts('journal'),
  life: posts('life'),
  use,
  currently,
  playlist,
};
