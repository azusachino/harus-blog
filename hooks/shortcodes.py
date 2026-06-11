"""MkDocs hook: render legacy Hugo shortcodes at build time.

The migrated content no longer uses `{{< ... >}}` shortcodes, but this hook keeps
the documented embeds (youtube/bilibili/douban/ppt) working if they reappear in
future posts, so authors can keep the familiar Hugo syntax.
"""

from __future__ import annotations

import re

# {{< youtube VIDEO_ID >}}
_YOUTUBE = re.compile(r"\{\{<\s*youtube\s+([\w-]+)\s*>\}\}")
# {{< bilibili BVID >}}
_BILIBILI = re.compile(r"\{\{<\s*bilibili\s+([\w-]+)\s*>\}\}")
# {{< douban src="URL" >}}
_DOUBAN = re.compile(r'\{\{<\s*douban\s+src="([^"]+)"\s*>\}\}')
# {{< ppt src="URL" >}}
_PPT = re.compile(r'\{\{<\s*ppt\s+src="([^"]+)"\s*>\}\}')


def _iframe(src: str) -> str:
    return f'<div class="video-wrapper"><iframe src="{src}" loading="lazy" allowfullscreen frameborder="0"></iframe></div>'


def on_page_markdown(markdown: str, **_kwargs) -> str:
    markdown = _YOUTUBE.sub(
        lambda m: _iframe(f"https://www.youtube-nocookie.com/embed/{m.group(1)}"),
        markdown,
    )
    markdown = _BILIBILI.sub(
        lambda m: _iframe(
            f"https://player.bilibili.com/player.html?bvid={m.group(1)}&high_quality=1"
        ),
        markdown,
    )
    markdown = _PPT.sub(lambda m: _iframe(m.group(1)), markdown)
    markdown = _DOUBAN.sub(
        lambda m: f'<a class="douban-card" href="{m.group(1)}" target="_blank" rel="noopener">豆瓣 ↗</a>',
        markdown,
    )
    return markdown
