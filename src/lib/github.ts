// Build-time GitHub data for /now. Public endpoints only; GITHUB_TOKEN, when
// set in the build environment, only raises the rate limit and never reaches
// the browser. Any failure returns null so the build still passes.
const USER = 'azusachino';
const API = 'https://api.github.com';

export interface Activity {
  // count is null for days older than the oldest event the API returned.
  days: { date: string; count: number | null }[];
  repos: { name: string; url: string; description: string | null; language: string | null; pushed: string }[];
  merged: { repo: string; number: number; url: string; date: string }[];
  fetched: string;
}

async function get<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`GitHub ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

interface Event {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: { action?: string; number?: number };
}

interface Repo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  pushed_at: string;
  fork: boolean;
}

let cached: Promise<Activity | null> | undefined;

export function githubActivity(days = 30): Promise<Activity | null> {
  cached ??= load(days).catch((err) => {
    console.warn(`[now] GitHub unavailable: ${err.message}`);
    return null;
  });
  return cached;
}

async function load(span: number): Promise<Activity> {
  const [events, repos] = await Promise.all([
    // The events API returns at most 300 events (3 pages) from the last 90 days.
    Promise.all([1, 2, 3].map((page) => get<Event[]>(`/users/${USER}/events/public?per_page=100&page=${page}`))).then((p) => p.flat()),
    get<Repo[]>(`/users/${USER}/repos?sort=pushed&per_page=12`),
  ]);

  const counts = new Map<string, number>();
  for (const e of events) counts.set(e.created_at.slice(0, 10), (counts.get(e.created_at.slice(0, 10)) ?? 0) + 1);
  const oldest = events.reduce((min, e) => (e.created_at < min ? e.created_at : min), '9999').slice(0, 10);
  const today = new Date();
  // Cover only the days the API reaches (between a week and `span` days);
  // a busy week can use up all 300 events.
  const reach = Math.round((today.getTime() - Date.parse(oldest)) / 86_400_000) + 1;
  const length = Math.min(span, Math.max(7, reach));
  const dayList = Array.from({ length }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (length - 1 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, count: date < oldest ? null : (counts.get(date) ?? 0) };
  });

  return {
    days: dayList,
    repos: repos
      .filter((r) => !r.fork)
      .slice(0, 6)
      .map((r) => ({ name: r.name, url: r.html_url, description: r.description, language: r.language, pushed: r.pushed_at })),
    merged: events
      .filter((e) => e.type === 'PullRequestEvent' && e.payload.action === 'merged' && e.payload.number)
      .slice(0, 5)
      .map((e) => ({
        repo: e.repo.name,
        number: e.payload.number!,
        url: `https://github.com/${e.repo.name}/pull/${e.payload.number}`,
        date: e.created_at.slice(0, 10),
      })),
    fetched: today.toISOString(),
  };
}
