import type { PagefindInstance, PagefindResultData } from '../types/pagefind';

const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<{ default?: PagefindInstance } | PagefindInstance>;

let pagefindPromise: Promise<PagefindInstance | null> | null = null;

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

export function cleanUrl(url: string): string {
  const cleaned = url.replace(/\.html$/, '').replace(/\/index$/, '');
  return cleaned.endsWith('/') ? cleaned : `${cleaned}/`;
}

export interface SearchControllerOptions {
  dialog: HTMLDialogElement;
  input: HTMLInputElement;
  status: HTMLElement;
  resultsList: HTMLElement;
  closeBtn?: HTMLElement | null;
}

export function setupSearchController(options: SearchControllerOptions): () => void {
  const { dialog, input, status, resultsList, closeBtn } = options;

  let selectedIndex = -1;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  function updateSelected(items: NodeListOf<HTMLAnchorElement>) {
    items.forEach((item, idx) => {
      const parent = item.parentElement;
      if (idx === selectedIndex) {
        parent?.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        parent?.classList.remove('selected');
      }
    });
  }

  function renderResults(results: PagefindResultData[], query: string) {
    resultsList.innerHTML = '';
    selectedIndex = -1;

    if (results.length === 0) return;

    results.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'search-item';
      li.setAttribute('role', 'option');

      const a = document.createElement('a');
      a.href = cleanUrl(item.url);
      a.className = 'search-link';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'search-title';
      titleSpan.textContent = item.meta?.title || item.url;

      const excerptP = document.createElement('p');
      excerptP.className = 'search-excerpt';
      excerptP.innerHTML = item.excerpt;

      a.appendChild(titleSpan);
      a.appendChild(excerptP);
      li.appendChild(a);

      li.addEventListener('mouseenter', () => {
        selectedIndex = index;
        const items = resultsList.querySelectorAll<HTMLAnchorElement>('.search-item a');
        updateSelected(items);
      });

      resultsList.appendChild(li);
    });
  }

  async function executeSearch(query: string) {
    const pf = await loadPagefind();
    if (!pf) {
      status.textContent = 'Search index ready after static build (run `bun run build`).';
      renderResults([], query);
      return;
    }

    try {
      const search = await pf.search(query);
      const count = search.results.length;
      if (count === 0) {
        status.textContent = `No results found for "${query}"`;
        renderResults([], query);
        return;
      }

      status.textContent = `Found ${count} result${count > 1 ? 's' : ''}`;
      const topResults = await Promise.all(search.results.slice(0, 8).map((r) => r.data()));
      renderResults(topResults, query);
    } catch (err) {
      console.error('Search query failed:', err);
      status.textContent = 'Search encountered an error.';
    }
  }

  function openModal() {
    if (!dialog.open) {
      dialog.showModal();
      input.focus();
      loadPagefind();
    }
  }

  function closeModal() {
    if (dialog.open) {
      dialog.close();
      input.value = '';
      renderResults([], '');
      status.textContent = 'Type to start searching...';
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

      const items = resultsList.querySelectorAll<HTMLAnchorElement>('.search-item a');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelected(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelected(items);
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < items.length) {
        e.preventDefault();
        items[selectedIndex].click();
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
    const query = input.value.trim();
    if (!query) {
      status.textContent = 'Type to start searching...';
      renderResults([], '');
      return;
    }

    status.textContent = 'Searching...';
    debounceTimer = setTimeout(() => executeSearch(query), 120);
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
