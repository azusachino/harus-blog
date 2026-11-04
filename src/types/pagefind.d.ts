export interface DocumentItem {
  title: string;
  url: string;
  section: string;
  date?: string;
  tags?: string[];
  desc?: string;
}

export interface PagefindSearchResult {
  id: string;
  score: number;
  words: number[];
  data: () => Promise<PagefindResultData>;
}

export interface PagefindResultData {
  url: string;
  content: string;
  excerpt: string;
  meta: {
    title?: string;
    image?: string;
    [key: string]: string | undefined;
  };
  anchors?: Array<{
    element: string;
    id: string;
    text: string;
    location: number;
  }>;
  sub_results?: Array<{
    title: string;
    url: string;
    excerpt: string;
  }>;
}

export interface PagefindSearchOptions {
  verbose?: boolean;
  filters?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
}

export interface PagefindInstance {
  init: () => Promise<void>;
  destroy?: () => Promise<void>;
  search: (query: string, options?: PagefindSearchOptions) => Promise<{ results: PagefindSearchResult[] }>;
  preload: (term: string) => Promise<void>;
  filters: () => Promise<Record<string, Record<string, number>>>;
}

declare module '/pagefind/pagefind.js' {
  const pagefind: PagefindInstance;
  export default pagefind;
}
