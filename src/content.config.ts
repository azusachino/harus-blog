import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import fs from 'node:fs';
import path from 'node:path';

// The universal post frontmatter (see ../AGENTS.md). Posts stay plain
// Markdown under docs/ so the content outlives this framework.
const post = z.object({
  title: z.string(),
  created: z.coerce.date(),
  modified: z.coerce.date().optional(),
  description: z.string(),
  // Lowercase, as the frontmatter contract requires (also keeps category
  // URLs from colliding on case-insensitive filesystems).
  categories: z.array(z.string().regex(/^[a-z0-9-]+$/, 'categories must be lowercase')).default([]),
  tags: z.array(z.string().regex(/^[a-z0-9-]+$/, 'tags must be lowercase')).optional(),
  slug: z.string(),
  lang: z.string().optional(),
  comments: z.boolean().default(false),
  // Cover image shown above the post (a /assets/... path) and its alt text.
  cover: z.string().optional(),
  cover_alt: z.string().optional(),
});

const posts = (dir: string) =>
  defineCollection({
    loader: glob({ base: `docs/${dir}/posts`, pattern: '**/*.md' }),
    schema: post,
  });

const use = defineCollection({
  loader: file('src/data/use.yaml'),
  schema: z.object({
    group: z.enum(['dev', 'devices', 'subscriptions']),
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

// Magical Mirai theme songs, one per year (see src/data/magical-mirai.yaml).
const magicalMirai = defineCollection({
  loader: file('src/data/magical-mirai.yaml'),
  schema: z.object({
    title: z.string(),
    producer: z.string(),
    youtube: z.string().optional(),
  }),
});

// Ordered tutorials: tech/series/<name>/NN.<slug>.md.
const series = defineCollection({
  loader: glob({
    base: 'docs/tech/series',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    created: z.coerce.date(),
    modified: z.coerce.date().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
    cover_alt: z.string().optional(),
  }),
});

function geojsonLoader(dir: string): Loader {
  return {
    name: 'geojson-loader',
    load: async ({ store, parseData }) => {
      const fullDir = path.resolve(dir);
      if (!fs.existsSync(fullDir)) return;
      const files = fs.readdirSync(fullDir).filter((f) => f.endsWith('.geojson'));
      for (const file of files) {
        const filePath = path.join(fullDir, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const json = JSON.parse(raw);
        const id = file.replace(/\.geojson$/, '');
        const data = await parseData({ id, data: json });
        store.set({ id, data });
      }
    },
  };
}

// Travel journeys exported as GeoJSON FeatureCollection from Felicia.
const trips = defineCollection({
  loader: geojsonLoader('docs/travel'),
  schema: z.object({
    type: z.literal('FeatureCollection'),
    schema: z.literal('felicia.journey.geojson.v1'),
    generator: z.string(),
    properties: z.object({
      slug: z.string(),
      title: z.string(),
      place: z.string(),
      country: z.string(),
      region: z.string(),
      date_start: z.string(),
      date_end: z.string(),
      days: z
        .array(
          z.object({
            day: z.number(),
            date: z.string(),
            title: z.string(),
            description: z.string().optional(),
          })
        )
        .optional(),
    }),
    features: z.array(z.any()),
  }),
});

// The CV (src/data/cv.yaml): one entry per top-level key, rendered by
// src/pages/cv.astro and read by assets/cv/cv.typ for the PDF.
const link = z.object({ text: z.string(), href: z.url() });
const bullet = z.union([z.string(), z.object({ text: z.string(), link })]);
const project = z.object({ name: z.string(), tag: z.string(), href: z.url().optional(), text: z.string() });
const cv = defineCollection({
  loader: file('src/data/cv.yaml'),
  schema: z.union([
    z.object({
      updated: z.string(),
      name: z.string(),
      headline: z.string(),
      email: z.email(),
      phones: z.array(z.string()),
      born: z.string(),
      github: z.url(),
      linkedin: z.url(),
      summary: z.string(),
    }),
    z.object({
      title: z.string(),
      roles: z.array(
        z.object({ title: z.string(), org: z.string(), period: z.string(), bullets: z.array(bullet) }),
      ),
    }),
    z.object({ title: z.string(), projects: z.array(project) }),
    z.object({
      title: z.string(),
      rows: z.array(z.object({ label: z.string(), value: z.string(), href: z.url().optional() })),
    }),
  ]),
});

export const collections = {
  series,
  cv,
  trips,
  tech: posts('tech'),
  journal: posts('journal'),
  life: posts('life'),
  use,
  currently,
  playlist,
  magicalMirai,
};
