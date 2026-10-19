# Origin: pptx2html/renderer/html_renderer.py::HtmlRenderer._svg_stroke_attrs
from __future__ import annotations
from doe_export.html.renderer.shared import Border

def _svg_stroke_attrs(self, border: Border | None) -> str:
    if border is None:
        return ""
    attrs: list[str] = []
    if border.cap == "rnd":
        attrs.append('stroke-linecap="round"')
    elif border.cap == "sq":
        attrs.append('stroke-linecap="square"')
    if border.join in {"round", "bevel", "miter"}:
        attrs.append(f'stroke-linejoin="{border.join}"')
    dash = self._svg_dasharray(border.dash)
    if dash:
        attrs.append(f'stroke-dasharray="{dash}"')
    return (" ".join(attrs) + " ") if attrs else ""

_svg_stroke_attrs.__module__ = 'pptx2html.renderer.html_renderer'
_svg_stroke_attrs.__qualname__ = 'HtmlRenderer._svg_stroke_attrs'
