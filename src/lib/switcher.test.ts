import { expect, test } from 'bun:test';
import { DOCUMENT_LIMIT, matchDocuments, withoutShown } from './switcher';
import type { SwitcherNote } from '../types/pagefind';

const note = (
  title: string,
  tags: string[] = [],
  url = `/tech/posts/${title.replace(/\W+/g, '-')}/`,
  desc = ''
): SwitcherNote => ({
  title,
  tags,
  url,
  desc,
  section: 'tech',
});

const notes: SwitcherNote[] = [
  note('Inside Apache Kafka', ['distributed-systems', 'kafka']),
  note('Boring Kubernetes', ['kubernetes', 'homelab']),
  note('How Networks Work', ['networking', 'protocols']),
  note('LLM From Scratch: Tokenization', ['ai', 'llm']),
  note('Tokyo Autumn Walk', ['travel', 'japan']),
];

test('every query word must occur in title, tags, description or url', () => {
  expect(matchDocuments(notes, 'kafka').map((n) => n.title)).toEqual(['Inside Apache Kafka']);
  expect(matchDocuments(notes, 'kubernetes').map((n) => n.title)).toEqual(['Boring Kubernetes']);
  expect(matchDocuments(notes, 'nonexistent')).toEqual([]);
});

test('matching is case-insensitive and substring-based', () => {
  expect(matchDocuments(notes, 'KAFKA').map((n) => n.title)).toEqual(['Inside Apache Kafka']);
  expect(matchDocuments(notes, 'network').map((n) => n.title)).toEqual(['How Networks Work']);
});

test('multi-word queries require all terms to match', () => {
  expect(matchDocuments(notes, 'boring homelab').map((n) => n.title)).toEqual(['Boring Kubernetes']);
  expect(matchDocuments(notes, 'kafka kubernetes')).toEqual([]);
});

test('ranking prefers prefix match, then full title match, then tags/desc', () => {
  const customNotes = [
    note('A Note On Kubernetes', ['kubernetes']),
    note('Kubernetes Production Guide', ['kubernetes']),
  ];
  const ranked = matchDocuments(customNotes, 'kubernetes');
  expect(ranked[0].title).toBe('Kubernetes Production Guide');
});

test('withoutShown filters out items already present in shown set', () => {
  const hits = [
    { url: '/tech/posts/inside-kafka/', title: 'Kafka', excerpt: '...' },
    { url: '/tech/posts/boring-kubernetes/', title: 'K8s', excerpt: '...' },
  ];
  const shown = new Set(['/tech/posts/inside-kafka/']);
  const filtered = withoutShown(hits, shown);
  expect(filtered.map((h) => h.url)).toEqual(['/tech/posts/boring-kubernetes/']);
});
