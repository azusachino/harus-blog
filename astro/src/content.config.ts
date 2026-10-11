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
    group: z.enum(['dev', 'devices', 'subscriptions']),
    kind: z.string(),
    name: z.string(),
    url: z.url().optional(),
    since: z.coerce.date().optional(),
    price: z.string().optional(),
    renews: z.string().optional(),
    until: z.coerce.date().optional(),
    note: z.string().optional(),
  }),
});

const now = defineCollection({
  loader: file('src/data/now.yaml'),
  schema: z.object({
    label: z.string(),
    value: z.string(),
    detail: z.string().optional(),
    url: z.url().optional(),
    updated: z.coerce.date(),
  }),
});

export const collections = {
  tech: posts('tech'),
  journal: posts('journal'),
  life: posts('life'),
  use,
  now,
};
