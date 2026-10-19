# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._next_auto_bullet_index
from __future__ import annotations
from doe_export.html.renderer.shared import Optional

@staticmethod
def _next_auto_bullet_index(para, counters: dict[tuple[int, str], int]) -> Optional[int]:
    bullet = para.bullet
    if not bullet or bullet.kind != "auto":
        return None
    level = max(0, int(para.level or 0))
    scheme = str(bullet.auto_number_scheme or "arabicPeriod")
    for key in [key for key in counters if key[0] > level]:
        del counters[key]
    key = (level, scheme)
    if key not in counters:
        value = max(1, int(bullet.start_at or 1))
    else:
        value = counters[key] + 1
    counters[key] = value
    return value

_next_auto_bullet_index.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_next_auto_bullet_index.__func__.__qualname__ = 'HtmlRenderer._next_auto_bullet_index'
