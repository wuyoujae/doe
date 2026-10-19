# Origin: pptx2html/htmlir/compiler.py::_css_font_variant_caps
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _css_font_variant_caps(computed: dict[str, Any]) -> str | None:
    raw = str(computed.get("fontVariantCaps") or "").strip().lower()
    if raw in {"small-caps", "all-small-caps", "petite-caps", "all-petite-caps", "unicase", "titling-caps"}:
        return "small"
    return None

_css_font_variant_caps.__module__ = 'pptx2html.htmlir.compiler'
