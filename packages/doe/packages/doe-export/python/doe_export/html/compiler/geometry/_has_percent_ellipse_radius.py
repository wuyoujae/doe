# Origin: pptx2html/htmlir/compiler.py::_has_percent_ellipse_radius
from __future__ import annotations
from doe_export.html.compiler.shared import Any
from doe_export.html.compiler.document._computed import _computed

def _has_percent_ellipse_radius(node: dict[str, Any]) -> bool:
    computed = _computed(node)
    shorthand = computed.get("borderRadius")
    keys = (
        "borderTopLeftRadius",
        "borderTopRightRadius",
        "borderBottomRightRadius",
        "borderBottomLeftRadius",
    )
    values = [str(computed.get(key) or shorthand or "").strip().lower() for key in keys]
    return bool(values) and all("%" in value for value in values)

_has_percent_ellipse_radius.__module__ = 'pptx2html.htmlir.compiler'
