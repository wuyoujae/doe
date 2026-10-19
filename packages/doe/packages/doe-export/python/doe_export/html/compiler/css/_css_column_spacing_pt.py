# Origin: pptx2html/htmlir/compiler.py::_css_column_spacing_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _css_column_spacing_pt(computed: dict[str, Any], visual_scale: float) -> float | None:
    raw = str(computed.get("columnGap") or "").strip().lower()
    if not raw or raw == "normal":
        return 18.0
    px = _css_px(raw)
    if px <= 0:
        return 0.0
    return round(px * visual_scale * 0.75, 3)

_css_column_spacing_pt.__module__ = 'pptx2html.htmlir.compiler'
