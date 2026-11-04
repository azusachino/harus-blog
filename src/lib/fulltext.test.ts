import { expect, test } from 'bun:test';
import { excerptParts, routeOf } from './fulltext';

test('Pagefind excerpts keep only <mark> as markup and decode escaped text as plain text', () => {
  expect(excerptParts('a <mark>kafka</mark> broker &amp; &lt;b&gt; &quot;x&quot; &#39;y&#39;')).toEqual([
    { text: 'a ', mark: false },
    { text: 'kafka', mark: true },
    { text: ' broker & <b> "x" \'y\'', mark: false },
  ]);
});

test('excerpts drop any other HTML tag rather than passing it through', () => {
  const parts = excerptParts('<img src=x onerror="alert(1)"><script>bad()</script>safe <mark>word</mark>');
  expect(parts.map((p) => p.text).join('')).toBe('bad()safe word');
  expect(parts.every((p) => p.mark === (p.text === 'word'))).toBe(true);
});

test('escaped entities are decoded once', () => {
  expect(excerptParts('&amp;lt;')).toEqual([{ text: '&lt;', mark: false }]);
});

test('Pagefind URLs map to trailing slash blog routes', () => {
  expect(routeOf('/tech/posts/inside-kafka/index.html')).toBe('/tech/posts/inside-kafka/');
  expect(routeOf('/tech/posts/inside-kafka.html')).toBe('/tech/posts/inside-kafka/');
  expect(routeOf('/index.html')).toBe('/');
  expect(routeOf('/')).toBe('/');
});
