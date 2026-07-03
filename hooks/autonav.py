"""MkDocs hook: auto-generate nav lists that would otherwise be hand-maintained.

Sections rebuilt on every build:

- **Flat sections** (`FLAT_SECTIONS`) — standalone pages ordered *newest-first by
  frontmatter `date`*, with `index.md` pinned to the top. Currently empty — Tech,
  Journal, and Life are blog-plugin instances whose post lists the blog plugin manages.
- **Series** (tech/series/<name>/NN.*.md) — ordered tutorials grouped by
  subdirectory and sorted *ascending by the numeric filename prefix*.

To add a series tutorial: drop a properly-front-mattered `.md` in the right
directory — no `mkdocs.yml` edit needed. Series groups are listed alphabetically
by directory name.
"""

from __future__ import annotations

import glob
import os

import yaml

# nav section title -> docs subdirectory (flat, date-desc)
FLAT_SECTIONS: dict[str, str] = {}

# nav section title -> docs subdirectory (grouped tutorials, filename-asc)
SERIES_TITLE = "Series"
SERIES_SUBDIR = "tech/series"


def _read_frontmatter(path: str) -> dict:
    """Return the YAML frontmatter of a markdown file as a dict (empty if none)."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if not text.startswith("---"):
        return {}
    # frontmatter is between the first two '---' fences
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}
    try:
        data = yaml.safe_load(parts[1])
    except yaml.YAMLError:
        return {}
    return data or {}


def _build_flat_children(docs_dir: str, subdir: str) -> list:
    """Build the nav children for one flat section, newest-first by frontmatter date."""
    section_dir = os.path.join(docs_dir, subdir)
    entries = []
    index_path = None

    for path in glob.glob(os.path.join(section_dir, "*.md")):
        rel = os.path.relpath(path, docs_dir).replace(os.sep, "/")
        if os.path.basename(path) == "index.md":
            index_path = rel
            continue
        fm = _read_frontmatter(path)
        title = fm.get("title") or os.path.splitext(os.path.basename(path))[0]
        date = str(fm.get("date", ""))  # ISO dates sort lexically; path breaks ties
        entries.append((date, rel, {title: rel}))

    # newest date first; stable, deterministic tiebreak on the file path
    entries.sort(key=lambda e: (e[0], e[1]), reverse=True)

    children = []
    if index_path:
        children.append(index_path)
    children.extend(item for _date, _rel, item in entries)
    return children


def _build_series(docs_dir: str) -> list:
    """Build the Series subtree: one group per subdir, pages in filename order."""
    base = os.path.join(docs_dir, SERIES_SUBDIR)
    groups = []
    for name in sorted(os.listdir(base)):
        group_dir = os.path.join(base, name)
        if not os.path.isdir(group_dir):
            continue
        # NN.* prefixes are zero-padded, so a plain path sort is numeric order
        posts = sorted(glob.glob(os.path.join(group_dir, "*.md")))
        rels = [os.path.relpath(p, docs_dir).replace(os.sep, "/") for p in posts]
        if rels:
            groups.append({name: rels})
    return groups


def _rewrite(nav: list, docs_dir: str) -> None:
    """Recursively replace the children of every managed section in-place."""
    for item in nav:
        if not isinstance(item, dict):
            continue
        for key, val in list(item.items()):
            if key in FLAT_SECTIONS:
                item[key] = _build_flat_children(docs_dir, FLAT_SECTIONS[key])
            elif key == SERIES_TITLE:
                item[key] = _build_series(docs_dir)
            elif isinstance(val, list):
                _rewrite(val, docs_dir)


def on_config(config, **_kwargs):
    nav = config.get("nav")
    if nav:
        _rewrite(nav, config["docs_dir"])
    return config
