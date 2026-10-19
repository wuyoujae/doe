# Origin: pptx2html/htmlir/compiler.py::_filter_shadow_from_node
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.shared import Shadow
from doe_export.html.compiler.css._box_shadow_part import _box_shadow_part
from doe_export.html.compiler.document._computed import _computed
from doe_export.html.compiler.css._css_filter_function_names import _css_filter_function_names
from doe_export.html.compiler.css._css_named_function_arguments import _css_named_function_arguments
from doe_export.html.compiler.css._element_opacity import _element_opacity
from doe_export.html.compiler.diagnostics._unique_diagnostics import _unique_diagnostics

def _filter_shadow_from_node(node: dict[str, Any], sx: float, sy: float) -> Shadow | None:
    computed = _computed(node)
    raw = str(computed.get("filter") or "").strip()
    if not raw or raw.lower() == "none":
        return None
    args = _css_named_function_arguments(raw, "drop-shadow")
    if not args:
        return None
    shadow = _box_shadow_part(args[0], computed, sx, sy, _element_opacity(node))
    if shadow is None:
        return None
    shadow.diagnostics = _unique_diagnostics(
        ["htmlir:filter", "htmlir:filter-drop-shadow"] + shadow.diagnostics
    )
    if len(args) > 1:
        shadow.diagnostics.append("htmlir:filter-drop-shadow-multiple-first")
    if _css_filter_function_names(raw) != ["drop-shadow"]:
        shadow.diagnostics.append("htmlir:filter-chain-first-pass")
    return shadow

_filter_shadow_from_node.__module__ = 'pptx2html.htmlir.compiler'
