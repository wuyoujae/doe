# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._should_suppress_empty_bullet_paragraph
from __future__ import annotations

@staticmethod
def _should_suppress_empty_bullet_paragraph(para) -> bool:
    bullet = getattr(para, "bullet", None)
    if not bullet or bullet.kind == "none":
        return False
    return not any(
        (run.text or "").strip()
        for run in para.runs
        if getattr(run, "kind", "text") != "break"
    )

_should_suppress_empty_bullet_paragraph.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_should_suppress_empty_bullet_paragraph.__func__.__qualname__ = 'HtmlRenderer._should_suppress_empty_bullet_paragraph'
