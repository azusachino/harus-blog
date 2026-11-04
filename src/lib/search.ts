import type { FullTextHit, PagefindInstance, SwitcherNote } from '../types/pagefind';
import { excerptParts, routeOf } from './fulltext';
import { matchDocuments, withoutShown } from './switcher';

const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<{ default?: PagefindInstance } | PagefindInstance>;

let pagefindPromise: Promise<PagefindInstance | null> | null = null;
let documentsPromise: Promise<SwitcherNote[]> | null = null;

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
    } catch {
      // In local dev without pagefind build, gracefully fallback to document catalog
      return null;
    }
  })();

  return pagefindPromise;
}

export async function loadDocuments(): Promise<SwitcherNote[]> {
  if (documentsPromise) return documentsPromise;

  documentsPromise = (async () => {
    try {
      const res = await fetch('/search-index.json');
      if (!res.ok) return [];
      return (await res.json()) as SwitcherNote[];
    } catch {
      return [];
    }
  })();

  return documentsPromise;
}

export async function searchFullText(term: string, limit = 10): Promise<FullTextHit[]> {
  const pf = await loadPagefind();
  if (!pf) return [];

  try {
    const { results } = await pf.search(term);
    const pages = await Promise.all(results.slice(0, limit).map((r) => r.data()));
    return pages.map((page) => ({
      url: routeOf(page.url),
      title: page.meta?.title || routeOf(page.url),
      excerpt: page.excerpt,
    }));
  } catch (err) {
    console.error('Pagefind search failed:', err);
    return [];
  }
}

function createFileTextIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', 'item-icon');
  svg.setAttribute('aria-hidden', 'true');

  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z');
  const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p2.setAttribute('d', 'M14 2v4a2 2 0 0 0 2 2h4');
  const p3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p3.setAttribute('d', 'M10 9H8');
  const p4 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p4.setAttribute('d', 'M16 13H8');
  const p5 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p5.setAttribute('d', 'M16 17H8');

  svg.appendChild(p1);
  svg.appendChild(p2);
  svg.appendChild(p3);
  svg.appendChild(p4);
  svg.appendChild(p5);
  return svg;
}

function createArrowIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', 'item-arrow');
  svg.setAttribute('aria-hidden', 'true');

  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', 'M7 7h10v10');
  const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p2.setAttribute('d', 'M7 17 17 7');

  svg.appendChild(p1);
  svg.appendChild(p2);
  return svg;
}

export interface SearchControllerOptions {
  dialog: HTMLDialogElement;
  input: HTMLInputElement;
  listContainer: HTMLElement;
  statusElement: HTMLElement;
  resultsContent: HTMLElement;
  closeBtn?: HTMLElement | null;
}

