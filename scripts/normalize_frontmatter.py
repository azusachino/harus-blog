#!/usr/bin/env python3
"""One-shot: normalize post/page frontmatter to a universal key order.

Canonical order: title, date, description, categories, tags, slug, comments.
- Reorders existing keys in place (values kept byte-identical).
- Injects missing keys for flat pages (reviews/life) from sourced values.
- Leaves nav landing pages (index/about/cv) untouched.

Run from repo root:  uv run python scripts/normalize_frontmatter.py
"""

from __future__ import annotations

import sys
from pathlib import Path

ORDER = ["title", "date", "description", "categories", "tags", "slug", "comments"]

# Flat pages: fields to inject when missing. date/categories/slug are sourced
# (see commit message); description only where genuinely absent.
FLAT_INJECT: dict[str, dict[str, str]] = {
    # reviews -> period-end date, [Review]
    "docs/reviews/review-2021.md": {"date": "2021-12-31", "categories": "Review"},
    "docs/reviews/review-2022-mid.md": {"date": "2022-06-30", "categories": "Review"},
    "docs/reviews/review-2022.md": {"date": "2022-12-31", "categories": "Review"},
    "docs/reviews/review-2023.md": {"date": "2023-12-31", "categories": "Review"},
    "docs/reviews/review-2024.md": {"date": "2024-12-31", "categories": "Review"},
    "docs/reviews/review-2025.md": {"date": "2025-12-31", "categories": "Review"},
    "docs/reviews/review-2026.md": {
        "date": "2026-01-05",
        "categories": "Review",
        "description": "回顾 2026（进行中）",  # placeholder — personalize
    },
    # life/book pages -> git creation date, [Life]
    "docs/life/amusing-ourselves-to-death.md": {"date": "2024-04-08", "categories": "Life"},
    "docs/life/goodbye-sif.md": {"date": "2024-04-08", "categories": "Life"},
    "docs/life/gun-germ-steel.md": {"date": "2024-04-08", "categories": "Life"},
    "docs/life/how-to-read-a-book.md": {"date": "2024-04-08", "categories": "Life"},
    "docs/life/plato-and-platypus.md": {"date": "2024-04-08", "categories": "Life"},
    "docs/life/miku-symphony-2025.md": {"date": "2025-10-05", "categories": "Life"},
    "docs/life/the-limitation-of-stoicism.md": {"date": "2025-12-01", "categories": "Life"},
    "docs/life/yorushika-live-2025-09-30.md": {"date": "2025-10-05", "categories": "Life"},
}


def split_frontmatter(text: str) -> tuple[list[str], str] | None:
    """Return (frontmatter_lines, body) or None if no frontmatter."""
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return lines[1:i], "\n".join(lines[i + 1 :])
    return None


def parse_blocks(fm_lines: list[str]) -> list[tuple[str, list[str]]]:
    """Group frontmatter into (key, [lines]) blocks; continuation lines
    (indented or list items) attach to the preceding key."""
    blocks: list[tuple[str, list[str]]] = []
    for line in fm_lines:
        is_top_key = bool(line) and line[0] not in (" ", "\t", "-") and ":" in line
        if is_top_key:
            key = line.split(":", 1)[0].strip()
            blocks.append((key, [line]))
        elif blocks:
            blocks[-1][1].append(line)
        else:
            blocks.append(("", [line]))  # stray leading line, keep
    return blocks


def render_injection(key: str, slug: str, inject: dict[str, str]) -> list[str]:
    if key == "slug":
        return [f"slug: {slug}"]
    if key == "categories":
        return ["categories:", f"- {inject['categories']}"]
    return [f"{key}: {inject[key]}"]


def normalize(path: Path, repo_root: Path) -> bool:
    rel = path.relative_to(repo_root).as_posix()
    text = path.read_text(encoding="utf-8")
    split = split_frontmatter(text)
    if split is None:
        return False
    fm_lines, body = split
    blocks = parse_blocks(fm_lines)
    present = {k: lines for k, lines in blocks if k}
    extras = [(k, lines) for k, lines in blocks if not k]

    inject = FLAT_INJECT.get(rel, {})
    slug = path.stem

    out: list[str] = []
    for key in ORDER:
        if key in present:
            out.extend(present[key])
        elif key == "slug" and rel in FLAT_INJECT:
            out.extend(render_injection("slug", slug, inject))
        elif key in inject:
            out.extend(render_injection(key, slug, inject))
    # preserve any keys not in canonical order (e.g. unforeseen), then strays
    for key, lines in present.items():
        if key not in ORDER:
            out.extend(lines)
    for _, lines in extras:
        out.extend(lines)

    new_fm = "\n".join(out)
    new_text = f"---\n{new_fm}\n---\n{body}"
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    targets: list[Path] = []
    for d in ["docs/journal/posts", "docs/tech/posts", "docs/tech/series"]:
        targets += sorted((repo_root / d).rglob("*.md"))
    for d in ["docs/reviews", "docs/life"]:
        targets += [p for p in sorted((repo_root / d).glob("*.md")) if p.name != "index.md"]

    changed = 0
    for p in targets:
        if normalize(p, repo_root):
            changed += 1
    print(f"normalized {changed}/{len(targets)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
