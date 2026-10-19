# Origin: pptx2html/htmlir/compiler.py::_box_shadow_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.css._box_shadow_part import _box_shadow_part
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.css._split_css_shadow_list import _split_css_shadow_list

def _box_shadow_from_node(node: dict[str, Any], sx: float, sy: float) -> Shadow | None:
    computed = _computed(node)
    raw = str(computed.get("boxShadow") or "").strip()
    if not raw or raw.lower() == "none":
        return None
    parts = [part.strip() for part in _split_css_shadow_list(raw) if part.strip()]
    if not parts:
        return None
    for part in parts:
        shadow = _box_shadow_part(part, computed, sx, sy, _element_opacity(node))
        if shadow is None:
            continue
        if len(parts) > 1 and "htmlir:box-shadow-multiple-first" not in shadow.diagnostics:
            shadow.diagnostics.append("htmlir:box-shadow-multiple-first")
        return shadow
    return None

_box_shadow_from_node.__module__ = 'pptx2html.htmlir.compiler'
