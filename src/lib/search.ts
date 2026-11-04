import type { DocumentItem, PagefindInstance, PagefindResultData } from '../types/pagefind';

const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<{ default?: PagefindInstance } | PagefindInstance>;

let pagefindPromise: Promise<PagefindInstance | null> | null = null;
let documentsPromise: Promise<DocumentItem[]> | null = null;

export async function loadPagefind(): Promise<PagefindInstance | null> {
  if (pagefindPromise) return pagefindPromise;

  pagefindPromise = (async () => {
    try {
      const module = await dynamicImport('/pagefind/pagefind.js');
      const instance = (module as any).default ?? module;
      if (typeof instance.init === 'function') {
        await instance.init();
      }
      return instance as PagefindInstance;
    } catch (err) {
      console.warn('Pagefind index not found (available after build or in static preview):', err);
      return null;
    }
  })();

  return pagefindPromise;
}

export async function loadDocuments(): Promise<DocumentItem[]> {
  if (documentsPromise) return documentsPromise;

  documentsPromise = (async () => {
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) return [];
      return (await res.json()) as DocumentItem[];
    } catch {
      return [];
    }
  })();

  return documentsPromise;
}

export function cleanUrl(url: string): string {
  const cleaned = url.replace(/\.html$/, '').replace(/\/index$/, '');
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

function matchDocuments(docs: DocumentItem[], query: string): DocumentItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return docs.slice(0, 5);

  const scored: Array<{ doc: DocumentItem; score: number }> = [];

  for (const doc of docs) {
    const titleLower = doc.title.toLowerCase();
    const tagsLower = (doc.tags ?? []).join(' ').toLowerCase();
    const descLower = (doc.desc ?? '').toLowerCase();

    let score = 0;
    let allMatched = true;

    for (const term of terms) {
      if (titleLower.includes(term)) {
        score += titleLower.startsWith(term) ? 10 : 5;
      } else if (tagsLower.includes(term)) {
        score += 3;
      } else if (descLower.includes(term)) {
        score += 1;
      } else {
        allMatched = false;
        break;
      }
    }

    if (allMatched && score > 0) {
      scored.push({ doc, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 6).map((s) => s.doc);
}

export interface SearchControllerOptions {
  dialog: HTMLDialogElement;
  input: HTMLInputElement;
  resultsList: HTMLElement;
  emptyState: HTMLElement;
  closeBtn?: HTMLElement | null;
}

export function setupSearchController(options: SearchControllerOptions): () => void {
  const { dialog, input, resultsList, emptyState, closeBtn } = options;

  let selectedIndex = -1;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let allDocuments: DocumentItem[] = [];

  function updateSelected(items: NodeListOf<HTMLAnchorElement>) {
    items.forEach((item, idx) => {
      const parent = item.parentElement;
      if (idx === selectedIndex) {
        parent?.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        parent?.classList.remove('selected');
        item.removeAttribute('aria-selected');
      }
    });
  }

  function getNavigableItems(): NodeListOf<HTMLAnchorElement> {
    return resultsList.querySelectorAll<HTMLAnchorElement>('.search-item a');
  }

  function render(docMatches: DocumentItem[], fullTextHits: PagefindResultData[], query: string) {
    resultsList.innerHTML = '';
    selectedIndex = -1;

    const hasDocs = docMatches.length > 0;
    const hasFull = fullTextHits.length > 0;

    if (!hasDocs && !hasFull) {
      emptyState.style.display = 'flex';
      resultsList.style.display = 'none';
      const emptyText = emptyState.querySelector('.search-empty-text');
      if (emptyText) {
        emptyText.textContent = query
          ? `No matching articles or notes for "${query}"`
          : 'Type a query to search articles, series, notes, and full text';
      }
      return;
    }

    emptyState.style.display = 'none';
    resultsList.style.display = 'block';

    const frag = document.createDocumentFragment();

    // 1. Articles group (Instant title & metadata matches)
    if (hasDocs) {
      const group = document.createElement('div');
      group.className = 'search-group';

      const heading = document.createElement('div');
      heading.className = 'search-group-header mono';
      heading.textContent = query ? 'Articles' : 'Suggested';
      group.appendChild(heading);

      const ul = document.createElement('ul');
      ul.className = 'search-group-list';
      ul.setAttribute('role', 'group');

      docMatches.forEach((doc) => {
        const li = document.createElement('li');
        li.className = 'search-item';
        li.setAttribute('role', 'option');

        const a = document.createElement('a');
        a.href = doc.url;
        a.className = 'search-link';

        const main = document.createElement('div');
        main.className = 'search-item-main';

        const titleRow = document.createElement('div');
        titleRow.className = 'search-title-row';

        const sectionBadge = document.createElement('span');
        sectionBadge.className = `search-badge search-badge-${doc.section} mono`;
        sectionBadge.textContent = doc.section;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'search-title';
        titleSpan.textContent = doc.title;

        titleRow.appendChild(sectionBadge);
        titleRow.appendChild(titleSpan);
        main.appendChild(titleRow);

        if (doc.desc) {
          const descP = document.createElement('p');
          descP.className = 'search-desc';
          descP.textContent = doc.desc;
          main.appendChild(descP);
        }

        const actionHint = document.createElement('span');
        actionHint.className = 'search-action-hint mono';
        actionHint.setAttribute('aria-hidden', 'true');
        actionHint.textContent = '↵';

        a.appendChild(main);
        a.appendChild(actionHint);
        li.appendChild(a);

        li.addEventListener('mouseenter', () => {
          const allItems = getNavigableItems();
          selectedIndex = Array.from(allItems).indexOf(a);
          updateSelected(allItems);
        });

        ul.appendChild(li);
      });

      group.appendChild(ul);
      frag.appendChild(group);
    }

    // 2. Full text group (Pagefind matches)
    if (hasFull) {
      const group = document.createElement('div');
      group.className = 'search-group';

      const heading = document.createElement('div');
      heading.className = 'search-group-header mono';
      heading.textContent = 'Full Text';
      group.appendChild(heading);

      const ul = document.createElement('ul');
      ul.className = 'search-group-list';
      ul.setAttribute('role', 'group');

      fullTextHits.forEach((hit) => {
        const li = document.createElement('li');
        li.className = 'search-item';
        li.setAttribute('role', 'option');

        const a = document.createElement('a');
        a.href = cleanUrl(hit.url);
        a.className = 'search-link';

        const main = document.createElement('div');
        main.className = 'search-item-main';

        const titleRow = document.createElement('div');
        titleRow.className = 'search-title-row';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'search-title';
        titleSpan.textContent = hit.meta?.title || hit.url;

        titleRow.appendChild(titleSpan);
        main.appendChild(titleRow);

        const excerptP = document.createElement('p');
        excerptP.className = 'search-excerpt';
        excerptP.innerHTML = hit.excerpt;
        main.appendChild(excerptP);

        const actionHint = document.createElement('span');
        actionHint.className = 'search-action-hint mono';
        actionHint.setAttribute('aria-hidden', 'true');
        actionHint.textContent = '↵';

        a.appendChild(main);
        a.appendChild(actionHint);
        li.appendChild(a);

        li.addEventListener('mouseenter', () => {
          const allItems = getNavigableItems();
          selectedIndex = Array.from(allItems).indexOf(a);
          updateSelected(allItems);
        });

        ul.appendChild(li);
      });

      group.appendChild(ul);
      frag.appendChild(group);
    }

    resultsList.appendChild(frag);

    // Auto-select the first item
    const all = getNavigableItems();
    if (all.length > 0) {
      selectedIndex = 0;
      updateSelected(all);
    }
  }

  async function executeSearch(query: string) {
    const trimmed = query.trim();
    const docMatches = matchDocuments(allDocuments, trimmed);

    let fullTextHits: PagefindResultData[] = [];

    if (trimmed) {
      const pf = await loadPagefind();
      if (pf) {
        try {
          const search = await pf.search(trimmed);
          const shownUrls = new Set(docMatches.map((d) => cleanUrl(d.url)));

          const candidates = await Promise.all(search.results.slice(0, 10).map((r) => r.data()));
          fullTextHits = candidates
            .filter((hit) => !shownUrls.has(cleanUrl(hit.url)))
            .slice(0, 5);
        } catch (err) {
          console.error('Pagefind search failed:', err);
        }
      }
    }

    render(docMatches, fullTextHits, trimmed);
  }

  async function openModal() {
    if (!dialog.open) {
      dialog.showModal();
      input.focus();

      // Preload data in parallel
      const [docs] = await Promise.all([loadDocuments(), loadPagefind()]);
      allDocuments = docs;

      // Render initial recommendations if input is empty
      if (!input.value.trim()) {
        render(allDocuments.slice(0, 5), [], '');
      } else {
        executeSearch(input.value);
      }
    }
  }

  function closeModal() {
    if (dialog.open) {
      dialog.close();
      input.value = '';
      selectedIndex = -1;
      resultsList.innerHTML = '';
      emptyState.style.display = 'none';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) closeModal();
      else openModal();
      return;
    }

    if (e.key === '/' && !dialog.open) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !target?.isContentEditable) {
        e.preventDefault();
        openModal();
        return;
      }
    }

    if (dialog.open) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      const items = getNavigableItems();
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelected(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelected(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          items[selectedIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        }
      }
    }
  }

  function handleDialogClick(e: MouseEvent) {
    const rect = dialog.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!inDialog) closeModal();
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    const query = input.value;
    debounceTimer = setTimeout(() => executeSearch(query), 100);
  }

  window.addEventListener('keydown', handleKeydown);
  dialog.addEventListener('click', handleDialogClick);
  input.addEventListener('input', handleInput);
  closeBtn?.addEventListener('click', closeModal);

  const triggers = document.querySelectorAll('[data-search-trigger]');
  const triggerHandlers = Array.from(triggers).map((btn) => {
    const handler = () => openModal();
    btn.addEventListener('click', handler);
    return { btn, handler };
  });

  return () => {
    window.removeEventListener('keydown', handleKeydown);
    dialog.removeEventListener('click', handleDialogClick);
    input.removeEventListener('input', handleInput);
    closeBtn?.removeEventListener('click', closeModal);
    triggerHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler));
  };
}
