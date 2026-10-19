# Origin: pptx2html/htmlir/compiler.py::_border_inset_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.css._css_px import _css_px

def _border_inset_pt(computed: dict[str, Any], side: str, scale: float) -> float:
    side_key = side[:1].upper() + side[1:]
    style = str(computed.get(f"border{side_key}Style") or "none").strip().lower()
    if style in {"none", "hidden"}:
        return 0.0
    return round(max(0.0, _css_px(computed.get(f"border{side_key}Width")) * scale), 3)

_border_inset_pt.__module__ = 'pptx2html.htmlir.compiler'
