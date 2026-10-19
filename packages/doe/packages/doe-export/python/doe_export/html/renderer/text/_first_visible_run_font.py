# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._first_visible_run_font
from __future__ import annotations

@staticmethod
def _first_visible_run_font(para):
    for run in para.runs:
        if getattr(run, "kind", "text") == "break":
            continue
        text = run.text or ""
        if text.strip():
            return run.font, text
    return None, ""

_first_visible_run_font.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_first_visible_run_font.__func__.__qualname__ = 'HtmlRenderer._first_visible_run_font'
