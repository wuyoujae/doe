# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._svg_dasharray
from __future__ import annotations

@staticmethod
def _svg_dasharray(dash: str | None) -> str | None:
    presets = {
        "dash": "6 4",
        "dashDot": "6 3 1 3",
        "dot": "1 3",
        "lgDash": "9 4",
        "lgDashDot": "9 3 1 3",
        "lgDashDotDot": "9 3 1 3 1 3",
        "sysDash": "3 2",
        "sysDashDot": "3 2 1 2",
        "sysDashDotDot": "3 2 1 2 1 2",
        "sysDot": "1 2",
    }
    if not dash or dash == "solid":
        return None
    return presets.get(dash, "1 3" if "dot" in dash else "6 4")

_svg_dasharray.__func__.__module__ = 'pptx2html.renderer.html_renderer'
_svg_dasharray.__func__.__qualname__ = 'HtmlRenderer._svg_dasharray'
