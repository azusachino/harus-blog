"""MkDocs hook: enforce the universal frontmatter convention at build time.

Every content post/page must carry the same keys in the same order:

    title, date, description, categories, slug, comments

(optional `tags` may sit right after `categories`). This hook fails the strict
build with a clear `path: problem` message when a page drifts — so `make build`
and the pre-commit `make check` catch it instead of a human. It complements
`autonav.py`, which trusts `title`/`date` to be present and well-formed.

Series tutorials (tech/series/<name>/) are ordered by filename, not by date, so
they only need `title` + `description`; any universal keys they *do* carry must
still follow the canonical order. Nav landing pages (index.md, about.md, cv.md)
are exempt entirely.
"""

from __future__ import annotations

import glob
import os

import yaml

# directories whose markdown files are content (must obey the convention)
CONTENT_DIRS = (
    "tech/posts",
    "tech/series",
    "journal",
    "life",
)

# canonical order of the universal frontmatter keys
CANONICAL_ORDER = ["title", "date", "description", "categories", "slug", "comments"]

# series tutorials are filename-ordered nav pages: only these are required
SERIES_REQUIRED = ["title", "description"]

# path prefix (relative to docs_dir) that gets the reduced series ruleset
SERIES_PREFIX = "tech/series/"

# filenames that are nav landing pages, not content
EXEMPT_BASENAMES = {"index.md", "about.md", "cv.md"}


def _split_frontmatter(text: str):
    """Return (raw_yaml, parsed_dict) or (None, None) when there is no frontmatter."""
    if not text.startswith("---"):
        return None, None
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, None
    try:
        data = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as exc:
        raise ValueError(f"invalid YAML frontmatter: {exc}") from exc
    return parts[1], data


def _validate(path: str, required: list[str]) -> list[str]:
    """Return a list of problem strings for one file (empty when valid)."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()

    try:
        _raw, data = _split_frontmatter(text)
    except ValueError as exc:
        return [str(exc)]

    if data is None:
        return ["missing frontmatter"]

    problems = []

    # 1. required keys present
    for key in required:
        if key not in data:
            problems.append(f"missing key '{key}'")

    # 2. any universal keys present must follow the canonical order (ignoring
    #    optional `tags` and any non-universal keys)
    present = [k for k in data.keys() if k in CANONICAL_ORDER]
    expected = [k for k in CANONICAL_ORDER if k in data]
    if present != expected:
        problems.append(
            f"key order {present} should be {expected} "
            f"(run scripts/normalize_frontmatter.py)"
        )

    # 3. comments must be enabled where it is required
    if "comments" in required and data.get("comments") is not True:
        problems.append("'comments' must be true")

    return problems


def on_config(config, **_kwargs):
    docs_dir = config["docs_dir"]
    failures = []

    for subdir in CONTENT_DIRS:
        pattern = os.path.join(docs_dir, subdir, "**", "*.md")
        for path in glob.glob(pattern, recursive=True):
            if os.path.basename(path) in EXEMPT_BASENAMES:
                continue
            rel = os.path.relpath(path, docs_dir).replace(os.sep, "/")
            required = (
                SERIES_REQUIRED if rel.startswith(SERIES_PREFIX) else CANONICAL_ORDER
            )
            for problem in _validate(path, required):
                failures.append(f"{rel}: {problem}")

    if failures:
        joined = "\n  ".join(sorted(failures))
        raise SystemExit(f"frontmatter validation failed:\n  {joined}")

    return config
