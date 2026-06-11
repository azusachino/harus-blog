#!/usr/bin/env python3
"""One-shot migration: Hugo (theme-stack) content -> MkDocs Material blog layout.

Idempotent: wipes and rebuilds the generated docs trees on each run. Hand-authored
files (docs/index.md, docs/assets/extra.css) live outside the generated trees and
are left untouched.

Run: `uv run python scripts/migrate.py` (or `mise run migrate`).
"""

from __future__ import annotations

import re
import shutil
from datetime import date, datetime
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SRC_POSTS = ROOT / "content" / "post"
SRC_PAGE = ROOT / "content" / "page"
SRC_STATIC = ROOT / "static"
DOCS = ROOT / "docs"

# Blog instances (tabs). Series is a non-blog subsection of the Tech tab.
TABS = ("tech", "journal", "reviews", "life")

CATEGORY_MAP = {
    "learning": "Learning",
    "exp": "Exp",
    "practice": "Practice",
    "java": "Java",
    "db": "DB",
    "middleware": "Middleware",
    "chatgpt": "AI",
    "ai": "AI",
    "week-report": "Weekly",
    "month-refresh": "Refresh",
    "review": "Review",
    "conclusion": "Conclusion",
    "concluion": "Conclusion",  # fix source typo
    "book": "Book",
    "life": "Life",
    "concerning": "Concerning",
    "thought": "Thought",
    "philosophy": "Philosophy",
}

# Which tab a (normalized) category belongs to, when path gives no hint.
CATEGORY_TAB = {
    "Weekly": "journal",
    "Refresh": "journal",
    "Review": "reviews",
    "Book": "life",
    "Life": "life",
    "Concerning": "life",
    "Thought": "life",
    "Philosophy": "life",
}

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", re.DOTALL)


def split_frontmatter(text: str) -> tuple[dict, str]:
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    data = yaml.safe_load(m.group(1)) or {}
    return data, m.group(2)


def norm_categories(raw) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        raw = [raw]
    out = []
    for c in raw:
        if c is None:
            continue
        out.append(CATEGORY_MAP.get(str(c).strip().lower(), str(c).strip()))
    # de-dup, keep order
    seen, res = set(), []
    for c in out:
        if c not in seen:
            seen.add(c)
            res.append(c)
    return res


def classify(path: Path, cats: list[str]) -> tuple[str, str | None]:
    """Return (tab, series_name|None)."""
    parts = path.parts
    if "series" in parts:
        return "tech", path.parent.name
    if "report" in parts or "refresh" in parts:
        return "journal", None
    stem = path.stem.lower()
    if stem.startswith("review-") or "reflection" in stem:
        return "reviews", None
    if "年终总结" in path.stem or "年中总结" in path.stem:  # yearly/mid-year review
        return "reviews", None
    for c in cats:
        if c in CATEGORY_TAB:
            return CATEGORY_TAB[c], None
    return "tech", None


def infer_date(fm: dict, path: Path) -> date:
    d = fm.get("date") or fm.get("created") or fm.get("modified")
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    if isinstance(d, str):
        try:
            return datetime.fromisoformat(d.split()[0]).date()
        except ValueError:
            pass
    # fall back to year from path, month from NN filename if any
    year = next((int(s) for s in path.parts if s.isdigit() and len(s) == 4), 2021)
    m = re.match(r"(\d{4})-(\d{2})", path.stem) or re.match(r"(\d{2})$", path.stem)
    month = 1
    if m and len(m.groups()) == 2:
        month = int(m.group(2))
    return date(year, month, 1)


IMG_RE = re.compile(r"(\]\()(/?)(images/|book/)")


def rewrite_body(body: str) -> str:
    # ](images/..  ](/images/..  ](book/..  ](/book/..  ->  ](/assets/images|book/..
    return IMG_RE.sub(r"\1/assets/\3", body)


def lead_image(fm: dict) -> str:
    """Markdown for the Hugo `image:` cover, or '' if absent/missing on disk."""
    img = fm.get("image")
    if not img:
        return ""
    rel = str(img).strip().lstrip("/")
    if not (SRC_STATIC / rel).is_file():
        return ""  # broken cover reference — skip silently
    return f"![](/assets/{rel}){{ .post-cover }}"


def dump_frontmatter(fm: dict) -> str:
    return yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)


def write_post(out_path: Path, fm: dict, body: str) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(f"---\n{dump_frontmatter(fm)}---\n\n{body.lstrip()}", encoding="utf-8")


def unique_stem(rel: Path, fm: dict, used: set[str]) -> str:
    """Collision-free output stem. Prefer the Hugo slug (unique, url-clean);
    fall back to the source stem, disambiguated by year then a counter."""
    slug = fm.get("slug")
    base = str(slug).strip("/").replace("/", "-") if slug else rel.stem
    stem = base
    if stem in used:
        year = next((s for s in rel.parts if s.isdigit() and len(s) == 4), "")
        stem = f"{year}-{base}" if year else base
        n = 1
        while stem in used:
            n += 1
            stem = f"{base}-{n}"
    used.add(stem)
    return stem


# Tabs rendered as flat nav-page sidebars (like Series) instead of blog indexes.
FLAT_TABS = {"reviews", "life"}


