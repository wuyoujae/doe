# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._contains_cjk
from __future__ import annotations

@staticmethod
def _contains_cjk(text: str) -> bool:
    return any(
        "\u3400" <= char <= "\u9fff"
        or "\uf900" <= char <= "\ufaff"
        for char in text or ""
    )

_contains_cjk.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_contains_cjk.__func__.__qualname__ = 'HtmlRenderer._contains_cjk'
