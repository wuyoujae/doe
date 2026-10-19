# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._normalized_text_anchor
from __future__ import annotations
from doe_export.html.renderer.shared import Optional

@staticmethod
def _normalized_text_anchor(value: Optional[str]) -> str:
    raw = (value or "t").lower()
    if raw in {"ctr", "mid", "middle", "center"}:
        return "mid"
    if raw in {"b", "bot", "bottom"}:
        return "bot"
    return "top"

_normalized_text_anchor.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_normalized_text_anchor.__func__.__qualname__ = 'HtmlRenderer._normalized_text_anchor'