export function setupSearchController(options: SearchControllerOptions): () => void {
  const { dialog, input, listContainer, statusElement, resultsContent, closeBtn } = options;

  let selectedIndex = -1;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let allDocuments: SwitcherNote[] = [];

  function getNavigableItems(): NodeListOf<HTMLAnchorElement> {
    return resultsContent.querySelectorAll<HTMLAnchorElement>('.switcher-link');
  }

  function updateSelected(items: NodeListOf<HTMLAnchorElement>) {
    items.forEach((item, idx) => {
      const parent = item.closest('.switcher-item');
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

  function render(documents: SwitcherNote[], textHits: FullTextHit[], query: string, searching = false) {
    resultsContent.innerHTML = '';
    selectedIndex = -1;

    const hasDocs = documents.length > 0;
    const hasFull = textHits.length > 0;

    if (!hasDocs && !hasFull) {
      if (searching) {
        statusElement.style.display = 'block';
        statusElement.textContent = 'Searching full text…';
      } else {
        statusElement.style.display = 'block';
        statusElement.innerHTML = `
          <div class="switcher-empty">
            No matching documents or full text. Try a title, tag or phrase.
          </div>
        `;
      }
      return;
    }

    statusElement.style.display = 'none';

    const frag = document.createDocumentFragment();

    // Group 1: Documents
    if (hasDocs) {
      const group = document.createElement('div');
      group.className = 'switcher-group';

      const heading = document.createElement('div');
      heading.className = 'switcher-group-heading mono';
      heading.textContent = 'Documents';
      group.appendChild(heading);

      const ul = document.createElement('ul');
      ul.className = 'switcher-group-list';
      ul.setAttribute('role', 'group');

      documents.forEach((doc) => {
        const li = document.createElement('li');
        li.className = 'switcher-item';
        li.setAttribute('role', 'option');

        const a = document.createElement('a');
        a.href = doc.url;
        a.className = 'switcher-link';

        a.appendChild(createFileTextIcon());

        const docWrapper = document.createElement('span');
        docWrapper.className = 'switcher-document';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'switcher-title';
        titleSpan.textContent = doc.title;
        docWrapper.appendChild(titleSpan);

        const pathSmall = document.createElement('small');
        pathSmall.className = 'switcher-path mono';
        pathSmall.textContent = doc.url;
        docWrapper.appendChild(pathSmall);

        a.appendChild(docWrapper);
        a.appendChild(createArrowIcon());

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

    // Group 2: Full text
    if (hasFull) {
      const group = document.createElement('div');
      group.className = 'switcher-group';

      const heading = document.createElement('div');
      heading.className = 'switcher-group-heading mono';
      heading.textContent = 'Full text';
      group.appendChild(heading);

      const ul = document.createElement('ul');
      ul.className = 'switcher-group-list';
      ul.setAttribute('role', 'group');

      textHits.forEach((hit) => {
        const li = document.createElement('li');
        li.className = 'switcher-item';
        li.setAttribute('role', 'option');

        const a = document.createElement('a');
        a.href = hit.url;
        a.className = 'switcher-link';

        a.appendChild(createFileTextIcon());

        const docWrapper = document.createElement('span');
        docWrapper.className = 'switcher-document';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'switcher-title';
        titleSpan.textContent = hit.title;
        docWrapper.appendChild(titleSpan);

        const excerptSpan = document.createElement('span');
        excerptSpan.className = 'switcher-excerpt';

        const parts = excerptParts(hit.excerpt);
        parts.forEach((part) => {
          if (part.mark) {
            const markEl = document.createElement('mark');
            markEl.textContent = part.text;
            excerptSpan.appendChild(markEl);
          } else {
            excerptSpan.appendChild(document.createTextNode(part.text));
          }
        });

        docWrapper.appendChild(excerptSpan);
        a.appendChild(docWrapper);
        a.appendChild(createArrowIcon());

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

    resultsContent.appendChild(frag);

    const all = getNavigableItems();
    if (all.length > 0) {
      selectedIndex = 0;
      updateSelected(all);
    }
  }

  async function executeSearch(query: string) {
    const term = query.trim();
    const documents = matchDocuments(allDocuments, term);
    const shownUrls = new Set(documents.map((d) => d.url));

    if (!term) {
      render(documents, [], '');
      return;
    }

    render(documents, [], term, true);

    const fullHits = await searchFullText(term);
    const textHits = withoutShown(fullHits, shownUrls);

    render(documents, textHits, term, false);
  }

  async function openModal() {
    if (!dialog.open) {
      dialog.showModal();
      input.focus();

      if (allDocuments.length === 0) {
        statusElement.style.display = 'block';
        statusElement.textContent = 'Loading documents…';
        const [docs] = await Promise.all([loadDocuments(), loadPagefind()]);
        allDocuments = docs;
      }

      const initialQuery = input.value.trim();
      if (!initialQuery) {
        render(matchDocuments(allDocuments, ''), [], '');
      } else {
        executeSearch(initialQuery);
      }
    }
  }

  function closeModal() {
    if (dialog.open) {
      dialog.close();
      input.value = '';
      selectedIndex = -1;
      resultsContent.innerHTML = '';
      statusElement.style.display = 'none';
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      e.stopPropagation();
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