def migrate_posts() -> tuple[dict[str, int], dict[str, list]]:
    counts = {t: 0 for t in TABS}
    counts["series"] = 0
    used: dict[str, set[str]] = {t: set() for t in TABS}
    # for flat tabs: collect (date, stem, title) to emit reverse-chron nav
    flat: dict[str, list] = {t: [] for t in FLAT_TABS}
    for md in SRC_POSTS.rglob("*.md"):
        if md.name == "_index.md":
            continue
        fm, body = split_frontmatter(md.read_text(encoding="utf-8"))
        cats = norm_categories(fm.get("categories"))
        tab, series = classify(md.relative_to(SRC_POSTS), cats)
        body = rewrite_body(body)

        cover = lead_image(fm)

        if series:
            # ordered tutorial page (NOT a blog post) — keep NN. filename for order
            out = DOCS / "tech" / "series" / series / md.name
            new_fm = {"title": fm.get("title", md.stem)}
            if fm.get("description"):
                new_fm["description"] = fm["description"]
            page_body = f"{cover}\n\n{body}" if cover else body
            write_post(out, new_fm, page_body)
            counts["series"] += 1
            continue

        rel = md.relative_to(SRC_POSTS)
        post_date = infer_date(fm, rel)
        title = fm.get("title") or md.stem
        stem = unique_stem(rel, fm, used[tab])

        if tab in FLAT_TABS:
            # plain nav page (sidebar lists every file, like Series)
            page_fm: dict = {"title": title}
            if fm.get("description"):
                page_fm["description"] = fm["description"]
            page_fm["comments"] = True
            page_body = f"{cover}\n\n{body}" if cover else body
            write_post(DOCS / tab / f"{stem}.md", page_fm, page_body)
            flat[tab].append((post_date, stem, title))
            counts[tab] += 1
            continue

        new_fm: dict = {"title": title, "date": post_date}
        if fm.get("description"):
            new_fm["description"] = fm["description"]
        if cats:
            new_fm["categories"] = cats
        if fm.get("tags"):
            new_fm["tags"] = fm["tags"]
        if fm.get("slug"):
            new_fm["slug"] = str(fm["slug"]).strip("/").replace("/", "-")
        new_fm["comments"] = True

        # cover before <!-- more --> so it also shows on the blog index cards
        post_body = f"{cover}\n\n<!-- more -->\n\n{body}" if cover else body
        write_post(DOCS / tab / "posts" / f"{stem}.md", new_fm, post_body)
        counts[tab] += 1
    return counts, flat


def migrate_pages() -> None:
    for name in ("about", "cv"):
        src = SRC_PAGE / f"{name}.md"
        if not src.exists():
            continue
        fm, body = split_frontmatter(src.read_text(encoding="utf-8"))
        new_fm = {"title": fm.get("title", name.title())}
        if fm.get("description"):
            new_fm["description"] = fm["description"]
        write_post(DOCS / f"{name}.md", new_fm, rewrite_body(body))


def write_indexes() -> None:
    intros = {
        "tech": ("Tech", "技术笔记与系列 — notes, experiments, and deep dives."),
        "journal": ("Journal", "周报与月度刷新 — weekly reports and monthly refreshes."),
        "reviews": ("Reviews", "年度回顾 — yearly reflections."),
        "life": ("Life", "生活、阅读与随想 — life, books, and thoughts."),
    }
    for tab, (title, intro) in intros.items():
        idx = DOCS / tab / "index.md"
        idx.parent.mkdir(parents=True, exist_ok=True)
        idx.write_text(f"---\ntitle: {title}\n---\n\n# {title}\n\n{intro}\n", encoding="utf-8")


def copy_assets() -> None:
    dst_img = DOCS / "assets" / "images"
    dst_book = DOCS / "assets" / "book"
    if (SRC_STATIC / "images").exists():
        shutil.copytree(SRC_STATIC / "images", dst_img, dirs_exist_ok=True)
    if (SRC_STATIC / "book").exists():
        shutil.copytree(SRC_STATIC / "book", dst_book, dirs_exist_ok=True)


def clean() -> None:
    for tab in TABS:
        shutil.rmtree(DOCS / tab, ignore_errors=True)
    shutil.rmtree(DOCS / "assets" / "images", ignore_errors=True)
    shutil.rmtree(DOCS / "assets" / "book", ignore_errors=True)


def print_flat_nav(flat: dict[str, list]) -> None:
    """Emit reverse-chronological nav YAML for the flat tabs, to paste into mkdocs.yml."""
    print("\n--- nav snippet for flat tabs (paste into mkdocs.yml) ---")
    for tab, items in flat.items():
        print(f"  - {tab.capitalize()}:")
        print(f"      - {tab}/index.md")
        for _date, stem, title in sorted(items, key=lambda x: x[0], reverse=True):
            print(f"      - {title}: {tab}/{stem}.md")


def main() -> None:
    clean()
    copy_assets()
    counts, flat = migrate_posts()
    migrate_pages()
    write_indexes()
    total = sum(v for k, v in counts.items())
    print("migrated:")
    for k, v in counts.items():
        print(f"  {k:8} {v}")
    print(f"  {'TOTAL':8} {total}")
    print_flat_nav(flat)


if __name__ == "__main__":
    main()
