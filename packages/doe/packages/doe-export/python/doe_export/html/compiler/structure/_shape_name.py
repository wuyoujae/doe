# Origin: pptx2html/htmlir/compiler.py::_shape_name
from __future__ import annotations
from doe_export.html.compiler.shared import Any

def _shape_name(node: dict[str, Any], fallback: str) -> str:
    attrs = node.get("attributes") if isinstance(node.get("attributes"), dict) else {}
    explicit = attrs.get("element-name") or attrs.get("id") or attrs.get("class")
    tag = str(node.get("tag") or "element")
    if isinstance(explicit, str) and explicit.strip():
        return f"html {fallback} {tag} {explicit.strip()[:48]}"
    return f"html {fallback} {tag}"

_shape_name.__module__ = 'pptx2html.htmlir.compiler'
