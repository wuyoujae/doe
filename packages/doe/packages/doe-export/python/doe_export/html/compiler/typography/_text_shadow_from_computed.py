# Origin: pptx2html/htmlir/compiler.py::_text_shadow_from_computed
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.css._split_css_shadow_list import _split_css_shadow_list
from doe_export.html.compiler.typography._text_shadow_part import _text_shadow_part

def _text_shadow_from_computed(computed: dict[str, Any], visual_scale: float, opacity: float) -> Shadow | None:
    raw = str(computed.get("textShadow") or "").strip()
    if not raw or raw.lower() == "none":
        return None
    parts = [part.strip() for part in _split_css_shadow_list(raw) if part.strip()]
    if not parts:
        return None
    for part in parts:
        shadow = _text_shadow_part(part, computed, visual_scale, opacity)
        if shadow is None:
            continue
        if len(parts) > 1 and "htmlir:text-shadow-multiple-first" not in shadow.diagnostics:
            shadow.diagnostics.append("htmlir:text-shadow-multiple-first")
        return shadow
    return None

_text_shadow_from_computed.__module__ = 'pptx2html.htmlir.compiler'
