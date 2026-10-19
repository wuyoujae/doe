# Origin: pptx2html/htmlir/compiler.py::_css_kerning_pt
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_kerning_pt(computed: dict[str, Any]) -> float | None:
    raw = str(computed.get("fontKerning") or "").strip().lower()
    if raw == "none":
        return 0.0
    return None

_css_kerning_pt.__module__ = 'pptx2html.htmlir.compiler'
